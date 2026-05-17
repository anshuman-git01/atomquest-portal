"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { calculateSystemProgressScore } from "~/lib/progress-score";

type AchievementRow = {
  employee: string;
  email: string;
  goal: string;
  quarter: string;
  target: string;
  actual: string;
  uom: string;
  progressStatus: string;
  systemScore: string;
};

function escapeCsvField(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function exportAchievementReportCsv(rows: AchievementRow[]) {
  const headers = [
    "Employee",
    "Email",
    "Goal",
    "Quarter",
    "Planned Target",
    "Actual Achievement",
    "UoM",
    "Progress Status",
    "System Progress Score",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.employee,
        row.email,
        row.goal,
        row.quarter,
        row.target,
        row.actual,
        row.uom,
        row.progressStatus,
        row.systemScore,
      ]
        .map(escapeCsvField)
        .join(","),
    ),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "achievement_report.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

function MetricCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className={`rounded-xl border bg-white p-6 shadow-sm ${accent}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const utils = api.useUtils();
  const {
    data: checkIns,
    isLoading: checkInsLoading,
    isError: checkInsError,
    error: checkInsQueryError,
  } = api.admin.getCompletionReport.useQuery();

  const {
    data: auditLogs,
    isLoading: auditLoading,
    isError: auditError,
    error: auditQueryError,
  } = api.admin.getAuditLogs.useQuery();

  const {
    data: employees,
    isLoading: employeesLoading,
    isError: employeesError,
  } = api.admin.getEmployees.useQuery();

  const pushSharedGoal = api.admin.pushSharedGoal.useMutation({
    onSuccess: async () => {
      alert("Departmental KPI pushed successfully!");
      setFormValues({ thrustArea: "", title: "", uom: "NUMERIC", target: "", weightage: 50, employeeIds: [] });
      await Promise.all([
        utils.admin.getCompletionReport.invalidate(),
        utils.admin.getAuditLogs.invalidate(),
        utils.admin.getLockedGoalsForAdmin.invalidate(),
        utils.admin.getAnalyticsMetrics.invalidate(),
        utils.goal.getLockedGoals.invalidate(),
      ]);
    },
    onError: (error) => {
      alert("Error pushing KPI: " + error.message);
    },
  });

  const [formValues, setFormValues] = useState({
    thrustArea: "",
    title: "",
    uom: "NUMERIC" as const,
    target: "",
    weightage: 50,
    employeeIds: [] as string[],
  });

  const totalCheckIns = checkIns?.totalCheckins ?? 0;
  const onTrackCount = checkIns?.onTrackCheckins ?? 0;
  const notStartedCount = checkIns?.notStartedCheckins ?? 0;
  const completedCount = checkIns?.completedCheckins ?? 0;

  const achievementRows: AchievementRow[] =
    checkIns?.achievementRows.map((row) => {
      const progress = calculateSystemProgressScore(row.uom, row.target, row.actual);
      return {
        ...row,
        progressStatus: formatStatus(row.progressStatus),
        systemScore: progress.display,
      };
    }) ?? [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <header>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Section 4 - Governance
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Admin Governance & Reporting
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Organization-wide completion metrics, achievement exports, and audit visibility.
          </p>
        </header>

        {/* Section 0 - Push Departmental KPI */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Push Departmental KPI</h2>
          <p className="mt-1 text-sm text-slate-500">Create shared organizational goals for employees to adopt and weight.</p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="thrustArea" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Thrust Area
              </label>
              <input
                id="thrustArea"
                type="text"
                value={formValues.thrustArea}
                onChange={(e) => setFormValues({ ...formValues, thrustArea: e.target.value })}
                placeholder="e.g., Q3 Sales"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label htmlFor="title" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={formValues.title}
                onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
                placeholder="e.g., Revenue Growth"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label htmlFor="uom" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                UoM
              </label>
              <select
                id="uom"
                value={formValues.uom}
                onChange={(e) => setFormValues({ ...formValues, uom: e.target.value as any })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="NUMERIC">Numeric</option>
                <option value="PERCENTAGE">Percentage</option>
                <option value="TIMELINE">Timeline</option>
                <option value="ZERO_BASED">Zero-based</option>
              </select>
            </div>

            <div>
              <label htmlFor="target" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Target
              </label>
              <input
                id="target"
                type="text"
                value={formValues.target}
                onChange={(e) => setFormValues({ ...formValues, target: e.target.value })}
                placeholder="e.g., $500k"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Push to Employees
            </label>
            <p className="text-xs text-slate-500 mb-3">Select employees to receive this KPI</p>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-300 rounded-lg p-3 bg-slate-50">
              {employeesLoading && <p className="text-sm text-slate-500">Loading employees...</p>}
              {employeesError && <p className="text-sm text-red-600">Unable to load employees.</p>}
              {!employeesLoading && !employeesError && employees?.length === 0 && (
                <p className="text-sm text-slate-500">No employees found.</p>
              )}
              {employees?.map((employee) => {
                const checked = formValues.employeeIds.includes(employee.id);
                return (
                  <label key={employee.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setFormValues({
                          ...formValues,
                          employeeIds: e.target.checked
                            ? [...formValues.employeeIds, employee.id]
                            : formValues.employeeIds.filter((id) => id !== employee.id),
                        });
                      }}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">
                      {employee.name ?? employee.email ?? employee.id}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (formValues.thrustArea && formValues.title && formValues.target && formValues.employeeIds.length > 0) {
                pushSharedGoal.mutate(formValues);
              } else {
                alert("Please fill in all required fields and select at least one employee");
              }
            }}
            disabled={pushSharedGoal.isPending}
            className="mt-6 rounded-md bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pushSharedGoal.isPending ? "Pushing KPI..." : "Push Departmental KPI"}
          </button>
        </section>

        {/* Section 0.5 - Global Cycle Management */}
        <CycleManagementSection />

        {/* Section 1 - Completion Dashboard */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Completion Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">High-level check-in activity across the organization.</p>

          {checkInsLoading && (
            <p className="mt-6 text-sm text-slate-500">Loading completion metrics...</p>
          )}

          {checkInsError && (
            <p className="mt-6 text-sm text-red-600">
              Failed to load completion report: {checkInsQueryError.message}
            </p>
          )}

          {!checkInsLoading && !checkInsError && (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Total Check-ins Completed"
                value={totalCheckIns}
                accent="border-slate-200"
              />
              <MetricCard label="On Track" value={onTrackCount} accent="border-green-200" />
              <MetricCard label="Not Started" value={notStartedCount} accent="border-amber-200" />
              <MetricCard label="Completed" value={completedCount} accent="border-blue-200" />
            </div>
          )}
        </section>

        {/* Section 2 - Achievement Report & Export */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Achievement Report</h2>
              <p className="mt-1 text-sm text-slate-500">
                Employee goals, targets, actuals, and BRD system progress scores.
              </p>
            </div>
            <button
              type="button"
              onClick={() => exportAchievementReportCsv(achievementRows)}
              disabled={achievementRows.length === 0}
              className="shrink-0 rounded-md bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export to CSV
            </button>
          </div>

          {checkInsLoading && (
            <p className="mt-6 text-sm text-slate-500">Loading achievement data...</p>
          )}

          {!checkInsLoading && !checkInsError && achievementRows.length === 0 && (
            <p className="mt-6 text-sm text-slate-500">No check-in data available for export.</p>
          )}

          {!checkInsLoading && !checkInsError && achievementRows.length > 0 && (
            <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "Employee",
                      "Goal",
                      "Quarter",
                      "Planned Target",
                      "Actual Achievement",
                      "System Score",
                      "Status",
                    ].map((col) => (
                      <th
                        key={col}
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {achievementRows.map((row, index) => (
                    <tr key={`${row.email}-${row.goal}-${row.quarter}-${index}`} className="hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <div className="font-medium text-slate-900">{row.employee}</div>
                        <div className="text-xs text-slate-500">{row.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">{row.goal}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{row.quarter}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.target}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.actual}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-blue-700">
                        {row.systemScore}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                        {row.progressStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section 3 - Audit Trail */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Audit Trail</h2>
          <p className="mt-1 text-sm text-slate-500">Immutable log of governance actions.</p>

          {auditLoading && <p className="mt-6 text-sm text-slate-500">Loading audit logs...</p>}

          {auditError && (
            <p className="mt-6 text-sm text-red-600">
              Failed to load audit logs: {auditQueryError.message}
            </p>
          )}

          {!auditLoading && !auditError && auditLogs?.length === 0 && (
            <p className="mt-6 text-sm text-slate-500">No audit log entries recorded yet.</p>
          )}

          {!auditLoading && !auditError && auditLogs && auditLogs.length > 0 && (
            <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {["Goal ID", "Changed By", "Action", "Timestamp"].map((col) => (
                      <th
                        key={col}
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{log.goalId}</td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {log.changedById}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{log.action}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <LockedGoalsManagementSection />
      </div>
    </main>
  );
}

function CycleManagementSection() {
  const { data: cycleConfig, isLoading: cycleLoading, refetch } = api.admin.getCycleConfig.useQuery();

  const [isEditing, setIsEditing] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Initialize form values when data loads
  useEffect(() => {
    if (cycleConfig && cycleConfig.length > 0) {
      const config = cycleConfig[0]!;
      setStartDate(new Date(config.startDate).toISOString().split('T')[0] ?? "");
      setEndDate(new Date(config.endDate).toISOString().split('T')[0] ?? "");
      setIsActive(config.isActive);
    }
  }, [cycleConfig]);

  const updateCycleConfig = api.admin.cycleConfig.useMutation({
    onSuccess: () => {
      alert("Cycle configuration updated successfully!");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      alert("Error updating cycle: " + error.message);
    },
  });

  const handleSave = () => {
    if (!startDate || !endDate) {
      alert("Please fill in both dates");
      return;
    }
    updateCycleConfig.mutate({
      phaseName: "GOAL_SETTING",
      startDate,
      endDate,
      isActive,
    });
  };

  if (cycleLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading cycle configuration...</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Global Cycle Management</h2>
          <p className="mt-1 text-sm text-slate-500">Control when employees can submit their goal sheets.</p>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
          >
            Edit
          </button>
        )}
      </div>

      {!isEditing && cycleConfig && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-sm font-medium text-slate-700">Phase: Goal Setting (Phase 1)</span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                cycleConfig?.length && cycleConfig[0]?.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {cycleConfig?.length && cycleConfig[0]?.isActive ? "ACTIVE" : "CLOSED"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start Date</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {cycleConfig?.length && cycleConfig[0] ? new Date(cycleConfig[0]!.startDate).toLocaleDateString() : "-"}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">End Date</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {cycleConfig?.length && cycleConfig[0] ? new Date(cycleConfig[0]!.endDate).toLocaleDateString() : "-"}
              </p>
            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="startDate" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <input
              id="isActive"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-slate-300"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">
              Cycle is ACTIVE (Employees can submit)
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={updateCycleConfig.isPending}
              className="rounded-md bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateCycleConfig.isPending ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function LockedGoalsManagementSection() {
  const utils = api.useUtils();
  const {
    data: lockedGoals,
    isLoading,
    isError,
    error,
  } = api.admin.getLockedGoalsForAdmin.useQuery();

  const unlockGoal = api.admin.unlockGoal.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.admin.getLockedGoalsForAdmin.invalidate(),
        utils.admin.getCompletionReport.invalidate(),
        utils.admin.getAuditLogs.invalidate(),
        utils.admin.getAnalyticsMetrics.invalidate(),
        utils.goal.getLockedGoals.invalidate(),
        utils.goal.getPendingGoals.invalidate(),
      ]);
    },
    onError: (mutationError) => {
      alert("Error unlocking goal: " + mutationError.message);
    },
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Locked Goals Management</h2>
      <p className="mt-1 text-sm text-slate-500">Force unlock approved goals and return them to draft status.</p>

      {isLoading && <p className="mt-6 text-sm text-slate-500">Loading locked goals...</p>}

      {isError && (
        <p className="mt-6 text-sm text-red-600">
          Failed to load locked goals: {error.message}
        </p>
      )}

      {!isLoading && !isError && lockedGoals?.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">No locked goals found.</p>
      )}

      {!isLoading && !isError && lockedGoals && lockedGoals.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {["Employee", "Goal", "Weight", "Shared", "Action"].map((col) => (
                  <th
                    key={col}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {lockedGoals.map((goal) => (
                <tr key={goal.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 text-sm text-slate-900">
                    <div className="font-medium">{goal.user.name ?? "Unknown employee"}</div>
                    <div className="text-xs text-slate-500">{goal.user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">
                    <div className="font-medium">{goal.title}</div>
                    <div className="text-xs text-slate-500">{goal.thrustArea}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{goal.weightage}%</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                    {goal.isShared ? "Yes" : "No"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => unlockGoal.mutate({ goalId: goal.id })}
                      disabled={unlockGoal.isPending}
                      className="rounded-md bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {unlockGoal.isPending && unlockGoal.variables?.goalId === goal.id
                        ? "Unlocking..."
                        : "Unlock"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
