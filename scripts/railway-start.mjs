import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const defaultDatabaseUrl = "file:./prod.db";
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const sqliteSchemaPath = resolve(scriptDirectory, "sqlite-schema.sql");

process.env.DATABASE_URL ||= defaultDatabaseUrl;

if (process.env.DATABASE_URL.startsWith("file:/")) {
  const sqlitePath = process.env.DATABASE_URL.replace(/^file:/, "");
  const directory = dirname(resolve(sqlitePath));

  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
}

const run = (command, args) => {
  const result = spawnSync(command, args, {
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const dbPush = spawnSync("npx", ["prisma", "db", "push"], {
  env: process.env,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (dbPush.status !== 0) {
  console.warn("Prisma db push failed; applying SQLite schema fallback.");

  const schemaSql = readFileSync(sqliteSchemaPath, "utf8");
  const fallback = spawnSync(
    "npx",
    ["prisma", "db", "execute", "--stdin", "--schema", "prisma/schema.prisma"],
    {
    env: process.env,
    input: schemaSql,
    stdio: ["pipe", "inherit", "inherit"],
    shell: process.platform === "win32",
    },
  );

  if (fallback.status !== 0) {
    process.exit(fallback.status ?? 1);
  }
}

run("npx", ["next", "start"]);
