import {prisma} from "@/lib/prisma";
import {phoneMatchCandidates} from "@/lib/whatsapp/phone";
import {sendWhatsAppTextMessage} from "@/lib/whatsapp/provider";

const SESSION_MINUTES = 30;
const MAX_CATALOGUE_PRODUCTS = 15;

type ChatbotStep =
  | "MENU"
  | "AWAIT_PRODUCT"
  | "AWAIT_QUANTITY"
  | "AWAIT_FULFILMENT"
  | "AWAIT_LOCATION"
  | "AWAIT_CONFIRMATION"
  | "STAFF_REVIEW";

type SessionData = {
  productId?: string;
  productName?: string;
  productGrade?: string;
  productUnit?: string;
  unitPrice?: number;
  quantity?: number;
  fulfilment?: "Delivery" | "Pickup";
  location?: string;
  profileName?: string | null;
};

type ChatbotInput = {
  from: string;
  body: string;
  messageId?: string | null;
  profileName?: string | null;
};

type ChatbotResult = {
  handled: boolean;
  duplicate?: boolean;
  step?: ChatbotStep;
};

function parseData(raw: string | null | undefined): SessionData {
  try {
    return JSON.parse(raw || "{}") as SessionData;
  } catch {
    return {};
  }
}

function normaliseText(raw: string) {
  return String(raw || "")
    .trim()
    .replace(/\s+/g, " ");
}

function lower(raw: string) {
  return normaliseText(raw).toLowerCase();
}

function expiresAt() {
  return new Date(Date.now() + SESSION_MINUTES * 60 * 1000);
}

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function isAvailable(value: string) {
  return ["available", "in stock", "active"].includes(
    String(value || "").trim().toLowerCase(),
  );
}

async function activeProducts() {
  const products = await prisma.product.findMany({
    where: {
      status: "Active",
    },
    orderBy: [{category: "asc"}, {name: "asc"}],
    select: {
      id: true,
      name: true,
      category: true,
      grade: true,
      unit: true,
      basePrice: true,
      availability: true,
    },
  });

  return products.filter((product) => isAvailable(product.availability));
}

function mainMenu() {
  return [
    "Welcome to OneFarmTech 🌱",
    "",
    "How can we help?",
    "",
    "1. View products and prices",
    "2. Place an order",
    "3. Check payment status",
    "4. Check delivery status",
    "5. Speak to support",
    "",
    "Reply with 1, 2, 3, 4 or 5.",
    "You can also type MENU at any time.",
  ].join("\n");
}

function catalogueMessage(
  products: Awaited<ReturnType<typeof activeProducts>>,
  heading = "Available products",
) {
  if (!products.length) {
    return [
      "No products are currently marked available.",
      "",
      "A OneFarmTech staff member will review your message.",
    ].join("\n");
  }

  const rows = products
    .slice(0, MAX_CATALOGUE_PRODUCTS)
    .map(
      (product, index) =>
        `${index + 1}. ${product.name} — ${product.grade} — ${formatNaira(
          product.basePrice,
        )} per ${product.unit}`,
    );

  return [
    heading,
    "",
    ...rows,
    "",
    "Reply with the product number or product name.",
    "Prices shown are from the current OneFarmTech catalogue.",
  ].join("\n");
}

async function findCustomer(phone: string) {
  const candidates = phoneMatchCandidates(phone);

  if (!candidates.length) return null;

  const contact = await prisma.buyerContact.findFirst({
    where: {
      phone: {in: candidates},
      status: "Active",
    },
    include: {
      customer: true,
    },
  });

  if (contact?.customer) return contact.customer;

  return prisma.customer.findFirst({
    where: {
      phone: {in: candidates},
    },
  });
}

async function ensureMessageCustomer(
  phone: string,
  profileName?: string | null,
) {
  const existing = await findCustomer(phone);
  if (existing) return existing;

  return prisma.customer.create({
    data: {
      name: profileName || "WhatsApp buyer",
      phone,
      buyerType: "WhatsApp buyer",
      accountStatus: "Manual WhatsApp",
      status: "Active",
    },
  });
}

