"use client";

import { useState } from "react";

import { calculateSystemProgressScore } from "~/lib/progress-score";
import { api } from "~/trpc/react";

type TeamCheckIn = {
  id: string;
  quarter: string;
  actualAchievement: string;
  progressStatus: string;
  managerComment: string | null;
  goal: {
    title: string;
    target: string;
    uom: string;
    thrustArea: string;
  };
};

function formatProgressStatus(status: string) {
  return status.replace(/_/g, " ");
}

function scoreColorClass(score: number | null) {
  if (score === null) return "text-slate-500";
  if (score >= 100) return "text-green-600";
  if (score >= 70) return "text-amber-600";
  return "text-red-600";
}

function scoreStrokeClass(score: number | null) {
  if (score === null) return "stroke-slate-300";
  if (score >= 100) return "stroke-green-600";
  if (score >= 70) return "stroke-amber-500";
  return "stroke-red-500";
}

function CircularProgress({ score, display }: { score: number | null; display: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const clamped = score === null ? 0 : Math.min(100, Math.max(0, score));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r={radius} fill="none" strokeWidth="6" className="stroke-slate-200" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          strokeWidth="6"
          className={scoreStrokeClass(score)}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center px-1 text-center text-xs font-bold leading-tight ${scoreColorClass(score)}`}
      >
        {display}
      </span>
    </div>
  );
}

function CheckInReviewCard({ checkIn }: { checkIn: TeamCheckIn }) {
  const utils = api.useUtils();
  const [comment, setComment] = useState("");

  const progress = calculateSystemProgressScore(
    checkIn.goal.uom,
    checkIn.goal.target,
    checkIn.actualAchievement,
  );

  const addComment = api.checkin.addManagerComment.useMutation({
    onSuccess: async () => {
      await utils.checkin.getTeamCheckIns.invalidate();
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            {checkIn.goal.thrustArea} - {checkIn.quarter}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">{checkIn.goal.title}</h2>

          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-md bg-slate-50 px-3 py-2">
              <dt className="text-xs font-semibold uppercase text-slate-500">Planned Target</dt>
              <dd className="mt-0.5 font-medium text-slate-900">{checkIn.goal.target}</dd>
            </div>
            <div className="rounded-md bg-slate-50 px-3 py-2">
              <dt className="text-xs font-semibold uppercase text-slate-500">Actual Achievement</dt>
              <dd className="mt-0.5 font-medium text-slate-900">{checkIn.actualAchievement}</dd>
            </div>
            <div className="rounded-md bg-slate-50 px-3 py-2">
              <dt className="text-xs font-semibold uppercase text-slate-500">Progress Status</dt>
              <dd className="mt-0.5 font-medium text-slate-900">
                {formatProgressStatus(checkIn.progressStatus)}
              </dd>
            </div>
            <div className="rounded-md bg-slate-50 px-3 py-2">
              <dt className="text-xs font-semibold uppercase text-slate-500">UoM</dt>
              <dd className="mt-0.5 font-medium text-slate-900">{checkIn.goal.uom}</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-col items-center gap-2 lg:items-end">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            System Progress Score
          </p>
          <CircularProgress score={progress.score} display={progress.display} />
        </div>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="text-sm font-semibold text-slate-900">Manager Feedback</h3>
        {checkIn.managerComment ? (
          <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {checkIn.managerComment}
          </p>
        ) : (
          <form
            className="mt-3 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!comment.trim()) return;
              addComment.mutate({ checkInId: checkIn.id, comment: comment.trim() });
            }}
          >
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Write structured feedback for this check-in..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              disabled={addComment.isPending || !comment.trim()}
              className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {addComment.isPending ? "Saving..." : "Save Feedback"}
            </button>
          </form>
        )}
      </div>
    </article>
  );
}

export default function ManagerCheckInsPage() {
  const { data: teamCheckIns, isLoading, isError, error } = api.checkin.getTeamCheckIns.useQuery();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Phase 2 - Manager Workflow
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Team Quarterly Check-ins
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Review team progress, system-calculated scores, and provide structured feedback.
          </p>
        </div>

        {isLoading && (
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">
            Loading team check-ins...
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-16 text-center text-sm text-red-700">
            Failed to load check-ins: {error.message}
          </div>
        )}

        {!isLoading && !isError && teamCheckIns?.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">
            No check-ins submitted yet.
          </div>
        )}

        {!isLoading && !isError && teamCheckIns && teamCheckIns.length > 0 && (
          <div className="space-y-4">
            {teamCheckIns.map((checkIn) => (
              <CheckInReviewCard key={checkIn.id} checkIn={checkIn} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
