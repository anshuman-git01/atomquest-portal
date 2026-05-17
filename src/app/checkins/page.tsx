"use client";

import { useState } from "react";

import { api } from "~/trpc/react";
import { useRole } from "~/lib/role-context";

type LockedGoal = {
  id: string;
  thrustArea: string;
  title: string;
  uom: string;
  target: string;
  weightage: number;
};

type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
type ProgressStatus = "NOT_STARTED" | "ON_TRACK" | "COMPLETED";

const inputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

const labelClassName = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600";

function isCheckInWindowOpen(selectedQuarter: string): boolean {
  const currentMonth = new Date().getMonth();
  
  switch (selectedQuarter) {
    case "Q1":
      return currentMonth === 6; // July
    case "Q2":
      return currentMonth === 9; // October
    case "Q3":
      return currentMonth === 0; // January
    case "Q4":
      return currentMonth === 2 || currentMonth === 3; // March or April
    default:
      return false;
  }
}

function formatUom(uom: string) {
  const labels: Record<string, string> = {
    NUMERIC: "Numeric",
    PERCENTAGE: "Percentage",
    TIMELINE: "Timeline",
    ZERO_BASED: "Zero-based",
  };
  return labels[uom] ?? uom;
}

function GoalCheckInCard({ goal }: { goal: LockedGoal }) {
  const [quarter, setQuarter] = useState<Quarter>("Q1");
  const [actualAchievement, setActualAchievement] = useState("");
  const [progressStatus, setProgressStatus] = useState<ProgressStatus>("ON_TRACK");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const createCheckIn = api.checkin.createCheckIn.useMutation({
    onSuccess: () => {
      setSuccessMessage("Check-in logged!");
      setActualAchievement("");
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (error) => {
      setSuccessMessage(null);
      alert(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualAchievement.trim()) return;

    createCheckIn.mutate({
      goalId: goal.id,
      quarter,
      actualAchievement: actualAchievement.trim(),
      progressStatus,
    });
  };

  const isWindowOpen = isCheckInWindowOpen(quarter);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{goal.thrustArea}</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">{goal.title}</h2>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
          <span className="rounded-md bg-slate-100 px-2.5 py-1">
            <span className="font-medium text-slate-800">Target:</span> {goal.target}
          </span>
          <span className="rounded-md bg-slate-100 px-2.5 py-1">
            <span className="font-medium text-slate-800">UoM:</span> {formatUom(goal.uom)}
          </span>
          <span className="rounded-md bg-slate-100 px-2.5 py-1">
            <span className="font-medium text-slate-800">Weight:</span> {goal.weightage}%
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Log Check-in</h3>

        {successMessage && (
          <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-800">
            {successMessage}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor={`quarter-${goal.id}`} className={labelClassName}>
              Quarter
            </label>
            <select
              id={`quarter-${goal.id}`}
              value={quarter}
              onChange={(e) => setQuarter(e.target.value as Quarter)}
              className={inputClassName}
            >
              <option value="Q1">Q1</option>
              <option value="Q2">Q2</option>
              <option value="Q3">Q3</option>
              <option value="Q4">Q4</option>
            </select>
          </div>

          <div>
            <label htmlFor={`status-${goal.id}`} className={labelClassName}>
              Status
            </label>
            <select
              id={`status-${goal.id}`}
              value={progressStatus}
              onChange={(e) => setProgressStatus(e.target.value as ProgressStatus)}
              className={inputClassName}
            >
              <option value="NOT_STARTED">Not Started</option>
              <option value="ON_TRACK">On Track</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <label htmlFor={`achievement-${goal.id}`} className={labelClassName}>
              Actual Achievement
            </label>
            <input
              id={`achievement-${goal.id}`}
              type="text"
              value={actualAchievement}
              onChange={(e) => setActualAchievement(e.target.value)}
              className={inputClassName}
              placeholder='e.g., "$50k", "5 incidents"'
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={createCheckIn.isPending || !actualAchievement.trim() || !isWindowOpen}
          className="mt-4 rounded-md bg-[#2563eb] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createCheckIn.isPending ? "Submitting..." : "Submit Update"}
        </button>
        {!isWindowOpen && (
          <p className="mt-2 text-sm italic text-red-600">
            Check-in window for {quarter} is currently closed.
          </p>
        )}
      </form>
    </article>
  );
}

export default function CheckInsPage() {
  const { currentUserId } = useRole();
  const { data: lockedGoals, isLoading, isError, error } = api.goal.getLockedGoals.useQuery({ userId: currentUserId });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Phase 2 - Employee Workflow
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            My OKRs - Quarterly Check-in
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Log progress against your approved goals for each quarter.
          </p>
        </div>

        {isLoading && (
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">
            Loading your OKRs...
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-16 text-center text-sm text-red-700">
            Failed to load goals: {error.message}
          </div>
        )}

        {!isLoading && !isError && lockedGoals?.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">
            No locked goals yet. Submit goals and have your manager approve them first.
          </div>
        )}

        {!isLoading && !isError && lockedGoals && lockedGoals.length > 0 && (
          <div className="space-y-4">
            {lockedGoals.map((goal) => (
              <GoalCheckInCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
