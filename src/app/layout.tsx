import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { Sidebar } from "~/components/Sidebar";
import { Navbar } from "~/components/Navbar";
import { RoleProvider } from "~/lib/role-context";

export const metadata: Metadata = {
  title: "AtomQuest - Goal Management Portal",
  description: "Enterprise goal management and performance tracking portal",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="bg-slate-50">
        <TRPCReactProvider>
          <RoleProvider>
            <div className="flex h-screen overflow-hidden">
              {/* Sidebar */}
              <Sidebar />

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Navbar */}
                <Navbar />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-slate-50">
                  {children}
                </main>
              </div>
            </div>
          </RoleProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
