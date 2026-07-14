import {prisma} from "@/lib/prisma";

function safeMetadata(value: unknown) {
  if (!value) return null;
  try {
    return JSON.stringify(value, (key, item) => /authorization|token|secret|card|customer|email|phone/i.test(key) ? "[redacted]" : item).slice(0, 4000);
  } catch {
    return JSON.stringify({unserializable: true});
  }
}

export async function createPaymentReconciliationIncident(input: {
  provider: string;
  internalReference?: string | null;
  providerReference?: string | null;
  reason: string;
  payloadMetadata?: unknown;
  verificationMetadata?: unknown;
}) {
  return prisma.paymentReconciliationIncident.create({
    data: {
      provider: input.provider,
      internalReference: input.internalReference || null,
      providerReference: input.providerReference || null,
      reason: input.reason.slice(0, 500),
      payloadMetadata: safeMetadata(input.payloadMetadata),
      verificationMetadata: safeMetadata(input.verificationMetadata),
    },
  });
}
