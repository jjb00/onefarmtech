"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireStaffRole} from "@/lib/auth";
import {createAuditLog} from "@/lib/auditLog";
import {validatePermanentDeletionInput} from "@/lib/adminRecordDeletion.js";
import {prisma} from "@/lib/prisma";
import {verifyStaffPassword} from "@/lib/staffAuthorization";
import {phoneMatchCandidates} from "@/lib/whatsapp/phone";

const text = (formData: FormData, key: string) => String(formData.get(key) || "").trim();

export async function permanentlyDeleteAdminMessageAction(formData: FormData) {
  const staff = await requireStaffRole("Super admin");
  const recordType = text(formData, "recordType");
  const recordId = text(formData, "recordId");
  const returnTo = text(formData, "returnTo");
  const reason = text(formData, "reason");
  const confirmation = text(formData, "confirmation");
  const password = text(formData, "password");
  const error = validatePermanentDeletionInput({recordType, recordId, reason, confirmation, password});
  const safeReturnBase =
    returnTo.startsWith("/admin/") && !returnTo.startsWith("//") && !returnTo.includes("\n") && !returnTo.includes("\r")
      ? returnTo.split("?")[0]
      : "/admin/buyer-messages";
  if (error || !staff.email || !verifyStaffPassword(staff.email, password)) redirect(`${safeReturnBase}?error=${error || "confirmation-failed"}`);

  try {
    await prisma.$transaction(async (tx) => {
    if (recordType === "ContactEnquiry") {
      await tx.contactEnquiry.delete({where: {id: recordId}});
    } else if (recordType === "BuyerMessage") {
      await tx.buyerMessage.delete({where: {id: recordId}});
    } else if (recordType === "OrderRequest") {
      const request = await tx.orderRequest.findUnique({
        where: {id: recordId},
        select: {status: true},
      });

      if (!request || request.status === "Converted to order") {
        throw new Error("ORDER_REQUEST_DELETE_BLOCKED");
      }

      await tx.orderRequest.delete({where: {id: recordId}});
    } else if (recordType === "BuyerAccountRequest") {
      const application = await tx.buyerAccountRequest.findUnique({
        where: {id: recordId},
        select: {status: true},
      });

      if (
        !application ||
        application.status === "Converted to customer"
      ) {
        throw new Error("BUYER_APPLICATION_DELETE_BLOCKED");
      }

      await tx.buyerAccountRequest.delete({where: {id: recordId}});
    } else if (recordType === "Conversation") {
      // recordId holds the phone number for this type -- there's no single
      // "Conversation" row, it's every BuyerMessage/ContactEnquiry that
      // matches the same phone the conversation viewer aggregates by.
      const candidates = phoneMatchCandidates(recordId);
      if (!candidates.length) throw new Error("INVALID_DELETE_TYPE");

      const customer = await tx.customer.findFirst({where: {phone: {in: candidates}}, select: {id: true}});
      const contact = await tx.buyerContact.findFirst({where: {phone: {in: candidates}}, select: {customerId: true}});
      const customerId = customer?.id || contact?.customerId || null;

      await tx.buyerMessage.deleteMany({
        where: {
          OR: [
            {recipient: {in: candidates}},
            ...(customerId ? [{customerId}] : []),
          ],
        },
      });
      await tx.contactEnquiry.deleteMany({
        where: {
          enquiryType: "WhatsApp inbound",
          phone: {in: candidates},
        },
      });
    } else if (recordType === "Customer") {
      const customer = await tx.customer.findUnique({
        where: {id: recordId},
        select: {
          _count: {
            select: {
              orders: true,
              receipts: true,
              paymentRequests: true,
              deliveries: true,
            },
          },
        },
      });

      const hasActivity = Boolean(
        !customer ||
          customer._count.orders ||
          customer._count.receipts ||
          customer._count.paymentRequests ||
          customer._count.deliveries,
      );

      if (hasActivity) {
        throw new Error("CUSTOMER_DELETE_BLOCKED");
      }

      // Contacts, invites, OTP challenges, profile-update requests and
      // buyer messages all cascade-delete with the customer row -- this
      // only reaches here once we've confirmed there's no order/receipt/
      // payment/delivery history to lose.
      await tx.customer.delete({where: {id: recordId}});
    } else if (recordType === "Order") {
      const order = await tx.order.findUnique({
        where: {id: recordId},
        select: {
          paymentStatus: true,
          fulfilmentStatus: true,
          _count: {
            select: {
              payments: true,
              receipts: true,
              paymentRequests: true,
              complaints: true,
            },
          },
          delivery: {select: {id: true}},
        },
      });

      const protectedPayment = ["Paid", "Approved", "Partially paid"].includes(
        order?.paymentStatus || "",
      );
      const protectedFulfilment = [
        "Delivered",
        "Picked up",
        "Completed",
      ].includes(order?.fulfilmentStatus || "");

      if (
        !order ||
        protectedPayment ||
        protectedFulfilment ||
        order.delivery ||
        order._count.payments ||
        order._count.receipts ||
        order._count.paymentRequests ||
        order._count.complaints
      ) {
        throw new Error("ORDER_DELETE_BLOCKED");
      }

      await tx.orderItem.deleteMany({where: {orderId: recordId}});
      await tx.order.delete({where: {id: recordId}});
    } else if (recordType === "PaymentRequest") {
      const paymentRequest = await tx.paymentRequest.findUnique({
        where: {id: recordId},
        select: {status: true, paidAt: true},
      });

      // A paid request is reconciled revenue -- deleting it would erase the
      // financial trail behind a receipt. Only pending/failed/cancelled
      // links (duplicates, expired links, abandoned attempts) can go.
      if (!paymentRequest || paymentRequest.status === "Paid" || paymentRequest.paidAt) {
        throw new Error("PAYMENT_REQUEST_DELETE_BLOCKED");
      }

      await tx.paymentRequest.delete({where: {id: recordId}});
    } else {
      throw new Error("INVALID_DELETE_TYPE");
    }

    await tx.auditLog.create({data: {
      actorName: staff.name,
      actorEmail: staff.email,
      actorRole: staff.role,
      action: "Permanently deleted admin record",
      entityType: recordType,
      entityId: recordId,
      entityLabel: "Deleted admin record",
      metadata: JSON.stringify({actorId: staff.id, deletionReason: reason, deletedAt: new Date().toISOString()}),
    }});
    });
  } catch (err) {
    const code = err instanceof Error ? err.message : "DELETE_FAILED";
    redirect(`${safeReturnBase}?error=${code}`);
  }

  revalidatePath("/admin/buyer-messages");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/order-requests");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/buyer-account-requests");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/audit-log");

  if (
    returnTo.startsWith("/admin/") &&
    !returnTo.startsWith("//") &&
    !returnTo.includes("\n") &&
    !returnTo.includes("\r")
  ) {
    redirect(returnTo);
  }

  if (recordType === "OrderRequest") {
    redirect("/admin/orders?view=new-requests&deleted=1");
  }

  if (recordType === "Order") {
    redirect("/admin/orders?deleted=1");
  }

  if (recordType === "PaymentRequest") {
    redirect("/admin/payments?deleted=1");
  }

  if (recordType === "BuyerAccountRequest") {
    redirect("/admin/customers?view=applications&queue=active&deleted=1");
  }

  redirect("/admin/buyer-messages?view=needs-reply&deleted=1");
}
