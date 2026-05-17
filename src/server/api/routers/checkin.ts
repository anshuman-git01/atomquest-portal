import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const createCheckInInput = z.object({
  goalId: z.string().min(1),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
  actualAchievement: z.string().min(1),
  progressStatus: z.enum(["NOT_STARTED", "ON_TRACK", "COMPLETED"]),
});

export const checkinRouter = createTRPCRouter({
  getTeamCheckIns: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.checkIn.findMany({
      include: { goal: true },
      orderBy: { createdAt: "desc" },
    });
  }),

  addManagerComment: publicProcedure
    .input(
      z.object({
        checkInId: z.string().min(1),
        comment: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.checkIn.update({
        where: { id: input.checkInId },
        data: { managerComment: input.comment },
      });
    }),

  createCheckIn: publicProcedure
    .input(createCheckInInput)
    .mutation(async ({ ctx, input }) => {
      const goal = await ctx.db.goal.findFirst({
        where: { id: input.goalId, status: "LOCKED" },
      });

      if (!goal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Goal not found or not available for check-in.",
        });
      }

      try {
        return await ctx.db.checkIn.create({
          data: {
            goalId: input.goalId,
            quarter: input.quarter,
            actualAchievement: input.actualAchievement,
            progressStatus: input.progressStatus,
          },
        });
      } catch {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A check-in for ${input.quarter} already exists for this goal.`,
        });
      }
    }),

  updateCheckInWithCascade: publicProcedure
    .input(createCheckInInput)
    .mutation(async ({ ctx, input }) => {
      const goal = await ctx.db.goal.findFirst({
        where: { id: input.goalId, status: "LOCKED" },
        include: { childGoals: true },
      });

      if (!goal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Goal not found or not available for check-in.",
        });
      }

      try {
        // Create check-in for the parent/primary goal
        const checkIn = await ctx.db.checkIn.create({
          data: {
            goalId: input.goalId,
            quarter: input.quarter,
            actualAchievement: input.actualAchievement,
            progressStatus: input.progressStatus,
          },
        });

        // BRD Rule 1.12: If this goal has child goals, cascade the update
        if (goal.childGoals && goal.childGoals.length > 0) {
          await Promise.all(
            goal.childGoals.map((childGoal) =>
              ctx.db.checkIn.upsert({
                where: { goalId_quarter: { goalId: childGoal.id, quarter: input.quarter } },
                create: {
                  goalId: childGoal.id,
                  quarter: input.quarter,
                  actualAchievement: input.actualAchievement,
                  progressStatus: input.progressStatus,
                },
                update: {
                  actualAchievement: input.actualAchievement,
                  progressStatus: input.progressStatus,
                },
              }),
            ),
          );
        }

        return checkIn;
      } catch {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A check-in for ${input.quarter} already exists for this goal.`,
        });
      }
    }),
});
