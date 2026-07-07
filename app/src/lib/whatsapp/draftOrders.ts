import {prisma} from "@/lib/prisma";
import {parseWhatsAppOrderMessage} from "./orderParser";

export async function createDraftOrderRequestFromInboundWhatsApp(input: {
  body: string;
  from: string;
  profileName?: string | null;
  messageId?: string | null;
}) {
  const parsed = parseWhatsAppOrderMessage({
    body: input.body,
    from: input.from,
    profileName: input.profileName,
  });

  if (!parsed.isLikelyOrder) {
    return {
      created: false,
      parsed,
      orderRequest: null,
    };
  }

  const existing = input.messageId
    ? await prisma.orderRequest.findFirst({
        where: {
          source: "WhatsApp inbound draft",
          adminNote: {
            contains: input.messageId,
          },
        },
      })
    : null;

  if (existing) {
    return {
      created: false,
      parsed,
      orderRequest: existing,
    };
  }

  const orderRequest = await prisma.orderRequest.create({
    data: {
      buyerName: parsed.buyerName || input.profileName || input.from,
      buyerType: "WhatsApp buyer",
      phone: input.from,
      email: null,
      location: parsed.location || null,
      deliveryPreference: parsed.deliveryPreference || "Delivery",
      items: parsed.itemsText,
      timing: parsed.timing || null,
      groupBuyInterest: false,
      message: parsed.notes || input.body,
      status: "Draft from WhatsApp",
      source: "WhatsApp inbound draft",
      adminNote: JSON.stringify({
        confidence: parsed.confidence,
        matchedKeywords: parsed.matchedKeywords,
        messageId: input.messageId,
        needsStaffReview: true,
        autoCreatedOrder: false,
      }),
    },
  });

  return {
    created: true,
    parsed,
    orderRequest,
  };
}
