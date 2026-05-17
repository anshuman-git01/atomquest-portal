"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useRole } from "~/lib/role-context";

function formatUom(uom: string) {
  const labels: Record<string, string> = {
    NUMERIC: "Numeric",
    PERCENTAGE: "Percentage",
    TIMELINE: "Timeline",
    ZERO_BASED: "Zero-based",
  };
  return labels[uom] ?? uom;
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

export default function ManagerDashboardPage() {
  const { role } = useRole();
  const utils = api.useUtils();
  const { data: pendingGoals, isLoading, isError, error } = api.goal.getPendingGoals.useQuery({ role });

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState("");
  const [editWeightage, setEditWeightage] = useState<number | "">();

  const approveGoal = api.goal.approveGoal.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.goal.getPendingGoals.invalidate(),
        utils.goal.getLockedGoals.invalidate(),
        utils.admin.getAuditLogs.invalidate(),
        utils.admin.getCompletionReport.invalidate(),
        utils.admin.getAnalyticsMetrics.invalidate(),
      ]);
    },
  });

  const returnGoal = api.goal.returnGoal.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.goal.getPendingGoals.invalidate(),
        utils.admin.getAuditLogs.invalidate(),
      ]);
    },
  });

  const updateGoalInline = api.goal.updateGoalInline.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.goal.getPendingGoals.invalidate(),
        utils.admin.getAuditLogs.invalidate(),
        utils.admin.getAnalyticsMetrics.invalidate(),
      ]);
      setEditingGoalId(null);
      setEditTarget("");
      setEditWeightage("");
    },
  });

  const handleEditOpen = (goal: NonNullable<typeof pendingGoals>[number]) => {
    setEditingGoalId(goal.id);
    setEditTarget(goal.target);
    setEditWeightage(goal.weightage);
  };

  const handleSaveChanges = () => {
    if (editingGoalId && editTarget && editWeightage) {
      updateGoalInline.mutate({
        goalId: editingGoalId,
        newTarget: editTarget,
        newWeightage: Number(editWeightage),
      });
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Phase 1 - Manager Workflow
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Manager Dashboard - Goal Approvals
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Review employee-submitted goals and lock them after approval.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {isLoading && (
            <div className="px-6 py-16 text-center text-sm text-slate-500">Loading pending goals...</div>
          )}

          {isError && (
            <div className="px-6 py-16 text-center text-sm text-red-600">
              Failed to load goals: {error.message}
            </div>
          )}

          {!isLoading && !isError && pendingGoals?.length === 0 && (
            <div className="px-6 py-16 text-center text-sm text-slate-500">
              No goals awaiting approval.
            </div>
          )}

          {!isLoading && !isError && pendingGoals && pendingGoals.length > 0 && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-medium text-blue-600">{goal.thrustArea}</span>
                        <h3 className="font-semibold text-slate-900 mt-1">{goal.title}</h3>
                      </div>
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded">{formatStatus(goal.status)}</span>
                    </div>
                    <div className="flex gap-3 mt-3 text-sm text-slate-600 flex-wrap">
                      <span>[GOAL] Target: {goal.target}</span>
                      <span>[WEIGHT] Weight: {goal.weightage}%</span>
                      <span>[CHART] UoM: {formatUom(goal.uom)}</span>
                    </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      <button
                        type="button"
                        onClick={() => handleEditOpen(goal)}
                        disabled={updateGoalInline.isPending || editingGoalId === goal.id}
                        className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => approveGoal.mutate({ goalId: goal.id })}
                        disabled={approveGoal.isPending || editingGoalId === goal.id}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {approveGoal.isPending && approveGoal.variables?.goalId === goal.id
                          ? "Locking..."
                          : "Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => returnGoal.mutate({ goalId: goal.id })}
                        disabled={returnGoal.isPending || editingGoalId === goal.id}
                        className="text-red-600 hover:text-red-700 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {returnGoal.isPending && returnGoal.variables?.goalId === goal.id
                          ? "Returning..."
                          : "Return"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingGoalId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900">Edit Goal</h2>
              </div>
              <div className="space-y-4 px-6 py-4">
                <div>
                  <label htmlFor="editTarget" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Target
                  </label>
                  <input
                    id="editTarget"
                    type="text"
                    value={editTarget}
                    onChange={(e) => setEditTarget(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g., $500k"
                  />
                </div>
                <div>
                  <label htmlFor="editWeightage" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Weightage (%)
                  </label>
                  <input
                    id="editWeightage"
                    type="number"
                    value={editWeightage}
                    onChange={(e) => setEditWeightage(e.target.value ? Number(e.target.value) : "")}
                    min={10}
                    max={100}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Min 10%"
                  />
                </div>
              </div>
              <div className="flex gap-2 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setEditingGoalId(null)}
                  disabled={updateGoalInline.isPending}
                  className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={updateGoalInline.isPending || !editTarget || !editWeightage}
                  className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updateGoalInline.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
