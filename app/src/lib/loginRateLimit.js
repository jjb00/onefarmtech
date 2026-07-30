import crypto from "node:crypto";

export const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_RATE_LIMIT_MAX_FAILURES = 5;

export function loginFingerprint(scope, identifier, ipAddress, secret) {
  return crypto
    .createHmac("sha256", String(secret || "missing-session-secret"))
    .update(`${scope}:${String(ipAddress || "unknown")}:${String(identifier || "").trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 24);
}

export async function isLoginRateLimited({
  db,
  action,
  fingerprint,
  windowMs = LOGIN_RATE_LIMIT_WINDOW_MS,
  maxFailures = LOGIN_RATE_LIMIT_MAX_FAILURES,
}) {
  const recentFailures = await db.auditLog.count({
    where: {
      action,
      createdAt: {gte: new Date(Date.now() - windowMs)},
      metadata: {contains: fingerprint},
    },
  });

  return recentFailures >= maxFailures;
}

/**
 * @param {{db: any, action: string, fingerprint: string, actorEmail?: string | null, actorName?: string | null, entityId?: string | null}} input
 */
export async function recordLoginAttempt({db, action, fingerprint, actorEmail = null, actorName = null, entityId = null}) {
  try {
    await db.auditLog.create({
      data: {
        actorName: actorName || "Unauthenticated",
        actorEmail: actorEmail || null,
        actorRole: "System",
        action,
        entityType: "LoginAttempt",
        entityId: entityId || null,
        entityLabel: actorEmail || null,
        metadata: JSON.stringify({fingerprint}),
      },
    });
  } catch (error) {
    console.error("Login attempt audit log failed", error);
  }
}

const RANDOM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function randomAccessCode(length = 8) {
  const bytes = crypto.randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += RANDOM_CODE_ALPHABET[bytes[i] % RANDOM_CODE_ALPHABET.length];
  }
  return code;
}
