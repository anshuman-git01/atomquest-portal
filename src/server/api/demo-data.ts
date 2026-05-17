import type { PrismaClient } from "@prisma/client";

const DEMO_USERS = [
  {
    id: "mgr1",
    email: "manager@demo.com",
    name: "Mike Manager",
    role: "MANAGER",
  },
  {
    id: "emp1",
    email: "employee@demo.com",
    name: "Sarah Employee",
    role: "EMPLOYEE",
    managerId: "mgr1",
  },
  {
    id: "adm1",
    email: "admin@demo.com",
    name: "HR Admin",
    role: "ADMIN",
  },
] as const;

type DemoDb = PrismaClient;

export async function ensureDemoUsers(db: DemoDb) {
  for (const user of DEMO_USERS) {
    await db.user.upsert({
      where: { id: user.id },
      create: user,
      update: {
        email: user.email,
        name: user.name,
        role: user.role,
        ...("managerId" in user ? { managerId: user.managerId } : {}),
      },
    });
  }
}

export async function ensureDemoUser(db: DemoDb, userId: string) {
  if (["emp1", "mgr1", "adm1"].includes(userId)) {
    await ensureDemoUsers(db);
  }

  return db.user.findUnique({ where: { id: userId } });
}
