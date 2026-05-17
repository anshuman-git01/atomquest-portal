import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";

// Allow demo login only in development or on specific domains
const isDemoLoginAllowed = () => {
  const env = process.env.NODE_ENV;
  const host = process.env.VERCEL_URL || process.env.NEXTAUTH_URL || "";

  // Always allow in development
  if (env === "development") return true;

  // Allow on hackathon demo URLs
  if (host.includes("atomquest") || host.includes("localhost")) return true;

  return false;
};

export async function POST(request: NextRequest) {
  try {
    // Security check
    if (!isDemoLoginAllowed()) {
      return NextResponse.json(
        { message: "Demo login is not available in this environment" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { message: "Email and role are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["EMPLOYEE", "MANAGER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { message: "Invalid role" },
        { status: 400 }
      );
    }

    // Find or create user
    const user = await db.user.upsert({
      where: { email },
      update: { role },
      create: {
        email,
        name: email.split("@")[0],
        role,
      },
    });

    // Create NextAuth session
    // Note: NextAuth session management via API route is limited.
    // We'll use a callback approach instead by returning the user data
    // and letting the client handle the redirect.

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Demo login error:", error);
    return NextResponse.json(
      { message: "An error occurred during login" },
      { status: 500 }
    );
  }
}
