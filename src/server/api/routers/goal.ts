import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const goalInputSchema = z.object({
  thrustArea: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  uom: z.enum(["NUMERIC", "PERCENTAGE", "TIMELINE", "ZERO_BASED"]),
  target: z.string().min(1),
  weightage: z.coerce.number().min(10).max(100),
});

const submitGoalSheetInput = z.object({
  goals: z
    .array(goalInputSchema)
    .min(1, "Add at least one goal")
    .max(8, "Maximum 8 goals allowed")
    .refine(
      (goals) => goals.reduce((sum, goal) => sum + goal.weightage, 0) === 100,
      { message: "Total weightage across all goals MUST equal exactly 100%" },
    ),
  userId: z.string(),
});

export const goalRouter = createTRPCRouter({
  getPendingGoals: publicProcedure
    .input(z.object({ userId: z.string().optional(), role: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const role = input?.role || "EMPLOYEE";

      if (role === "MANAGER") {
        return ctx.db.goal.findMany({
          where: {
            status: { in: ["DRAFT", "PENDING_APPROVAL"] },
          },
          include: { user: true },
          orderBy: { createdAt: "desc" },
        });
      }

      const userId = input?.userId || "emp1";
      return ctx.db.goal.findMany({
        where: {
          userId,
          status: { in: ["DRAFT", "PENDING_APPROVAL"] },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  approveGoal: publicProcedure
    .input(z.object({ goalId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.goal.update({
        where: { id: input.goalId },
        data: { status: "LOCKED" },
      });
    }),

  returnGoal: publicProcedure
    .input(z.object({ goalId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.goal.update({
        where: { id: input.goalId },
        data: { status: "DRAFT" },
      });
    }),

  getLockedGoals: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.goal.findMany({
        where: {
          userId: input.userId,
          status: "LOCKED",
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  updateGoalInline: publicProcedure
    .input(
      z.object({
        goalId: z.string().min(1),
        newTarget: z.string().min(1),
        newWeightage: z.coerce.number().min(10).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.goal.update({
        where: { id: input.goalId },
        data: {
          target: input.newTarget,
          weightage: input.newWeightage,
        },
      });
    }),

  submitGoalSheet: publicProcedure
    .input(submitGoalSheetInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.goal.createMany({
        data: input.goals.map((goal) => ({
          userId: input.userId,
          thrustArea: goal.thrustArea,
          title: goal.title,
          description: goal.description ?? null,
          uom: goal.uom,
          target: goal.target,
          weightage: goal.weightage,
          status: "DRAFT",
        })),
      });
    }),
});
