import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("career role is preserved into the protected application modal", () => {
  const careers = read("src/app/careers/page.tsx");
  const modal = read("src/components/CareerApplicationModal.tsx");
  const action = read("src/actions/publicApplications.ts");

  assert.match(careers, /\/careers\?apply=1&role=/);
  assert.match(careers, /CareerApplicationModal/);
  assert.match(modal, /name="role"[\s\S]*value=\{role\}/);
  assert.match(modal, /TurnstileWidget/);
  assert.match(action, /careerApplication\.create/);
  assert.match(action, /action: "career_application"/);
  assert.match(action, /\/careers\?apply=1&role=/);
  assert.doesNotMatch(
    action,
    /contactEnquiry\.create\(\{data: \{name: values\.name/,
  );
});

test("legacy career application links redirect into the modal", () => {
  const legacyPage = read("src/app/careers/apply/page.tsx");

  assert.match(legacyPage, /query\.set\("apply", "1"\)/);
  assert.match(legacyPage, /redirect\(`\/careers\?\$\{query\.toString\(\)\}`\)/);
});

test("supplier enquiries use the supplier category and source", () => {
  const action = read("src/actions/publicApplications.ts");
  const page = read("src/app/supplier-partners/page.tsx");

  assert.match(page, /createSupplierEnquiryAction/);
  assert.match(action, /enquiryType: "Supplier \/ partner enquiry"/);
  assert.match(action, /source: "Supplier partners page"/);
  assert.match(action, /action: "supplier_enquiry"/);
});

test("career notifications are concise and no insecure CV storage was added", () => {
  const templates = read("src/lib/email/templates.ts");
  const modal = read("src/components/CareerApplicationModal.tsx");

  assert.match(
    templates,
    /careerAdmin[\s\S]*Applicant:[\s\S]*Role:[\s\S]*Location:[\s\S]*Review:/,
  );
  assert.doesNotMatch(templates, /careerAdmin[\s\S]*experience/);
  assert.doesNotMatch(modal, /type="file"|public\/uploads/);
});
