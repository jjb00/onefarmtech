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
  const staffPasswordHashes = process.env.STAFF_PASSWORD_HASHES;
  const databaseUrl = process.env.DATABASE_URL || "";
  const nodeEnv = process.env.NODE_ENV || "development";
  const configured = (keys: string[]) => keys.every((key) => Boolean(process.env[key]));

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
      title: "Named staff credentials",
      status: staffPasswordHashes ? "pass" : "fail",
      detail: staffPasswordHashes
        ? "Per-user staff password hashes are configured; identity and role are resolved from active staff records."
        : "STAFF_PASSWORD_HASHES is not configured, so staff login is intentionally unavailable.",
      recommendation: "Keep password hashes server-only and rotate them when staff access changes.",
    },
    {
      title: "Buyer login",
      status: process.env.SESSION_SECRET ? "pass" : "fail",
      detail: process.env.SESSION_SECRET ? "Signed buyer sessions and authoritative BuyerContact permissions are configured." : "SESSION_SECRET is missing, so signed buyer sessions cannot be trusted.",
      recommendation: "Test an active approved buyer contact with each permission combination.",
    },
    {
      title: "Staff roles",
      status: staffPasswordHashes && process.env.SESSION_SECRET ? "pass" : "fail",
      detail: staffPasswordHashes && process.env.SESSION_SECRET ? "Named staff login, signed sessions and server-side capabilities are configured." : "Staff credential hashes or the session secret are missing.",
      recommendation: "Keep StaffUser roles authoritative and password hashes server-only.",
    },
    {
      title: "Payments",
      status: configured(["PAYSTACK_SECRET_KEY", "PAYSTACK_PUBLIC_KEY", "FLUTTERWAVE_SECRET_KEY", "FLUTTERWAVE_PUBLIC_KEY"]) ? "pass" : "warn",
      detail: configured(["PAYSTACK_SECRET_KEY", "PAYSTACK_PUBLIC_KEY", "FLUTTERWAVE_SECRET_KEY", "FLUTTERWAVE_PUBLIC_KEY"]) ? "Paystack and Flutterwave credentials are configured in this environment." : "One or more payment-provider credentials are missing in this environment.",
      recommendation: "Provider readiness requires configured credentials and successful webhook acceptance, not code files alone.",
    },
    {title: "Public bot protection", status: configured(["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"]) ? "pass" : "fail", detail: configured(["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"]) ? "Turnstile client and server keys are configured." : "Turnstile site or secret key is missing.", recommendation: "Keep the secret server-only and verify hostname and action for every protected intake."},
    {
      title: "Runtime environment",
      status: nodeEnv === "production" && isSqlite ? "fail" : "pass",
      detail: `This is ${nodeEnv === "production" ? "Vercel production" : "local/non-production"} readiness (NODE_ENV=${nodeEnv}).`,
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
