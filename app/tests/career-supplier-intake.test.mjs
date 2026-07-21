import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("career role is preserved into a dedicated protected application route", () => {
  const careers = read("src/app/careers/page.tsx"), form = read("src/app/careers/apply/page.tsx"), action = read("src/actions/publicApplications.ts");
  assert.match(careers, /\/careers\/apply\?role=/); assert.match(form, /name="role"[\s\S]*defaultValue=\{role\}/);
  assert.match(action, /careerApplication\.create/); assert.match(action, /action: "career_application"/);
  assert.doesNotMatch(action, /contactEnquiry\.create\(\{data: \{name: values\.name/);
});

test("supplier enquiries use the supplier category and source", () => {
  const action = read("src/actions/publicApplications.ts"), page = read("src/app/supplier-partners/page.tsx");
  assert.match(page, /createSupplierEnquiryAction/); assert.match(action, /enquiryType: "Supplier \/ partner enquiry"/);
  assert.match(action, /source: "Supplier partners page"/); assert.match(action, /action: "supplier_enquiry"/);
});

test("career notifications are concise and no insecure CV storage was added", () => {
  const templates = read("src/lib/email/templates.ts"), form = read("src/app/careers/apply/page.tsx");
  assert.match(templates, /careerAdmin[\s\S]*Applicant:[\s\S]*Role:[\s\S]*Location:[\s\S]*Review:/);
  assert.doesNotMatch(templates, /careerAdmin[\s\S]*experience/);
  assert.doesNotMatch(form, /type="file"|public\/uploads/);
});
