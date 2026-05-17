"use client";

import { GoalForm } from "../_components/GoalForm";

export default function GoalsPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2">
            Goal Setting
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            My Goals
          </h1>
          <p className="mt-2 text-slate-600">
            Create and manage your quarterly goals
          </p>
        </div>
        
        <GoalForm />
      </div>
    </main>
  );
}
