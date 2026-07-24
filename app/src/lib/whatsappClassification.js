const recruitmentPhrases = [
  "job application", "apply for a job", "looking for work", "looking for a job",
  "vacancy", "career opportunity", "submit my cv", "attached cv", "curriculum vitae",
];
const supplierPhrases = [
  "become a supplier", "supply your company", "supplier partnership",
  "partnership proposal", "distribution partner",
];
export const nonOperationalWhatsAppPhrases = [...recruitmentPhrases, ...supplierPhrases];
const orderPhrases = [
  "place an order", "want to order", "buy ", "price of", "how much",
  "available", "delivery", "pickup",
];

function combinedText(record) {
  return [
    record.source,
    record.enquiryType,
    record.message,
    record.adminNote,
  ].filter(Boolean).join(" ").toLowerCase();
}

export function classifyUnknownWhatsAppContact(record) {
  const text = combinedText(record);
  const explicit = String(record.adminNote || "").match(/classification\s*:\s*(recruitment|supplier|general|operational)/i)?.[1]?.toLowerCase();
  if (explicit === "recruitment") return "recruitment";
  if (explicit === "supplier") return "supplier/partnership";
  if (explicit === "general") return "general/non-operational";
  if (explicit === "operational") return "operational order contact";
  if (recruitmentPhrases.some((phrase) => text.includes(phrase))) return "recruitment";
  if (supplierPhrases.some((phrase) => text.includes(phrase))) return "supplier/partnership";
  if (orderPhrases.some((phrase) => text.includes(phrase))) return "operational order contact";
  return "unknown";
}

export function isOperationalUnknownWhatsAppContact(record) {
  return ["operational order contact", "unknown"].includes(classifyUnknownWhatsAppContact(record));
}
