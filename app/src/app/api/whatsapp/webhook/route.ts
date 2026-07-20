import crypto from "node:crypto";
import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {phoneMatchCandidates} from "@/lib/whatsapp/phone";
import {createDraftOrderRequestFromInboundWhatsApp} from "@/lib/whatsapp/draftOrders";
import {parseWhatsAppOrderMessage} from "@/lib/whatsapp/orderParser";
import {sendWhatsAppTextMessage} from "@/lib/whatsapp/provider";
import {recordOperationalEvent} from "@/lib/operationalEvents";
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
  if (!appSecret) return process.env.NODE_ENV !== "production";

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



async function makeComplaintCode() {
  const count = await prisma.complaint.count();
  return `CMP-OFT-${String(count + 1).padStart(5, "0")}`;
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



async function findLatestCustomerOrder(customerId: string | null) {
  if (!customerId) return null;

  return prisma.order.findFirst({
    where: {
      customerId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      code: true,
      paymentStatus: true,
      fulfilmentStatus: true,
      totalAmount: true,
      paymentReference: true,
      delivery: {
        select: {
          id: true,
          status: true,
          trackingReference: true,
          deliveryPartnerName: true,
          deliveryPartnerPhone: true,
        },
      },
      paymentRequests: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          id: true,
          reference: true,
          status: true,
          provider: true,
          amount: true,
          paymentUrl: true,
        },
      },
    },
  });
}

async function logWhatsAppOperationalFollowUp(input: {
  from: string;
  body: string;
  messageId?: string | null;
  parsedIntent: ReturnType<typeof parseWhatsAppOrderMessage>;
  matchedCustomerId?: string | null;
}) {
  const intent = input.parsedIntent.intent;

  if (!["payment_follow_up", "delivery_follow_up"].includes(intent)) {
    return {
      logged: false,
      reason: "intent-not-follow-up",
    };
  }

  const customerId = input.matchedCustomerId || null;

  if (!customerId) {
    return {
      logged: false,
      reason: "no-matched-customer",
    };
  }

  const latestOrder = await findLatestCustomerOrder(customerId);

  if (!latestOrder) {
    return {
      logged: false,
      reason: "no-recent-order",
    };
  }

  const relatedType = intent === "payment_follow_up" ? "PaymentFollowUp" : "DeliveryFollowUp";
  const title =
    intent === "payment_follow_up"
      ? `WhatsApp payment follow-up for ${latestOrder.code}`
      : `WhatsApp delivery follow-up for ${latestOrder.code}`;

  const context =
    intent === "payment_follow_up"
      ? {
          orderCode: latestOrder.code,
          paymentStatus: latestOrder.paymentStatus,
          paymentReference: latestOrder.paymentReference,
          latestPaymentRequest: latestOrder.paymentRequests?.[0] || null,
        }
      : {
          orderCode: latestOrder.code,
          fulfilmentStatus: latestOrder.fulfilmentStatus,
          delivery: latestOrder.delivery || null,
        };

  await prisma.buyerMessage.create({
    data: {
      customerId,
      title,
      body: input.body,
      channel: "WhatsApp",
      direction: "Inbound",
      status: "Unread",
      recipient: input.from,
      source: "WhatsApp storefront follow-up routing",
      relatedType,
      relatedId: latestOrder.id,
      sentAt: new Date(),
      metadata: JSON.stringify({
        messageId: input.messageId,
        intent,
        confidence: input.parsedIntent.confidence,
        matchedIntentKeywords: input.parsedIntent.matchedIntentKeywords,
        ...context,
      }),
    },
  });

  return {
    logged: true,
    reason: "follow-up-logged",
    orderId: latestOrder.id,
    orderCode: latestOrder.code,
  };
}

