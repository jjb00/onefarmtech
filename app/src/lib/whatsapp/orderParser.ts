export type WhatsAppInboundIntent =
  | "order_intent"
  | "product_price_enquiry"
  | "availability_enquiry"
  | "payment_follow_up"
  | "delivery_follow_up"
  | "complaint"
  | "support"
  | "general";

export type ParsedWhatsAppOrder = {
  intent: WhatsAppInboundIntent;
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
  matchedIntentKeywords: string[];
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
  "baskets",
  "bag",
  "bags",
  "crate",
  "crates",
  "kg",
  "kilo",
  "tomato",
  "tomatoes",
  "pepper",
  "peppers",
  "onion",
  "onions",
  "yam",
  "plantain",
  "rice",
  "beans",
  "garri",
  "vegetable",
  "vegetables",
  "produce",
];

const priceKeywords = [
  "price",
  "prices",
  "cost",
  "how much",
  "rate",
  "rates",
  "price list",
  "pricelist",
  "catalogue",
  "catalog",
  "list",
];

const availabilityKeywords = [
  "available",
  "availability",
  "what do you have",
  "what is available",
  "what's available",
  "in stock",
  "stock",
  "today",
  "menu",
];

const paymentKeywords = [
  "paid",
  "payment",
  "pay",
  "transfer",
  "receipt",
  "proof",
  "payment proof",
  "bank",
  "account",
  "link",
];

const deliveryKeywords = [
  "where is",
  "track",
  "tracking",
  "delivery status",
  "delivered",
  "driver",
  "rider",
  "dispatch",
  "arrived",
  "address",
];

const complaintKeywords = [
  "complaint",
  "complain",
  "bad",
  "spoilt",
  "spoiled",
  "damaged",
  "rotten",
  "wrong",
  "missing",
  "refund",
  "issue",
  "problem",
  "not good",
];

const supportKeywords = [
  "help",
  "support",
  "speak",
  "agent",
  "person",
  "team",
  "hello",
  "hi",
  "good morning",
  "good afternoon",
  "good evening",
];

function matchKeywords(text: string, keywords: string[]) {
  return keywords.filter((keyword) => text.includes(keyword));
}

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

  const match = text.match(/\\b(?:to|at|in|around)\\s+([A-Za-z][A-Za-z\\s,.'-]{2,60})/i);
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
      /\\d/.test(line) ||
      orderKeywords.some((keyword) => lower.includes(keyword))
    );
  });

  return usefulLines.length ? usefulLines.join("\\n") : text.trim();
}

function detectIntent(input: {
  lower: string;
  hasQuantity: boolean;
  matchedOrder: string[];
  matchedPrice: string[];
  matchedAvailability: string[];
  matchedPayment: string[];
  matchedDelivery: string[];
  matchedComplaint: string[];
  matchedSupport: string[];
}): {intent: WhatsAppInboundIntent; matchedIntentKeywords: string[]} {
  const {
    lower,
    hasQuantity,
    matchedOrder,
    matchedPrice,
    matchedAvailability,
    matchedPayment,
    matchedDelivery,
    matchedComplaint,
    matchedSupport,
  } = input;

  const hasOrderLanguage = matchedOrder.length >= 2 || lower.includes("i want") || lower.includes("i need");

  if (matchedComplaint.length > 0) {
    return {intent: "complaint", matchedIntentKeywords: matchedComplaint};
  }

  if (matchedPayment.length > 0 && !hasOrderLanguage) {
    return {intent: "payment_follow_up", matchedIntentKeywords: matchedPayment};
  }

  if (matchedDelivery.length > 0 && !hasOrderLanguage) {
    return {intent: "delivery_follow_up", matchedIntentKeywords: matchedDelivery};
  }

  if (hasQuantity && hasOrderLanguage) {
    return {intent: "order_intent", matchedIntentKeywords: matchedOrder};
  }

  if (matchedPrice.length > 0) {
    return {intent: "product_price_enquiry", matchedIntentKeywords: matchedPrice};
  }

  if (matchedAvailability.length > 0 || (matchedOrder.length > 0 && lower.length < 80)) {
    return {
      intent: "availability_enquiry",
      matchedIntentKeywords: matchedAvailability.length > 0 ? matchedAvailability : matchedOrder,
    };
  }

  if (matchedSupport.length > 0) {
    return {intent: "support", matchedIntentKeywords: matchedSupport};
  }

  return {intent: "general", matchedIntentKeywords: []};
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

  const matchedOrder = matchKeywords(lower, orderKeywords);
  const matchedPrice = matchKeywords(lower, priceKeywords);
  const matchedAvailability = matchKeywords(lower, availabilityKeywords);
  const matchedPayment = matchKeywords(lower, paymentKeywords);
  const matchedDelivery = matchKeywords(lower, deliveryKeywords);
  const matchedComplaint = matchKeywords(lower, complaintKeywords);
  const matchedSupport = matchKeywords(lower, supportKeywords);

  const hasQuantity = /\\b\\d+\\s?(kg|kilo|bag|bags|crate|crates|basket|baskets|tubers?|pcs|pieces?|unit|units)?\\b/i.test(body);

  const {intent, matchedIntentKeywords} = detectIntent({
    lower,
    hasQuantity,
    matchedOrder,
    matchedPrice,
    matchedAvailability,
    matchedPayment,
    matchedDelivery,
    matchedComplaint,
    matchedSupport,
  });

  const isLikelyOrder = intent === "order_intent";

  let confidence: ParsedWhatsAppOrder["confidence"] = "Low";
  if (isLikelyOrder && matchedOrder.length >= 3) confidence = "High";
  else if (isLikelyOrder) confidence = "Medium";
  else if (matchedIntentKeywords.length >= 2) confidence = "Medium";

  return {
    intent,
    isLikelyOrder,
    confidence,
    buyerName: lineValue(lines, ["name", "buyer", "customer"]) || input.profileName || null,
    phone: input.from || null,
    location: detectLocation(body, lines),
    deliveryPreference: detectDeliveryPreference(body),
    timing: detectTiming(body, lines),
    itemsText: extractItemsText(body, lines),
    notes: body,
    matchedKeywords: matchedOrder,
    matchedIntentKeywords,
  };
}
