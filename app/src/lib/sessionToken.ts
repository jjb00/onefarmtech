import crypto from "node:crypto";

const DEFAULT_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return null;
    }

    return "onefarmtech-development-session-secret";
  }

  return secret;
}

function sign(secret: string, payload: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(scope: string, subject: string, ttlMs: number = DEFAULT_SESSION_TTL_MS) {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error("SESSION_SECRET is required in production.");
  }

  const expiresAt = Date.now() + ttlMs;
  const payload = `${scope}:${subject}:${expiresAt}`;
  return `${payload}.${sign(secret, payload)}`;
}

export function verifySessionToken(token: string | undefined, scope: string, subject: string) {
  const secret = getSessionSecret();
  if (!secret || !token) return false;

  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex === -1) return false;

  const payload = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  const expiresAtIndex = payload.lastIndexOf(":");
  if (expiresAtIndex === -1) return false;

  const expiresAtText = payload.slice(expiresAtIndex + 1);
  const expiresAt = Number(expiresAtText);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  const expectedPayload = `${scope}:${subject}:${expiresAtText}`;
  if (payload !== expectedPayload) return false;

  const expectedSignature = sign(secret, payload);

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}
