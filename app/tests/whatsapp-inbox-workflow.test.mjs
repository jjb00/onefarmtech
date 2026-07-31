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

test("WhatsApp inbox uses one combined reply queue, grouped by buyer", () => {
  assert.doesNotMatch(page, /UnknownContactsView/);
  assert.doesNotMatch(page, />\s*Unknown contacts\s*</);
  assert.doesNotMatch(page, /view=unknown/);
  assert.match(page, /'Unknown buyer'::text AS "buyerName"/);
  assert.match(page, /'ContactEnquiry'::text AS "recordType"/);
  assert.match(page, /'BuyerMessage'::text AS "recordType"/);
});

test("unread and newest conversations are prioritised, server-side", () => {
  assert.match(page, /ORDER BY \("unreadCount" > 0\) DESC, "latestActivity" DESC/);
  assert.match(page, /\(bm\.status = 'Unread'\) AS unread/);
  assert.match(page, /\(ce\.status = 'New'\) AS unread/);
  assert.match(page, /COUNT\(\*\) FILTER \(WHERE unread\)::bigint AS "unreadCount"/);
});

test("conversation queue groups messages by buyer and preserves search and pagination", () => {
  assert.match(page, /DISTINCT ON \("normalizedPhone"\)/);
  assert.match(page, /GROUP BY "normalizedPhone"/);
  assert.match(page, /LIMIT \$2/);
  assert.match(page, /OFFSET \$3/);
  assert.match(page, /adminListHref\(PATH, base/);
  assert.match(page, /searchPlaceholder="Buyer, phone or message"/);
  assert.match(page, /c\.phone ILIKE CONCAT\('%', \$1, '%'\)/);
  assert.match(page, /ce\.phone ILIKE CONCAT\('%', \$1, '%'\)/);
  assert.match(page, /ce\.message ILIKE CONCAT\('%', \$1, '%'\)/);
});

test("conversation-level actions remain available for both record types", () => {
  assert.match(page, /resolveWhatsAppExceptionAction/);
  assert.match(page, /Mark handled/);
  assert.match(page, /Open WhatsApp/);
  assert.match(page, /recordType" value="Conversation"/);
  assert.match(page, /recordId" value=\{row\.phone\}/);
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
