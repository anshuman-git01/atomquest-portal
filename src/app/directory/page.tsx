"use client";

import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  LockKeyhole,
  Settings,
  Shuffle,
  Target,
  type LucideIcon,
} from "lucide-react";

type PageDirectory = {
  path: string;
  title: string;
  description: string;
  role: string;
  icon: LucideIcon;
  section: string;
};

const pages: PageDirectory[] = [
  // Employee Section
  {
    path: "/",
    title: "Home - Goal Sheet",
    description: "Main employee dashboard for creating and managing goals. Enforce 100% weightage rule with up to 8 goals per cycle.",
    role: "Employee",
    icon: Target,
    section: "Employee Workflows",
  },
  {
    path: "/checkins",
    title: "Check-ins - Quarterly Updates",
    description: "File quarterly check-ins for your goals. Time-locked by phase (Q1/July, Q2/October, Q3/January, Q4/March/April).",
    role: "Employee",
    icon: ClipboardCheck,
    section: "Employee Workflows",
  },

  // Manager Section
  {
    path: "/manager",
    title: "Manager - Pending Approvals",
    description: "Approve or return pending goal sheets. Edit target/weightage inline before locking. See employee goals awaiting approval.",
    role: "Manager",
    icon: CheckCircle2,
    section: "Manager Workflows",
  },
  {
    path: "/manager/checkins",
    title: "Manager - Check-in Review",
    description: "Review employee check-ins by quarter. Approve progress updates and provide feedback. See system-calculated progress scores.",
    role: "Manager",
    icon: BarChart3,
    section: "Manager Workflows",
  },

  // Admin Section
  {
    path: "/admin",
    title: "Admin - Governance Dashboard",
    description: "Push departmental KPIs, unlock locked goals, manage cycles, and view audit logs. Global configuration hub.",
    role: "Admin",
    icon: Settings,
    section: "Admin Workflows",
  },
  {
    path: "/admin/analytics",
    title: "Admin - Analytics Module",
    description: "Organization-wide insights: Goal distribution by UoM, quarterly trends, and Manager Effectiveness Leaderboard.",
    role: "Admin",
    icon: BarChart3,
    section: "Admin Workflows",
  },
];

const features = [
  {
    icon: Target,
    title: "Goal Management",
    description: "Create, approve, and track employee goals with 100% weightage enforcement",
  },
  {
    icon: ClipboardCheck,
    title: "Quarterly Check-ins",
    description: "Time-locked check-ins with phase-specific windows (Q1/July, Q2/October, etc.)",
  },
  {
    icon: CheckCircle2,
    title: "Manager Approval",
    description: "Inline editing, approval workflows, and return-to-draft capabilities",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Organization-wide insights, goal distribution, and manager effectiveness metrics",
  },
  {
    icon: LockKeyhole,
    title: "Admin Governance",
    description: "Cycle management, departmental KPIs, goal unlock, and audit logging",
  },
  {
    icon: Shuffle,
    title: "Shared Goals",
    description: "Push organizational KPIs and cascade updates automatically",
  },
];

export default function DirectoryPage() {
  const sections = Array.from(new Set(pages.map((p) => p.section)));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Navigation Hub
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
            AtomQuest Portal Directory
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Access all pages and workflows across the Employee, Manager, and Admin sections.
          </p>
        </header>

        {/* Sections Grid */}
        <div className="space-y-12">
          {sections.map((section) => {
            const sectionPages = pages.filter((p) => p.section === section);
            const roleColors: { [key: string]: { bg: string; badge: string; text: string } } = {
              Employee: { bg: "bg-emerald-50", badge: "bg-emerald-100 text-emerald-800", text: "text-emerald-700" },
              Manager: { bg: "bg-blue-50", badge: "bg-blue-100 text-blue-800", text: "text-blue-700" },
              Admin: { bg: "bg-purple-50", badge: "bg-purple-100 text-purple-800", text: "text-purple-700" },
            };

            return (
              <section key={section}>
                <h2 className="mb-6 text-2xl font-bold text-slate-900">{section}</h2>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {sectionPages.map((page) => {
                    const colors = roleColors[page.role] || roleColors["Employee"];
                    const Icon = page.icon;

                    return (
                      <Link key={page.path} href={page.path}>
                        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
                          {/* Hover gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-blue-500/5 opacity-0 transition-opacity group-hover:opacity-100" />

                          <div className="relative z-10">
                            {/* Header with Icon and Role */}
                            <div className="mb-3 flex items-start justify-between">
                              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${colors?.bg} ${colors?.text}`}>
                                <Icon className="h-5 w-5" aria-hidden="true" />
                              </span>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors?.badge}`}>
                                {page.role}
                              </span>
                            </div>

                            {/* Title */}
                            <h3 className="mb-2 text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {page.title}
                            </h3>

                            {/* Path Badge */}
                            <p className="mb-3 text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded w-fit">
                              {page.path}
                            </p>

                            {/* Description */}
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {page.description}
                            </p>

                            {/* Arrow indicator */}
                            <div className="mt-4 inline-flex items-center text-blue-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                              Visit Page
                              <svg
                                className="ml-1 h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Quick Stats */}
        <section className="mt-16 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">Portal Overview</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                Employee Pages
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-900">2</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                Manager Pages
              </p>
              <p className="mt-1 text-2xl font-bold text-blue-900">2</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4">
              <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
                Admin Pages
              </p>
              <p className="mt-1 text-2xl font-bold text-purple-900">2</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Total Pages
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{pages.length}</p>
            </div>
          </div>
        </section>

        {/* Features Summary */}
        <section className="mt-10 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">Key Features</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
              <div key={feature.title} className="flex gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </div>
              </div>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-200 pt-8 text-center">
          <p className="text-sm text-slate-600">
            AtomQuest Portal v1.0 - Built with Next.js, T3 Stack, and Profit.co Design System
          </p>
          <p className="mt-2 text-xs text-slate-500">
            BRD Compliance: Sections 1.1 - 5.4 - 100% Core Features Complete
          </p>
        </footer>
      </div>
    </main>
  );
}
