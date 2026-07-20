import {prisma} from "@/lib/prisma";
import {honeypotIsFilled, intakeFingerprint, registerUniqueIntakeDedupe, validTurnstileResult, verifyThenReserveIntake} from "@/lib/publicIntakeRules.js";

export class PublicIntakeError extends Error {
  constructor(public code: "bot-check" | "duplicate" | "spam") {
    super(code);
    this.name = "PublicIntakeError";
  }
}

export function turnstileTestBypassAllowed() {
  return process.env.NODE_ENV === "test" && process.env.TURNSTILE_TEST_BYPASS === "true";
}

async function verifyTurnstile(token: string, action: string, fetcher: typeof fetch) {
  if (turnstileTestBypassAllowed()) return;
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret || !token) throw new PublicIntakeError("bot-check");
  const body = new URLSearchParams({secret, response: token});
  const response = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", {method: "POST", body, signal: AbortSignal.timeout(8_000), cache: "no-store"});
  const result = await response.json().catch(() => null);
  const configuredHostname = new URL(process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://onefarmtech.com").hostname;
  const allowedHostnames = [...new Set([configuredHostname, "onefarmtech.com", "www.onefarmtech.com"])];
  if (!response.ok || !validTurnstileResult(result, action, allowedHostnames)) throw new PublicIntakeError("bot-check");
}

export async function protectPublicIntake(input: {formType: "contact" | "order-request"; action: string; token?: string; honeypot?: string; values: unknown[]; fetcher?: typeof fetch}) {
  if (honeypotIsFilled(input.honeypot)) throw new PublicIntakeError("spam");
  const fingerprint = intakeFingerprint(input.values);
  const created = await verifyThenReserveIntake(
    () => verifyTurnstile(String(input.token || ""), input.action, input.fetcher || fetch),
    () => registerUniqueIntakeDedupe(prisma, `${input.formType}:${fingerprint}`, new Date(Date.now() - 10 * 60 * 1000)),
  );
  if (!created) throw new PublicIntakeError("duplicate");
}

export function publicIntakeErrorMessage(code?: string) {
  return ({"bot-check": "Please complete the human verification and try again.", duplicate: "We already received this submission. There is no need to send it again.", spam: "We could not accept this submission."} as Record<string, string>)[String(code || "")] || "We could not accept this submission. Please try again.";
}
