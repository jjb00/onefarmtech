import {createHash} from "node:crypto";

export const normalizeIntakeValue = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
export const hashIntakeValue = (value) => createHash("sha256").update(value).digest("hex");
export const intakeFingerprint = (values) => hashIntakeValue(values.map(normalizeIntakeValue).join("\u001f"));
export const honeypotIsFilled = (value) => Boolean(normalizeIntakeValue(value));

export function validTurnstileResult(result, expectedAction, expectedHostname) {
  return Boolean(result?.success && result.action === expectedAction && result.hostname === expectedHostname);
}

export async function registerUniqueIntakeDedupe(db, dedupeKey, since) {
  const existing = await db.publicIntakeDedupe.findUnique({where: {dedupeKey}});
  if (existing && existing.createdAt >= since) return false;
  if (existing) await db.publicIntakeDedupe.deleteMany({where: {dedupeKey, createdAt: {lt: since}}});
  try {
    await db.publicIntakeDedupe.create({data: {dedupeKey}});
    return true;
  } catch (error) {
    if (error?.code === "P2002") return false;
    throw error;
  }
}
