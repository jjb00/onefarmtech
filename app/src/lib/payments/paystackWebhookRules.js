import crypto from "node:crypto";

export function verifyPaystackWebhookSignature(rawBody, signature, secretKey) {
  if (!rawBody || !signature || !secretKey) return false;
  const expected = crypto.createHmac("sha512", secretKey).update(rawBody).digest("hex");
  const supplied = String(signature).trim().toLowerCase();
  if (!/^[0-9a-f]{128}$/.test(supplied) || supplied.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(supplied, "hex"));
}

export function validatePaystackWebhookPayment({data, expectedAmount, expectedCurrency}) {
  const amountMinor = Number(data?.amount);
  const currency = String(data?.currency || "").toUpperCase();
  if (!Number.isInteger(amountMinor) || amountMinor !== Math.round(expectedAmount * 100)) return "amount-mismatch";
  if (currency !== String(expectedCurrency || "NGN").toUpperCase()) return "currency-mismatch";
  return null;
}
