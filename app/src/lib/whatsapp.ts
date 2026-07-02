export const whatsappNumber = "234XXXXXXXXXX";

export const defaultWhatsAppOrderMessage = encodeURIComponent(
  "Hi OneFarmTech, I want to order farm produce.\n\nBuyer type:\nProduce needed:\nQuantity:\nDelivery area:\nPreferred delivery/pickup date:"
);

export function buildWhatsAppLink(message = defaultWhatsAppOrderMessage) {
  return `https://wa.me/${whatsappNumber}?text=${message}`;
}
