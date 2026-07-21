"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {verifyPaystackTransaction} from "@/lib/payments/paystack";
import {settleVerifiedPaystackPayment} from "@/lib/payments/paystackSettlement.js";
import {createPaymentReconciliationIncident} from "@/lib/payments/reconciliation";

export async function verifyPaystackPaymentAction(formData: FormData) {
  const staff = await requireStaff();
  if (!["Super admin", "Admin", "Finance"].includes(staff.role)) throw new Error("Forbidden: finance access is required.");
  const id = String(formData.get("id") || "").trim();
  const paymentRequest = await prisma.paymentRequest.findUnique({where: {id}, include: {order: true, customer: true}});
  if (!paymentRequest || paymentRequest.provider !== "Paystack") redirect("/admin/payment-requests?error=paystack-request-not-found");

  const providerReference = paymentRequest.gatewayReference || paymentRequest.reference;
  let result;
  try {
    const verification = await verifyPaystackTransaction(providerReference);
    result = await settleVerifiedPaystackPayment({db: prisma, paymentRequest, verification, paidAt: verification.metadata?.paidAt ? new Date(String(verification.metadata.paidAt)) : new Date(), source: `Manual verification by ${staff.name}`});
  } catch (error) {
    await createPaymentReconciliationIncident({provider: "Paystack", internalReference: paymentRequest.reference, providerReference, reason: "Manual Paystack verification failed.", verificationMetadata: {error: error instanceof Error ? error.message : "unknown"}});
    redirect("/admin/payment-requests?error=paystack-verification-failed");
  }
  if (!result.ok) {
    await createPaymentReconciliationIncident({provider: "Paystack", internalReference: paymentRequest.reference, providerReference, reason: `Manual provider verification conflict: ${result.conflict}.`});
    redirect(`/admin/payment-requests?error=verification-${result.conflict}`);
  }
  if (result.receiptError) await createPaymentReconciliationIncident({provider: "Paystack", internalReference: paymentRequest.reference, providerReference, reason: "Payment was verified and marked paid, but automatic receipt creation failed.", verificationMetadata: {receiptError: result.receiptError}});

  for (const path of ["/admin/payment-requests", "/admin/orders", `/admin/orders/${paymentRequest.orderId}`, "/admin/payments", "/admin/receipts", "/admin", "/buyer-account"]) revalidatePath(path);
  redirect(`/admin/payment-requests?verified=${encodeURIComponent(paymentRequest.reference)}`);
}
