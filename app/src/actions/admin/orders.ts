/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- carried over from createAdminRecords.ts during the module split; see git
// history for context. Removing this needs a dedicated type-safety pass.
"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireBuyerCapability} from "@/lib/currentBuyer";
import {prisma} from "@/lib/prisma";
import {createAuditLog} from "@/lib/auditLog";
import {requireCapability} from "@/lib/auth";
import {getEmailBaseUrl, sendAdminTransactionalEmail, sendTransactionalEmail} from "@/lib/email/service";
import {emailTemplates} from "@/lib/email/templates";
import {OrderRequestConversionError, convertOrderRequestIntegrity} from "@/lib/orderRequestConversion.js";
import {validateOrderStatusTransition} from "@/lib/orderStatusRules.js";
import {protectPublicIntake, PublicIntakeError} from "@/lib/publicIntakeProtection";
import {readText, readBoolean} from "./shared";

export async function createOrderRequestAction(formData: FormData) {
  const buyerName = readText(formData, "buyerName");
  const buyerType = readText(formData, "buyerType", "Household / individual");
  const phone = readText(formData, "phone");
  const email = readText(formData, "email");
  const location = readText(formData, "location");
  const deliveryPreference = readText(formData, "deliveryPreference", "Delivery");
  const items = readText(formData, "items");
  const timing = readText(formData, "timing");
  const groupBuyInterest = readBoolean(formData, "groupBuyInterest");
  const message = readText(formData, "message");

  if (!buyerName || !phone || !items) {
    throw new Error("Buyer name, phone, and items are required.");
  }

  try {
    await protectPublicIntake({formType: "order-request", action: "order_request", token: readText(formData, "cf-turnstile-response"), honeypot: readText(formData, "website"), values: [buyerName, buyerType, phone, email, location, deliveryPreference, items, timing, groupBuyInterest, message]});
  } catch (error) {
    const code = error instanceof PublicIntakeError ? error.code : "bot-check";
    redirect(`/order-request?intakeError=${encodeURIComponent(code)}`);
  }

  const orderRequest = await prisma.orderRequest.create({
    data: {
      buyerName,
      buyerType,
      phone,
      email: email || null,
      location: location || null,
      deliveryPreference,
      items,
      timing: timing || null,
      groupBuyInterest,
      message: message || null,
      status: "New",
      source: "Order request page",
    },
  });

  await createAuditLog({
    action: "Created order request",
    entityType: "OrderRequest",
    entityId: orderRequest.id,
    entityLabel: `${orderRequest.buyerName} · ${orderRequest.buyerType}`,
    newValue: orderRequest,
  });

  if (orderRequest.email) {
    await sendTransactionalEmail({deduplicationKey: `order-request-ack:${orderRequest.id}`, template: "order-request-acknowledgement", to: orderRequest.email, content: emailTemplates.orderRequestAcknowledgement(orderRequest.buyerName), relatedType: "OrderRequest", relatedId: orderRequest.id});
  }
  await sendAdminTransactionalEmail({deduplicationKeyPrefix: `order-request-admin:${orderRequest.id}`, template: "order-request-admin", content: emailTemplates.orderRequestAdmin(orderRequest.buyerName, orderRequest.items, getEmailBaseUrl()), relatedType: "OrderRequest", relatedId: orderRequest.id});

  revalidatePath("/order-request");
  revalidatePath("/admin/order-requests");
  revalidatePath("/admin/audit-log");
  redirect("/order-request?submitted=1");
}
export async function updateOrderRequestStatusAction(formData: FormData) {
  const staff = await requireCapability("manage_orders");
  const requestId = readText(formData, "requestId");
  const status = readText(formData, "status");

  if (!requestId || !status) {
    throw new Error("Request ID and status are required.");
  }

  if (status === "Converted to order") {
    let convertedOrderId = "";
    try {
      const result = await convertOrderRequestIntegrity({db: prisma, requestId, actor: staff});
      convertedOrderId = result.order.id;
    } catch (error) {
      const code = error instanceof OrderRequestConversionError ? error.code : "conversion-failed";
      redirect(`/admin/order-requests?conversionError=${encodeURIComponent(code)}`);
    }
    revalidatePath("/admin/launch-inbox");
    revalidatePath("/admin/order-requests");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/audit-log");
    redirect(`/admin/orders/${convertedOrderId}`);
  }

  const updated = await prisma.orderRequest.update({
    where: {id: requestId},
    data: {status},
  });

  await createAuditLog({
    action: "Updated order request status",
    entityType: "OrderRequest",
    entityId: updated.id,
    entityLabel: `${updated.buyerName} · ${updated.buyerType}`,
    newValue: {status: updated.status},
  });

  revalidatePath("/admin/order-requests");
  revalidatePath("/admin/audit-log");
}
async function makeOrderCode() {
  const count = await prisma.order.count();

  return `OFT-${String(count + 1).padStart(5, "0")}`;
}
export async function createBuyerPortalOrderAction(formData: FormData) {
  const {customer} = await requireBuyerCapability("canPlaceOrders");

  const items = readText(formData, "items");
  const deliveryPreference = readText(formData, "deliveryPreference", "Delivery");
  const timing = readText(formData, "timing");
  const groupBuyInterest = readBoolean(formData, "groupBuyInterest");
  const message = readText(formData, "message");

  if (!items) {
    throw new Error("Items and quantities are required.");
  }

  const order = await prisma.order.create({
    data: {
      code: await makeOrderCode(),
      customerId: customer.id,
      buyerName: customer.name,
      phone: customer.phone,
      buyerType: customer.buyerType,
      orderType: "Buyer portal request",
      paymentStatus: "Pending confirmation",
      fulfilmentStatus: "Buyer request",
      deliveryMethod: deliveryPreference,
      deliveryNote: [
        timing ? `Timing: ${timing}` : null,
        groupBuyInterest ? "Open to group-buy if useful." : null,
        message || null,
        `Requested items: ${items}`,
      ]
        .filter(Boolean)
        .join("\n"),
      estimatedTotal: 0,
      adminNote: "Created from buyer account portal. Admin should confirm availability, pricing, delivery plan and payment step.",
      items: {
        create: {
          name: "Buyer requested items",
          grade: "To confirm",
          quantity: 1,
          unit: "Request",
          unitPrice: 0,
          lineTotal: 0,
        },
      },
    },
  });

  await createAuditLog({
    action: "Created buyer portal order",
    entityType: "Order",
    entityId: order.id,
    entityLabel: order.code,
    newValue: {
      order,
      requestedItems: items,
      timing,
      groupBuyInterest,
      message,
    },
    actorRole: "Buyer portal",
  });

  await prisma.buyerMessage.create({
    data: {
      customerId: customer.id,
      title: "Order request received",
      body: `Your buyer order request ${order.code} has been received. The team will confirm availability, pricing, payment and fulfilment.`,
      channel: "Portal",
      direction: "Outbound",
      status: "Logged",
      recipient: customer.email || customer.phone,
      source: "Buyer portal",
      relatedType: "Order",
      relatedId: order.id,
    },
  });

  revalidatePath("/buyer-account");
  revalidatePath("/buyer-account/inbox");
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/admin/audit-log");
  redirect("/buyer-account?orderSubmitted=1");
}
export async function updateAdminOrderControlAction(formData: FormData) {
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");

  await requireStaff();

  const orderId = String(formData.get("orderId") || "");
  const paymentStatus = String(formData.get("paymentStatus") || "").trim();
  const fulfilmentStatus = String(formData.get("fulfilmentStatus") || "").trim();
  const adminNote = String(formData.get("adminNote") || "").trim();
  const deliveryNote = String(formData.get("deliveryNote") || "").trim();

  if (!orderId) {
    redirect("/admin/orders?error=missing-order");
  }

  const existingOrder = await prisma.order.findUnique({where: {id: orderId}, select: {deliveryMethod: true, paymentStatus: true, fulfilmentStatus: true}});
  if (!existingOrder) redirect("/admin/orders?error=order-not-found");
  if (paymentStatus && paymentStatus !== existingOrder.paymentStatus) await requireCapability("manage_payments");
  if (fulfilmentStatus && fulfilmentStatus !== existingOrder.fulfilmentStatus) await requireCapability("manage_fulfilment");
  if (!paymentStatus && !fulfilmentStatus) await requireCapability("manage_orders");
  const transitionError = validateOrderStatusTransition({deliveryMethod: existingOrder.deliveryMethod, currentPaymentStatus: existingOrder.paymentStatus, nextPaymentStatus: paymentStatus || existingOrder.paymentStatus, currentFulfilmentStatus: existingOrder.fulfilmentStatus, nextFulfilmentStatus: fulfilmentStatus || existingOrder.fulfilmentStatus});
  if (transitionError) redirect(`/admin/orders/${orderId}?error=${transitionError}`);

  await prisma.order.update({
    where: {id: orderId},
    data: {
      paymentStatus: paymentStatus || undefined,
      fulfilmentStatus: fulfilmentStatus || undefined,
      adminNote: adminNote || null,
      deliveryNote: deliveryNote || null,
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/payment-requests");
  revalidatePath("/admin/deliveries");
  revalidatePath("/buyer-account/orders");
  revalidatePath(`/buyer-account/orders/${orderId}`);

  redirect(`/admin/orders/${orderId}?updated=1`);
}
export async function linkOrderToCustomerAction(formData: FormData) {
  await requireCapability("manage_orders");
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");
  const {normalisePhone} = await import("@/lib/commerce/whatsappOrders");

  await requireStaff();

  const orderId = String(formData.get("orderId") || "");
  const customerId = String(formData.get("customerId") || "");
  const createBuyerContact = String(formData.get("createBuyerContact") || "") === "on";

  if (!orderId) {
    redirect("/admin/orders?error=missing-order");
  }

  if (!customerId) {
    redirect(`/admin/orders/${orderId}?error=missing-customer`);
  }

  const [order, customer] = await Promise.all([
    prisma.order.findUnique({
      where: {id: orderId},
    }),
    prisma.customer.findUnique({
      where: {id: customerId},
    }),
  ]);

  if (!order || !customer) {
    redirect(`/admin/orders/${orderId}?error=link-not-found`);
  }

  const phone = normalisePhone(order.sourcePhone || order.phone);

  await prisma.order.update({
    where: {id: order.id},
    data: {
      customerId: customer.id,
      buyerName: customer.name,
      buyerType: customer.buyerType || order.buyerType,
      phone: phone || order.phone,
      sourcePhone: phone || order.sourcePhone,
      adminNote: [
        order.adminNote || "",
        `Linked to buyer account ${customer.name} from admin order detail.`,
      ]
        .filter(Boolean)
        .join("\\n"),
    },
  });

  if (createBuyerContact && phone) {
    const existingContact = await prisma.buyerContact.findFirst({
      where: {
        customerId: customer.id,
        OR: [
          {phone},
          {phone: phone},
          {phone: phone.replace(/[^\\d]/g, "")},
        ],
      },
    });

    if (!existingContact) {
      await prisma.buyerContact.create({
        data: {
          customerId: customer.id,
          name: order.buyerName || customer.name,
          email: null,
          phone,
          phone: phone,
          role: "WhatsApp ordering contact",
          status: "Active",
        },
      });
    }
  }

  await prisma.paymentRequest.updateMany({
    where: {orderId: order.id},
    data: {customerId: customer.id},
  });

  await prisma.receipt.updateMany({
    where: {orderId: order.id},
    data: {customerId: customer.id},
  });

  await prisma.delivery.updateMany({
    where: {orderId: order.id},
    data: {customerId: customer.id},
  });

  await prisma.buyerMessage.create({
    data: {
      customerId: customer.id,
      title: `Order ${order.code} linked to your account`,
      body: `Order ${order.code} has been linked to your OneFarmTech buyer account. You can now view the order, payment and delivery status in your portal.`,
      channel: "Portal",
      direction: "Outbound",
      status: "Unread",
      recipient: phone || order.phone,
      source: "Order linked to buyer account",
      relatedType: "Order",
      relatedId: order.id,
    },
  });

  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/buyer-messages");
  revalidatePath("/buyer-account/orders");
  revalidatePath(`/buyer-account/orders/${order.id}`);
  revalidatePath("/buyer-account/inbox");

  redirect(`/admin/orders/${order.id}?linked=1`);
}
export async function logOrderBuyerMessageAction(formData: FormData) {
  await requireCapability("manage_communications");
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");

  await requireStaff();

  const orderId = String(formData.get("orderId") || "");
  const customerId = String(formData.get("customerId") || "");
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const channel = String(formData.get("channel") || "Portal").trim();

  if (!orderId) {
    redirect("/admin/orders?error=missing-order");
  }

  if (!customerId || !title || !body) {
    redirect(`/admin/orders/${orderId}?error=message-required`);
  }

  const order = await prisma.order.findUnique({
    where: {id: orderId},
    select: {
      id: true,
      phone: true,
    },
  });

  await prisma.buyerMessage.create({
    data: {
      customerId,
      title,
      body,
      channel,
      direction: "Outbound",
      status: "Unread",
      recipient: order?.phone || null,
      source: "Admin order detail",
      relatedType: "Order",
      relatedId: orderId,
    },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/buyer-messages");
  revalidatePath("/buyer-account/inbox");

  redirect(`/admin/orders/${orderId}?message=logged`);
}
