/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- carried over from createAdminRecords.ts during the module split; see git
// history for context. Removing this needs a dedicated type-safety pass.
"use server";

import {createAuditLog} from "@/lib/auditLog";
import {requireCapability} from "@/lib/auth";
import {getEmailBaseUrl, sendTransactionalEmail} from "@/lib/email/service";
import {emailTemplates} from "@/lib/email/templates";
import {isPickupMethod} from "@/lib/orderStatusRules.js";
import {isLoginRateLimited, loginFingerprint, randomAccessCode, recordLoginAttempt} from "@/lib/loginRateLimit.js";
import {recordOperationalEvent} from "@/lib/operationalEvents";

export async function createDeliveryPartnerAction(formData: FormData) {
  await requireCapability("manage_delivery_partners");
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");

  await requireStaff();

  const name = String(formData.get("name") || "").trim();
  const contactName = String(formData.get("contactName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const serviceArea = String(formData.get("serviceArea") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!name) {
    redirect("/admin/delivery-partners?error=missing-name");
  }

  // Generate the access code immediately instead of requiring a separate
  // "generate access code" step for the common case of onboarding a driver
  // who's ready to start right away.
  const partner = await prisma.deliveryPartner.create({
    data: {
      name,
      contactName: contactName || null,
      phone: phone || null,
      email: email || null,
      serviceArea: serviceArea || null,
      notes: notes || null,
      status: "Active",
      accessCode: `DP-${randomAccessCode(8)}`,
      accessStatus: "Active",
    },
  });

  await createAuditLog({
    action: "Created delivery partner with access code",
    entityType: "DeliveryPartner",
    entityId: partner.id,
    entityLabel: partner.name,
  });

  revalidatePath("/admin/delivery-partners");
  redirect(`/admin/delivery-partners?created=1&reveal=${partner.id}`);
}
export async function updateDeliveryPartnerStatusAction(formData: FormData) {
  await requireCapability("manage_delivery_partners");
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");

  await requireStaff();

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "Active");

  if (!id) {
    redirect("/admin/delivery-partners");
  }

  await prisma.deliveryPartner.update({
    where: {id},
    data: {status},
  });

  revalidatePath("/admin/delivery-partners");
  redirect("/admin/delivery-partners?updated=1");
}
export async function generateDeliveryPartnerAccessCodeAction(formData: FormData) {
  await requireCapability("manage_delivery_access");
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");

  await requireStaff();

  const id = String(formData.get("id") || "");
  if (!id) {
    redirect("/admin/delivery-partners");
  }

  const accessCode = `DP-${randomAccessCode(8)}`;

  await prisma.deliveryPartner.update({
    where: {id},
    data: {
      accessCode,
      accessStatus: "Active",
    },
  });

  revalidatePath("/admin/delivery-partners");
  redirect(`/admin/delivery-partners?access=created&reveal=${id}`);
}
export async function sendDeliveryPartnerAccessCodeAction(formData: FormData) {
  await requireCapability("manage_delivery_access");
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");
  const {normaliseWhatsAppPhone, sendWhatsAppDriverInviteTemplate, WhatsAppProviderError} = await import("@/lib/whatsapp/provider");

  await requireStaff();

  const id = String(formData.get("id") || "");
  if (!id) {
    redirect("/admin/delivery-partners?error=missing-id");
  }

  const partner = await prisma.deliveryPartner.findUnique({where: {id}});

  if (!partner) {
    redirect("/admin/delivery-partners?error=not-found");
  }

  if (!partner.accessCode) {
    redirect("/admin/delivery-partners?error=missing-access-code");
  }

  if (!partner.phone) {
    redirect("/admin/delivery-partners?error=missing-phone");
  }

  let normalizedRecipient: string;
  try {
    normalizedRecipient = normaliseWhatsAppPhone(partner.phone);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "WhatsApp recipient phone is invalid.";
    redirect(`/admin/delivery-partners?error=whatsapp-recipient&detail=${encodeURIComponent(detail)}`);
  }

  const loginUrl = `${getEmailBaseUrl()}/delivery-partner/login`;

  try {
    const result = await sendWhatsAppDriverInviteTemplate({
      to: partner.phone,
      driverName: partner.name,
      accessCode: partner.accessCode,
      loginUrl,
    });

    await prisma.buyerMessage.create({
      data: {
        customerId: null,
        title: `Delivery partner access code sent to ${partner.name}`,
        body: `A driver access code was sent securely to ${normalizedRecipient}.`,
        channel: "WhatsApp",
        direction: "Outbound",
        status: "Sent",
        recipient: normalizedRecipient,
        source: "WhatsApp API",
        relatedType: "DeliveryPartner",
        relatedId: partner.id,
        sentAt: new Date(),
        metadata: JSON.stringify({provider: result.provider, messageId: result.messageId}),
      },
    });

    await createAuditLog({
      action: "Sent delivery partner access code by WhatsApp",
      entityType: "DeliveryPartner",
      entityId: partner.id,
      entityLabel: `${partner.name} · ${normalizedRecipient}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "WhatsApp send failed.";
    const details = error instanceof WhatsAppProviderError ? error.details : {};
    await recordOperationalEvent({
      category: "Delivery partner onboarding",
      severity: "Warning",
      summary: `Delivery partner access code send failed for ${partner.name}.`,
      route: "/admin/delivery-partners",
      relatedType: "DeliveryPartner",
      relatedId: partner.id,
      metadata: {error: message, ...details},
    });
    redirect(`/admin/delivery-partners?error=whatsapp-failed&detail=${encodeURIComponent(message).slice(0, 220)}`);
  }

  revalidatePath("/admin/delivery-partners");
  revalidatePath("/admin/buyer-messages");
  redirect(`/admin/delivery-partners?whatsapp=sent&reveal=${id}`);
}
export async function deliveryPartnerLoginAction(formData: FormData) {
  const {redirect} = await import("next/navigation");
  const {headers} = await import("next/headers");
  const {prisma} = await import("@/lib/prisma");
  const {setDeliveryPartnerSession} = await import("@/lib/currentDeliveryPartner");

  const accessCode = String(formData.get("accessCode") || "").trim().toUpperCase();
  const requestHeaders = await headers();
  const ipAddress =
    requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const fingerprint = loginFingerprint("delivery-partner", accessCode, ipAddress, process.env.SESSION_SECRET);

  if (!accessCode) {
    redirect("/delivery-partner/login?error=missing-code");
  }

  if (
    await isLoginRateLimited({
      db: prisma,
      action: "Rejected delivery partner login",
      fingerprint,
    })
  ) {
    await recordLoginAttempt({db: prisma, action: "Rate limited delivery partner login", fingerprint});
    redirect("/delivery-partner/login?error=too-many-attempts");
  }

  const partner = await prisma.deliveryPartner.findFirst({
    where: {
      accessCode,
      status: "Active",
      accessStatus: "Active",
    },
  });

  if (!partner) {
    await recordLoginAttempt({db: prisma, action: "Rejected delivery partner login", fingerprint});
    redirect("/delivery-partner/login?error=invalid-code");
  }

  await prisma.deliveryPartner.update({
    where: {id: partner.id},
    data: {lastLoginAt: new Date()},
  });

  await recordLoginAttempt({
    db: prisma,
    action: "Completed delivery partner login",
    fingerprint,
    actorName: partner.name,
    entityId: partner.id,
  });
  await setDeliveryPartnerSession(partner.id);
  redirect("/delivery-partner/jobs");
}
export async function deliveryPartnerLogoutAction() {
  const {redirect} = await import("next/navigation");
  const {clearDeliveryPartnerSession} = await import("@/lib/currentDeliveryPartner");

  await clearDeliveryPartnerSession();
  redirect("/delivery-partner/login");
}
export async function updateDeliveryJobStatusAction(formData: FormData) {
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {prisma} = await import("@/lib/prisma");
  const {getCurrentDeliveryPartner} = await import("@/lib/currentDeliveryPartner");

  const partner = await getCurrentDeliveryPartner();

  if (!partner) {
    redirect("/delivery-partner/login");
  }

  const deliveryId = String(formData.get("deliveryId") || "");
  const status = String(formData.get("status") || "Accepted");
  const proofOfDeliveryNote = String(formData.get("proofOfDeliveryNote") || "").trim();

  if (!deliveryId) {
    redirect("/delivery-partner/jobs");
  }

  const delivery = await prisma.delivery.findFirst({
    where: {
      id: deliveryId,
      deliveryPartnerId: partner.id,
    },
    select: {
      id: true,
      orderId: true,
      customerId: true,
      customer: {select: {name: true, email: true}},
    },
  });

  if (!delivery) {
    redirect("/delivery-partner/jobs?error=not-found");
  }

  const updatedDelivery = await prisma.delivery.update({
    where: {id: delivery.id},
    data: {
      status,
      proofOfDeliveryNote: proofOfDeliveryNote || undefined,
      deliveredAt: status === "Delivered" ? new Date() : undefined,
    },
  });

  const fulfilmentStatus =
    status === "Delivered"
      ? "Delivered"
      : status === "In transit"
        ? "Out for delivery"
        : status === "Picked up"
          ? "Picked up by delivery partner"
          : status === "Failed / issue"
            ? "Delivery issue"
            : "Delivery assigned";

  await prisma.order.update({
    where: {id: delivery.orderId},
    data: {fulfilmentStatus},
  });

  if (delivery.customerId) {
    await prisma.buyerMessage.create({
      data: {
        customerId: delivery.customerId,
        title: `Delivery update: ${status}`,
        body: proofOfDeliveryNote
          ? `Your delivery status is now ${status}. Note: ${proofOfDeliveryNote}`
          : `Your delivery status is now ${status}.`,
        channel: "Portal",
        direction: "Outbound",
        status: "Unread",
        source: "Delivery partner update",
        relatedType: "Delivery",
        relatedId: delivery.id,
      },
    });

    if (delivery.customer?.email) {
      await sendTransactionalEmail({deduplicationKey: `delivery-status:${delivery.id}:${status}`, template: "delivery-status", to: delivery.customer.email, content: emailTemplates.deliveryStatus(delivery.customer.name, status, getEmailBaseUrl()), relatedType: "Delivery", relatedId: delivery.id});
    }
  }

  await createAuditLog({
    action: "Updated delivery status",
    entityType: "Delivery",
    entityId: delivery.id,
    entityLabel: status,
    newValue: updatedDelivery,
    actorName: partner.name,
    actorRole: "Delivery partner",
  });

  revalidatePath("/delivery-partner/jobs");
  revalidatePath("/admin/deliveries");
  revalidatePath(`/admin/orders/${delivery.orderId}`);
  redirect("/delivery-partner/jobs?updated=1");
}
export async function assignDeliveryPartnerAction(formData: FormData) {
  await requireCapability("manage_fulfilment");
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");

  await requireStaff();

  const deliveryId = String(formData.get("deliveryId") || "");
  const deliveryPartnerId = String(formData.get("deliveryPartnerId") || "");
  const status = String(formData.get("status") || "Assigned");
  const deliveryFeeRaw = String(formData.get("deliveryFee") || "").replace(/[^\d]/g, "");
  const deliveryFee = deliveryFeeRaw ? Number.parseInt(deliveryFeeRaw, 10) : 0;
  const deliveryArea = String(formData.get("deliveryArea") || "").trim();
  const deliveryAddress = String(formData.get("deliveryAddress") || "").trim();
  const trackingReference = String(formData.get("trackingReference") || "").trim();
  const proofOfDeliveryNote = String(formData.get("proofOfDeliveryNote") || "").trim();

  if (!deliveryId) {
    redirect("/admin/deliveries?error=missing-delivery");
  }

  const partner = deliveryPartnerId
    ? await prisma.deliveryPartner.findUnique({
        where: {id: deliveryPartnerId},
        select: {id: true, name: true, phone: true},
      })
    : null;

  const delivery = await prisma.delivery.update({
    where: {id: deliveryId},
    data: {
      deliveryPartnerId: partner?.id || null,
      deliveryPartnerName: partner?.name || null,
      deliveryPartnerPhone: partner?.phone || null,
      deliveryFee,
      deliveryArea: deliveryArea || null,
      deliveryAddress: deliveryAddress || null,
      trackingReference: trackingReference || null,
      proofOfDeliveryNote: proofOfDeliveryNote || null,
      status,
    },
    select: {
      id: true,
      orderId: true,
      order: {
        select: {
          totalAmount: true,
          subtotal: true,
          serviceFee: true,
          discountAmount: true,
        },
      },
    },
  });

  const fulfilmentStatus = partner ? "Delivery assigned" : "Delivery pending assignment";
  const totalAmount = Math.max(
    0,
    (delivery.order.subtotal || 0) + deliveryFee + (delivery.order.serviceFee || 0) - (delivery.order.discountAmount || 0)
  );

  await prisma.order.update({
    where: {id: delivery.orderId},
    data: {
      fulfilmentStatus,
      deliveryFee,
      totalAmount,
      estimatedTotal: totalAmount,
    },
  });

  revalidatePath("/admin/deliveries");
  revalidatePath(`/admin/orders/${delivery.orderId}`);
  revalidatePath("/delivery-partner/jobs");
  redirect("/admin/deliveries?assigned=1");
}
export async function createOrAssignDeliveryFromOrderAction(formData: FormData) {
  await requireCapability("manage_fulfilment");
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");

  await requireStaff();

  const orderId = String(formData.get("orderId") || "");
  const deliveryPartnerId = String(formData.get("deliveryPartnerId") || "").trim();
  const deliveryMethod =
    String(formData.get("deliveryMethod") || "OneFarmTech arranged").trim() ||
    "OneFarmTech arranged";
  const deliveryArea = String(formData.get("deliveryArea") || "").trim();
  const deliveryAddress = String(formData.get("deliveryAddress") || "").trim();
  const deliveryFeeInput = String(formData.get("deliveryFee") || "").replace(/[^\d]/g, "");
  const trackingReference = String(formData.get("trackingReference") || "").trim();
  const status = String(formData.get("status") || "").trim();

  if (!orderId) {
    redirect("/admin/orders?error=missing-order");
  }

  const order = await prisma.order.findUnique({
    where: {id: orderId},
    include: {
      delivery: true,
    },
  });

  if (!order) {
    redirect("/admin/orders?error=order-not-found");
  }

  if (isPickupMethod(order.deliveryMethod) || isPickupMethod(deliveryMethod)) {
    redirect(`/admin/orders/${order.id}?error=pickup-does-not-use-delivery-assignment`);
  }

  const partner = deliveryPartnerId
    ? await prisma.deliveryPartner.findUnique({
        where: {id: deliveryPartnerId},
      })
    : null;

  const existingDeliveryFee =
    typeof order.delivery?.deliveryFee === "number" ? order.delivery.deliveryFee : 0;

  const deliveryFee =
    deliveryFeeInput.length > 0
      ? Number(deliveryFeeInput)
      : existingDeliveryFee || order.deliveryFee || 0;

  const nextStatus =
    status ||
    (partner ? "Assigned" : order.delivery?.status || "Pending assignment");

  const delivery = await prisma.delivery.upsert({
    where: {orderId: order.id},
    create: {
      orderId: order.id,
      customerId: order.customerId || null,
      deliveryPartnerId: partner?.id || null,
      deliveryPartnerName: partner?.name || null,
      deliveryPartnerPhone: partner?.phone || null,
      deliveryMethod,
      deliveryFee,
      deliveryArea: deliveryArea || null,
      deliveryAddress: deliveryAddress || order.deliveryNote || null,
      trackingReference: trackingReference || null,
      status: nextStatus,
    },
    update: {
      deliveryPartnerId: partner?.id || order.delivery?.deliveryPartnerId || null,
      deliveryPartnerName: partner?.name || order.delivery?.deliveryPartnerName || null,
      deliveryPartnerPhone: partner?.phone || order.delivery?.deliveryPartnerPhone || null,
      deliveryMethod,
      deliveryFee,
      deliveryArea: deliveryArea || order.delivery?.deliveryArea || null,
      deliveryAddress: deliveryAddress || order.delivery?.deliveryAddress || order.deliveryNote || null,
      trackingReference: trackingReference || order.delivery?.trackingReference || null,
      status: nextStatus,
    },
  });

  await prisma.order.update({
    where: {id: order.id},
    data: {
      deliveryMethod,
      deliveryFee,
      deliveryNote: deliveryAddress || order.deliveryNote || null,
      fulfilmentStatus: partner ? "Delivery assigned" : order.fulfilmentStatus,
    },
  });

  if (order.customerId && partner) {
    await prisma.buyerMessage.create({
      data: {
        customerId: order.customerId,
        title: `Delivery assigned for ${order.code}`,
        body: `Delivery has been assigned for order ${order.code}.\\n\\nDelivery partner: ${partner.name}\\nPhone: ${partner.phone || "Not set"}\\nArea: ${delivery.deliveryArea || "Not set"}\\nTracking: ${delivery.trackingReference || "Not set"}`,
        channel: "Portal",
        direction: "Outbound",
        status: "Unread",
        recipient: order.phone,
        source: "Delivery assigned",
        relatedType: "Delivery",
        relatedId: delivery.id,
      },
    });
  }

  revalidatePath("/admin/deliveries");
  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath("/delivery-partner/jobs");
  revalidatePath("/buyer-account/orders");
  revalidatePath(`/buyer-account/orders/${order.id}`);
  revalidatePath("/buyer-account/inbox");

  redirect(`/admin/orders/${order.id}?delivery=updated`);
}
