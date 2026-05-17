"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { api } from "~/trpc/react";
import { useRole } from "~/lib/role-context";

// --- 1. THE BRD VALIDATION SCHEMA ---
const goalSchema = z.object({
  thrustArea: z.string().min(1, "Required"),
  title: z.string().min(1, "Required"),
  description: z.string().optional(),
  uom: z.enum(["NUMERIC", "PERCENTAGE", "TIMELINE", "ZERO_BASED"]),
  target: z.string().min(1, "Required"),
  weightage: z.coerce.number().min(10, "Min 10%").max(100), // Enforces minimum 10% per goal
});

const goalSheetSchema = z.object({
  goals: z
    .array(goalSchema)
    .min(1, "Add at least one goal")
    .max(8, "Maximum 8 goals allowed") // Enforces max 8 goals
    .refine((goals) => {
      const totalWeight = goals.reduce((sum, goal) => sum + (goal.weightage || 0), 0);
      return totalWeight === 100;
    }, { message: "Total weightage across all goals MUST equal exactly 100%" }), // Enforces exact 100%
});

type GoalSheetFormValues = z.infer<typeof goalSheetSchema>;

const inputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

const labelClassName = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600";

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
    </svg>
  );
}

const defaultFormValues: GoalSheetFormValues = {
  goals: [{ thrustArea: "", title: "", description: "", uom: "NUMERIC", target: "", weightage: 0 }],
};

