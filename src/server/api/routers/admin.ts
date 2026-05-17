import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

async function createAuditLog(
  ctx: { db: any },
  input: {
    goalId: string;
    action: string;
    previousData?: unknown;
    newData?: unknown;
  },
) {
  const admin = await ctx.db.user.findUnique({ where: { id: "adm1" } });
  if (!admin) return;

  await ctx.db.auditLog.create({
    data: {
      goalId: input.goalId,
      changedById: "adm1",
      action: input.action,
      previousData: input.previousData ? JSON.stringify(input.previousData) : null,
      newData: input.newData ? JSON.stringify(input.newData) : null,
    },
  });
}

export const adminRouter = createTRPCRouter({
  getEmployees: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      where: { role: "EMPLOYEE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
  }),

  getAnalyticsMetrics: publicProcedure.query(async ({ ctx }) => {
    const goals = await ctx.db.goal.findMany({ include: { user: true } });
    const checkins = await ctx.db.checkIn.findMany();
    const users = await ctx.db.user.findMany({ where: { role: "MANAGER" } });

    const totalGoals = goals.length;
    const avgCompletion =
      checkins.length > 0
        ? Math.round(
            checkins.reduce((sum) => sum + 50, 0) /
              checkins.length,
          )
        : 0;

    const goalsByUom = Object.entries(goals.reduce(
      (acc, goal) => {
        const current = acc[goal.uom] || 0;
        return { ...acc, [goal.uom]: current + 1 };
      },
      {} as Record<string, number>,
    )).map(([uom, count]) => ({ uom, count }));

    const managerMetrics = users
      .map((manager) => {
        const managerGoals = goals.filter((g) => g.user.managerId === manager.id);
        const managerCheckins = checkins.filter((c) => {
          const goal = managerGoals.find((g) => g.id === c.goalId);
          return goal !== undefined;
        });

        const completionRate =
          managerGoals.length > 0
            ? Math.round(
                (managerCheckins.filter((c) => c.progressStatus === "COMPLETED")
                  .length /
                  managerGoals.length) *
                  100,
              )
            : 0;

        let status = "Needs Improvement";
        if (completionRate === 100) status = "Perfect";
        else if (completionRate >= 90) status = "Excellent";
        else if (completionRate >= 75) status = "On Track";

        return {
          name: manager.name,
          department: managerGoals[0]?.thrustArea || "General",
          completionRate,
          status,
        };
      })
      .sort((a, b) => b.completionRate - a.completionRate);

    return {
      totalGoals,
      avgCompletion,
      goalsByUom,
      managerMetrics,
    };
  }),

  pushSharedGoal: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        thrustArea: z.string().min(1),
        uom: z.enum(["NUMERIC", "PERCENTAGE", "TIMELINE", "ZERO_BASED"]),
        target: z.string().min(1),
        weightage: z.coerce.number().min(10).max(100),
        employeeIds: z.array(z.string()).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { employeeIds, ...goalData } = input;

      const createdGoals = await Promise.all(
        employeeIds.map((userId) =>
          ctx.db.goal.create({
            data: {
              ...goalData,
              userId,
              status: "LOCKED",
              isShared: true,
            },
          }),
        ),
      );

      await Promise.all(
        createdGoals.map((goal) =>
          createAuditLog(ctx, {
            goalId: goal.id,
            action: "PUSHED_SHARED_GOAL",
            newData: goal,
          }),
        ),
      );

      return { count: createdGoals.length };
    }),

  getCompletionReport: publicProcedure.query(async ({ ctx }) => {
    const goals = await ctx.db.goal.findMany();
    const checkins = await ctx.db.checkIn.findMany({
      include: {
        goal: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const achievementRows = checkins.map((checkIn) => ({
      employee: checkIn.goal.user.name ?? "Unknown employee",
      email: checkIn.goal.user.email ?? "",
      goal: checkIn.goal.title,
      quarter: checkIn.quarter,
      target: checkIn.goal.target,
      actual: checkIn.actualAchievement,
      uom: checkIn.goal.uom,
      progressStatus: checkIn.progressStatus,
    }));

    return {
      totalGoals: goals.length,
      completedGoals: goals.filter((g) => g.status === "LOCKED").length,
      totalCheckins: checkins.length,
      completedCheckins: checkins.filter(
        (c) => c.progressStatus === "COMPLETED",
      ).length,
      onTrackCheckins: checkins.filter((c) => c.progressStatus === "ON_TRACK").length,
      notStartedCheckins: checkins.filter((c) => c.progressStatus === "NOT_STARTED").length,
      achievementRows,
    };
  }),

  getAuditLogs: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }),

  unlockGoal: publicProcedure
    .input(z.object({ goalId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const previousGoal = await ctx.db.goal.findUnique({ where: { id: input.goalId } });
      const goal = await ctx.db.goal.update({
        where: { id: input.goalId },
        data: { status: "DRAFT" },
      });
      await createAuditLog(ctx, {
        goalId: goal.id,
        action: "UNLOCKED_GOAL",
        previousData: previousGoal,
        newData: goal,
      });
      return goal;
    }),

  getLockedGoalsForAdmin: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.goal.findMany({
      where: { status: "LOCKED" },
      include: { user: true },
      orderBy: { updatedAt: "desc" },
    });
  }),

  cycleConfig: publicProcedure
    .input(
      z.object({
        phaseName: z.enum([
          "GOAL_SETTING",
          "GOAL_APPROVAL",
          "CHECK_IN_1",
          "CHECK_IN_2",
          "CHECK_IN_3",
          "CHECK_IN_4",
        ]),
        startDate: z.string(),
        endDate: z.string(),
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.cycleConfig.upsert({
        where: { phaseName: input.phaseName },
        create: input,
        update: {
          startDate: input.startDate,
          endDate: input.endDate,
          isActive: input.isActive,
        },
      });
    }),

  getCycleConfig: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.cycleConfig.findMany();
  }),
});
