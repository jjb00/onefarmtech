import crypto from "node:crypto";

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

export function createSessionToken(scope: string, subject: string) {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error("SESSION_SECRET is required in production.");
  }

  const payload = `${scope}:${subject}`;
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined, scope: string, subject: string) {
  const secret = getSessionSecret();
  if (!secret || !token) return false;

  const payload = `${scope}:${subject}`;
  const expected = createSessionToken(scope, subject);

  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected)) && token.startsWith(`${payload}.`);
  } catch {
    return false;
  }
}
