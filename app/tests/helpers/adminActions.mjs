import fs from "node:fs";

// The admin server actions used to live in one file
// (src/actions/createAdminRecords.ts). That file is now a set of domain
// modules under src/actions/admin/*.ts. Tests that inspect action source
// text for security/business-logic patterns read this concatenated view so
// existing assertions keep working regardless of which domain file a given
// action now lives in.
const DOMAIN_FILES = [
  "customers",
  "products",
  "staff",
  "orders",
  "communications",
  "delivery",
  "whatsapp",
  "payments",
];

export function readAdminActions() {
  return DOMAIN_FILES.map((name) =>
    fs.readFileSync(new URL(`../../src/actions/admin/${name}.ts`, import.meta.url), "utf8"),
  ).join("\n\n");
}

export function readAdminActionFile(name) {
  return fs.readFileSync(new URL(`../../src/actions/admin/${name}.ts`, import.meta.url), "utf8");
}
