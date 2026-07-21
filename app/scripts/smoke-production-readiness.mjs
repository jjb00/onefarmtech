import fs from "node:fs";
import path from "node:path";
import nextEnv from "@next/env";
const {loadEnvConfig} = nextEnv;
loadEnvConfig(process.cwd());

const root = process.cwd();

const requiredFiles = [
  "src/lib/payments/provider.ts",
  "src/lib/payments/paystack.ts",
  "src/lib/payments/flutterwave.ts",
  "src/app/api/payments/webhook/route.ts",
  "src/app/api/payments/flutterwave/webhook/route.ts",
  "src/lib/whatsapp/provider.ts",
  "src/lib/whatsapp/phone.ts",
  "src/lib/whatsapp/orderParser.ts",
  "src/lib/whatsapp/draftOrders.ts",
  "src/app/api/whatsapp/webhook/route.ts",
  "src/app/admin/whatsapp-inbox/page.tsx",
  "src/app/admin/whatsapp-drafts/page.tsx",
  "src/lib/communications/paymentTemplates.ts",
  "docs/payment-whatsapp-provider-setup.md"
];

let failed = false;

console.log(`OneFarmTech ${process.env.VERCEL_ENV === "production" ? "Vercel production" : "local"} readiness smoke check`);

for (const file of requiredFiles) {
  const exists = fs.existsSync(path.join(root, file));
  console.log(`${exists ? "✓" : "✗"} ${file}`);
  if (!exists) failed = true;
}

if (failed) {
  console.error("Smoke check failed: required files are missing.");
  process.exit(1);
}

const requiredEnvironment = ["DATABASE_URL", "SESSION_SECRET", "STAFF_PASSWORD_HASHES"];
for (const key of requiredEnvironment) {
  const configured = Boolean(process.env[key]);
  console.log(`${configured ? "✓ configured" : "✗ missing"} ${key} (required)`);
  if (!configured) failed = true;
}
if (failed) process.exit(1);
console.log("Smoke check passed for code and required environment readiness.");
