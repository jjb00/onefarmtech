import crypto from "node:crypto";

export function verifyFlutterwaveWebhookSignature({rawBody, signature, legacyHash, secretHash}) {
  if (!secretHash) return false;
  if (signature) {
    const expected = crypto.createHmac("sha256", secretHash).update(rawBody).digest("base64");
    const supplied = String(signature).trim();
    if (supplied.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
  }
  return Boolean(legacyHash) && String(legacyHash) === secretHash;
}

export function validateFlutterwaveWebhookPayment({data, expectedAmount, expectedCurrency}) {
  if (Number(data?.amount) !== Number(expectedAmount)) return "amount-mismatch";
  if (String(data?.currency || "").toUpperCase() !== String(expectedCurrency || "NGN").toUpperCase()) return "currency-mismatch";
  return null;
}
