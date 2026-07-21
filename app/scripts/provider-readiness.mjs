import nextEnv from "@next/env";

const {loadEnvConfig} = nextEnv;
loadEnvConfig(process.cwd());

import fs from "node:fs";

const requiredFiles = [
  "src/lib/payments/provider.ts",
  "src/lib/payments/paystack.ts",
  "src/lib/payments/flutterwave.ts",
  "src/app/api/payments/webhook/route.ts",
  "src/app/api/payments/flutterwave/webhook/route.ts",
  "src/lib/whatsapp/provider.ts",
  "src/app/api/whatsapp/webhook/route.ts",
  "src/app/api/email/resend/webhook/route.ts",
  "src/app/admin/whatsapp-inbox/page.tsx",
  "src/app/admin/whatsapp-drafts/page.tsx",
  "src/app/admin/integration-readiness/page.tsx",
  "src/app/admin/launch-smoke-test/page.tsx",
];

const envGroups = [
  {
    name: "Transactional email",
    keys: ["RESEND_API_KEY", "RESEND_WEBHOOK_SIGNING_SECRET", "EMAIL_FROM_ADDRESS", "EMAIL_FROM_NAME", "EMAIL_REPLY_TO", "EMAIL_ADMIN_RECIPIENTS"],
  },
  {
    name: "Monitoring",
    keys: ["SENTRY_DSN", "SENTRY_ORG", "SENTRY_PROJECT", "SENTRY_AUTH_TOKEN"],
  },
  {
    name: "Core production",
    keys: ["DATABASE_URL", "SESSION_SECRET", "STAFF_PASSWORD_HASHES", "APP_BASE_URL", "NEXT_PUBLIC_APP_URL"],
  },
  {
    name: "Paystack",
    keys: ["PAYSTACK_SECRET_KEY", "PAYSTACK_PUBLIC_KEY", "PAYSTACK_WEBHOOK_SECRET"],
  },
  {
    name: "Flutterwave",
    keys: ["FLUTTERWAVE_SECRET_KEY", "FLUTTERWAVE_PUBLIC_KEY", "FLUTTERWAVE_WEBHOOK_SECRET_HASH"],
  },
  {
    name: "WhatsApp Cloud API",
    keys: ["WHATSAPP_CLOUD_ACCESS_TOKEN", "WHATSAPP_CLOUD_PHONE_NUMBER_ID", "WHATSAPP_WEBHOOK_VERIFY_TOKEN", "WHATSAPP_APP_SECRET"],
  },
];

let failed = false;

const scope = process.env.VERCEL_ENV === "production" ? "Vercel production" : "local environment";
console.log(`\nOneFarmTech provider readiness · ${scope}\n`);

console.log("Code files:");
for (const file of requiredFiles) {
  const ok = fs.existsSync(file);
  console.log(`${ok ? "✓" : "✗"} ${file}`);
  if (!ok) failed = true;
}

console.log("\nEnvironment variables:");
for (const group of envGroups) {
  const ready = group.keys.filter((key) => Boolean(process.env[key]));
  console.log(`\n${group.name}: ${ready.length === group.keys.length ? "configured" : "missing required values"} (${ready.length}/${group.keys.length})`);
  for (const key of group.keys) {
    console.log(`${process.env[key] ? "✓" : "○"} ${key}`);
  }
}

console.log("\nWebhook paths to configure in provider dashboards:");
console.log("Paystack:      /api/payments/webhook");
console.log("Flutterwave:   /api/payments/flutterwave/webhook");
console.log("Meta WhatsApp: /api/whatsapp/webhook");
console.log("Resend:        /api/email/resend/webhook");

if (failed) {
  console.error("\nProvider readiness failed because required code files are missing.");
  process.exit(1);
}

console.log("\nProvider readiness code check passed.");
