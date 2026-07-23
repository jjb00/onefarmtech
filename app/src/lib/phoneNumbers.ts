const COUNTRY_CODES = new Set(["1", "27", "44", "233", "234", "254"]);

export const buyerPhoneCountryOptions = [
  {code: "234", label: "Nigeria (+234)"},
  {code: "44", label: "United Kingdom (+44)"},
  {code: "233", label: "Ghana (+233)"},
  {code: "254", label: "Kenya (+254)"},
  {code: "27", label: "South Africa (+27)"},
  {code: "1", label: "US / Canada (+1)"},
];

export function normalizeInternationalPhone(
  rawPhone: string | null | undefined,
  selectedCountryCode = "234",
) {
  const input = String(rawPhone || "").trim();
  if (!input) return "";

  let digits = input.replace(/\D/g, "");
  if (!digits) throw new Error("Enter a valid phone number.");

  if (input.startsWith("+")) {
    if (digits.length < 8 || digits.length > 15) throw new Error("Enter a valid international phone number.");
    return `+${digits}`;
  }

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
    if (digits.length < 8 || digits.length > 15) throw new Error("Enter a valid international phone number.");
    return `+${digits}`;
  }

  const countryCode = selectedCountryCode.replace(/\D/g, "");
  if (!COUNTRY_CODES.has(countryCode)) throw new Error("Choose a supported country code.");

  if (digits.startsWith(countryCode) && digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }

  if (digits.startsWith("0")) digits = digits.slice(1);
  const normalized = `${countryCode}${digits}`;
  if (normalized.length < 8 || normalized.length > 15) {
    throw new Error("Enter a valid phone number for the selected country.");
  }

  return `+${normalized}`;
}
