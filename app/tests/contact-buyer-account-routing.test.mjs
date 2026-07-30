import assert from "node:assert/strict";
import test from "node:test";
import {readAdminActionFile} from "./helpers/adminActions.mjs";

const communications = readAdminActionFile("communications");
const start = communications.indexOf("export async function createContactEnquiryAction");
const nextExport = communications.indexOf("export async function", start + 40);
const end = nextExport === -1 ? communications.length : nextExport;
const contactAction = communications.slice(start, end);

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
