export type ParsedWhatsAppOrder = {
  isLikelyOrder: boolean;
  confidence: "Low" | "Medium" | "High";
  buyerName?: string | null;
  phone?: string | null;
  location?: string | null;
  deliveryPreference?: string | null;
  timing?: string | null;
  itemsText: string;
  notes?: string | null;
  matchedKeywords: string[];
};

const orderKeywords = [
  "order",
  "buy",
  "need",
  "want",
  "supply",
  "deliver",
  "delivery",
  "basket",
  "bag",
  "crate",
  "kg",
  "kilo",
  "tomato",
  "pepper",
  "onion",
  "yam",
  "plantain",
  "rice",
  "beans",
  "garri",
  "vegetable",
  "vegetables",
  "produce",
];

const supportKeywords = [
  "receipt",
  "paid",
  "payment",
  "where is",
  "status",
  "complaint",
  "refund",
  "issue",
  "problem",
];

function lineValue(lines: string[], labels: string[]) {
  for (const line of lines) {
    const normalised = line.toLowerCase();
    for (const label of labels) {
      if (normalised.startsWith(`${label}:`) || normalised.startsWith(`${label} -`)) {
        return line.slice(line.indexOf(":") >= 0 ? line.indexOf(":") + 1 : line.indexOf("-") + 1).trim();
      }
    }
  }

  return null;
}

function detectLocation(text: string, lines: string[]) {
  const explicit = lineValue(lines, ["location", "address", "deliver to", "delivery address", "area"]);
  if (explicit) return explicit;

  const match = text.match(/\b(?:to|at|in|around)\s+([A-Za-z][A-Za-z\s,.'-]{2,60})/i);
  return match?.[1]?.trim() || null;
}

function detectTiming(text: string, lines: string[]) {
  const explicit = lineValue(lines, ["time", "timing", "when", "delivery time", "date"]);
  if (explicit) return explicit;

  const lower = text.toLowerCase();
  if (lower.includes("today")) return "Today";
  if (lower.includes("tomorrow")) return "Tomorrow";
  if (lower.includes("morning")) return "Morning";
  if (lower.includes("afternoon")) return "Afternoon";
  if (lower.includes("evening")) return "Evening";

  return null;
}

function detectDeliveryPreference(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("pickup") || lower.includes("pick up") || lower.includes("collect")) {
    return "Pickup";
  }

  if (lower.includes("deliver") || lower.includes("delivery") || lower.includes("send to")) {
    return "Delivery";
  }

  return "Delivery";
}

function extractItemsText(text: string, lines: string[]) {
  const explicit = lineValue(lines, ["items", "item", "order", "produce", "basket"]);
  if (explicit) return explicit;

  const usefulLines = lines.filter((line) => {
    const lower = line.toLowerCase();
    return (
      /\d/.test(line) ||
      orderKeywords.some((keyword) => lower.includes(keyword))
    );
  });

  return usefulLines.length ? usefulLines.join("\\n") : text.trim();
}

export function parseWhatsAppOrderMessage(input: {
  body: string;
  from?: string | null;
  profileName?: string | null;
}): ParsedWhatsAppOrder {
  const body = String(input.body || "").trim();
  const lower = body.toLowerCase();
  const lines = body
    .split(/\\r?\\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const matchedKeywords = orderKeywords.filter((keyword) => lower.includes(keyword));
  const matchedSupport = supportKeywords.filter((keyword) => lower.includes(keyword));

  const hasQuantity = /\\b\\d+\\s?(kg|kilo|bag|bags|crate|crates|basket|baskets|tubers?|pcs|pieces?|unit|units)?\\b/i.test(body);
  const hasOrderLanguage = matchedKeywords.length >= 2 || lower.includes("i want") || lower.includes("i need");
  const isLikelyOrder = hasQuantity && hasOrderLanguage && matchedSupport.length < 3;

  let confidence: ParsedWhatsAppOrder["confidence"] = "Low";
  if (isLikelyOrder && matchedKeywords.length >= 3) confidence = "High";
  else if (isLikelyOrder) confidence = "Medium";

  return {
    isLikelyOrder,
    confidence,
    buyerName: lineValue(lines, ["name", "buyer", "customer"]) || input.profileName || null,
    phone: input.from || null,
    location: detectLocation(body, lines),
    deliveryPreference: detectDeliveryPreference(body),
    timing: detectTiming(body, lines),
    itemsText: extractItemsText(body, lines),
    notes: body,
    matchedKeywords,
  };
}
