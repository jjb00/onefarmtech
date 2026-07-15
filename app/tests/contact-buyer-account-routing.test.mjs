import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const actions = fs.readFileSync(new URL("../src/actions/createAdminRecords.ts", import.meta.url), "utf8");
const start = actions.indexOf("export async function createContactEnquiryAction");
const end = actions.indexOf("export async function createBuyerAccountRequestAction", start);
const contactAction = actions.slice(start, end);

test("contact-page buyer applications are routed to the buyer application model", () => {
  assert.match(contactAction, /enquiryType === "Buyer account request"/);
  assert.match(contactAction, /prisma\.buyerAccountRequest\.create/);
  assert.match(contactAction, /entityType: "BuyerAccountRequest"/);
  assert.match(contactAction, /relatedType: "BuyerAccountRequest"/);
  assert.match(contactAction, /revalidatePath\("\/admin\/buyer-account-requests"\)/);
});

test("contact-page buyer applications persist before acknowledgement email", () => {
  const branchStart = contactAction.indexOf('enquiryType === "Buyer account request"');
  const create = contactAction.indexOf("prisma.buyerAccountRequest.create", branchStart);
  const acknowledgement = contactAction.indexOf("account-request-ack:", branchStart);
  assert.ok(create > branchStart);
  assert.ok(acknowledgement > create);
});
