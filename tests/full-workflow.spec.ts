import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { expect, type Page, type Request, test } from "@playwright/test";

const prisma = new PrismaClient();

const BASE_URL = "http://localhost:3000";
const USERS = {
  employee: {
    id: "employee-test-user",
    name: "Employee User",
    email: "employee@test.local",
    role: "EMPLOYEE",
  },
  manager: {
    id: "manager-test-user",
    name: "Manager User",
    email: "manager@test.local",
    role: "MANAGER",
  },
  admin: {
    id: "admin-test-user",
    name: "Admin User",
    email: "admin@test.local",
    role: "ADMIN",
  },
  demoEmployee: {
    id: "demo-employee",
    name: "Demo Employee",
    email: "demo-employee@test.local",
    role: "EMPLOYEE",
  },
} as const;

type Telemetry = {
  consoleErrors: string[];
  apiTimes: Array<{ url: string; method: string; status: number; durationMs: number }>;
  starts: Map<Request, number>;
};

const telemetryByPage = new WeakMap<Page, Telemetry>();

async function resetAndSeedDatabase() {
  await prisma.checkIn.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.cycleConfig.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      ...USERS.manager,
      directReports: {
        create: [
          { ...USERS.employee, role: "EMPLOYEE" },
          { ...USERS.demoEmployee, role: "EMPLOYEE" },
        ],
      },
    },
  });
  await prisma.user.create({ data: USERS.admin });

  const today = new Date();
  await prisma.cycleConfig.create({
    data: {
      phaseName: "GOAL_SETTING",
      startDate: new Date(today.getTime() - 24 * 60 * 60 * 1000),
      endDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  const seededLockedGoal = await prisma.goal.create({
    data: {
      userId: USERS.employee.id,
      thrustArea: "Reliability",
      title: "Seeded Locked Goal",
      uom: "NUMERIC",
      target: "100",
      weightage: 20,
      status: "LOCKED",
    },
  });

  await prisma.checkIn.create({
    data: {
      goalId: seededLockedGoal.id,
      quarter: "Q4",
      actualAchievement: "35",
      progressStatus: "ON_TRACK",
    },
  });
}

async function createSessionToken(userId: string) {
  const sessionToken = randomUUID();
  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  return sessionToken;
}

async function seedManagerWorkflowGoals() {
  await prisma.goal.deleteMany({
    where: {
      userId: USERS.employee.id,
      title: { in: ["Employee Goal 1", "Employee Goal 2"] },
      status: { in: ["DRAFT", "PENDING_APPROVAL"] },
    },
  });

  await prisma.goal.createMany({
    data: [
      {
        userId: USERS.employee.id,
        thrustArea: "Sales",
        title: "Employee Goal 1",
        uom: "NUMERIC",
        target: "500",
        weightage: 60,
        status: "DRAFT",
      },
      {
        userId: USERS.employee.id,
        thrustArea: "Quality",
        title: "Employee Goal 2",
        uom: "PERCENTAGE",
        target: "95",
        weightage: 40,
        status: "DRAFT",
      },
    ],
  });
}

async function loginAsRole(page: Page, role: keyof typeof USERS) {
  const sessionToken = await createSessionToken(USERS[role].id);
  await page.context().clearCookies();
  await page.context().addCookies([
    {
      name: "authjs.session-token",
      value: sessionToken,
      url: BASE_URL,
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: "next-auth.session-token",
      value: sessionToken,
      url: BASE_URL,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await page.goto("/");
}

async function fillGoal(page: Page, index: number, data: {
  thrustArea: string;
  title: string;
  uom: "NUMERIC" | "PERCENTAGE" | "TIMELINE" | "ZERO_BASED";
  target: string;
  weightage: string;
}) {
  await page.getByLabel("Thrust Area").nth(index).fill(data.thrustArea);
  await page.getByLabel("Goal Title").nth(index).fill(data.title);
  await page.getByLabel("Unit of Measurement (UoM)").nth(index).selectOption(data.uom);
  await page.getByLabel("Target").nth(index).fill(data.target);
  await page.getByLabel("Weightage (%)").nth(index).fill(data.weightage);
}

test.describe.serial("End-to-end full workflow", () => {
  test.beforeAll(async () => {
    await resetAndSeedDatabase();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    const telemetry: Telemetry = {
      consoleErrors: [],
      apiTimes: [],
      starts: new Map(),
    };
    telemetryByPage.set(page, telemetry);

    page.on("dialog", (dialog) => dialog.accept());
    page.on("console", (msg) => {
      if (msg.type() === "error") telemetry.consoleErrors.push(msg.text());
    });
    page.on("request", (request) => {
      if (request.url().includes("/api/trpc/")) telemetry.starts.set(request, Date.now());
    });
    page.on("response", (response) => {
      const request = response.request();
      const startedAt = telemetry.starts.get(request);
      if (!request.url().includes("/api/trpc/") || startedAt === undefined) return;
      telemetry.apiTimes.push({
        url: request.url(),
        method: request.method(),
        status: response.status(),
        durationMs: Date.now() - startedAt,
      });
      telemetry.starts.delete(request);
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    const telemetry = telemetryByPage.get(page);
    if (!telemetry) return;

    await testInfo.attach("console-errors.json", {
      body: Buffer.from(JSON.stringify(telemetry.consoleErrors, null, 2)),
      contentType: "application/json",
    });
    await testInfo.attach("api-response-times.json", {
      body: Buffer.from(JSON.stringify(telemetry.apiTimes, null, 2)),
      contentType: "application/json",
    });

    if (testInfo.status !== testInfo.expectedStatus) {
      await page.screenshot({
        path: testInfo.outputPath("failure.png"),
        fullPage: true,
      });
    }
  });

  test("Employee journey: create goals, submit, validate constraints, enforce quarterly window", async ({
    page,
  }) => {
    await loginAsRole(page, "employee");
    await expect(page.getByText("Welcome back, Employee User! 👋")).toBeVisible();

    await page.goto("/goals");
    await fillGoal(page, 0, {
      thrustArea: "Sales",
      title: "Employee Goal 1",
      uom: "NUMERIC",
      target: "500",
      weightage: "60",
    });

    await page.getByRole("button", { name: "Add Another Goal" }).click();
    await fillGoal(page, 1, {
      thrustArea: "Quality",
      title: "Employee Goal 2",
      uom: "PERCENTAGE",
      target: "95",
      weightage: "40",
    });

    await page.getByRole("button", { name: "Submit Goals for Approval" }).click();
    await expect(page.getByText("Total Weightage: 100% / 100%")).toBeVisible();

    await fillGoal(page, 0, {
      thrustArea: "Validation",
      title: "Too Low Weight",
      uom: "NUMERIC",
      target: "100",
      weightage: "5",
    });
    const weightInput = page.getByLabel("Weightage (%)").first();
    const isValidWeight = await weightInput.evaluate((node) => (node as HTMLInputElement).checkValidity());
    expect(isValidWeight).toBe(false);

    const addGoalButton = page.getByRole("button", { name: "Add Another Goal" }).first();
    for (let i = 0; i < 10; i++) {
      const goalCards = await page.getByRole("heading", { level: 3 }).filter({ hasText: /^Goal \d+$/ }).count();
      if (goalCards >= 8) break;
      await addGoalButton.click();
    }
    await expect(page.getByRole("heading", { level: 3 }).filter({ hasText: /^Goal \d+$/ })).toHaveCount(8);
    await expect(page.getByText("Goal 8")).toBeVisible();

    await page.goto("/checkins");
    await expect(page.getByText("My OKRs - Quarterly Check-in")).toBeVisible();
    await expect(page.getByText(/Check-in window for Q1 is currently closed\./)).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit Update" }).first()).toBeDisabled();
  });

  test("Manager journey: approve with inline edit, return for rework, add check-in comment", async ({
    page,
  }) => {
    await seedManagerWorkflowGoals();
    await loginAsRole(page, "manager");
    await expect(page.getByRole("heading", { name: "Manager Dashboard" })).toBeVisible();

    await page.goto("/manager");

    const firstGoalCard = page.locator("div.rounded-lg.border").filter({ hasText: "Employee Goal 1" }).first();
    await firstGoalCard.getByRole("button", { name: "Edit" }).click();
    await page.getByLabel("Target").fill("650");
    await page.getByLabel("Weightage (%)").fill("55");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByRole("heading", { name: "Edit Goal" })).toHaveCount(0);
    await firstGoalCard.getByRole("button", { name: "Approve" }).click();
    await expect(firstGoalCard).toHaveCount(0);

    const secondGoalCard = page.locator("div.rounded-lg.border").filter({ hasText: "Employee Goal 2" }).first();
    await secondGoalCard.getByRole("button", { name: "Return" }).click();
    await expect(secondGoalCard).toHaveCount(0);

    await page.goto("/manager/checkins");
    const seededCheckInCard = page.locator("article").filter({ hasText: "Seeded Locked Goal" }).first();
    await seededCheckInCard.getByPlaceholder("Write structured feedback for this check-in…").fill("Good momentum. Keep this trajectory next quarter.");
    await seededCheckInCard.getByRole("button", { name: "Save Feedback" }).click();
    await expect(page.getByText("Good momentum. Keep this trajectory next quarter.")).toBeVisible();
  });

  test("Admin journey: push KPI, export CSV, unlock goal, verify audit entry", async ({ page }) => {
    await loginAsRole(page, "admin");
    await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();

    await page.goto("/admin");
    await page.getByLabel("Thrust Area").fill("Org Growth");
    await page.getByLabel("Title").fill("Shared KPI - New Pipeline");
    await page.getByLabel("UoM").selectOption("NUMERIC");
    await page.getByLabel("Target").fill("1000");
    await page.getByLabel("All Employees (Demo)").check();
    await page.getByRole("button", { name: "Push Departmental KPI" }).click();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export to CSV" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("achievement_report.csv");

    const unlockButtons = page.getByRole("button", { name: "Force Unlock" });
    await expect(unlockButtons.first()).toBeVisible();
    await unlockButtons.first().click();

    await expect
      .poll(async () =>
        prisma.auditLog.count({
          where: { action: "UNLOCK_GOAL", changedById: USERS.admin.id },
        }),
      )
      .toBeGreaterThan(0);
  });
});
