import crypto from "node:crypto";

export const ADMIN_RECOVERY_EMAIL = "grace@onefarmtech.com";
export const ADMIN_RECOVERY_ROLE = "Super admin";
export const ADMIN_RECOVERY_WINDOW_MS = 15 * 60 * 1000;
export const ADMIN_RECOVERY_MAX_ATTEMPTS = 5;

export function recoveryTokenMatches(submitted, configured) {
  const actual = Buffer.from(String(submitted || ""));
  const expected = Buffer.from(String(configured || ""));
  if (!actual.length || actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

export function recoveryAttemptFingerprint(ipAddress, sessionSecret) {
  return crypto.createHmac("sha256", String(sessionSecret || "missing-session-secret"))
    .update(String(ipAddress || "unknown"))
    .digest("hex")
    .slice(0, 24);
}
