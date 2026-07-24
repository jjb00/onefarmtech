import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {convertOrderRequestIntegrity, convertedOrderFromNote} from "../src/lib/orderRequestConversion.js";

const actor = {name: "Test Admin", email: "admin@example.test", role: "Admin"};
const initialRequest = {id: "request-abcdefgh", buyerName: "Buyer", phone: "+2341", buyerType: "Business", deliveryPreference: "Delivery", timing: "Tomorrow", items: "Tomatoes", message: "Call first", source: "Order request page", status: "New", adminNote: null};

function fakeDb() {
  const state = {request: {...initialRequest}, orders: new Map(), creates: 0, audits: []};
  let lock = Promise.resolve();
  return {state, async $transaction(callback) {
    const previous = lock; let release; lock = new Promise((resolve) => {release = resolve;}); await previous;
    const tx = {
      $queryRawUnsafe: async () => [],
      orderRequest: {findUnique: async () => state.request, update: async ({data}) => (state.request = {...state.request, ...data})},
      order: {findUnique: async ({where}) => state.orders.get(where.id) || null, create: async ({data}) => {state.creates += 1; const order = {id: `order-${state.creates}`, ...data}; state.orders.set(order.id, order); return order;}},
      auditLog: {create: async ({data}) => {state.audits.push(data); return data;}},
    };
    try { return await callback(tx); } finally {release();}
  }};
}

test("OrderRequest conversion creates and links one real Order", async () => {
  const db = fakeDb();
  const result = await convertOrderRequestIntegrity({db, requestId: initialRequest.id, actor});
  assert.equal(result.created, true);
  assert.equal(db.state.creates, 1);
  assert.equal(db.state.request.status, "Converted to order");
  assert.equal(result.order.paymentStatus, "Pending confirmation");
  assert.equal(result.order.fulfilmentStatus, "Buyer request");
  assert.deepEqual(convertedOrderFromNote(db.state.request.adminNote), {id: result.order.id, code: result.order.code});
  assert.equal(db.state.audits.length, 1);
});

test("pickup conversion starts awaiting pickup without creating delivery state", async () => {
  const db = fakeDb();
  db.state.request.deliveryPreference = "Pickup";
  const result = await convertOrderRequestIntegrity({db, requestId: initialRequest.id, actor});
  assert.equal(result.order.paymentStatus, "Pending confirmation");
  assert.equal(result.order.fulfilmentStatus, "Pending pickup");
  assert.equal("delivery" in result.order, false);
});

test("repeated and concurrent conversion is idempotent", async () => {
  const db = fakeDb();
  const [first, second] = await Promise.all([
    convertOrderRequestIntegrity({db, requestId: initialRequest.id, actor}),
    convertOrderRequestIntegrity({db, requestId: initialRequest.id, actor}),
  ]);
  assert.equal(db.state.creates, 1);
  assert.equal(first.order.id, second.order.id);
  assert.equal(second.created, false);
});

test("legacy status-only conversion is repaired with one linked Order", async () => {
  const db = fakeDb();
  db.state.request.status = "Converted to order";
  const first = await convertOrderRequestIntegrity({db, requestId: initialRequest.id, actor});
  const second = await convertOrderRequestIntegrity({db, requestId: initialRequest.id, actor});
  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(db.state.creates, 1);
  assert.equal(convertedOrderFromNote(db.state.request.adminNote).id, first.order.id);
});

test("Orders query includes all Order rows and order-number href uses implemented ID route", () => {
  const data = fs.readFileSync(new URL("../src/data/dbOrders.ts", import.meta.url), "utf8");
  const list = fs.readFileSync(new URL("../src/app/admin/orders/page.tsx", import.meta.url), "utf8");
  const detail = fs.readFileSync(new URL("../src/app/admin/orders/[id]/page.tsx", import.meta.url), "utf8");
  assert.match(data, /prisma\.order\.findMany\(\{\s*orderBy:/);
  assert.doesNotMatch(data, /prisma\.order\.findMany\(\{\s*where:/);
  assert.match(list, /href=\{`\/admin\/orders\/\$\{order\.id\}`\}/);
  assert.match(detail, /where: \{OR: \[\{id\}, \{code: id\}\]\}/);
});

test("WhatsApp-created order IDs and legacy code links resolve in the detail route", () => {
  const actions = fs.readFileSync(new URL("../src/actions/createAdminRecords.ts", import.meta.url), "utf8");
  const detail = fs.readFileSync(new URL("../src/app/admin/orders/[id]/page.tsx", import.meta.url), "utf8");
  assert.match(actions, /redirect\(`\/admin\/orders\/\$\{order\.id\}`\)/);
  assert.match(detail, /\{id\}, \{code: id\}/);
});
