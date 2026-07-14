import crypto from "node:crypto";

export function verifyResendWebhookSignature(input) {
  const secret = input.secret || process.env.RESEND_WEBHOOK_SIGNING_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!input.id || !input.timestamp || !input.signature) return false;
  const timestamp = Number(input.timestamp);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  try {
    const key = Buffer.from(secret.startsWith("whsec_") ? secret.slice(6) : secret, "base64");
    const expected = crypto.createHmac("sha256", key).update(`${input.id}.${input.timestamp}.${input.rawBody}`).digest("base64");
    return input.signature.split(" ").some((part) => {
      const candidate = part.startsWith("v1,") ? part.slice(3) : "";
      if (!candidate) return false;
      try { return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(expected)); } catch { return false; }
    });
  } catch { return false; }
}

export function mapResendEventStatus(type) {
  return ({"email.sent": "Sent", "email.delivered": "Delivered", "email.delivery_delayed": "Delayed", "email.bounced": "Bounced", "email.complained": "Complained", "email.failed": "Failed"})[type] || null;
}
