"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { api } from "~/trpc/react";

type GoalDistributionData = {
  name: string;
  value: number;
  color: string;
};

type ManagerEffectivenessData = {
  id: string;
  name: string;
  completionRate: number;
  color: string;
  status: string;
};

// Color mapping for UoM types
const UOM_COLORS: Record<string, string> = {
  NUMERIC: "#3b82f6",
  PERCENTAGE: "#8b5cf6",
  TIMELINE: "#ec4899",
  ZERO_BASED: "#f59e0b",
};

// UOM display names
const UOM_NAMES: Record<string, string> = {
  NUMERIC: "Numeric",
  PERCENTAGE: "Percentage",
  TIMELINE: "Timeline",
  ZERO_BASED: "Zero-Based",
};

// Get status label based on completion rate
const getStatusLabel = (rate: number): { label: string; color: string; icon: string } => {
  if (rate === 100) return { label: "Perfect", color: "#10b981", icon: "[OK]" };
  if (rate >= 90) return { label: "Excellent", color: "#3b82f6", icon: "[UP]" };
  if (rate >= 75) return { label: "On Track", color: "#f59e0b", icon: "[/]" };
  return { label: "Needs Improvement", color: "#ef4444", icon: "[!]" };
};

// Custom tooltips
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
        <p className="text-xs font-semibold text-slate-900">{data.name}</p>
        <p className="text-xs text-slate-600">Goals: {data.value}</p>
      </div>
    );
  }
  return null;
};

const CustomManagerTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
        <p className="text-xs font-semibold text-slate-900">{data.name}</p>
        <p className="text-xs text-slate-600">Completion: {data.completionRate}%</p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const { data: analyticsData, isLoading, isError, error } = api.admin.getAnalyticsMetrics.useQuery();

  // Process goal distribution data
  const goalDistributionData: GoalDistributionData[] = useMemo(() => {
    if (!analyticsData?.goalsByUom) return [];
    return analyticsData.goalsByUom.map((item: any) => ({
      name: UOM_NAMES[item.uom] || item.uom,
      value: item.count,
      color: UOM_COLORS[item.uom] || "#6b7280",
    }));
  }, [analyticsData?.goalsByUom]);

  // Process manager effectiveness data with colors and status
  const managerEffectivenessData: ManagerEffectivenessData[] = useMemo(() => {
    if (!analyticsData?.managerMetrics) return [];

    const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899"];
    return analyticsData.managerMetrics
      .sort((a: any, b: any) => b.completionRate - a.completionRate)
      .map((manager: any, index: number) => {
        const statusInfo = getStatusLabel(manager.completionRate);
        return {
          id: `manager-${index}`,
          name: manager.name,
          completionRate: manager.completionRate,
          color: colors[index % colors.length],
          status: statusInfo.label,
        } as ManagerEffectivenessData;
      });
  }, [analyticsData?.managerMetrics]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-red-600">Error loading analytics: {error?.message}</p>
        </div>
      </main>
    );
  }

  const totalGoals = analyticsData?.totalGoals || 0;
  const avgCompletion = analyticsData?.avgCompletion || 0;
  const mostUsedUom = analyticsData?.goalsByUom
    ? UOM_NAMES[analyticsData.goalsByUom.reduce((a, b) => (a.count > b.count ? a : b), { uom: "NUMERIC", count: 0 }).uom]
    : "Numeric";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        {/* Header */}
        <header>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Section 5.4 - Analytics Module
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Organization Analytics
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Comprehensive insights into goal performance metrics, distribution patterns, and manager effectiveness across the organization.
          </p>
        </header>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Chart 1: Goal Distribution (Pie Chart) */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Goal Distribution by UoM</h2>
              <p className="mt-1 text-sm text-slate-600">
                Breakdown of goals across Unit of Measurement types.
              </p>
            </div>

            {goalDistributionData.length > 0 ? (
              <>
                <div className="mt-6 flex justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={goalDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {goalDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                  {goalDistributionData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-slate-700">
                        {item.name}
                        <span className="ml-1 font-semibold text-slate-900">({item.value})</span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-6 flex items-center justify-center h-64 text-slate-500">
                No goal data available
              </div>
            )}
          </section>

          {/* Chart 2: Summary Metrics */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Key Performance Metrics
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Organization-wide goal and completion statistics.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <span className="font-medium text-slate-700">Total Goals</span>
                <span className="text-2xl font-bold text-slate-900">{totalGoals}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <span className="font-medium text-slate-700">Avg Completion</span>
                <span className="text-2xl font-bold text-green-600">{avgCompletion}%</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <span className="font-medium text-slate-700">Most Used UoM</span>
                <span className="text-2xl font-bold text-slate-900">{mostUsedUom}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Chart 3: Manager Effectiveness Leaderboard */}
        {managerEffectivenessData.length > 0 && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Manager Effectiveness Leaderboard</h2>
              <p className="mt-1 text-sm text-slate-600">
                Check-in completion rates across all L1 managers.
              </p>
            </div>

            <div className="mt-6">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={managerEffectivenessData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 12 }} stroke="#cbd5e1" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    stroke="#cbd5e1"
                    width={145}
                  />
                  <Tooltip content={<CustomManagerTooltip />} />
                  <Bar dataKey="completionRate" fill="#10b981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Manager Details Table */}
            <div className="mt-6 overflow-x-auto border-t border-slate-100 pt-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Manager</th>
                    <th className="px-4 py-2 text-center font-semibold text-slate-700">Completion Rate</th>
                    <th className="px-4 py-2 text-center font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {managerEffectivenessData.map((item) => {
                    const statusInfo = getStatusLabel(item.completionRate);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{ backgroundColor: `${item.color}20`, color: item.color }}
                          >
                            {item.completionRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{
                              backgroundColor: `${statusInfo.color}20`,
                              color: statusInfo.color,
                            }}
                          >
                            {statusInfo.icon} {statusInfo.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
