const CONVERTED_STATUS = "Converted to customer";
const CUSTOMER_NOTE_PREFIX = "Converted to customer record: ";
const BLOCKED_STATUSES = new Set(["Rejected", "Closed"]);

export class BuyerAccountConversionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "BuyerAccountConversionError";
    this.code = code;
  }
}

export function convertedCustomerIdFromNote(adminNote) {
  const note = String(adminNote || "").trim();
  if (!note.startsWith(CUSTOMER_NOTE_PREFIX)) return null;
  const customerId = note.slice(CUSTOMER_NOTE_PREFIX.length).trim();
  return customerId && !/\s/.test(customerId) ? customerId : null;
}

function json(value) {
  return JSON.stringify(value);
}

export async function convertBuyerAccountRequestIntegrity({db, requestId, actor, now = () => new Date()}) {
  if (!requestId) throw new BuyerAccountConversionError("missing-request-id", "Buyer account request ID is required.");

  try {
    return await db.$transaction(async (tx) => {
      // PostgreSQL transaction-scoped lock: every process converting this request uses the same key.
      await tx.$queryRawUnsafe(
        "SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))",
        requestId,
      );

      const request = await tx.buyerAccountRequest.findUnique({where: {id: requestId}});
      if (!request) throw new BuyerAccountConversionError("request-not-found", "Buyer account request was not found.");

      const recordedCustomerId = convertedCustomerIdFromNote(request.adminNote);
      if (request.status === CONVERTED_STATUS) {
        if (!recordedCustomerId) throw new BuyerAccountConversionError("malformed-conversion-evidence", "Converted request has malformed customer evidence.");
        const customer = await tx.customer.findUnique({where: {id: recordedCustomerId}});
        if (!customer) throw new BuyerAccountConversionError("converted-customer-missing", "The recorded converted customer no longer exists.");

        await tx.auditLog.create({data: {
          actorName: actor.name,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: "Resolved idempotent buyer account conversion",
          entityType: "BuyerAccountRequest",
          entityId: request.id,
          entityLabel: `${request.buyerType} · ${request.contactName}`,
          newValue: json({requestId: request.id, customerId: customer.id, status: request.status}),
          metadata: json({conversionTimestamp: now().toISOString(), conversionResult: "existing-linked-customer"}),
        }});
        return {request, customer, created: false};
      }

      // Historical evidence is authoritative even if an old status drifted; never create a second customer.
      if (recordedCustomerId) {
        const customer = await tx.customer.findUnique({where: {id: recordedCustomerId}});
        if (!customer) throw new BuyerAccountConversionError("converted-customer-missing", "The recorded converted customer no longer exists.");
        const updated = await tx.buyerAccountRequest.update({where: {id: request.id}, data: {status: CONVERTED_STATUS}});
        await tx.auditLog.create({data: {
          actorName: actor.name, actorEmail: actor.email, actorRole: actor.role,
          action: "Reconciled historical buyer account conversion",
          entityType: "BuyerAccountRequest", entityId: request.id,
          entityLabel: `${request.buyerType} · ${request.contactName}`,
          previousValue: json({status: request.status}),
          newValue: json({requestId: request.id, customerId: customer.id, status: CONVERTED_STATUS}),
          metadata: json({conversionTimestamp: now().toISOString(), conversionResult: "historical-linked-customer"}),
        }});
        return {request: updated, customer, created: false};
      }

      if (BLOCKED_STATUSES.has(request.status)) throw new BuyerAccountConversionError("conversion-not-allowed", `${request.status} requests cannot be converted.`);

      const customer = await tx.customer.create({data: {
        name: request.organisationName || request.contactName,
        buyerType: request.buyerType,
        phone: request.phone,
        email: request.email || null,
        location: request.location || null,
        accountStatus: "Approved - manual setup",
        accountLoginReady: false,
        creditLimit: 0,
        outstandingBalance: 0,
        paymentTerms: request.interestedInCredit ? "Payment terms interest noted - partner review required" : "Pay on order / manual terms",
        receiptEmail: request.email || null,
      }});
      const buyerContact = await tx.buyerContact.create({data: {
        customerId: customer.id,
        name: request.contactName,
        email: request.email || null,
        phone: request.phone || null,
        role: "Buyer user",
        canPlaceOrders: true,
        canViewReceipts: request.needsReceipts,
        canViewCredit: false,
        status: "Active",
      }});
      const convertedAt = now();
      const updated = await tx.buyerAccountRequest.update({where: {id: request.id}, data: {status: CONVERTED_STATUS, adminNote: `${CUSTOMER_NOTE_PREFIX}${customer.id}`}});
      await tx.auditLog.create({data: {
        actorName: actor.name, actorEmail: actor.email, actorRole: actor.role,
        action: "Converted buyer account request to customer",
        entityType: "BuyerAccountRequest", entityId: request.id,
        entityLabel: `${request.buyerType} · ${request.contactName}`,
        previousValue: json({status: request.status}),
        newValue: json({requestId: request.id, customerId: customer.id, status: updated.status}),
        metadata: json({conversionTimestamp: convertedAt.toISOString(), conversionResult: "new-customer"}),
      }});
      return {request: updated, customer, buyerContact, created: true};
    });
  } catch (error) {
    if (error instanceof BuyerAccountConversionError) throw error;
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (["P2034", "40001", "40P01"].includes(code)) throw new BuyerAccountConversionError("database-conflict", "The request changed during conversion. Please try again.");
    throw new BuyerAccountConversionError("conversion-failed", "The buyer account request could not be converted.");
  }
}
