import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  BUYER_OTP_MAX_ATTEMPTS,
  buyerOtpCanBeVerified,
  buyerOtpMatches,
  buyerOtpRequestAllowed,
  buyerOtpRequestLimits,
  consumeBuyerOtpChallenge,
  generateBuyerOtp,
  hashBuyerOtp,
  isBuyerLoginEligible,
  recordFailedBuyerOtpAttempt,
} from "../src/lib/buyerOtp.ts";
import {normalizeInternationalPhone} from "../src/lib/phoneNumbers.ts";

const read = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("approved active buyers require an active matching BuyerContact", () => {
  const customer = {status: "Active", accountLoginReady: true};
  const contact = {status: "Active", email: "buyer@example.com"};
  assert.equal(isBuyerLoginEligible(customer, contact, "BUYER@example.com"), true);
  assert.equal(isBuyerLoginEligible({...customer, status: "Inactive"}, contact), false);
  assert.equal(isBuyerLoginEligible({...customer, accountLoginReady: false}, contact), false);
  assert.equal(isBuyerLoginEligible(customer, {...contact, status: "Paused"}), false);
  assert.equal(isBuyerLoginEligible(customer, contact, "other@example.com"), false);
});

test("OTP generation is six digits and persistence uses only a keyed hash", () => {
  const otp = generateBuyerOtp();
  const hash = hashBuyerOtp("challenge-1", otp, "test-session-secret");
  assert.match(otp, /^\d{6}$/);
  assert.doesNotMatch(hash, new RegExp(otp));
  assert.equal(buyerOtpMatches("challenge-1", otp, "test-session-secret", hash), true);
  assert.equal(buyerOtpMatches("challenge-1", "000000", "test-session-secret", hash), otp === "000000");
  assert.equal(buyerOtpMatches("challenge-1", otp, "test-session-secret", "malformed"), false);

  const schema = read("prisma/schema.prisma");
  assert.match(schema, /model BuyerOtpChallenge/);
  assert.match(schema, /otpHash\s+String/);
  assert.doesNotMatch(schema, /\n\s+otp\s+String/);
});

test("expired, consumed, invalidated and attempt-limited OTPs are rejected", () => {
  const base = {
    expiresAt: new Date(Date.now() + 60_000),
    attempts: 0,
    consumedAt: null,
    invalidatedAt: null,
  };
  assert.equal(buyerOtpCanBeVerified(base), true);
  assert.equal(buyerOtpCanBeVerified({...base, expiresAt: new Date(Date.now() - 1)}), false);
  assert.equal(buyerOtpCanBeVerified({...base, consumedAt: new Date()}), false);
  assert.equal(buyerOtpCanBeVerified({...base, invalidatedAt: new Date()}), false);
  assert.equal(buyerOtpCanBeVerified({...base, attempts: BUYER_OTP_MAX_ATTEMPTS}), false);
});

test("OTP request and resend protection enforces cooldown and a short-window limit", () => {
  const now = new Date();
  assert.equal(buyerOtpRequestAllowed([], now).allowed, true);
  assert.equal(buyerOtpRequestAllowed([{createdAt: new Date(now.getTime() - 10_000)}], now).reason, "cooldown");
  assert.equal(
    buyerOtpRequestAllowed([
      {createdAt: new Date(now.getTime() - 61_000)},
      {createdAt: new Date(now.getTime() - 62_000)},
      {createdAt: new Date(now.getTime() - 63_000)},
    ], now).reason,
    "rate-limited",
  );
  const recipientOnly = buyerOtpRequestLimits(
    [{createdAt: new Date(now.getTime() - 61_000)}],
    [
      {createdAt: new Date(now.getTime() - 61_000)},
      {createdAt: new Date(now.getTime() - 62_000)},
      {createdAt: new Date(now.getTime() - 63_000)},
    ],
    now,
  );
  assert.equal(recipientOnly.recipient.allowed, true);
  assert.equal(recipientOnly.ip.reason, "rate-limited");
  assert.equal(recipientOnly.allowed, false);
});

test("request, resend and verification actions are generic, single-use and invalidate older codes", () => {
  const action = read("src/actions/buyerOtp.ts");
  assert.match(action, /redirect\("\/buyer-login\?step=verify&sent=1"\)/);
  assert.match(action, /buyerOtpChallenge\.updateMany[\s\S]*invalidatedAt: now/);
  assert.match(action, /isolationLevel: "Serializable"/);
  assert.match(action, /recipientChallenges, ipChallenges/);
  assert.match(action, /requestIpHash: context\.ipHash/);
  assert.match(action, /recordFailedBuyerOtpAttempt/);
  assert.match(action, /consumeBuyerOtpChallenge/);
  assert.doesNotMatch(action, /console\.(?:log|error)[\s\S]*otp/i);
});