async function logAndSend(input: {
  to: string;
  body: string;
  profileName?: string | null;
  relatedType?: string;
  relatedId?: string | null;
}) {
  const customer = await ensureMessageCustomer(input.to, input.profileName);

  const log = await prisma.buyerMessage.create({
    data: {
      customerId: customer.id,
      title: "OneFarmTech WhatsApp assistant",
      body: input.body,
      channel: "WhatsApp",
      direction: "Outbound",
      status: "Pending",
      recipient: input.to,
      source: "WhatsApp chatbot",
      relatedType: input.relatedType || "WhatsAppChatbot",
      relatedId: input.relatedId || null,
      metadata: JSON.stringify({
        attemptedAt: new Date().toISOString(),
        automated: true,
      }),
    },
  });

  try {
    const result = await sendWhatsAppTextMessage({
      to: input.to,
      body: input.body,
    });

    await prisma.buyerMessage.update({
      where: {id: log.id},
      data: {
        status: "Sent",
        sentAt: new Date(),
        metadata: JSON.stringify({
          automated: true,
          provider: result.provider,
          messageId: result.messageId || null,
          normalizedRecipient: result.normalizedTo,
          messageType: result.messageType,
          httpStatus: result.httpStatus,
        }),
      },
    });

    return {
      customerId: customer.id,
      messageId: log.id,
    };
  } catch (error) {
    await prisma.buyerMessage.update({
      where: {id: log.id},
      data: {
        status: "Failed",
        metadata: JSON.stringify({
          automated: true,
          error:
            error instanceof Error
              ? error.message
              : "WhatsApp chatbot reply failed.",
        }),
      },
    });

    throw error;
  }
}

async function saveSession(input: {
  phone: string;
  step: ChatbotStep;
  data?: SessionData;
  customerId?: string | null;
  messageId?: string | null;
}) {
  return prisma.whatsAppChatbotSession.upsert({
    where: {
      phone: input.phone,
    },
    create: {
      phone: input.phone,
      customerId: input.customerId || null,
      step: input.step,
      data: JSON.stringify(input.data || {}),
      lastInboundMessageId: input.messageId || null,
      lastOutboundAt: new Date(),
      expiresAt: expiresAt(),
    },
    update: {
      customerId: input.customerId || undefined,
      step: input.step,
      data: JSON.stringify(input.data || {}),
      lastInboundMessageId: input.messageId || undefined,
      lastOutboundAt: new Date(),
      expiresAt: expiresAt(),
    },
  });
}

async function resetSession(input: ChatbotInput, message = mainMenu()) {
  const sent = await logAndSend({
    to: input.from,
    body: message,
    profileName: input.profileName,
  });

  await saveSession({
    phone: input.from,
    customerId: sent.customerId,
    step: "MENU",
    data: {
      profileName: input.profileName,
    },
    messageId: input.messageId,
  });

  return {
    handled: true,
    step: "MENU" as const,
  };
}

function parseQuantity(raw: string) {
  const match = normaliseText(raw).match(/\b(\d{1,5})\b/);
  if (!match) return 0;

  const quantity = Number(match[1]);
  return Number.isInteger(quantity) && quantity > 0 ? quantity : 0;
}

function matchesOrderIntent(text: string) {
  return (
    /\b(order|buy|purchase|need|want|get)\b/.test(text) ||
    text === "2"
  );
}

function matchesCatalogueIntent(text: string) {
  return (
    /\b(product|products|price|prices|catalogue|catalog|available|availability)\b/.test(
      text,
    ) || text === "1"
  );
}

function matchesPaymentIntent(text: string) {
  return (
    text === "3" ||
    /\b(payment|paid|paystack|flutterwave|transaction)\b/.test(text)
  );
}

function matchesDeliveryIntent(text: string) {
  return (
    text === "4" ||
    /\b(delivery|delivered|pickup|tracking|driver|dispatch)\b/.test(text)
  );
}

