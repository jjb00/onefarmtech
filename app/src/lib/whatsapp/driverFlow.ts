import {prisma} from "@/lib/prisma";
import {applyDeliveryStatusUpdate, DeliveryStatusError, type DeliveryJobStatus} from "@/lib/deliveryStatus";
import {sendWhatsAppButtonsMessage, sendWhatsAppListMessage, sendWhatsAppTextMessage} from "@/lib/whatsapp/provider";
import {formatWhatsAppNaira} from "@/lib/whatsapp/productCatalogue";

const DRIVER_SESSION_TTL_MS = 15 * 60 * 1000;

const ACTIVE_JOB_STATUSES = ["Pending", "Assigned", "Out for delivery"];

const STATUS_BY_KEY: Record<string, DeliveryJobStatus> = {
  out: "Out for delivery",
  delivered: "Delivered",
  issue: "Failed / issue",
};

function statusButtons(deliveryId: string) {
  return [
    {id: `driver_status_${deliveryId}_out`, title: "Out for delivery"},
    {id: `driver_status_${deliveryId}_delivered`, title: "Delivered"},
    {id: `driver_status_${deliveryId}_issue`, title: "Report issue"},
  ];
}

// Sent the moment admin assigns (or reassigns) a driver to a delivery --
// today that assignment only notified the buyer, the driver had no way to
// find out except by opening the web portal.
export async function notifyDriverOfNewJob(input: {
  to: string;
  deliveryId: string;
  orderCode: string;
  buyerName: string;
  buyerPhone: string;
  deliveryArea?: string | null;
  deliveryAddress?: string | null;
  deliveryFee: number;
}) {
  const body = [
    `New delivery job: ${input.orderCode}`,
    `Buyer: ${input.buyerName} (${input.buyerPhone})`,
    input.deliveryArea ? `Area: ${input.deliveryArea}` : null,
    input.deliveryAddress ? `Address: ${input.deliveryAddress}` : null,
    `Fee: ${formatWhatsAppNaira(input.deliveryFee)}`,
  ].filter(Boolean).join("\n");

  await sendWhatsAppButtonsMessage({
    to: input.to,
    body,
    buttons: statusButtons(input.deliveryId),
  });
}

async function sendJobList(to: string) {
  const deliveries = await prisma.delivery.findMany({
    where: {deliveryPartnerPhone: to, status: {in: ACTIVE_JOB_STATUSES}},
    orderBy: {createdAt: "desc"},
    take: 10,
    select: {id: true, deliveryArea: true, order: {select: {code: true, buyerName: true}}},
  });

  if (!deliveries.length) {
    await sendWhatsAppTextMessage({
      to,
      body: 'No active delivery jobs right now. New assignments will message you here as soon as they come in. Reply "menu" any time to check again.',
    });
    return;
  }

  await sendWhatsAppListMessage({
    to,
    header: "Your jobs",
    body: "Select a job to update its status.",
    buttonLabel: "View jobs",
    sections: [{
      title: "Active deliveries",
      rows: deliveries.map((delivery) => ({
        id: `driver_job_${delivery.id}`,
        title: delivery.order.code,
        description: [delivery.order.buyerName, delivery.deliveryArea].filter(Boolean).join(" · ") || undefined,
      })),
    }],
  });
}

async function sendJobDetail(to: string, deliveryId: string) {
  const delivery = await prisma.delivery.findUnique({
    where: {id: deliveryId},
    select: {
      id: true,
      status: true,
      deliveryArea: true,
      deliveryAddress: true,
      deliveryFee: true,
      deliveryPartnerPhone: true,
      order: {select: {code: true, buyerName: true, phone: true}},
    },
  });

  if (!delivery || delivery.deliveryPartnerPhone !== to) {
    await sendWhatsAppTextMessage({to, body: "That job is no longer assigned to you."});
    return;
  }

  const body = [
    `${delivery.order.code} — currently ${delivery.status}`,
    `Buyer: ${delivery.order.buyerName} (${delivery.order.phone})`,
    delivery.deliveryArea ? `Area: ${delivery.deliveryArea}` : null,
    delivery.deliveryAddress ? `Address: ${delivery.deliveryAddress}` : null,
    `Fee: ${formatWhatsAppNaira(delivery.deliveryFee)}`,
  ].filter(Boolean).join("\n");

  await sendWhatsAppButtonsMessage({to, body, buttons: statusButtons(delivery.id)});
}

