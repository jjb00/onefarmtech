import crypto from "node:crypto";
import {isStaffRole, type StaffRole} from "@/lib/permissions";

export type StaffSessionClaims = {
  staffId: string;
  role: StaffRole;
  staffUpdatedAt: string;
  expiresAt: number;
  version: 1;
};

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value && process.env.NODE_ENV === "production") return null;
  return value || "onefarmtech-development-session-secret";
}

export function createStaffSessionToken(claims: StaffSessionClaims) {
  const key = secret();
  if (!key) throw new Error("SESSION_SECRET is required in production.");
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = crypto.createHmac("sha256", key).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyStaffSessionToken(token?: string): StaffSessionClaims | null {
  const key = secret();
  if (!key || !token) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  const expected = crypto.createHmac("sha256", key).update(payload).digest("base64url");
  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return claims?.version === 1 && typeof claims.staffId === "string" &&
      typeof claims.staffUpdatedAt === "string" && Number.isFinite(claims.expiresAt) &&
      claims.expiresAt > Date.now() && isStaffRole(claims.role)
      ? claims
      : null;
  } catch {
    return null;
  }
}

function credentialHashes(): Record<string, string> {
  try {
    const parsed = JSON.parse(process.env.STAFF_PASSWORD_HASHES || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function verifyStaffPassword(email: string, password: string) {
  const encoded = credentialHashes()[email.trim().toLowerCase()];
  if (!encoded) return false;
  const [algorithm, salt, expected] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !expected) return false;
  try {
    const actual = crypto.scryptSync(password, salt, Buffer.from(expected, "base64url").length);
    return crypto.timingSafeEqual(actual, Buffer.from(expected, "base64url"));
  } catch {
    return false;
  }
}