function matchesSupportIntent(text: string) {
  return (
    text === "5" ||
    /\b(support|help|human|person|agent|complaint|problem)\b/.test(text)
  );
}

async function latestOrderStatus(phone: string) {
  const customer = await findCustomer(phone);

  if (!customer) return null;

  return prisma.order.findFirst({
    where: {
      customerId: customer.id,
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
      deliveryMethod: true,
      paymentReference: true,
      delivery: {
        select: {
          status: true,
          trackingReference: true,
          deliveryPartnerName: true,
        },
      },
    },
  });
}

async function paymentStatusReply(input: ChatbotInput) {
  const order = await latestOrderStatus(input.from);

  const message = order
    ? [
        `Latest order: ${order.code}`,
        `Payment status: ${order.paymentStatus}`,
        `Amount: ${formatNaira(order.totalAmount)}`,
        order.paymentReference
          ? `Payment reference: ${order.paymentReference}`
          : "",
        "",
        "Reply MENU to return to the main menu.",
      ]
        .filter(Boolean)
        .join("\n")
    : [
        "We could not match this WhatsApp number to an existing buyer order.",
        "",
        "A staff member will review your message.",
        "Reply MENU to see the main options.",
      ].join("\n");

  const sent = await logAndSend({
    to: input.from,
    body: message,
    profileName: input.profileName,
    relatedType: "PaymentStatus",
    relatedId: order?.id || null,
  });

  await saveSession({
    phone: input.from,
    customerId: sent.customerId,
    step: "MENU",
    data: {
      profileName: input.profileName,
    },
    messageId: input.messageId,
  });

  return {
    handled: true,
    step: "MENU" as const,
  };
}

async function deliveryStatusReply(input: ChatbotInput) {
  const order = await latestOrderStatus(input.from);

  const message = order
    ? [
        `Latest order: ${order.code}`,
        `Order stage: ${order.fulfilmentStatus}`,
        `Method: ${order.deliveryMethod}`,
        order.delivery?.status
          ? `Delivery status: ${order.delivery.status}`
          : "",
        order.delivery?.trackingReference
          ? `Tracking: ${order.delivery.trackingReference}`
          : "",
        order.delivery?.deliveryPartnerName
          ? `Delivery partner: ${order.delivery.deliveryPartnerName}`
          : "",
        "",
        "Reply MENU to return to the main menu.",
      ]
        .filter(Boolean)
        .join("\n")
    : [
        "We could not match this WhatsApp number to an existing delivery.",
        "",
        "A staff member will review your message.",
        "Reply MENU to see the main options.",
      ].join("\n");

  const sent = await logAndSend({
    to: input.from,
    body: message,
    profileName: input.profileName,
    relatedType: "DeliveryStatus",
    relatedId: order?.id || null,
  });

  await saveSession({
    phone: input.from,
    customerId: sent.customerId,
    step: "MENU",
    data: {
      profileName: input.profileName,
    },
    messageId: input.messageId,
  });

  return {
    handled: true,
    step: "MENU" as const,
  };
}

async function supportReply(input: ChatbotInput) {
  const message = [
    "Your message has been placed in the OneFarmTech support queue.",
    "",
    "A staff member will review it and reply here.",
    "Reply MENU to return to the main options.",
  ].join("\n");

  const sent = await logAndSend({
    to: input.from,
    body: message,
    profileName: input.profileName,
    relatedType: "Support",
  });

  await saveSession({
    phone: input.from,
    customerId: sent.customerId,
    step: "MENU",
    data: {
      profileName: input.profileName,
    },
    messageId: input.messageId,
  });

  return {
    handled: true,
    step: "MENU" as const,
  };
}