async function maybeCreateComplaintFromInbound(input: {
  from: string;
  body: string;
  messageId?: string | null;
  profileName?: string | null;
  parsedIntent: ReturnType<typeof parseWhatsAppOrderMessage>;
  matchedCustomerId?: string | null;
}) {
  if (input.parsedIntent.intent !== "complaint") {
    return {
      created: false,
      reason: "intent-not-complaint",
    };
  }

  const customerId = input.matchedCustomerId || null;

  if (!customerId) {
    return {
      created: false,
      reason: "no-matched-customer",
    };
  }

  const recentOrder = await prisma.order.findFirst({
    where: {
      customerId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      code: true,
    },
  });

  if (!recentOrder) {
    return {
      created: false,
      reason: "no-recent-order",
    };
  }

  const existing = input.messageId
    ? await prisma.complaint.findFirst({
        where: {
          orderId: recentOrder.id,
          issue: {
            contains: input.messageId,
          },
        },
        select: {
          id: true,
          code: true,
        },
      })
    : null;

  if (existing) {
    return {
      created: false,
      reason: "duplicate",
      complaintId: existing.id,
      complaintCode: existing.code,
    };
  }

  const complaintCode = await makeComplaintCode();

  const complaintIssue = [
    input.body,
    "",
    "--- WhatsApp source context ---",
    "Source: WhatsApp storefront",
    input.messageId ? `Message ID: ${input.messageId}` : "",
    input.profileName ? `Profile name: ${input.profileName}` : "",
    `From: ${input.from}`,
    `Intent: ${input.parsedIntent.intent}`,
    `Confidence: ${input.parsedIntent.confidence}`,
    input.parsedIntent.matchedIntentKeywords?.length
      ? `Matched keywords: ${input.parsedIntent.matchedIntentKeywords.join(", ")}`
      : "",
    `Linked order: ${recentOrder.code}`,
    "Needs staff review: yes",
  ]
    .filter(Boolean)
    .join("\n");

  const complaint = await prisma.complaint.create({
    data: {
      orderId: recentOrder.id,
      code: complaintCode,
      issue: complaintIssue,
      priority: "High",
      status: "New",
    },
    select: {
      id: true,
      code: true,
    },
  });

  await prisma.buyerMessage.create({
    data: {
      customerId,
      title: `WhatsApp complaint logged for ${recentOrder.code}`,
      body: input.body,
      channel: "WhatsApp",
      direction: "Inbound",
      status: "Unread",
      recipient: input.from,
      source: "WhatsApp storefront complaint routing",
      relatedType: "Complaint",
      relatedId: complaint.id,
      sentAt: new Date(),
      metadata: JSON.stringify({
        complaintId: complaint.id,
        complaintCode: complaint.code,
        orderId: recentOrder.id,
        orderCode: recentOrder.code,
        messageId: input.messageId,
        intent: input.parsedIntent.intent,
        confidence: input.parsedIntent.confidence,
      }),
    },
  });

  return {
    created: true,
    reason: "complaint-created",
    complaintId: complaint.id,
    complaintCode: complaint.code,
  };
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
    if (input.messageId) {
      const existing = await prisma.buyerMessage.findFirst({
        where: {
          customerId: customer.id,
          channel: "WhatsApp",
          direction: "Inbound",
          relatedId: input.messageId,
        },
        select: {id: true},
      });

      if (existing) return {matched: true, customerId: customer.id, duplicate: true};
    }

    const record = await prisma.buyerMessage.create({
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
          messageType: (input.raw as {type?: string} | null)?.type || "unknown",
        }),
      },
    });

    return {matched: true, customerId: customer.id, duplicate: false, recordId: record.id, recordType: "BuyerMessage"};
  }

  if (input.messageId) {
    const existing = await prisma.contactEnquiry.findFirst({
      where: {
        source: "WhatsApp webhook",
        adminNote: {contains: input.messageId},
      },
      select: {id: true},
    });

    if (existing) return {matched: false, customerId: null, duplicate: true};
  }

  const record = await prisma.contactEnquiry.create({
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

  return {matched: false, customerId: null, duplicate: false, recordId: record.id, recordType: "ContactEnquiry"};
}

function deliveryStatus(status: string) {
  return ({sent: "Sent", delivered: "Delivered", read: "Read", failed: "Failed"} as Record<string, string>)[status] || null;
}

async function applyDeliveryStatus(statusEvent: any) {
  const providerMessageId = String(statusEvent?.id || "").trim();
  const status = deliveryStatus(String(statusEvent?.status || "").toLowerCase());
  if (!providerMessageId || !status) return false;

  const message = await prisma.buyerMessage.findFirst({
    where: {channel: "WhatsApp", direction: "Outbound", metadata: {contains: providerMessageId}},
    select: {id: true, metadata: true},
  });

  if (!message) {
    await recordOperationalEvent({
      category: "WhatsApp webhook",
      severity: "Warning",
      summary: "WhatsApp delivery status did not match an outbound message.",
      route: "/api/whatsapp/webhook",
      metadata: {providerMessageId, status},
    });
    return false;
  }

  let metadata: Record<string, unknown> = {};
  try { metadata = JSON.parse(message.metadata || "{}"); } catch {}
  const providerErrors = Array.isArray(statusEvent?.errors)
    ? statusEvent.errors.map((error: unknown) => {
        const providerError = error as {code?: number; title?: string; message?: string; error_data?: {details?: string}};
        return {
          code: providerError.code || null,
          title: providerError.title || null,
          message: providerError.message || null,
          details: providerError.error_data?.details || null,
        };
      })
    : [];
  await prisma.buyerMessage.update({
    where: {id: message.id},
    data: {
      status,
      readAt: status === "Read" ? new Date() : undefined,
      metadata: JSON.stringify({...metadata, latestProviderStatus: status, latestProviderStatusAt: statusEvent?.timestamp || null, providerErrors}),
    },
  });
  return true;
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
  let statusesUpdated = 0;

  try {
  for (const change of changes) {
    const value = change?.value || {};
    const contacts = value?.contacts || [];
    const messages = value?.messages || [];

    for (const statusEvent of value?.statuses || []) {
      if (await applyDeliveryStatus(statusEvent)) statusesUpdated += 1;
    }

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

      if (inboundLog.duplicate) continue;

      await recordOperationalEvent({
        category: "WhatsApp inbound",
        severity: "Info",
        summary: inboundLog.matched
          ? "Inbound WhatsApp message stored for a known buyer."
          : "Inbound WhatsApp message stored as an unmatched contact enquiry.",
        route: "/api/whatsapp/webhook",
        relatedType: inboundLog.recordType,
        relatedId: inboundLog.recordId,
        metadata: {messageId, messageType: message?.type || "unknown", matched: inboundLog.matched},
      });

      await createDraftOrderRequestFromInboundWhatsApp({
        from,
        profileName,
        body,
        messageId,
      });

      try {
        await maybeCreateComplaintFromInbound({
          from,
          profileName,
          body,
          messageId,
          parsedIntent,
          matchedCustomerId: inboundLog.customerId,
        });
      } catch (error) {
        console.error("WhatsApp complaint routing failed", error);
      }

      try {
        await logWhatsAppOperationalFollowUp({
          from,
          body,
          messageId,
          parsedIntent,
          matchedCustomerId: inboundLog.customerId,
        });
      } catch (error) {
        console.error("WhatsApp payment/delivery follow-up routing failed", error);
      }

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

  } catch (error) {
    await recordOperationalEvent({
      category: "WhatsApp webhook",
      summary: "WhatsApp webhook processing failed after signature verification.",
      route: "/api/whatsapp/webhook",
      metadata: {error: error instanceof Error ? error.message : "unknown"},
    });
    return NextResponse.json({ok: false, error: "Webhook processing failed"}, {status: 503, headers: {"Retry-After": "30"}});
  }

  return NextResponse.json({ok: true, logged, statusesUpdated});
}
