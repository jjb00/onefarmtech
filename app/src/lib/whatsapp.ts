export const whatsappNumber = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "").replace(/\D/g, "");

export const defaultWhatsAppOrderMessage = encodeURIComponent(
  "Hi OneFarmTech, I'd like to place an order."
);

export function buildWhatsAppLink(message = defaultWhatsAppOrderMessage) {
  const destination = whatsappNumber ? `/${whatsappNumber}` : "";
  return `https://wa.me${destination}?text=${message}`;
}
