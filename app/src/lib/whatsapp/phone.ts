export function normalisePhoneForMatch(rawPhone: string | null | undefined) {
  const digits = String(rawPhone || "").replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0") && digits.length >= 10) return `234${digits.slice(1)}`;

  return digits;
}

export function phoneMatchCandidates(rawPhone: string | null | undefined) {
  const normalised = normalisePhoneForMatch(rawPhone);

  if (!normalised) return [];

  const candidates = new Set<string>();
  candidates.add(normalised);
  candidates.add(`+${normalised}`);

  if (normalised.startsWith("234")) {
    candidates.add(`0${normalised.slice(3)}`);
  }

  return Array.from(candidates);
}