async function setAwaitingNote(phone: string, deliveryId: string) {
  const expiresAt = new Date(Date.now() + DRIVER_SESSION_TTL_MS);
  await prisma.whatsAppDriverSession.upsert({
    where: {phone},
    create: {phone, step: "AWAITING_NOTE", deliveryId, expiresAt},
    update: {step: "AWAITING_NOTE", deliveryId, expiresAt},
  });
}

async function clearSession(phone: string) {
  await prisma.whatsAppDriverSession.deleteMany({where: {phone}});
}

async function applyStatusFromButton(to: string, driverId: string, driverName: string, deliveryId: string, statusKey: string) {
  const status = STATUS_BY_KEY[statusKey];
  if (!status) return;

  let result;
  try {
    result = await applyDeliveryStatusUpdate({deliveryId, partnerId: driverId, status, actorName: driverName});
  } catch (error) {
    if (error instanceof DeliveryStatusError) {
      await sendWhatsAppTextMessage({to, body: "That job is no longer assigned to you."});
      return;
    }
    throw error;
  }

  await sendWhatsAppTextMessage({
    to,
    body: `${result.orderCode} marked as ${status}. Reply with a note to add one, or ignore this message.`,
  });
  await setAwaitingNote(to, deliveryId);
}

async function applyNoteText(to: string, deliveryId: string, note: string) {
  await prisma.delivery.updateMany({
    where: {id: deliveryId, deliveryPartnerPhone: to},
    data: {proofOfDeliveryNote: note},
  });
  await clearSession(to);
  await sendWhatsAppTextMessage({to, body: "Note added. Thanks."});
}

export async function handleDriverWhatsAppMessage(input: {
  from: string;
  driverId: string;
  driverName: string;
  body: string;
  message: {type?: string; interactive?: {button_reply?: {id?: string}; list_reply?: {id?: string}}};
  triggerMenu: boolean;
}): Promise<{handled: boolean}> {
  const interactiveReplyId =
    input.message?.type === "interactive"
      ? input.message?.interactive?.button_reply?.id || input.message?.interactive?.list_reply?.id || null
      : null;

  if (interactiveReplyId?.startsWith("driver_job_")) {
    await sendJobDetail(input.from, interactiveReplyId.slice("driver_job_".length));
    return {handled: true};
  }

  if (interactiveReplyId?.startsWith("driver_status_")) {
    const rest = interactiveReplyId.slice("driver_status_".length);
    const separatorIndex = rest.lastIndexOf("_");
    if (separatorIndex > 0) {
      const deliveryId = rest.slice(0, separatorIndex);
      const statusKey = rest.slice(separatorIndex + 1);
      await applyStatusFromButton(input.from, input.driverId, input.driverName, deliveryId, statusKey);
      return {handled: true};
    }
  }

  const session = await prisma.whatsAppDriverSession.findUnique({where: {phone: input.from}});
  const sessionActive = Boolean(session && session.step === "AWAITING_NOTE" && session.deliveryId && session.expiresAt > new Date());
  const text = input.body.trim();

  if (sessionActive && text) {
    await applyNoteText(input.from, session!.deliveryId!, text.slice(0, 500));
    return {handled: true};
  }

  if (text || input.triggerMenu) {
    await sendJobList(input.from);
    return {handled: true};
  }

  return {handled: false};
}