// --- 2. THE COMPONENT ---
export function GoalForm() {
  const { currentUserId, role } = useRole();
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<GoalSheetFormValues>({
    resolver: zodResolver(goalSheetSchema),
    defaultValues: defaultFormValues,
  });

  const { fields, append, remove } = useFieldArray({
    name: "goals",
    control,
  });

  const { data: draftGoals } = api.goal.getPendingGoals.useQuery({ userId: currentUserId, role });
  const { data: cycleConfig } = api.admin.getCycleConfig.useQuery();
  const [sharedGoalIds, setSharedGoalIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (draftGoals && draftGoals.length > 0) {
      const formattedGoals = draftGoals.map((goal) => ({
        thrustArea: goal.thrustArea,
        title: goal.title,
        description: goal.description ?? "",
        uom: goal.uom as "NUMERIC" | "PERCENTAGE" | "TIMELINE" | "ZERO_BASED",
        target: goal.target,
        weightage: goal.weightage,
      }));
      const shared = new Set(draftGoals.filter((g) => g.isShared).map((g) => g.id));
      setSharedGoalIds(shared);
      reset({ goals: formattedGoals });
    }
  }, [draftGoals, reset]);

  // Check if cycle window is open
  const isCycleOpen = true; // Demo mode: always open

  const submitGoals = api.goal.submitGoalSheet.useMutation({
    onSuccess: () => {
      alert("Goals submitted successfully!");
      reset(defaultFormValues);
      setSharedGoalIds(new Set());
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  // Calculate total weightage dynamically for the UI
  const watchGoals = watch("goals");
  const currentTotalWeight = watchGoals.reduce((sum, goal) => sum + (Number(goal.weightage) || 0), 0);
  const isWeightageValid = currentTotalWeight === 100;

  const onSubmit = (data: GoalSheetFormValues) => {
    submitGoals.mutate({ goals: data.goals, userId: currentUserId });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/60">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
            {/* Sticky header - Profit.co-style title row + top-right submit */}
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur-sm sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                Performance Cycle
              </p>

              <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Phase 1: Goal Creation
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Define up to 8 goals. Each goal needs at least 10% weight; total must equal 100%.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitGoals.isPending || !isCycleOpen || !isWeightageValid}
                  className="shrink-0 self-start rounded-md bg-[#2563eb] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:self-center"
                  title={!isWeightageValid ? "Total weightage must equal 100%" : ""}
                >
                  {submitGoals.isPending ? "Submitting..." : "Submit Goals for Approval"}
                </button>
              </div>

              {!isCycleOpen && (
                <p className="mt-4 text-sm italic text-red-600">
                  Phase 1 Goal Setting cycle is currently closed by Administration.
                </p>
              )}

              <div
                className={`mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${
                  isWeightageValid
                    ? "border-green-300 bg-green-100 text-green-800"
                    : "border-orange-300 bg-orange-50 text-orange-800"
                }`}
                role="status"
                aria-live="polite"
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isWeightageValid ? "bg-green-500" : "bg-orange-500"
                  }`}
                  aria-hidden="true"
                />
                Total Weightage: {currentTotalWeight}% / 100%
              </div>
            </div>

            <div className="px-6 py-8 sm:px-8">
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <article
                    key={field.id}
                    className="relative rounded-lg border border-slate-200 bg-white p-6"
                  >
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white shadow-sm">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">Goal {index + 1}</h3>
                          <p className="text-xs text-slate-500">Thrust area, target, and weightage</p>
                        </div>
                      </div>

                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        >
                          Remove Goal
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div>
                        <label htmlFor={`goals.${index}.thrustArea`} className={labelClassName}>
                          Thrust Area
                        </label>
                        <input
                          id={`goals.${index}.thrustArea`}
                          {...register(`goals.${index}.thrustArea`)}
                          disabled={sharedGoalIds.has(fields[index]?.id ?? "")}
                          className={`${inputClassName} ${
                            sharedGoalIds.has(fields[index]?.id ?? "")
                              ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                              : ""
                          }`}
                          placeholder="e.g., Q3 Sales"
                        />
                        {errors.goals?.[index]?.thrustArea && (
                          <p className="mt-1.5 text-xs font-medium text-red-600">
                            {errors.goals[index]?.thrustArea?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor={`goals.${index}.title`} className={labelClassName}>
                          Goal Title
                        </label>
                        <input
                          id={`goals.${index}.title`}
                          {...register(`goals.${index}.title`)}
                          disabled={sharedGoalIds.has(fields[index]?.id ?? "")}
                          className={`${inputClassName} ${
                            sharedGoalIds.has(fields[index]?.id ?? "")
                              ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                              : ""
                          }`}
                          placeholder="Increase revenue..."
                        />
                        {errors.goals?.[index]?.title && (
                          <p className="mt-1.5 text-xs font-medium text-red-600">
                            {errors.goals[index]?.title?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor={`goals.${index}.uom`} className={labelClassName}>
                          Unit of Measurement (UoM)
                        </label>
                        <select
                          id={`goals.${index}.uom`}
                          {...register(`goals.${index}.uom`)}
                          disabled={sharedGoalIds.has(fields[index]?.id ?? "")}
                          className={`${inputClassName} ${
                            sharedGoalIds.has(fields[index]?.id ?? "")
                              ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <option value="NUMERIC">Numeric (Higher is better)</option>
                          <option value="PERCENTAGE">Percentage (%)</option>
                          <option value="TIMELINE">Timeline (Date)</option>
                          <option value="ZERO_BASED">Zero-based (Lower is better)</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor={`goals.${index}.target`} className={labelClassName}>
                          Target
                        </label>
                        <input
                          id={`goals.${index}.target`}
                          {...register(`goals.${index}.target`)}
                          disabled={sharedGoalIds.has(fields[index]?.id ?? "")}
                          className={`${inputClassName} ${
                            sharedGoalIds.has(fields[index]?.id ?? "")
                              ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                              : ""
                          }`}
                          placeholder="e.g., $100k, 10-Nov-2026, 0 incidents"
                        />
                        {errors.goals?.[index]?.target && (
                          <p className="mt-1.5 text-xs font-medium text-red-600">
                            {errors.goals[index]?.target?.message}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2 md:max-w-xs">
                        <label htmlFor={`goals.${index}.weightage`} className={labelClassName}>
                          Weightage (%)
                        </label>
                        <input
                          id={`goals.${index}.weightage`}
                          type="number"
                          {...register(`goals.${index}.weightage`)}
                          className={inputClassName}
                          placeholder="Min 10%"
                          min={10}
                          max={100}
                        />
                        {errors.goals?.[index]?.weightage && (
                          <p className="mt-1.5 text-xs font-medium text-red-600">
                            {errors.goals[index]?.weightage?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    append({
                      thrustArea: "",
                      title: "",
                      description: "",
                      uom: "NUMERIC",
                      target: "",
                      weightage: 0,
                    })
                  }
                  disabled={fields.length >= 8}
                  className="inline-flex items-center gap-1.5 pt-1 text-sm font-medium text-blue-600 transition-colors hover:underline focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Another Goal
                </button>
              </div>

              {errors.goals?.root && (
                <div
                  className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  role="alert"
                >
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{errors.goals.root.message}</span>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
