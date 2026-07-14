export const whatsappNumber = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "").replace(/\D/g, "");

export const defaultWhatsAppOrderMessage = encodeURIComponent(
  "Hi OneFarmTech, I want to order farm produce.\n\nBuyer type:\nProduce needed:\nQuantity:\nDelivery area:\nPreferred delivery/pickup date:"
);

export function buildWhatsAppLink(message = defaultWhatsAppOrderMessage) {
  const destination = whatsappNumber ? `/${whatsappNumber}` : "";
  return `https://wa.me${destination}?text=${message}`;
}