async function beginProductSelection(input: ChatbotInput) {
  const products = await activeProducts();
  const body = catalogueMessage(
    products,
    "What would you like to order?",
  );

  const sent = await logAndSend({
    to: input.from,
    body,
    profileName: input.profileName,
    relatedType: "ProductCatalogue",
  });

  await saveSession({
    phone: input.from,
    customerId: sent.customerId,
    step: "AWAIT_PRODUCT",
    data: {
      profileName: input.profileName,
    },
    messageId: input.messageId,
  });

  return {
    handled: true,
    step: "AWAIT_PRODUCT" as const,
  };
}

async function showCatalogue(input: ChatbotInput) {
  const products = await activeProducts();

  const sent = await logAndSend({
    to: input.from,
    body: catalogueMessage(products),
    profileName: input.profileName,
    relatedType: "ProductCatalogue",
  });

  await saveSession({
    phone: input.from,
    customerId: sent.customerId,
    step: "MENU",
    data: {
      profileName: input.profileName,
    },
    messageId: input.messageId,
  });

  return {
    handled: true,
    step: "MENU" as const,
  };
}

async function selectProduct(
  input: ChatbotInput,
  currentData: SessionData,
) {
  const products = await activeProducts();
  const text = lower(input.body);
  const number = Number(text);

  let product =
    Number.isInteger(number) && number >= 1
      ? products[number - 1]
      : null;

  if (!product) {
    product =
      products.find((candidate) =>
        text.includes(candidate.name.toLowerCase()),
      ) || null;
  }

  if (!product) {
    const sent = await logAndSend({
      to: input.from,
      body: [
        "We could not identify that product.",
        "",
        catalogueMessage(products, "Please choose one of these products"),
      ].join("\n"),
      profileName: input.profileName,
      relatedType: "ProductCatalogue",
    });

    await saveSession({
      phone: input.from,
      customerId: sent.customerId,
      step: "AWAIT_PRODUCT",
      data: currentData,
      messageId: input.messageId,
    });

    return {
      handled: true,
      step: "AWAIT_PRODUCT" as const,
    };
  }

  const data: SessionData = {
    ...currentData,
    productId: product.id,
    productName: product.name,
    productGrade: product.grade,
    productUnit: product.unit,
    unitPrice: product.basePrice,
  };

  const sent = await logAndSend({
    to: input.from,
    body: [
      `${product.name} is ${formatNaira(product.basePrice)} per ${product.unit}.`,
      "",
      `How many ${product.unit}s would you like?`,
      "Reply with a number only, for example: 5",
    ].join("\n"),
    profileName: input.profileName,
    relatedType: "OrderCapture",
    relatedId: product.id,
  });

  await saveSession({
    phone: input.from,
    customerId: sent.customerId,
    step: "AWAIT_QUANTITY",
    data,
    messageId: input.messageId,
  });

  return {
    handled: true,
    step: "AWAIT_QUANTITY" as const,
  };
}

async function captureQuantity(
  input: ChatbotInput,
  currentData: SessionData,
) {
  const quantity = parseQuantity(input.body);

  if (!quantity) {
    const sent = await logAndSend({
      to: input.from,
      body: [
        "Please enter a valid quantity greater than zero.",
        "",
        `Example: 5`,
      ].join("\n"),
      profileName: input.profileName,
      relatedType: "OrderCapture",
      relatedId: currentData.productId || null,
    });

    await saveSession({
      phone: input.from,
      customerId: sent.customerId,
      step: "AWAIT_QUANTITY",
      data: currentData,
      messageId: input.messageId,
    });

    return {
      handled: true,
      step: "AWAIT_QUANTITY" as const,
    };
  }

  const data: SessionData = {
    ...currentData,
    quantity,
  };

  const sent = await logAndSend({
    to: input.from,
    body: [
      "How would you like to receive the order?",
      "",
      "1. Delivery",
      "2. Pickup",
      "",
      "Reply with 1 or 2.",
    ].join("\n"),
    profileName: input.profileName,
    relatedType: "OrderCapture",
    relatedId: currentData.productId || null,
  });

  await saveSession({
    phone: input.from,
    customerId: sent.customerId,
    step: "AWAIT_FULFILMENT",
    data,
    messageId: input.messageId,
  });

  return {
    handled: true,
    step: "AWAIT_FULFILMENT" as const,
  };
}