function otpChallengeStore() {
  const state = {
    attempts: 0,
    consumedAt: null,
    invalidatedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
  };
  return {
    state,
    buyerOtpChallenge: {
      update: async ({data}) => {
        state.attempts += data.attempts.increment;
        return {...state};
      },
      updateMany: async ({where, data}) => {
        if (where.consumedAt === null && state.consumedAt) return {count: 0};
        if (where.invalidatedAt === null && state.invalidatedAt) return {count: 0};
        if (where.expiresAt?.gt && state.expiresAt <= where.expiresAt.gt) return {count: 0};
        if (where.attempts?.lt && state.attempts >= where.attempts.lt) return {count: 0};
        Object.assign(state, data);
        return {count: 1};
      },
    },
  };
}

test("failed attempts increment atomically and the fifth invalidates the challenge", async () => {
  const db = otpChallengeStore();
  await Promise.all(
    Array.from({length: 5}, () => recordFailedBuyerOtpAttempt(db, "challenge-1")),
  );
  assert.equal(db.state.attempts, 5);
  assert.ok(db.state.invalidatedAt instanceof Date);
});

test("concurrent verification consumption succeeds exactly once", async () => {
  const db = otpChallengeStore();
  const results = await Promise.all([
    consumeBuyerOtpChallenge(db, "challenge-1"),
    consumeBuyerOtpChallenge(db, "challenge-1"),
  ]);
  assert.deepEqual(results.map((result) => result.count).sort(), [0, 1]);
});

test("failed email delivery invalidates the issued challenge", () => {
  const action = read("src/actions/buyerOtp.ts");
  assert.match(
    action,
    /if \(!result\.ok\)[\s\S]*buyerOtpChallenge\.update[\s\S]*invalidatedAt: new Date\(\)/,
  );
  assert.match(
    action,
    /catch \{[\s\S]*buyerOtpChallenge\.update[\s\S]*invalidatedAt: new Date\(\)/,
  );
});

test("OTP email is delivered but redacted in stored delivery content", () => {
  const action = read("src/actions/buyerOtp.ts");
  const templates = read("src/lib/email/templates.ts");
  const service = read("src/lib/email/service.ts");
  assert.match(action, /storedContent: emailTemplates\.buyerLoginOtpStored\(\)/);
  assert.match(service, /storedContent \|\| input\.content/);
  assert.match(service, /input\.content\.text/);
  assert.match(templates, /buyerLoginOtpStored/);
});

test("OTP UI has two accessible pending-safe steps, resend cooldown and legacy fallback", () => {
  const modal = read("src/components/BuyerLoginModal.tsx");
  const resend = read("src/components/BuyerOtpResendButton.tsx");
  assert.match(modal, /action=\{requestBuyerOtpAction\}/);
  assert.match(modal, /action=\{verifyBuyerOtpAction\}/);
  assert.match(modal, /name="otp"/);
  assert.match(modal, /Email me a login code/);
  assert.match(modal, /Legacy access-code login/);
  assert.match(modal, /action=\{buyerLoginAction\}/);
  assert.match(resend, /cooldownSeconds = 60/);
  assert.match(resend, /disabled=\{disabled\}/);
  assert.match(resend, /aria-disabled=\{disabled\}/);
});

test("buyer sessions preserve authoritative permissions and support OTP and legacy modes", () => {
  const current = read("src/lib/currentBuyer.ts");
  const session = read("src/lib/buyerSession.ts");
  for (const permission of ["canPlaceOrders", "canViewReceipts", "canViewCredit"]) {
    assert.match(current, new RegExp(permission));
  }
  assert.match(current, /contact\.updatedAt\.toISOString\(\) === contactRevision/);
  assert.match(current, /authMode === "email-otp"/);
  assert.match(current, /customerId: isAuthenticated \? customerId : null/);
  assert.match(session, /"invite-code" \| "email-otp"/);
  assert.match(session, /BUYER_OTP_CHALLENGE_COOKIE/);
});

test("Nigerian and foreign phone numbers normalize safely", () => {
  assert.equal(normalizeInternationalPhone("08012345678", "234"), "+2348012345678");
  assert.equal(normalizeInternationalPhone("020 7946 0958", "44"), "+442079460958");
  assert.equal(normalizeInternationalPhone("+1 (202) 555-0142", "234"), "+12025550142");
  assert.equal(normalizeInternationalPhone("0044 20 7946 0958", "234"), "+442079460958");
  assert.throws(() => normalizeInternationalPhone("12", "234"));
  assert.throws(() => normalizeInternationalPhone("+234abc8012345678", "234"));
});

test("incoming WhatsApp numbers are registered in canonical international form", () => {
  const webhook = read("src/app/api/whatsapp/webhook/route.ts");
  assert.match(webhook, /normalizeInternationalPhone\(`\+\$\{rawFrom\.replace/);
  assert.match(webhook, /phone: input\.from/);
});
