import crypto from "node:crypto";
import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {phoneMatchCandidates} from "@/lib/whatsapp/phone";
import {createDraftOrderRequestFromInboundWhatsApp} from "@/lib/whatsapp/draftOrders";
import {parseWhatsAppOrderMessage} from "@/lib/whatsapp/orderParser";
import {sendWhatsAppTextMessage} from "@/lib/whatsapp/provider";
import {
  buildWhatsAppProductListMessage,
  isProductAvailableForWhatsApp,
} from "@/lib/whatsapp/productCatalogue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifyMetaSignature(rawBody: string, signature: string | null) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  // Local/dev foundation mode: accept unsigned webhooks only if app secret is not configured.
  // Production should set WHATSAPP_APP_SECRET.
  if (!appSecret) return true;

  if (!signature || !signature.startsWith("sha256=")) return false;

  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", appSecret)
      .update(rawBody)
      .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

function getTextBody(message: any) {
  if (message?.type === "text") return String(message?.text?.body || "").trim();
  if (message?.type === "button") return String(message?.button?.text || "").trim();
  if (message?.type === "interactive") {
    return (
      String(message?.interactive?.button_reply?.title || "").trim() ||
      String(message?.interactive?.list_reply?.title || "").trim()
    );
  }

  return `[${message?.type || "unknown"} message received]`;
}

async function findCustomerByWhatsAppPhone(phone: string) {
  const candidates = phoneMatchCandidates(phone);

  if (candidates.length === 0) return null;

  const directCustomer = await prisma.customer.findFirst({
    where: {
      OR: [
        {phone: {in: candidates}},
        {phone: {contains: candidates[0]}},
      ],
    },
    select: {
      id: true,
      name: true,
      phone: true,
    },
  });

  if (directCustomer) return directCustomer;

  const contact = await prisma.buyerContact.findFirst({
    where: {
      OR: [
        {phone: {in: candidates}},
        {phone: {contains: candidates[0]}},
      ],
    },
    select: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  return contact?.customer || null;
}


function shouldAutoSendCatalogue(intent: string | undefined) {
  return ["product_price_enquiry", "availability_enquiry"].includes(String(intent || ""));
}

async function buildCurrentCatalogueMessage() {
  const products = await prisma.product.findMany({
    where: {
      status: "Active",
    },
    orderBy: [{category: "asc"}, {name: "asc"}],
    select: {
      id: true,
      name: true,
      category: true,
      unit: true,
      grade: true,
      basePrice: true,
      availability: true,
      status: true,
    },
  });

  const availableProducts = products.filter(isProductAvailableForWhatsApp);

  return {
    body: buildWhatsAppProductListMessage(availableProducts),
    productCount: availableProducts.length,
  };
}

async function logOutboundCatalogueReply(input: {
  to: string;
  body: string;
  productCount: number;
  result: Awaited<ReturnType<typeof sendWhatsAppTextMessage>>;
  matchedCustomerId?: string | null;
}) {
  let customerId = input.matchedCustomerId || null;

  if (!customerId) {
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        phone: input.to,
      },
      select: {
        id: true,
      },
    });

    customerId = existingCustomer?.id || null;
  }

  if (!customerId) {
    const customer = await prisma.customer.create({
      data: {
        name: "WhatsApp buyer",
        phone: input.to,
        buyerType: "WhatsApp buyer",
        accountStatus: "Manual WhatsApp",
        status: "Active",
      },
      select: {
        id: true,
      },
    });

    customerId = customer.id;
  }

  await prisma.buyerMessage.create({
    data: {
      customerId,
      title: "Auto WhatsApp product list reply",
      body: input.body,
      channel: "WhatsApp",
      direction: "Outbound",
      status: "Sent",
      recipient: input.to,
      source: "WhatsApp storefront auto-reply",
      relatedType: "ProductCatalogue",
      relatedId: null,
      sentAt: new Date(),
      metadata: JSON.stringify({
        provider: input.result.provider,
        messageId: input.result.messageId,
        productCount: input.productCount,
        autoReply: true,
      }),
    },
  });
}

