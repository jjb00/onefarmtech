import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import {applyResendDeliveryEvent} from "../src/lib/email/resendEventProcessing.js";
import {mapResendEventStatus, verifyResendWebhookSignature} from "../src/lib/email/resendWebhook.js";

function webhookDb(delivery = {id: "delivery-1", providerMessageId: "email-1", status: "Accepted", latestEventAt: null, failedAt: null, nextRetryAt: new Date()}) {
  const state = {delivery: delivery ? {...delivery} : null, events: []};
  return {state, emailProviderEvent: {
    findUnique: async ({where}) => state.events.find((event) => event.eventId === where.eventId) || null,
    create: async ({data}) => {
      if (state.events.some((event) => event.eventId === data.eventId)) throw Object.assign(new Error("duplicate"), {code: "P2002"});
      state.events.push({...data});
      return data;
    },
  }, emailDelivery: {
    findFirst: async ({where}) => state.delivery?.providerMessageId === where.providerMessageId ? {...state.delivery} : null,
    updateMany: async ({where, data}) => {
      if (!state.delivery || state.delivery.id !== where.id) return {count: 0};
      const currentAt = state.delivery.latestEventAt;
      const eligible = currentAt === null || currentAt < data.latestEventAt || (currentAt.getTime() === data.latestEventAt.getTime() && where.OR[2].status.in.includes(state.delivery.status));
      if (!eligible) return {count: 0};
      Object.assign(state.delivery, data);
      return {count: 1};
    },
  }};
}

for (const [type, expected] of [["email.delivered", "Delivered"], ["email.bounced", "Bounced"], ["email.failed", "Failed"]]) {
  test(`${type} updates the matching EmailDelivery`, async () => {
    const db = webhookDb();
    const result = await applyResendDeliveryEvent({db, eventId: `event-${expected}`, providerMessageId: "email-1", type, status: mapResendEventStatus(type), eventAt: new Date("2026-07-20T12:00:00Z")});
    assert.equal(result.outcome, "applied");
    assert.equal(db.state.delivery.status, expected);
    assert.equal(db.state.events.length, 1);
    assert.equal(db.state.events[0].matched, true);
  });
}

test("duplicate Resend events are idempotent", async () => {
  const db = webhookDb();
  const input = {db, eventId: "event-1", providerMessageId: "email-1", type: "email.delivered", status: "Delivered", eventAt: new Date("2026-07-20T12:00:00Z")};
  assert.equal((await applyResendDeliveryEvent(input)).outcome, "applied");
  assert.equal((await applyResendDeliveryEvent(input)).outcome, "duplicate");
  assert.equal(db.state.events.length, 1);
});

test("unmatched legitimate events are recorded once without an incident", async () => {
  const db = webhookDb(null);
  const input = {db, eventId: "event-unmatched", providerMessageId: "external-email", type: "email.delivered", status: "Delivered", eventAt: new Date("2026-07-20T12:00:00Z")};
  assert.equal((await applyResendDeliveryEvent(input)).outcome, "unmatched");
  assert.equal((await applyResendDeliveryEvent(input)).outcome, "duplicate");
  assert.equal(db.state.events.length, 1);
  assert.equal(db.state.events[0].matched, false);
});

test("invalid Resend signatures remain rejected", () => {
  const secret = `whsec_${Buffer.from("test-secret").toString("base64")}`;
  const rawBody = JSON.stringify({type: "email.delivered", data: {email_id: "email-1"}});
  const id = "event-1";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const valid = crypto.createHmac("sha256", Buffer.from("test-secret")).update(`${id}.${timestamp}.${rawBody}`).digest("base64");
  assert.equal(verifyResendWebhookSignature({rawBody, id, timestamp, signature: `v1,${valid}`, secret}), true);
  assert.equal(verifyResendWebhookSignature({rawBody, id, timestamp, signature: "v1,invalid", secret}), false);
});
