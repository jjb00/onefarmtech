"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {verifyFlutterwaveTransactionByReference} from "@/lib/payments/flutterwave";
import {settleVerifiedFlutterwavePayment} from "@/lib/payments/flutterwaveSettlement.js";
import {createPaymentReconciliationIncident} from "@/lib/payments/reconciliation";

export async function verifyFlutterwavePaymentAction(formData: FormData) {
  const staff = await requireStaff();
  if (!["Super admin", "Admin", "Finance"].includes(staff.role)) throw new Error("Forbidden: finance access is required.");
  const id = String(formData.get("id") || "").trim();
  const paymentRequest = await prisma.paymentRequest.findUnique({where: {id}, include: {order: true, customer: true}});
  if (!paymentRequest || paymentRequest.provider !== "Flutterwave") redirect("/admin/payment-requests?error=flutterwave-request-not-found");

  let result;
  try {
    const verification = await verifyFlutterwaveTransactionByReference(paymentRequest.reference);
    result = await settleVerifiedFlutterwavePayment({db: prisma, paymentRequest, verification, source: `Manual verification by ${staff.name}`});
  } catch (error) {
    await createPaymentReconciliationIncident({provider: "Flutterwave", internalReference: paymentRequest.reference, providerReference: paymentRequest.gatewayReference, reason: "Manual Flutterwave verification failed.", verificationMetadata: {error: error instanceof Error ? error.message : "unknown"}});
    redirect("/admin/payment-requests?error=flutterwave-verification-failed");
  }
  if (!result.ok) {
    await createPaymentReconciliationIncident({provider: "Flutterwave", internalReference: paymentRequest.reference, providerReference: paymentRequest.gatewayReference, reason: `Manual provider verification conflict: ${result.conflict}.`});
    redirect(`/admin/payment-requests?error=verification-${result.conflict}`);
  }
  if (result.receiptError) await createPaymentReconciliationIncident({provider: "Flutterwave", internalReference: paymentRequest.reference, providerReference: paymentRequest.gatewayReference, reason: "Payment was verified and marked paid, but automatic receipt creation failed.", verificationMetadata: {receiptError: result.receiptError}});
  for (const path of ["/admin/payment-requests", "/admin/orders", `/admin/orders/${paymentRequest.orderId}`, "/admin/payments", "/admin/receipts", "/admin", "/buyer-account"]) revalidatePath(path);
  redirect(`/admin/payment-requests?verified=${encodeURIComponent(paymentRequest.reference)}`);
}
