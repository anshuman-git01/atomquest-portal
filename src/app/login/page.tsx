"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const DEMO_ACCOUNTS = [
  {
    emoji: "Employee",
    title: "Employee",
    description: "View goals and check-ins",
    email: "employee@test.com",
    role: "EMPLOYEE",
  },
  {
    emoji: "Manager",
    title: "Manager",
    description: "Review and approve goals",
    email: "manager@test.com",
    role: "MANAGER",
  },
  {
    emoji: "Admin",
    title: "Admin",
    description: "Governance and reporting",
    email: "admin@test.com",
    role: "ADMIN",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = async (email: string, role: string) => {
    setLoading(email);
    setError(null);

    try {
      const result = await signIn("demo-login", {
        email,
        role,
        redirect: false,
      });

      if (!result?.ok) {
        throw new Error(result?.error || "Login failed");
      }

      // Successful login - redirect to home
      router.push("/");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      setLoading(null);
      console.error("Login error:", err);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
            <span className="text-2xl">[ATOM]</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
            AtomQuest Portal
          </h1>
          <p className="text-lg text-slate-600">
            Enterprise Goal Management System
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium">Login Failed</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Demo Account Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              onClick={() => handleDemoLogin(account.email, account.role)}
              disabled={loading !== null}
              className="relative group p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Hover accent */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-200" />

              {/* Content */}
              <div className="relative z-10">
                <div className="text-4xl mb-3">{account.emoji}</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  {account.title}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  {account.description}
                </p>

                {/* Email Badge */}
                <div className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded inline-block">
                  {account.email}
                </div>

                {/* Loading State */}
                {loading === account.email && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <span className="text-xs text-slate-600">Logging in...</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 mb-6">
          <p className="font-semibold mb-2">[GOAL] Demo Credentials</p>
          <p>Click any card above to instantly log in with that role. No password required for demo purposes.</p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          <p>AtomQuest Portal v1.0 - Built for Hackathon</p>
          <p className="mt-1">Demo Mode - Azure AD not required</p>
        </div>
      </div>
    </main>
  );
}
