import crypto from "node:crypto";

export const BUYER_OTP_TTL_MS = 10 * 60 * 1000;
export const BUYER_OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const BUYER_OTP_REQUEST_WINDOW_MS = 15 * 60 * 1000;
export const BUYER_OTP_MAX_REQUESTS_PER_WINDOW = 3;
export const BUYER_OTP_MAX_ATTEMPTS = 5;
export const BUYER_OTP_CHALLENGE_COOKIE = "oft_buyer_otp_challenge";

export function normalizeBuyerEmail(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

export function isValidBuyerEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeBuyerEmail(value));
}

export function isBuyerLoginEligible(
  customer: {status: string; accountLoginReady: boolean} | null | undefined,
  contact: {status: string; email?: string | null} | null | undefined,
  email?: string,
) {
  if (!customer || !contact) return false;
  if (customer.status !== "Active" || !customer.accountLoginReady) return false;
  if (contact.status !== "Active") return false;
  if (email && normalizeBuyerEmail(contact.email) !== normalizeBuyerEmail(email)) return false;
  return true;
}

export function generateBuyerOtp() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashBuyerOtp(challengeId: string, otp: string, secret: string) {
  if (!secret) throw new Error("SESSION_SECRET is required for buyer OTP authentication.");
  return crypto
    .createHmac("sha256", secret)
    .update(`${challengeId}:${otp}`)
    .digest("hex");
}

export function buyerOtpMatches(
  challengeId: string,
  otp: string,
  secret: string,
  expectedHash: string,
) {
  if (!/^[a-f0-9]{64}$/i.test(expectedHash)) return false;
  const actual = Buffer.from(hashBuyerOtp(challengeId, otp, secret), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function buyerOtpRequestAllowed(
  recentChallenges: Array<{createdAt: Date}>,
  now = new Date(),
) {
  const recent = recentChallenges
    .map((challenge) => challenge.createdAt.getTime())
    .filter((createdAt) => now.getTime() - createdAt < BUYER_OTP_REQUEST_WINDOW_MS)
    .sort((a, b) => b - a);

  if (recent[0] && now.getTime() - recent[0] < BUYER_OTP_RESEND_COOLDOWN_MS) {
    return {allowed: false, reason: "cooldown" as const};
  }

  if (recent.length >= BUYER_OTP_MAX_REQUESTS_PER_WINDOW) {
    return {allowed: false, reason: "rate-limited" as const};
  }

  return {allowed: true, reason: "allowed" as const};
}

export function buyerOtpCanBeVerified(
  challenge: {
    expiresAt: Date;
    attempts: number;
    consumedAt: Date | null;
    invalidatedAt: Date | null;
  },
  now = new Date(),
) {
  return (
    !challenge.consumedAt &&
    !challenge.invalidatedAt &&
    challenge.expiresAt.getTime() > now.getTime() &&
    challenge.attempts < BUYER_OTP_MAX_ATTEMPTS
  );
}

export function buyerOtpRequestLimits(
  recipientChallenges: Array<{createdAt: Date}>,
  ipChallenges: Array<{createdAt: Date}>,
  now = new Date(),
) {
  const recipient = buyerOtpRequestAllowed(recipientChallenges, now);
  const ip = buyerOtpRequestAllowed(ipChallenges, now);
  return {
    allowed: recipient.allowed && ip.allowed,
    recipient,
    ip,
  };
}

export function hashOtpRequestIdentifier(value: string | null, secret: string) {
  return value
    ? crypto.createHmac("sha256", secret).update(value).digest("hex")
    : null;
}

type BuyerOtpAttemptStore = {
  buyerOtpChallenge: {
    update(input: {
      where: {id: string};
      data: {attempts: {increment: number}};
    }): Promise<{attempts: number}>;
    updateMany(input: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }): Promise<{count: number}>;
  };
};

export async function recordFailedBuyerOtpAttempt(
  db: BuyerOtpAttemptStore,
  challengeId: string,
  now = new Date(),
) {
  const updated = await db.buyerOtpChallenge.update({
    where: {id: challengeId},
    data: {attempts: {increment: 1}},
  });
  if (updated.attempts >= BUYER_OTP_MAX_ATTEMPTS) {
    await db.buyerOtpChallenge.updateMany({
      where: {id: challengeId, invalidatedAt: null},
      data: {invalidatedAt: now},
    });
  }
  return updated.attempts;
}

export async function consumeBuyerOtpChallenge(
  db: BuyerOtpAttemptStore,
  challengeId: string,
  now = new Date(),
) {
  return db.buyerOtpChallenge.updateMany({
    where: {
      id: challengeId,
      consumedAt: null,
      invalidatedAt: null,
      expiresAt: {gt: now},
      attempts: {lt: BUYER_OTP_MAX_ATTEMPTS},
    },
    data: {consumedAt: now},
  });
}

export function safeOtpRequestMetadata(ip: string | null, userAgent: string | null, secret: string) {
  const hash = (value: string | null) =>
    hashOtpRequestIdentifier(value, secret)?.slice(0, 24) || null;

  return JSON.stringify({
    ipHash: hash(ip),
    userAgentHash: hash(userAgent),
  });
}
