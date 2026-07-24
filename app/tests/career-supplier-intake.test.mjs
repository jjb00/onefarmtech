import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("career role is preserved into the protected email-first application", () => {
  const careers = read("src/app/careers/page.tsx");
  const modal = read("src/components/CareerApplicationModal.tsx");
  const action = read("src/actions/publicApplications.ts");

  assert.match(careers, /\/careers\?apply=1&role=/);
  assert.match(careers, /CareerApplicationModal/);
  assert.match(modal, /name="role"[\s\S]*value=\{role\}/);
  assert.match(modal, /TurnstileWidget/);
  assert.match(modal, /name="cv"/);
  assert.match(action, /action: "career_application"/);
  assert.match(action, /attachments: \[cv\]/);
  assert.match(action, /careerAdminEmail/);
  assert.doesNotMatch(action, /careerApplication\.create/);
});

test("legacy career application links redirect into the modal", () => {
  const legacyPage = read("src/app/careers/apply/page.tsx");

  assert.match(legacyPage, /query\.set\("apply", "1"\)/);
  assert.match(
    legacyPage,
    /redirect\(`\/careers\?\$\{query\.toString\(\)\}`\)/,
  );
});

test("supplier enquiries are protected and delivered by email", () => {
  const action = read("src/actions/publicApplications.ts");
  const page = read("src/app/supplier-partners/page.tsx");

  assert.match(page, /createSupplierEnquiryAction/);
  assert.match(action, /action: "supplier_enquiry"/);
  assert.match(action, /group: "supplier"/);
  assert.match(action, /supplierAdminEmail/);
  assert.doesNotMatch(action, /contactEnquiry\.create/);
});

test("career email contains full details and CV without persistent CV storage", () => {
  const templates = read("src/lib/email/templates.ts");
  const modal = read("src/components/CareerApplicationModal.tsx");
  const action = read("src/actions/publicApplications.ts");

  assert.match(
    templates,
    /careerAdminEmail[\s\S]*Applicant:[\s\S]*Email:[\s\S]*Phone:[\s\S]*Location:[\s\S]*Role:/,
  );
  assert.match(templates, /Experience \/ suitability:/);
  assert.match(modal, /type="file"/);
  assert.match(action, /content: buffer\.toString\("base64"\)/);
  assert.doesNotMatch(action, /writeFile|public\/uploads|prisma\..*cv/i);
});