async function captureFulfilment(
  input: ChatbotInput,
  currentData: SessionData,
) {
  const text = lower(input.body);

  const fulfilment =
    text === "1" || text.includes("delivery")
      ? "Delivery"
      : text === "2" || text.includes("pickup")
        ? "Pickup"
        : null;

  if (!fulfilment) {
    const sent = await logAndSend({
      to: input.from,
      body: "Reply 1 for Delivery or 2 for Pickup.",
      profileName: input.profileName,
      relatedType: "OrderCapture",
      relatedId: currentData.productId || null,
    });

    await saveSession({
      phone: input.from,
      customerId: sent.customerId,
      step: "AWAIT_FULFILMENT",
      data: currentData,
      messageId: input.messageId,
    });

    return {
      handled: true,
      step: "AWAIT_FULFILMENT" as const,
    };
  }

  const data: SessionData = {
    ...currentData,
    fulfilment,
  };

  const prompt =
    fulfilment === "Delivery"
      ? "Please enter the delivery area and address."
      : "Please enter your preferred pickup area.";

  const sent = await logAndSend({
    to: input.from,
    body: [
      prompt,
      "",
      "A staff member will confirm the final delivery or pickup arrangement.",
    ].join("\n"),
    profileName: input.profileName,
    relatedType: "OrderCapture",
    relatedId: currentData.productId || null,
  });

  await saveSession({
    phone: input.from,
    customerId: sent.customerId,
    step: "AWAIT_LOCATION",
    data,
    messageId: input.messageId,
  });

  return {
    handled: true,
    step: "AWAIT_LOCATION" as const,
  };
}

async function captureLocation(
  input: ChatbotInput,
  currentData: SessionData,
) {
  const location = normaliseText(input.body);

  if (location.length < 3) {
    const sent = await logAndSend({
      to: input.from,
      body:
        currentData.fulfilment === "Pickup"
          ? "Please enter a preferred pickup area."
          : "Please enter a valid delivery area and address.",
      profileName: input.profileName,
      relatedType: "OrderCapture",
      relatedId: currentData.productId || null,
    });

    await saveSession({
      phone: input.from,
      customerId: sent.customerId,
      step: "AWAIT_LOCATION",
      data: currentData,
      messageId: input.messageId,
    });

    return {
      handled: true,
      step: "AWAIT_LOCATION" as const,
    };
  }

  const data: SessionData = {
    ...currentData,
    location,
  };

  const subtotal =
    Number(data.unitPrice || 0) * Number(data.quantity || 0);

  const summary = [
    "Please review your order request",
    "",
    `Product: ${data.productName}`,
    `Grade: ${data.productGrade}`,
    `Quantity: ${data.quantity} ${data.productUnit}`,
    `Catalogue price: ${formatNaira(data.unitPrice || 0)} per ${data.productUnit}`,
    `Product subtotal: ${formatNaira(subtotal)}`,
    `Method: ${data.fulfilment}`,
    `${data.fulfilment === "Pickup" ? "Pickup area" : "Delivery address"}: ${data.location}`,
    "",
    "Delivery fees, final availability and the final total still require staff confirmation.",
    "",
    "Reply YES or CONFIRM to submit this request for staff review.",
    "Reply NO to cancel and choose again.",
  ].join("\n");

  const sent = await logAndSend({
    to: input.from,
    body: summary,
    profileName: input.profileName,
    relatedType: "OrderSummary",
    relatedId: currentData.productId || null,
  });

  await saveSession({
    phone: input.from,
    customerId: sent.customerId,
    step: "AWAIT_CONFIRMATION",
    data,
    messageId: input.messageId,
  });

  return {
    handled: true,
    step: "AWAIT_CONFIRMATION" as const,
  };
}

