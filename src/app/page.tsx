"use client";

import Link from "next/link";
import { ArrowRight, Target, TrendingUp, Users, BarChart3, Hand } from "lucide-react";
import { api } from "~/trpc/react";
import { useRole } from "~/lib/role-context";

export default function HomePage() {
  const { role, isLoading } = useRole();

  if (isLoading) {
    return null;
  }

  if (role === "EMPLOYEE") {
    return <EmployeeDashboard />;
  }

  if (role === "MANAGER") {
    return <ManagerDashboard />;
  }

  if (role === "ADMIN") {
    return <AdminDashboard />;
  }

  return null;
}

// Employee Dashboard
function EmployeeDashboard() {
  const { currentUserId, role } = useRole();
  const { data: lockedGoals } = api.goal.getLockedGoals.useQuery({ userId: currentUserId });
  const { data: draftGoals } = api.goal.getPendingGoals.useQuery({ userId: currentUserId, role });

  const totalGoals = (lockedGoals?.length || 0) + (draftGoals?.length || 0);
  const draftCount = draftGoals?.length || 0;

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold text-slate-900">
            Welcome back, Sarah!
            <Hand className="h-7 w-7 text-amber-500" aria-hidden="true" />
          </h1>
          <p className="text-slate-600">Track your goals and progress for Q4</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <KPICard title="Total Goals" value={totalGoals} icon={Target} color="blue" />
          <KPICard title="Draft Goals" value={draftCount} icon={TrendingUp} color="amber" />
          <KPICard title="Locked Goals" value={lockedGoals?.length || 0} icon={BarChart3} color="green" />
          <KPICard title="Q4 Active" value="Yes" icon={Target} color="purple" />
        </div>

        {/* Recent Goals */}
        {lockedGoals && lockedGoals.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Goals</h2>
            <div className="space-y-3">
              {lockedGoals.slice(0, 3).map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{goal.title}</p>
                    <p className="text-sm text-slate-600">{goal.thrustArea}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{goal.weightage}%</p>
                    <p className="text-xs text-slate-500">Weightage</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Button */}
        <Link
          href="/goals"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          Create New Goal
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </main>
  );
}

// Manager Dashboard
function ManagerDashboard() {
  const { role } = useRole();
  const { data: pendingGoals } = api.goal.getPendingGoals.useQuery({ role });
  const { data: lockedGoals } = api.goal.getLockedGoals.useQuery({ userId: "emp1" });

  const pendingCount = pendingGoals?.length || 0;
  const lockedCount = lockedGoals?.length || 0;
  const avgProgress = 75;

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Manager Dashboard</h1>
          <p className="text-slate-600">Oversee your team's goals and progress</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <KPICard title="Pending Approvals" value={pendingCount} icon={Users} color="red" />
          <KPICard title="Team Avg Progress" value={`${avgProgress}%`} icon={TrendingUp} color="green" />
          <KPICard title="Active Goals" value={lockedCount} icon={Target} color="blue" />
        </div>

        {pendingCount > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              You have {pendingCount} pending goal(s) to review
            </h2>
            <Link
              href="/manager"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Review Pending Goals
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

// Admin Dashboard
function AdminDashboard() {
  const { data: allGoals } = api.goal.getLockedGoals.useQuery({ userId: "emp1" });
  const totalGoals = allGoals?.length || 0;
  const completionRate = 62;

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
          <p className="text-slate-600">Organization-wide goals and metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <KPICard title="Total Goals" value={totalGoals} icon={Target} color="blue" />
          <KPICard title="Completion Rate" value={`${completionRate}%`} icon={BarChart3} color="green" />
          <KPICard title="Active Cycles" value="Q4" icon={TrendingUp} color="purple" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin"
            className="bg-white rounded-lg border border-slate-200 p-6 hover:border-blue-300 transition"
          >
            <h3 className="font-semibold text-slate-900 mb-2">Admin Panel</h3>
            <p className="text-sm text-slate-600">Manage cycles, unlock goals, push KPIs</p>
          </Link>
          <Link
            href="/admin/analytics"
            className="bg-white rounded-lg border border-slate-200 p-6 hover:border-blue-300 transition"
          >
            <h3 className="font-semibold text-slate-900 mb-2">Analytics</h3>
            <p className="text-sm text-slate-600">View org-wide dashboards and reports</p>
          </Link>
        </div>
      </div>
    </main>
  );
}

// KPI Card Component
function KPICard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: "blue" | "green" | "red" | "amber" | "purple";
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    red: "bg-red-50 text-red-600 border-red-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
  };

  return (
    <div className={`rounded-lg border p-6 ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <Icon className="w-10 h-10 opacity-20" />
      </div>
    </div>
  );
}
