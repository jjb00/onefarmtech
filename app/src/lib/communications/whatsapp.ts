export function normalizeWhatsAppPhone(phone?: string | null) {
  return (phone || "").replace(/[^\d]/g, "");
}

export function makeWhatsAppComposeUrl({
  phone,
  message,
}: {
  phone?: string | null;
  message: string;
}) {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  const encodedMessage = encodeURIComponent(message);

  if (!normalizedPhone) {
    return `https://wa.me/?text=${encodedMessage}`;
  }

  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
}

export function buildBuyerWhatsAppMessage({
  buyerName,
  topic,
  body,
}: {
  buyerName: string;
  topic: string;
  body: string;
}) {
  return [
    `Hello ${buyerName},`,
    "",
    body,
    "",
    `Topic: ${topic}`,
    "",
    "OneFarmTech",
  ].join("\\n");
}