async function confirmOrderRequest(
  input: ChatbotInput,
  currentData: SessionData,
) {
  const text = lower(input.body);

  if (["no", "cancel", "edit", "change"].includes(text)) {
    return beginProductSelection(input);
  }

  if (!["yes", "confirm", "confirmed"].includes(text)) {
    const sent = await logAndSend({
      to: input.from,
      body: [
        "Your order request has not been submitted yet.",
        "",
        "Reply YES or CONFIRM to submit it for staff review.",
        "Reply NO to cancel and choose again.",
      ].join("\n"),
      profileName: input.profileName,
      relatedType: "OrderSummary",
      relatedId: currentData.productId || null,
    });

    await saveSession({
      phone: input.from,
      customerId: sent.customerId,
      step: "AWAIT_CONFIRMATION",
      data: currentData,
      messageId: input.messageId,
    });

    return {
      handled: true,
      step: "AWAIT_CONFIRMATION" as const,
    };
  }

  if (
    !currentData.productId ||
    !currentData.productName ||
    !currentData.quantity ||
    !currentData.unitPrice ||
    !currentData.fulfilment ||
    !currentData.location
  ) {
    return resetSession(
      input,
      [
        "The previous order details were incomplete or expired.",
        "",
        mainMenu(),
      ].join("\n"),
    );
  }

  const customer = await ensureMessageCustomer(
    input.from,
    input.profileName,
  );

  const existing = input.messageId
    ? await prisma.orderRequest.findFirst({
        where: {
          source: "WhatsApp chatbot",
          adminNote: {
            contains: input.messageId,
          },
        },
      })
    : null;

  const subtotal =
    Number(currentData.unitPrice) * Number(currentData.quantity);

  const orderRequest =
    existing ||
    (await prisma.orderRequest.create({
      data: {
        buyerName: customer.name,
        buyerType: customer.buyerType || "WhatsApp buyer",
        phone: input.from,
        email: customer.email || null,
        location: currentData.location,
        deliveryPreference: currentData.fulfilment,
        items: [
          `${currentData.productName}`,
          `Grade: ${currentData.productGrade || "Standard"}`,
          `Quantity: ${currentData.quantity} ${currentData.productUnit}`,
          `Catalogue unit price: ${formatNaira(currentData.unitPrice)}`,
          `Catalogue subtotal: ${formatNaira(subtotal)}`,
        ].join("\n"),
        timing: null,
        groupBuyInterest: false,
        message: [
          "Buyer-confirmed WhatsApp chatbot order request.",
          "",
          `Product: ${currentData.productName}`,
          `Quantity: ${currentData.quantity} ${currentData.productUnit}`,
          `Method: ${currentData.fulfilment}`,
          `Location: ${currentData.location}`,
        ].join("\n"),
        status: "New",
        source: "WhatsApp chatbot",
        adminNote: JSON.stringify({
          chatbotConfirmed: true,
          confirmedAt: new Date().toISOString(),
          confirmationMessageId: input.messageId || null,
          customerId: customer.id,
          productId: currentData.productId,
          productName: currentData.productName,
          productGrade: currentData.productGrade,
          productUnit: currentData.productUnit,
          unitPrice: currentData.unitPrice,
          quantity: currentData.quantity,
          catalogueSubtotal: subtotal,
          fulfilment: currentData.fulfilment,
          location: currentData.location,
          requiresStaffReview: true,
          requiresAvailabilityConfirmation: true,
          requiresDeliveryFeeConfirmation: true,
          requiresFinalTotalConfirmation: true,
          paymentNotRequested: true,
          fulfilmentNotStarted: true,
        }),
      },
    }));

  const response = [
    `Your order request has been submitted: ${orderRequest.id}`,
    "",
    `${currentData.productName} — ${currentData.quantity} ${currentData.productUnit}`,
    `${currentData.fulfilment}: ${currentData.location}`,
    "",
    "A OneFarmTech staff member will now confirm:",
    "• current availability",
    "• delivery or pickup arrangement",
    "• delivery fee",
    "• final total",
    "",
    "No payment or fulfilment has started yet.",
    "We will reply here after staff review.",
  ].join("\n");

  await logAndSend({
    to: input.from,
    body: response,
    profileName: input.profileName,
    relatedType: "OrderRequest",
    relatedId: orderRequest.id,
  });

  await saveSession({
    phone: input.from,
    customerId: customer.id,
    step: "STAFF_REVIEW",
    data: currentData,
    messageId: input.messageId,
  });

  return {
    handled: true,
    step: "STAFF_REVIEW" as const,
  };
}