async function maybeSendCatalogueAutoReply(input: {
  from: string;
  parsedIntent: ReturnType<typeof parseWhatsAppOrderMessage>;
  matchedCustomerId?: string | null;
}) {
  if (!shouldAutoSendCatalogue(input.parsedIntent.intent)) {
    return {
      sent: false,
      reason: "intent-not-catalogue",
    };
  }

  if (process.env.WHATSAPP_AUTO_REPLY_CATALOGUE !== "true") {
    return {
      sent: false,
      reason: "auto-reply-disabled",
    };
  }

  const catalogue = await buildCurrentCatalogueMessage();

  const result = await sendWhatsAppTextMessage({
    to: input.from,
    body: catalogue.body,
  });

  await logOutboundCatalogueReply({
    to: input.from,
    body: catalogue.body,
    productCount: catalogue.productCount,
    result,
    matchedCustomerId: input.matchedCustomerId,
  });

  return {
    sent: true,
    reason: "catalogue-sent",
    messageId: result.messageId || null,
    productCount: catalogue.productCount,
  };
}

async function logInboundMessage(input: {
  from: string;
  profileName?: string | null;
  body: string;
  messageId?: string | null;
  timestamp?: string | null;
  raw: unknown;
  parsedIntent?: ReturnType<typeof parseWhatsAppOrderMessage>;
}) {
  const customer = await findCustomerByWhatsAppPhone(input.from);

  if (customer) {
    await prisma.buyerMessage.create({
      data: {
        customerId: customer.id,
        title: `Inbound WhatsApp from ${input.profileName || customer.name}`,
        body: input.body,
        channel: "WhatsApp",
        direction: "Inbound",
        status: "Unread",
        recipient: input.from,
        source: "WhatsApp webhook",
        relatedType: "WhatsAppInbound",
        relatedId: input.messageId || null,
        sentAt: input.timestamp ? new Date(Number(input.timestamp) * 1000) : new Date(),
        metadata: JSON.stringify({
          from: input.from,
          profileName: input.profileName,
          messageId: input.messageId,
          matchedCustomerId: customer.id,
          intent: input.parsedIntent?.intent || "general",
          confidence: input.parsedIntent?.confidence || "Low",
          matchedIntentKeywords: input.parsedIntent?.matchedIntentKeywords || [],
          raw: input.raw,
        }),
      },
    });

    return {matched: true, customerId: customer.id};
  }

  await prisma.contactEnquiry.create({
    data: {
      name: input.profileName || input.from,
      organisation: null,
      email: null,
      phone: input.from,
      enquiryType: "WhatsApp inbound",
      message: input.body,
      status: "New",
      source: "WhatsApp webhook",
      adminNote: JSON.stringify({
        messageId: input.messageId,
        profileName: input.profileName,
        timestamp: input.timestamp,
        intent: input.parsedIntent?.intent || "general",
        confidence: input.parsedIntent?.confidence || "Low",
        matchedIntentKeywords: input.parsedIntent?.matchedIntentKeywords || [],
      }),
    },
  });

  return {matched: false, customerId: null};
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token &&
    token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN &&
    challenge
  ) {
    return new NextResponse(challenge, {status: 200});
  }

  return NextResponse.json({ok: false, error: "Invalid verification token"}, {status: 403});
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(rawBody, signature)) {
    return NextResponse.json({ok: false, error: "Invalid signature"}, {status: 401});
  }

  let payload: any;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ok: false, error: "Invalid JSON"}, {status: 400});
  }

  const changes = payload?.entry?.flatMap((entry: any) => entry?.changes || []) || [];
  let logged = 0;

  for (const change of changes) {
    const value = change?.value || {};
    const contacts = value?.contacts || [];
    const messages = value?.messages || [];

    for (const message of messages) {
      const from = String(message?.from || "").trim();
      if (!from) continue;

      const contact = contacts.find((item: any) => String(item?.wa_id || "") === from);
      const body = getTextBody(message);

      const profileName = contact?.profile?.name || null;
      const messageId = message?.id || null;

      const parsedIntent = parseWhatsAppOrderMessage({
        from,
        profileName,
        body,
      });

      const inboundLog = await logInboundMessage({
        from,
        profileName,
        body,
        messageId,
        timestamp: message?.timestamp || null,
        raw: message,
        parsedIntent,
      });

      await createDraftOrderRequestFromInboundWhatsApp({
        from,
        profileName,
        body,
        messageId,
      });

      try {
        await maybeSendCatalogueAutoReply({
          from,
          parsedIntent,
          matchedCustomerId: inboundLog.customerId,
        });
      } catch (error) {
        console.error("WhatsApp catalogue auto-reply failed", error);
      }

      logged += 1;
    }
  }

  return NextResponse.json({ok: true, logged});
}
