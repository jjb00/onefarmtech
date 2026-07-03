import fs from "node:fs";
import path from "node:path";

const strict = process.argv.includes("--strict");
const root = process.cwd();
const schemaPath = path.join(root, "prisma", "schema.prisma");

function readSchema() {
  try {
    return fs.readFileSync(schemaPath, "utf8");
  } catch {
    return "";
  }
}

function statusIcon(status) {
  if (status === "pass") return "✅";
  if (status === "warn") return "⚠️";
  return "⛔";
}

const schema = readSchema();
const isSqlite = schema.includes('provider = "sqlite"');
const isPostgres = schema.includes('provider = "postgresql"');

const checks = [
  {
    title: "Database provider",
    status: isSqlite ? "fail" : isPostgres ? "pass" : "warn",
    detail: isSqlite
      ? "Prisma is still using local SQLite."
      : isPostgres
        ? "Prisma is using Postgres."
        : "Could not identify Prisma provider.",
  },
  {
    title: "DATABASE_URL",
    status: process.env.DATABASE_URL ? "pass" : isSqlite ? "warn" : "fail",
    detail: process.env.DATABASE_URL
      ? "DATABASE_URL is present."
      : "DATABASE_URL is missing.",
  },
  {
    title: "ADMIN_PASSWORD",
    status:
      process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD !== "onefarmtech-admin"
        ? "warn"
        : "fail",
    detail:
      process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD !== "onefarmtech-admin"
        ? "ADMIN_PASSWORD is set, but temporary auth is still in use."
        : "ADMIN_PASSWORD is missing or fallback password may be used.",
  },
  {
    title: "Supabase public env",
    status:
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "pass"
        : "warn",
    detail:
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "Supabase public env vars are present."
        : "Supabase public env vars are not configured.",
  },
  {
    title: "Buyer auth",
    status: "fail",
    detail: "Real recurring buyer login is not active yet.",
  },
  {
    title: "Staff auth",
    status: "fail",
    detail: "Proper staff login and role enforcement are not active yet.",
  },
];

console.log("\nOneFarmTech prelaunch check\n");

for (const check of checks) {
  console.log(`${statusIcon(check.status)} ${check.title}: ${check.detail}`);
}

const failCount = checks.filter((check) => check.status === "fail").length;
const warnCount = checks.filter((check) => check.status === "warn").length;

console.log(`\nSummary: ${failCount} blocked, ${warnCount} warning(s).\n`);

if (strict && (failCount > 0 || warnCount > 0)) {
  console.error("Strict prelaunch check failed.");
  process.exit(1);
}

if (failCount > 0) {
  console.log("Deployment should remain blocked until failed checks are resolved.");
} else {
  console.log("No blocking checks found. Review warnings before deployment.");
}
