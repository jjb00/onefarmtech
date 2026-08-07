import {prisma} from "@/lib/prisma";
import {createAuditLog} from "@/lib/auditLog";
import {getEmailBaseUrl, sendTransactionalEmail} from "@/lib/email/service";
import {emailTemplates} from "@/lib/email/templates";
import {sendWhatsAppTextMessage} from "@/lib/whatsapp/provider";

export type DeliveryJobStatus = "Out for delivery" | "Delivered" | "Failed / issue";

export class DeliveryStatusError extends Error {
  code: "not-found";
  constructor(code: "not-found") {
    super(code);
    this.code = code;
  }
}

// Shared by the delivery-partner web portal form and the WhatsApp driver
// flow, so a status update looks identical to the buyer no matter which
// channel the driver used to send it.
export async function applyDeliveryStatusUpdate(input: {
  deliveryId: string;
  partnerId: string;
  status: DeliveryJobStatus;
  proofOfDeliveryNote?: string;
  actorName: string;
}) {
  const proofOfDeliveryNote = (input.proofOfDeliveryNote || "").trim();

  const delivery = await prisma.delivery.findFirst({
    where: {id: input.deliveryId, deliveryPartnerId: input.partnerId},
    select: {
      id: true,
      orderId: true,
      customerId: true,
      customer: {select: {name: true, email: true}},
      order: {select: {code: true, phone: true, sourcePhone: true, fulfilmentStatus: true}},
    },
  });

  if (!delivery) throw new DeliveryStatusError("not-found");

  const updatedDelivery = await prisma.delivery.update({
    where: {id: delivery.id},
    data: {
      status: input.status,
      proofOfDeliveryNote: proofOfDeliveryNote || undefined,
      deliveredAt: input.status === "Delivered" ? new Date() : undefined,
    },
  });

  // Just two buyer-facing outcomes once a driver is on the job: delivered,
  // or an issue. Everything in between is "Out for delivery" already.
  const fulfilmentStatus =
    input.status === "Delivered"
      ? "Delivered"
      : input.status === "Failed / issue"
        ? "Delivery issue"
        : "Out for delivery";
  const fulfilmentChanged = fulfilmentStatus !== delivery.order.fulfilmentStatus;

  await prisma.order.update({
    where: {id: delivery.orderId},
    data: {fulfilmentStatus},
  });

  if (fulfilmentChanged) {
    const recipientPhone = delivery.order.sourcePhone || delivery.order.phone;
    let whatsappSent = false;

    if (recipientPhone) {
      try {
        await sendWhatsAppTextMessage({
          to: recipientPhone,
          body: `Update on order ${delivery.order.code}: ${fulfilmentStatus}.${proofOfDeliveryNote ? `\n\nNote: ${proofOfDeliveryNote}` : ""}\n\nReply "menu" any time for order status or support.`,
        });
        whatsappSent = true;
      } catch (error) {
        console.error("delivery-status-whatsapp-notify-failed", {
          deliveryId: delivery.id,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (delivery.customerId) {
      await prisma.buyerMessage.create({
        data: {
          customerId: delivery.customerId,
          title: `Delivery update: ${fulfilmentStatus}`,
          body: proofOfDeliveryNote
            ? `Your delivery status is now ${fulfilmentStatus}. Note: ${proofOfDeliveryNote}`
            : `Your delivery status is now ${fulfilmentStatus}.`,
          channel: whatsappSent ? "WhatsApp" : "Portal",
          direction: "Outbound",
          status: whatsappSent ? "Sent" : "Unread",
          recipient: recipientPhone || undefined,
          source: "Delivery partner update",
          relatedType: "Delivery",
          relatedId: delivery.id,
          sentAt: whatsappSent ? new Date() : undefined,
        },
      });

      if (delivery.customer?.email) {
        await sendTransactionalEmail({
          deduplicationKey: `delivery-status:${delivery.id}:${fulfilmentStatus}`,
          template: "delivery-status",
          to: delivery.customer.email,
          content: emailTemplates.deliveryStatus(delivery.customer.name, fulfilmentStatus, getEmailBaseUrl()),
          relatedType: "Delivery",
          relatedId: delivery.id,
        });
      }
    }
  }

  await createAuditLog({
    action: "Updated delivery status",
    entityType: "Delivery",
    entityId: delivery.id,
    entityLabel: input.status,
    newValue: updatedDelivery,
    actorName: input.actorName,
    actorRole: "Delivery partner",
  });

  return {delivery, orderCode: delivery.order.code, fulfilmentStatus};
}
