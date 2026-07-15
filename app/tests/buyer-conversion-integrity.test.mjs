import assert from "node:assert/strict";
import test from "node:test";
import {BuyerAccountConversionError, convertBuyerAccountRequestIntegrity, convertedCustomerIdFromNote} from "../src/lib/buyerAccountConversion.js";

const actor = {name: "Test Admin", email: "admin@example.test", role: "Admin"};
function request(overrides = {}) { return {id: "request-1", contactName: "Buyer", organisationName: "Farm Shop", buyerType: "Business buyer", phone: "+2341", email: "buyer@example.test", location: "Lagos", interestedInCredit: false, status: "New", adminNote: null, ...overrides}; }

function fakeDb(initial = request()) {
  const state = {request: initial, customers: new Map(), audits: [], creates: 0};
  let lock = Promise.resolve();
  return {state, async $transaction(callback) {
    const previous = lock; let release; lock = new Promise((resolve) => { release = resolve; }); await previous;
    const tx = {
      $queryRawUnsafe: async () => [{pg_advisory_xact_lock: null}],
      buyerAccountRequest: {findUnique: async () => state.request, update: async ({data}) => (state.request = {...state.request, ...data})},
      customer: {findUnique: async ({where}) => state.customers.get(where.id) || null, create: async ({data}) => { state.creates += 1; const customer = {id: `customer-${state.creates}`, ...data}; state.customers.set(customer.id, customer); return customer; }},
      auditLog: {create: async ({data}) => { state.audits.push(data); return data; }},
    };
    try { return await callback(tx); } finally { release(); }
  }};
}

test("first conversion atomically creates one customer, request evidence and audit", async () => {
  const db = fakeDb(); const result = await convertBuyerAccountRequestIntegrity({db, requestId: "request-1", actor});
  assert.equal(result.created, true); assert.equal(db.state.creates, 1); assert.equal(db.state.request.status, "Converted to customer"); assert.equal(convertedCustomerIdFromNote(db.state.request.adminNote), result.customer.id); assert.equal(db.state.audits.length, 1); assert.match(db.state.audits[0].newValue, /request-1/); assert.match(db.state.audits[0].newValue, /customer-1/);
});

test("repeated and concurrent conversion creates no more than one customer", async () => {
  const db = fakeDb(); const [first, second] = await Promise.all([convertBuyerAccountRequestIntegrity({db, requestId: "request-1", actor}), convertBuyerAccountRequestIntegrity({db, requestId: "request-1", actor})]);
  assert.equal(db.state.creates, 1); assert.equal(first.customer.id, second.customer.id); assert.equal(db.state.audits.filter((audit) => audit.action === "Converted buyer account request to customer").length, 1); assert.equal(db.state.audits.filter((audit) => audit.action.includes("idempotent")).length, 1);
});

test("historical conversion evidence resolves existing customer", async () => {
  const db = fakeDb(request({status: "Reviewing", adminNote: "Converted to customer record: customer-old"})); db.state.customers.set("customer-old", {id: "customer-old", name: "Existing"});
  const result = await convertBuyerAccountRequestIntegrity({db, requestId: "request-1", actor}); assert.equal(result.created, false); assert.equal(result.customer.id, "customer-old"); assert.equal(db.state.creates, 0); assert.equal(db.state.request.status, "Converted to customer");
});

test("blocked, malformed, missing request and missing customer fail safely", async () => {
  for (const [initial, code] of [[request({status: "Rejected"}), "conversion-not-allowed"], [request({status: "Converted to customer", adminNote: "bad"}), "malformed-conversion-evidence"], [request({status: "Converted to customer", adminNote: "Converted to customer record: missing"}), "converted-customer-missing"]]) {
    await assert.rejects(() => convertBuyerAccountRequestIntegrity({db: fakeDb(initial), requestId: "request-1", actor}), (error) => error instanceof BuyerAccountConversionError && error.code === code);
  }
  const db = fakeDb(null); await assert.rejects(() => convertBuyerAccountRequestIntegrity({db, requestId: "request-1", actor}), (error) => error.code === "request-not-found");
  assert.equal(convertedCustomerIdFromNote("Converted to customer record: malformed id"), null);
});

test("conversion does not match customers or create buyer access", async () => {
  const source = String(convertBuyerAccountRequestIntegrity);
  assert.doesNotMatch(source, /findFirst|buyerContact|buyerAccountInvite|email.*find|phone.*find/);
});
