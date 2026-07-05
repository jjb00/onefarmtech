import {readFile} from "node:fs/promises";
import path from "node:path";

export type PrelaunchCheckStatus = "pass" | "warn" | "fail";

export type PrelaunchCheck = {
  title: string;
  status: PrelaunchCheckStatus;
  detail: string;
  recommendation: string;
};

function statusRank(status: PrelaunchCheckStatus) {
  if (status === "fail") return 3;
  if (status === "warn") return 2;
  return 1;
}

async function readPrismaSchema() {
  try {
    return await readFile(path.join(process.cwd(), "prisma/schema.prisma"), "utf8");
  } catch {
    return "";
  }
}

export async function getPrelaunchChecks() {
  const schema = await readPrismaSchema();

  const isSqlite = schema.includes('provider = "sqlite"');
  const isPostgres = schema.includes('provider = "postgresql"');
  const adminPassword = process.env.ADMIN_PASSWORD;
  const databaseUrl = process.env.DATABASE_URL || "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const nodeEnv = process.env.NODE_ENV || "development";

  const checks: PrelaunchCheck[] = [
    {
      title: "Database provider",
      status: isSqlite ? "fail" : isPostgres ? "pass" : "warn",
      detail: isSqlite
        ? "Prisma is not yet confirmed against the expected production database configuration."
        : isPostgres
          ? "Prisma is configured for Postgres."
          : "Database provider could not be confidently identified.",
      recommendation: isSqlite
        ? "Do not treat as production-ready until Supabase/Postgres, secrets, seeding and deployment checks are verified."
        : "Confirm migrations, seed data, and connection pooling before Vercel testing.",
    },
    {
      title: "Database URL",
      status: databaseUrl ? "pass" : isSqlite ? "warn" : "fail",
      detail: databaseUrl
        ? "DATABASE_URL is present in the environment."
        : "DATABASE_URL is not present in the environment.",
      recommendation: databaseUrl
        ? "Ensure the value is not pasted into chat or committed to git."
        : "For Supabase/Postgres, keep DATABASE_URL configured locally and in Vercel environment variables.",
    },
    {
      title: "Temporary staff password",
      status:
        adminPassword && adminPassword !== "onefarmtech-admin" ? "warn" : "fail",
      detail:
        adminPassword && adminPassword !== "onefarmtech-admin"
          ? "ADMIN_PASSWORD is set, but the app still uses a temporary shared-password gate."
          : "ADMIN_PASSWORD is missing or using the fallback local password.",
      recommendation:
        "Before Vercel team testing, replace the shared password gate with proper staff auth and roles.",
    },
    {
      title: "Supabase public config",
      status: supabaseUrl && supabaseAnonKey ? "pass" : "warn",
      detail:
        supabaseUrl && supabaseAnonKey
          ? "Supabase public URL and anon key are present."
          : "Supabase public URL and anon key are not configured yet.",
      recommendation:
        "Only add these after the Supabase project password has been reset and the migration branch is ready.",
    },
    {
      title: "Service role key",
      status: serviceRoleKey ? "warn" : "pass",
      detail: serviceRoleKey
        ? "SUPABASE_SERVICE_ROLE_KEY is present."
        : "No service role key found in the current environment.",
      recommendation:
        "Use service role keys only on trusted server-side routes. Never expose them publicly.",
    },
    {
      title: "Buyer login",
      status: "fail",
      detail:
        "Recurring buyer login is intentionally not active yet. The buyer login page is only a holding page.",
      recommendation:
        "Build real buyer auth before serious Vercel team/buyer testing so receipts, credit limits, and order history are protected.",
    },
    {
      title: "Staff roles",
      status: "warn",
      detail:
        "Staff roles and permission pages exist, but role enforcement is not connected to real auth yet.",
      recommendation:
        "Connect staff identities to roles through Supabase Auth or equivalent before team testing.",
    },
    {
      title: "Payments",
      status: "warn",
      detail:
        "Payments and receipts are manually recorded. Paystack links and webhooks are not active yet.",
      recommendation:
        "Manual finance workflow is acceptable for launch, but payment automation should come after stronger auth and database controls.",
    },
    {
      title: "Runtime environment",
      status: nodeEnv === "production" && isSqlite ? "fail" : "pass",
      detail: `NODE_ENV is ${nodeEnv}.`,
      recommendation:
        nodeEnv === "production" && isSqlite
          ? "Production runtime must use the approved Postgres database connection."
          : "Keep using local mode until Supabase/Postgres is deliberately resumed.",
    },
  ];

  const summary = checks.reduce(
    (acc, check) => {
      acc[check.status] += 1;
      return acc;
    },
    {pass: 0, warn: 0, fail: 0},
  );

  const overallStatus = checks.reduce<PrelaunchCheckStatus>(
    (current, check) =>
      statusRank(check.status) > statusRank(current) ? check.status : current,
    "pass",
  );

  return {
    overallStatus,
    summary,
    checks,
  };
}
