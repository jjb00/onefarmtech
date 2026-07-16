import {initialFulfilmentStatus} from "./orderStatusRules.js";

const CONVERTED_STATUS = "Converted to order";
const BLOCKED_STATUSES = new Set(["Rejected", "Closed"]);

export class OrderRequestConversionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "OrderRequestConversionError";
    this.code = code;
  }
}

export function convertedOrderFromNote(adminNote) {
  try {
    const note = JSON.parse(String(adminNote || "{}"));
    return typeof note.convertedOrderId === "string" && note.convertedOrderId
      ? {id: note.convertedOrderId, code: typeof note.convertedOrderCode === "string" ? note.convertedOrderCode : ""}
      : null;
  } catch {
    return null;
  }
}

function mergeNote(adminNote, evidence) {
  try {
    return JSON.stringify({...JSON.parse(String(adminNote || "{}")), ...evidence});
  } catch {
    return JSON.stringify({previousNote: String(adminNote || ""), ...evidence});
  }
}

function json(value) {
  return JSON.stringify(value);
}

export async function convertOrderRequestIntegrity({db, requestId, actor, now = () => new Date()}) {
  if (!requestId) throw new OrderRequestConversionError("missing-request-id", "Order request ID is required.");

  try {
    return await db.$transaction(async (tx) => {
      await tx.$queryRawUnsafe("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", `order-request:${requestId}`);

      const request = await tx.orderRequest.findUnique({where: {id: requestId}});
      if (!request) throw new OrderRequestConversionError("request-not-found", "Order request was not found.");

      const recorded = convertedOrderFromNote(request.adminNote);
      if (recorded) {
        const order = await tx.order.findUnique({where: {id: recorded.id}});
        if (!order) throw new OrderRequestConversionError("converted-order-missing", "The linked converted order no longer exists.");
        if (request.status !== CONVERTED_STATUS) await tx.orderRequest.update({where: {id: request.id}, data: {status: CONVERTED_STATUS}});
        return {request, order, created: false};
      }

      if (BLOCKED_STATUSES.has(request.status)) throw new OrderRequestConversionError("conversion-not-allowed", `${request.status} requests cannot be converted.`);

      const convertedAt = now();
      const order = await tx.order.create({data: {
        code: `OFT-REQ-${request.id.slice(-8).toUpperCase()}`,
        buyerName: request.buyerName,
        phone: request.phone,
        buyerType: request.buyerType,
        orderType: "Order request conversion",
        paymentStatus: "Pending confirmation",
        fulfilmentStatus: initialFulfilmentStatus(request.deliveryPreference, "Buyer request"),
        deliveryMethod: request.deliveryPreference,
        deliveryNote: [request.timing ? `Timing: ${request.timing}` : null, request.message || null, `Requested items: ${request.items}`].filter(Boolean).join("\n"),
        source: request.source,
        sourcePhone: request.phone,
        adminNote: `Created from OrderRequest ${request.id}. Confirm items, pricing, payment and fulfilment.`,
        items: {create: {name: "Requested items", grade: "To confirm", quantity: 1, unit: "Request", unitPrice: 0, lineTotal: 0}},
      }});
      const evidence = {convertedOrderId: order.id, convertedOrderCode: order.code, convertedAt: convertedAt.toISOString()};
      const updated = await tx.orderRequest.update({where: {id: request.id}, data: {status: CONVERTED_STATUS, adminNote: mergeNote(request.adminNote, evidence)}});
      await tx.auditLog.create({data: {
        actorName: actor.name, actorEmail: actor.email, actorRole: actor.role,
        action: "Converted order request to order", entityType: "OrderRequest", entityId: request.id,
        entityLabel: `${request.buyerName} · ${request.buyerType}`,
        previousValue: json({status: request.status}), newValue: json({...evidence, status: updated.status}),
        metadata: json({conversionTimestamp: convertedAt.toISOString(), conversionResult: "new-order"}),
      }});
      return {request: updated, order, created: true};
    });
  } catch (error) {
    if (error instanceof OrderRequestConversionError) throw error;
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (["P2034", "40001", "40P01"].includes(code)) throw new OrderRequestConversionError("database-conflict", "The request changed during conversion. Please try again.");
    throw new OrderRequestConversionError("conversion-failed", "The order request could not be converted.");
  }
}
