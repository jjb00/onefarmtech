import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("career role is preserved into the protected, database-backed application", () => {
  const careers = read("src/app/careers/page.tsx");
  const rolePage = read("src/app/careers/[slug]/page.tsx");
  const modal = read("src/components/CareerApplicationModal.tsx");
  const action = read("src/actions/publicApplications.ts");

  assert.match(careers, /href=\{careerPath\(role\)\}/);
  assert.match(careers, /CareerApplicationModal/);
  assert.match(rolePage, /href=\{`\$\{path\}\?apply=1`\}/);
  assert.match(rolePage, /returnPath=\{path\}/);
  assert.match(modal, /name="role"[\s\S]*value=\{role\}/);
  assert.match(modal, /TurnstileWidget/);
  assert.match(modal, /name="cv"/);
  assert.match(action, /action: "career_application"/);
  assert.match(action, /attachments: \[cv\]/);
  assert.match(action, /careerAdminEmail/);
  assert.match(action, /careerApplication\.create/);
});

test("legacy career application links redirect into the modal", () => {
  const legacyPage = read("src/app/careers/apply/page.tsx");

  assert.match(legacyPage, /query\.set\("apply", "1"\)/);
  assert.match(legacyPage, /careerRoleByTitle/);
  assert.match(legacyPage, /role \? careerPath\(role\) : "\/careers"/);
});

test("each published role has its own crawlable job page and sitemap entry", () => {
  const careers = read("src/app/careers/page.tsx");
  const rolePage = read("src/app/careers/[slug]/page.tsx");
  const careerData = read("src/lib/careers.ts");
  const sitemap = read("src/app/sitemap.ts");
  const slugs = [...careerData.matchAll(/\n\s+slug: "([^"]+)"/g)].map(
    (match) => match[1],
  );

  assert.equal(slugs.length, 15);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.doesNotMatch(careers, /<StructuredData|jobPostingFor\(/);
  assert.match(rolePage, /<StructuredData data=\{jobPostingFor\(role\)\}/);
  assert.match(rolePage, /generateStaticParams/);
  assert.match(rolePage, /dynamicParams = false/);
  assert.match(careerData, /"@type": "JobPosting"/);
  assert.match(careerData, /directApply: true/);
  assert.match(careerData, /url: canonicalUrl\(careerPath\(role\)\)/);
  assert.match(sitemap, /careerRoles\.map\(\(role\) =>/);
  assert.match(sitemap, /lastModified: CAREERS_LAST_MODIFIED/);
});

test("supplier enquiries are protected, persisted and delivered by email", () => {
  const action = read("src/actions/publicApplications.ts");
  const page = read("src/app/supplier-partners/page.tsx");

  assert.match(page, /createSupplierEnquiryAction/);
  assert.match(action, /action: "supplier_enquiry"/);
  assert.match(action, /group: "supplier"/);
  assert.match(action, /supplierAdminEmail/);
  assert.match(action, /contactEnquiry\.create/);
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
