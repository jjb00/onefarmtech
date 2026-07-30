/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- carried over from createAdminRecords.ts during the module split; see git
// history for context. Removing this needs a dedicated type-safety pass.
"use server";

import {prisma} from "@/lib/prisma";
import {requireCapability} from "@/lib/auth";
import {initialFulfilmentStatus} from "@/lib/orderStatusRules.js";
import {readText} from "./shared";

async function markSourceDraftConverted(sourceDraftId: string, orderId: string, orderCode: string) {
  if (!sourceDraftId) return;

  const draft = await prisma.orderRequest.findUnique({
    where: {id: sourceDraftId},
  });

  if (!draft) return;

  let existingNote = {};
  try {
    existingNote = JSON.parse(draft.adminNote || "{}");
  } catch {
    existingNote = {previousNote: draft.adminNote || ""};
  }

  await prisma.orderRequest.update({
    where: {id: sourceDraftId},
    data: {
      status: "Converted to order",
      adminNote: JSON.stringify({
        ...existingNote,
        staffReviewStatus: "Converted to order",
        convertedOrderId: orderId,
        convertedOrderCode: orderCode,
        convertedAt: new Date().toISOString(),
      }),
    },
  });
}
export async function createWhatsAppAssistedOrderAction(formData: FormData) {
  await requireCapability("manage_orders");
  const sourceDraftId = readText(formData, "sourceDraftId");
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");
  const {
    matchBuyerByPhone,
    makePaymentReference,
    normalisePhone,
    parseMoney,
    parseQuantity,
    formatNaira,
  } = await import("@/lib/commerce/whatsappOrders");

  await requireStaff();

  const sourceDraft = sourceDraftId
    ? await prisma.orderRequest.findUnique({
        where: {id: sourceDraftId},
      })
    : null;

  const whatsappPhoneInput = String(formData.get("whatsappPhone") || "").trim();
  const buyerNameInput = String(formData.get("buyerName") || "").trim();
  const buyerTypeInput = String(formData.get("buyerType") || "WhatsApp buyer").trim();
  const deliveryMethod = String(formData.get("deliveryMethod") || "Delivery").trim();
  const deliveryAddress = String(formData.get("deliveryAddress") || "").trim();
  const deliveryArea = String(formData.get("deliveryArea") || "").trim();
  const deliveryNote = String(formData.get("deliveryNote") || "").trim();
  const adminNote = String(formData.get("adminNote") || "").trim();

  const deliveryFee = parseMoney(formData.get("deliveryFee"), 0);
  const serviceFee = parseMoney(formData.get("serviceFee"), 0);
  const discountAmount = parseMoney(formData.get("discountAmount"), 0);

  const matched = await matchBuyerByPhone(whatsappPhoneInput);
  const sourcePhone = matched.phone || normalisePhone(whatsappPhoneInput);

  if (!sourcePhone) {
    redirect("/admin/whatsapp-orders/new?error=missing-phone");
  }

  const products = await prisma.product.findMany({
    where: {
      status: "Active",
    },
    orderBy: [{category: "asc"}, {name: "asc"}],
  });

  const selectedLines = products
    .map((product) => {
      const quantity = parseQuantity(formData.get(`quantity_${product.id}`));
      if (quantity <= 0) return null;

      const unitPrice = product.basePrice || 0;
      const lineTotal = quantity * unitPrice;

      return {
        product,
        quantity,
        unitPrice,
        lineTotal,
      };
    })
    .filter(Boolean) as Array<{
      product: Awaited<ReturnType<typeof prisma.product.findMany>>[number];
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;

  if (selectedLines.length === 0) {
    redirect("/admin/whatsapp-orders/new?error=no-items");
  }

  const subtotal = selectedLines.reduce((sum, line) => sum + line.lineTotal, 0);
  const totalAmount = Math.max(0, subtotal + deliveryFee + serviceFee - discountAmount);
  const orderCode = await makeOrderCode();

  const buyerName =
    matched.customer?.name ||
    buyerNameInput ||
    matched.buyerContact?.name ||
    "WhatsApp buyer";

  const buyerType =
    matched.customer?.buyerType ||
    buyerTypeInput ||
    "WhatsApp buyer";

  const sourceDraftContext = sourceDraft
    ? [
        "",
        "Source WhatsApp storefront draft:",
        `Draft ID: ${sourceDraft.id}`,
        `Draft status: ${sourceDraft.status}`,
        `Original buyer: ${sourceDraft.buyerName}`,
        `Original phone: ${sourceDraft.phone}`,
        sourceDraft.location ? `Parsed location: ${sourceDraft.location}` : "",
        sourceDraft.timing ? `Parsed timing: ${sourceDraft.timing}` : "",
        sourceDraft.message ? `Original message: ${sourceDraft.message}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const orderAdminNote = `${adminNote || "Created from WhatsApp-assisted admin order entry."}${sourceDraftContext}`;

  const order = await prisma.order.create({
    data: {
      code: orderCode,
      customerId: matched.customer?.id || null,
      buyerName,
      phone: sourcePhone,
      buyerType,
      orderType: "WhatsApp assisted",
      paymentStatus: "Payment pending",
      fulfilmentStatus: initialFulfilmentStatus(deliveryMethod, "WhatsApp order received"),
      deliveryMethod,
      deliveryNote: deliveryNote || null,
      source: "WhatsApp",
      sourcePhone,
      buyerContactId: matched.buyerContact?.id || null,
      subtotal,
      deliveryFee,
      serviceFee,
      discountAmount,
      totalAmount,
      estimatedTotal: totalAmount,
      adminNote: orderAdminNote,
      items: {
        create: selectedLines.map((line) => ({
          product: {
            connect: {id: line.product.id},
          },
          name: line.product.name,
          grade: line.product.grade || "Standard",
          unit: line.product.unit,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
        })),
      },
    },
    include: {
      items: true,
    },
  });

  const paymentReference = await makePaymentReference(order.code);

  await prisma.paymentRequest.create({
    data: {
      orderId: order.id,
      customerId: matched.customer?.id || null,
      provider: "Manual",
      reference: paymentReference,
      amount: totalAmount,
      currency: "NGN",
      status: "Pending",
    },
  });

  await prisma.order.update({
    where: {id: order.id},
    data: {
      paymentReference,
    },
  });

  await prisma.delivery.create({
    data: {
      orderId: order.id,
      customerId: matched.customer?.id || null,
      deliveryMethod,
      deliveryFee,
      deliveryAddress: deliveryAddress || null,
      deliveryArea: deliveryArea || null,
      status: "Pending assignment",
    },
  });

  if (matched.customer?.id) {
    const itemSummary = selectedLines
      .map((line) => `- ${line.product.name}: ${line.quantity} ${line.product.unit} x ${formatNaira(line.unitPrice)} = ${formatNaira(line.lineTotal)}`)
      .join("\\n");

    await prisma.buyerMessage.create({
      data: {
        customerId: matched.customer.id,
        title: `WhatsApp order ${order.code} received`,
        body: `Your WhatsApp order has been recorded.\\n\\n${itemSummary}\\n\\nSubtotal: ${formatNaira(subtotal)}\\nDelivery: ${formatNaira(deliveryFee)}\\nService fee: ${formatNaira(serviceFee)}\\nDiscount: ${formatNaira(discountAmount)}\\nTotal: ${formatNaira(totalAmount)}\\n\\nPayment reference: ${paymentReference}`,
        channel: "WhatsApp",
        direction: "Outbound",
        status: "Prepared",
        recipient: sourcePhone,
        source: "WhatsApp-assisted order",
        relatedType: "Order",
        relatedId: order.id,
      },
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/whatsapp-orders/new");
  revalidatePath("/admin/deliveries");
  revalidatePath("/admin/buyer-messages");
  revalidatePath("/buyer-account/orders");
  await markSourceDraftConverted(sourceDraftId, order.id, order.code);

  revalidatePath("/buyer-account/inbox");

  redirect(`/admin/orders/${order.id}`);
}
export async function sendWhatsAppStorefrontMenuAction(formData: FormData) {
  await requireCapability("manage_communications");
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");
  const {sendWhatsAppTextMessage} = await import("@/lib/whatsapp/provider");
  const {buildWhatsAppStorefrontMenuMessage} = await import("@/lib/whatsapp/storefrontMenu");
  const {
    matchBuyerByPhone,
    normalisePhone,
  } = await import("@/lib/commerce/whatsappOrders");

  await requireStaff();

  const recipientPhoneInput = String(formData.get("recipientPhone") || "").trim();
  const sourcePhone = normalisePhone(recipientPhoneInput);

  if (!sourcePhone) {
    redirect("/admin/whatsapp-tools?error=missing-phone");
  }

  const body = buildWhatsAppStorefrontMenuMessage();

  let result;
  try {
    result = await sendWhatsAppTextMessage({
      to: sourcePhone,
      body,
    });
  } catch (error) {
    console.error("sendWhatsAppStorefrontMenuAction failed", error);
    redirect("/admin/whatsapp-tools?error=send-failed");
  }

  const matched = await matchBuyerByPhone(sourcePhone);

  let customerId = matched.customer?.id || null;

  if (!customerId) {
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        phone: sourcePhone,
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
        phone: sourcePhone,
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
      title: "WhatsApp storefront menu sent",
      body,
      channel: "WhatsApp",
      direction: "Outbound",
      status: {in: ["Sent", "Delivered", "Read"]},
      recipient: sourcePhone,
      source: "WhatsApp storefront menu",
      relatedType: "WhatsAppStorefrontMenu",
      relatedId: null,
      sentAt: new Date(),
      metadata: JSON.stringify({
        provider: result.provider,
        messageId: result.messageId,
      }),
    },
  });

  revalidatePath("/admin/whatsapp-tools");
  revalidatePath("/admin/buyer-messages");
  revalidatePath("/admin/customers");
  revalidatePath("/buyer-account/inbox");

  redirect("/admin/whatsapp-tools?menu=sent");
}
export async function sendWhatsAppProductListAction(formData: FormData) {
  await requireCapability("manage_communications");
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");
  const {sendWhatsAppTextMessage} = await import("@/lib/whatsapp/provider");
  const {
    buildWhatsAppProductListMessage,
    isProductAvailableForWhatsApp,
  } = await import("@/lib/whatsapp/productCatalogue");
  const {
    matchBuyerByPhone,
    normalisePhone,
  } = await import("@/lib/commerce/whatsappOrders");

  await requireStaff();

  const recipientPhoneInput = String(formData.get("recipientPhone") || "").trim();
  const sourcePhone = normalisePhone(recipientPhoneInput);

  if (!sourcePhone) {
    redirect("/admin/whatsapp-tools?error=missing-phone");
  }

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
  const body = buildWhatsAppProductListMessage(availableProducts);

  let result;
  try {
    result = await sendWhatsAppTextMessage({
      to: sourcePhone,
      body,
    });
  } catch (error) {
    console.error("sendWhatsAppProductListAction failed", error);
    redirect("/admin/whatsapp-tools?error=send-failed");
  }

  const matched = await matchBuyerByPhone(sourcePhone);

  let customerId = matched.customer?.id || null;

  if (!customerId) {
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        phone: sourcePhone,
      },
      select: {
        id: true,
      },
    });

    if (existingCustomer) {
      customerId = existingCustomer.id;
    }
  }

  if (!customerId) {
    const customer = await prisma.customer.create({
      data: {
        name: "WhatsApp buyer",
        phone: sourcePhone,
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
      title: "WhatsApp product list sent",
      body,
      channel: "WhatsApp",
      direction: "Outbound",
      status: "Sent",
      recipient: sourcePhone,
      source: "WhatsApp storefront product catalogue",
      relatedType: "ProductCatalogue",
      relatedId: null,
      sentAt: new Date(),
      metadata: JSON.stringify({
        provider: result.provider,
        messageId: result.messageId,
        productCount: availableProducts.length,
      }),
    },
  });

  revalidatePath("/admin/whatsapp-tools");
  revalidatePath("/admin/buyer-messages");
  revalidatePath("/admin/customers");
  revalidatePath("/buyer-account/inbox");

  redirect("/admin/whatsapp-tools?catalogue=sent");
}
export async function updateWhatsAppDraftStatusAction(formData: FormData) {
  await requireCapability("manage_communications");
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");

  await requireStaff();

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "").trim();
  const adminNote = String(formData.get("adminNote") || "").trim();

  if (!id) {
    redirect("/admin/whatsapp-drafts?error=missing-id");
  }

  const draft = await prisma.orderRequest.findUnique({
    where: {id},
  });

  if (!draft) {
    redirect("/admin/whatsapp-drafts?error=not-found");
  }

  let existingNote = {};
  try {
    existingNote = JSON.parse(draft.adminNote || "{}");
  } catch {
    existingNote = {previousNote: draft.adminNote || ""};
  }

  await prisma.orderRequest.update({
    where: {id},
    data: {
      status: status || draft.status,
      adminNote: JSON.stringify({
        ...existingNote,
        staffReviewStatus: status || draft.status,
        staffNote: adminNote || existingNote.staffNote || null,
        reviewedAt: new Date().toISOString(),
      }),
    },
  });

  revalidatePath("/admin/whatsapp-drafts");
  revalidatePath("/admin/order-requests");
  revalidatePath("/admin/whatsapp-inbox");

  redirect("/admin/whatsapp-drafts?updated=1");
}
export async function sendPaymentRequestWhatsAppAction(formData: FormData) {
  await requireCapability("manage_payments");
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");
  const {normaliseWhatsAppPhone, sendWhatsAppPaymentTemplate, WhatsAppProviderError} = await import("@/lib/whatsapp/provider");
  const {buildPaymentInstructionMessage} = await import("@/lib/communications/paymentTemplates");

  await requireStaff();

  const id = String(formData.get("id") || "");

  if (!id) {
    redirect("/admin/payment-requests?error=missing-id");
  }

  const paymentRequest = await prisma.paymentRequest.findUnique({
    where: {id},
    include: {
      order: true,
      customer: true,
    },
  });

  if (!paymentRequest) {
    redirect("/admin/payment-requests?error=not-found");
  }

  const alreadySent = await prisma.buyerMessage.findFirst({
    where: {
      relatedType: "PaymentRequest",
      relatedId: paymentRequest.id,
      channel: "WhatsApp",
      direction: "Outbound",
      source: "WhatsApp API",
      status: "Sent",
    },
    select: {id: true},
  });

  if (alreadySent) {
    redirect("/admin/payment-requests?whatsapp=already-sent");
  }

  const body = buildPaymentInstructionMessage({
    orderCode: paymentRequest.order.code,
    buyerName: paymentRequest.customer?.name || paymentRequest.order.buyerName,
    amount: paymentRequest.amount,
    currency: paymentRequest.currency,
    reference: paymentRequest.reference,
    provider: paymentRequest.provider,
    paymentUrl: paymentRequest.paymentUrl,
    bankName: paymentRequest.bankName,
    accountNumber: paymentRequest.accountNumber,
    accountName: paymentRequest.accountName,
  });

  const recipient = paymentRequest.customer?.phone || paymentRequest.order.phone;
  let normalizedRecipient: string;
  try {
    normalizedRecipient = normaliseWhatsAppPhone(recipient);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "WhatsApp recipient phone is invalid.";
    redirect(`/admin/payment-requests?error=whatsapp-recipient&detail=${encodeURIComponent(detail)}`);
  }

  let customerId = paymentRequest.customerId || paymentRequest.order.customerId || null;
  if (!customerId) {
    const existingCustomer = await prisma.customer.findFirst({where: {phone: recipient}});
    const customer = existingCustomer || await prisma.customer.create({data: {
      name: paymentRequest.order.buyerName || "WhatsApp buyer",
      phone: recipient,
      email: paymentRequest.customer?.email || null,
      buyerType: paymentRequest.order.buyerType || "WhatsApp buyer",
      location: paymentRequest.order.deliveryNote || null,
      accountStatus: "Manual WhatsApp",
      status: "Active",
    }});
    customerId = customer.id;
    await prisma.order.update({where: {id: paymentRequest.orderId}, data: {customerId}});
    await prisma.paymentRequest.update({where: {id: paymentRequest.id}, data: {customerId}});
  }

  const messageLog = await prisma.buyerMessage.create({data: {
    customerId,
    title: `WhatsApp payment request for ${paymentRequest.order.code}`,
    body,
    channel: "WhatsApp",
    direction: "Outbound",
    status: "Pending",
    recipient: normalizedRecipient,
    source: "WhatsApp API",
    relatedType: "PaymentRequest",
    relatedId: paymentRequest.id,
    metadata: JSON.stringify({provider: "Meta WhatsApp Cloud API", attemptedAt: new Date().toISOString(), normalizedRecipient, paymentUrl: paymentRequest.paymentUrl}),
  }});

  try {
    if (!paymentRequest.paymentUrl) throw new Error("Create a valid checkout link before sending the WhatsApp payment notification.");
    const result = await sendWhatsAppPaymentTemplate({
      to: recipient,
      buyerName: paymentRequest.customer?.name || paymentRequest.order.buyerName || "Customer",
      orderCode: paymentRequest.order.code,
      amount: new Intl.NumberFormat("en-NG", {style: "currency", currency: paymentRequest.currency || "NGN", maximumFractionDigits: 0}).format(paymentRequest.amount),
      reference: paymentRequest.reference,
      paymentUrl: paymentRequest.paymentUrl,
    });
    await prisma.buyerMessage.update({where: {id: messageLog.id}, data: {status: "Sent", sentAt: new Date(), metadata: JSON.stringify({provider: result.provider, messageId: result.messageId, metaHttpStatus: result.httpStatus, normalizedRecipient: result.normalizedTo, messageType: result.messageType, paymentUrl: paymentRequest.paymentUrl})}});

    revalidatePath("/admin/payment-requests");
    revalidatePath(`/admin/orders/${paymentRequest.orderId}`);
    revalidatePath("/admin/buyer-messages");
    revalidatePath("/buyer-account/inbox");
  } catch (error) {
    const message = error instanceof Error ? error.message : "WhatsApp send failed.";
    const details = error instanceof WhatsAppProviderError ? error.details : {};
    await prisma.buyerMessage.update({where: {id: messageLog.id}, data: {status: "Failed", metadata: JSON.stringify({provider: "Meta WhatsApp Cloud API", normalizedRecipient, paymentUrl: paymentRequest.paymentUrl, error: message, ...details})}});
    revalidatePath("/admin/payment-requests");
    redirect(`/admin/payment-requests?error=whatsapp-failed&detail=${encodeURIComponent(message).slice(0, 220)}`);
  }

  redirect("/admin/payment-requests?whatsapp=accepted");
}
