const failureStatuses = new Set(["Bounced", "Complained", "Failed"]);
const terminalFailureStatuses = new Set(["Bounced", "Complained"]);
const statusOrder = ["Pending", "Accepted", "Sent", "Delayed", "Delivered", "Bounced", "Complained", "Failed"];

function isUniqueConstraintError(error) {
  return error?.code === "P2002";
}

function statusesNotAfter(status) {
  const index = statusOrder.indexOf(status);
  return index < 0 ? statusOrder : statusOrder.slice(0, index + 1);
}

export async function applyResendDeliveryEvent({db, eventId, providerMessageId, type, status, eventAt}) {
  const replay = await db.emailProviderEvent.findUnique({where: {eventId}});
  if (replay) return {outcome: "duplicate", status};

  const delivery = await db.emailDelivery.findFirst({where: {providerMessageId}});
  if (!delivery) {
    try {
      await db.emailProviderEvent.create({data: {
        eventId,
        providerMessageId,
        eventType: type,
        eventAt,
        matched: false,
        metadata: JSON.stringify({type}),
      }});
    } catch (error) {
      if (isUniqueConstraintError(error)) return {outcome: "duplicate", status};
      throw error;
    }
    return {outcome: "unmatched", status};
  }

  try {
    await db.emailDelivery.updateMany({
      where: {
        id: delivery.id,
        OR: [
          {latestEventAt: null},
          {latestEventAt: {lt: eventAt}},
          {latestEventAt: eventAt, status: {in: statusesNotAfter(status)}},
        ],
      },
      data: {
        status,
        latestEventId: eventId,
        latestEventType: type,
        latestEventAt: eventAt,
        eventMetadata: JSON.stringify({type, providerMessageId}),
        lastError: failureStatuses.has(status) ? `Resend reported ${status.toLowerCase()}.` : null,
        failedAt: failureStatuses.has(status) ? eventAt : delivery.failedAt,
        nextRetryAt: terminalFailureStatuses.has(status) ? null : delivery.nextRetryAt,
      },
    });
    await db.emailProviderEvent.create({data: {
      eventId,
      emailDeliveryId: delivery.id,
      providerMessageId,
      eventType: type,
      eventAt,
      matched: true,
      metadata: JSON.stringify({type}),
    }});
  } catch (error) {
    if (isUniqueConstraintError(error)) return {outcome: "duplicate", status, deliveryId: delivery.id};
    throw error;
  }

  return {outcome: "applied", status, deliveryId: delivery.id};
}
