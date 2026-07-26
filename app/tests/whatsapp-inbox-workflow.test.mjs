import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync(
  new URL("../src/app/admin/buyer-messages/page.tsx", import.meta.url),
  "utf8",
);

const loading = fs.readFileSync(
  new URL("../src/components/admin/AdminLoadingState.tsx", import.meta.url),
  "utf8",
);

test("WhatsApp inbox uses one combined reply queue", () => {
  assert.doesNotMatch(page, /UnknownContactsView/);
  assert.doesNotMatch(page, />\s*Unknown contacts\s*</);
  assert.doesNotMatch(page, /view=unknown/);
  assert.match(page, /buyerName: "Unknown buyer"/);
  assert.match(page, /recordType: "ContactEnquiry"/);
  assert.match(page, /recordType: "BuyerMessage"/);
});

test("unread and newest WhatsApp messages are prioritised", () => {
  assert.match(page, /if \(a\.unread !== b\.unread\) return a\.unread \? -1 : 1/);
  assert.match(page, /b\.receivedAt\.getTime\(\) - a\.receivedAt\.getTime\(\)/);
  assert.match(page, /status: "Unread"/);
  assert.match(page, /status: "New"/);

  const descendingQueries =
    page.match(/orderBy: \[\{createdAt: "desc"\}, \{id: "desc"\}\]/g) || [];

  assert.equal(descendingQueries.length, 4);
  assert.doesNotMatch(page, /createdAt: "asc"/);
  assert.doesNotMatch(page, /updatedAt: "asc"/);
});

test("merged queue preserves search and pagination", () => {
  assert.match(page, /const requiredRows = page \* pageSize/);
  assert.match(page, /take: requiredRows/);
  assert.match(page, /const start = \(page - 1\) \* pageSize/);
  assert.match(page, /\.slice\(start, start \+ pageSize\)/);
  assert.match(page, /adminListHref\(PATH, base/);
  assert.match(page, /searchPlaceholder="Buyer, phone or message"/);
  assert.match(page, /customer:\s*\{\s*phone: \{contains: q\}/);
  assert.match(page, /\{phone: \{contains: q\}\}/);
  assert.match(page, /\{message: \{contains: q\}\}/);
});

test("message actions remain available for both record types", () => {
  assert.match(page, /resolveWhatsAppExceptionAction/);
  assert.match(page, /Mark handled/);
  assert.match(page, /Open WhatsApp/);
  assert.match(page, /AdminRecordControls/);
  assert.match(page, /returnTo=\{PATH\}/);
});

test("admin loading state is compact and accessible", () => {
  assert.match(loading, /bg-\[#f7f4ea\]/);
  assert.match(loading, /aria-busy="true"/);
  assert.match(loading, /Loading…/);
  assert.match(loading, /motion-reduce:animate-none/);
  assert.doesNotMatch(loading, /h-64/);
  assert.doesNotMatch(loading, /h-24/);
  assert.doesNotMatch(loading, /bg-black/);
});
