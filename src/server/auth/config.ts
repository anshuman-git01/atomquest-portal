import { PrismaAdapter } from "@auth/prisma-adapter";
import {
  type DefaultSession,
  type NextAuthConfig,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import AzureADProvider from "next-auth/providers/azure-ad";

import { env } from "~/env";
import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        role: (user as any).role || "EMPLOYEE",
      },
    }),
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "EMPLOYEE";
      }
      return token;
    },
  },
  adapter: PrismaAdapter(db) as any,
  providers: [
    CredentialsProvider({
      id: "demo-login",
      name: "Demo Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@example.com" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials, req) {
        // Security: Only allow demo login in development or on demo domains
        if (process.env.NODE_ENV !== "development") {
          const host = process.env.VERCEL_URL || process.env.NEXTAUTH_URL || "";
          const isAllowed = host.includes("atomquest") || 
                           host.includes("localhost") || 
                           host.includes("127.0.0.1");
          if (!isAllowed) {
            console.error("Demo login blocked on domain:", host);
            return null;
          }
        }

        if (!credentials?.email || !credentials?.role) {
          console.error("Missing credentials:", { email: credentials?.email, role: credentials?.role });
          return null;
        }

        // Validate role
        if (!["EMPLOYEE", "MANAGER", "ADMIN"].includes(credentials.role as string)) {
          console.error("Invalid role:", credentials.role);
          return null;
        }

        try {
          // Find or create user with the specified role
          const email = credentials.email as string;
          const role = credentials.role as string;
          
          const user = await db.user.upsert({
            where: { email },
            update: { role },
            create: {
              email,
              name: email.split("@")[0],
              role,
            },
          });

          return {
            id: user.id,
            email: user.email || "",
            name: user.name || "",
            role: user.role || "EMPLOYEE",
          };
        } catch (error) {
          console.error("Demo login error:", error);
          return null;
        }
      },
    }),
    // Only add Azure provider if credentials are available
    ...(env.AZURE_AD_CLIENT_ID && env.AZURE_AD_CLIENT_SECRET
      ? [
          AzureADProvider({
            clientId: env.AZURE_AD_CLIENT_ID,
            clientSecret: env.AZURE_AD_CLIENT_SECRET,
            authorization: {
              params: {
                scope: "openid profile email User.Read",
                tenant: env.AZURE_AD_TENANT_ID,
              },
            },
          }),
        ]
      : []),
  ],
};