export async function handleWhatsAppChatbotMessage(
  input: ChatbotInput,
): Promise<ChatbotResult> {
  if (process.env.WHATSAPP_CHATBOT_ENABLED !== "true") {
    return {
      handled: false,
    };
  }

  const body = normaliseText(input.body);
  const text = lower(body);

  if (!body) {
    return {
      handled: false,
    };
  }

  let session = await prisma.whatsAppChatbotSession.findUnique({
    where: {
      phone: input.from,
    },
  });

  if (
    input.messageId &&
    session?.lastInboundMessageId === input.messageId
  ) {
    return {
      handled: true,
      duplicate: true,
      step: session.step as ChatbotStep,
    };
  }

  if (
    session?.expiresAt &&
    session.expiresAt.getTime() <= Date.now()
  ) {
    session = await prisma.whatsAppChatbotSession.update({
      where: {
        phone: input.from,
      },
      data: {
        step: "MENU",
        data: JSON.stringify({}),
        expiresAt: expiresAt(),
      },
    });
  }

  if (["menu", "start", "reset", "cancel"].includes(text)) {
    return resetSession(input);
  }

  const currentStep = (session?.step || "MENU") as ChatbotStep;
  const currentData = parseData(session?.data);

  if (currentStep === "AWAIT_PRODUCT") {
    return selectProduct(input, currentData);
  }

  if (currentStep === "AWAIT_QUANTITY") {
    return captureQuantity(input, currentData);
  }

  if (currentStep === "AWAIT_FULFILMENT") {
    return captureFulfilment(input, currentData);
  }

  if (currentStep === "AWAIT_LOCATION") {
    return captureLocation(input, currentData);
  }

  if (currentStep === "AWAIT_CONFIRMATION") {
    return confirmOrderRequest(input, currentData);
  }

  if (currentStep === "STAFF_REVIEW") {
    if (matchesPaymentIntent(text)) {
      return paymentStatusReply(input);
    }

    if (matchesDeliveryIntent(text)) {
      return deliveryStatusReply(input);
    }

    if (matchesOrderIntent(text)) {
      return beginProductSelection(input);
    }

    const sent = await logAndSend({
      to: input.from,
      body: [
        "Your previous order request is waiting for staff review.",
        "",
        "You may:",
        "• reply MENU for the main options",
        "• type NEW ORDER to begin another request",
        "• type SUPPORT to speak to staff",
      ].join("\n"),
      profileName: input.profileName,
      relatedType: "OrderRequestStatus",
    });

    await saveSession({
      phone: input.from,
      customerId: sent.customerId,
      step: "STAFF_REVIEW",
      data: currentData,
      messageId: input.messageId,
    });

    return {
      handled: true,
      step: "STAFF_REVIEW",
    };
  }

  if (matchesOrderIntent(text)) {
    return beginProductSelection(input);
  }

  if (matchesCatalogueIntent(text)) {
    return showCatalogue(input);
  }

  if (matchesPaymentIntent(text)) {
    return paymentStatusReply(input);
  }

  if (matchesDeliveryIntent(text)) {
    return deliveryStatusReply(input);
  }

  if (matchesSupportIntent(text)) {
    return supportReply(input);
  }

  if (
    /\b(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(
      text,
    )
  ) {
    return resetSession(input);
  }

  return resetSession(
    input,
    [
      "We did not understand that request.",
      "",
      mainMenu(),
    ].join("\n"),
  );
}
