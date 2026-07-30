/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- carried over from createAdminRecords.ts during the module split; see git
// history for context. Removing this needs a dedicated type-safety pass.
"use server";

import {createAuditLog} from "@/lib/auditLog";
import {requireCapability} from "@/lib/auth";
import {getEmailBaseUrl, sendTransactionalEmail} from "@/lib/email/service";
import {emailTemplates} from "@/lib/email/templates";
import {initialisePayment, PaymentInitializationError} from "@/lib/payments/paymentInitialization.js";

export async function createPaymentRequestFromOrderAction(formData: FormData) {
  await requireCapability("manage_payments");
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");

  await requireStaff();

  const orderId = String(formData.get("orderId") || "");
  const provider = String(formData.get("provider") || "Manual").trim() || "Manual";
  const amountInput = String(formData.get("amount") || "").replace(/[^\d]/g, "");
  const paymentUrl = String(formData.get("paymentUrl") || "").trim();
  const bankName = String(formData.get("bankName") || "").trim();
  const accountNumber = String(formData.get("accountNumber") || "").trim();
  const accountName = String(formData.get("accountName") || "").trim();

  if (!orderId) {
    redirect("/admin/orders?error=missing-order");
  }

  const order = await prisma.order.findUnique({
    where: {id: orderId},
    include: {
      customer: true,
      paymentRequests: {
        orderBy: {createdAt: "desc"},
        take: 1,
      },
    },
  });

  if (!order) {
    redirect("/admin/orders?error=order-not-found");
  }

  const amount =
    amountInput.length > 0
      ? Number(amountInput)
      : order.totalAmount || order.estimatedTotal || order.subtotal || 0;

  if (!amount || amount <= 0) {
    redirect(`/admin/orders/${orderId}?error=invalid-payment-amount`);
  }

  const activePaymentRequest = await prisma.paymentRequest.findFirst({where: {orderId: order.id, paidAt: null, status: {in: ["Pending", "Initialising"]}, OR: [{expiresAt: null}, {expiresAt: {gt: new Date()}}]}, orderBy: {createdAt: "desc"}});
  if (activePaymentRequest) redirect(`/admin/orders/${order.id}?paymentRequest=existing`);

  const reference = await makePaymentReference(order.code);

  const paymentRequest = await prisma.paymentRequest.create({
    data: {
      orderId: order.id,
      customerId: order.customerId || null,
      provider,
      reference,
      amount,
      currency: "NGN",
      status: "Pending",
      paymentUrl: paymentUrl || null,
      bankName: bankName || null,
      accountNumber: accountNumber || null,
      accountName: accountName || null,
    },
  });

  await prisma.order.update({
    where: {id: order.id},
    data: {
      paymentReference: reference,
      paymentStatus: "Payment pending",
    },
  });

  if (order.customerId) {
    await prisma.buyerMessage.create({
      data: {
        customerId: order.customerId,
        title: `Payment request for ${order.code}`,
        body: `A payment request has been created for order ${order.code}.\\n\\nReference: ${reference}\\nAmount: ${new Intl.NumberFormat("en-NG", {style: "currency", currency: "NGN", maximumFractionDigits: 0}).format(amount)}`,
        channel: "Portal",
        direction: "Outbound",
        status: "Unread",
        recipient: order.phone,
        source: "Payment request",
        relatedType: "PaymentRequest",
        relatedId: reference,
      },
    });
  }

  if (order.customer?.email) {
    await sendTransactionalEmail({deduplicationKey: `payment-request:${paymentRequest.id}`, template: "payment-request", to: order.customer.email, content: emailTemplates.paymentRequest(order.customer.name, order.code, new Intl.NumberFormat("en-NG", {style: "currency", currency: "NGN", maximumFractionDigits: 0}).format(amount), paymentRequest.paymentUrl, getEmailBaseUrl()), relatedType: "PaymentRequest", relatedId: paymentRequest.id});
  }

  revalidatePath("/admin/payment-requests");
  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath("/buyer-account/payments");
  revalidatePath(`/buyer-account/orders/${order.id}`);
  revalidatePath("/buyer-account/inbox");

  redirect(`/admin/orders/${order.id}?paymentRequest=created`);
}
export async function generatePaymentLinkAction(formData: FormData) {
  await requireCapability("manage_payments");
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");
  const {createPaymentCheckout} = await import("@/lib/payments/provider");

  const staff = await requireStaff();

  const id = String(formData.get("id") || "");
  const provider = String(formData.get("provider") || "Paystack").trim() || "Paystack";

  if (!id) {
    redirect("/admin/payment-requests?error=missing-id");
  }

  let result;
  try {
    result = await initialisePayment({db: prisma, paymentRequestId: id, provider, createCheckout: createPaymentCheckout});
  } catch (error) {
    const code = error instanceof PaymentInitializationError ? error.code : "payment-link-failed";
    const detail = error instanceof PaymentInitializationError ? error.message : "Payment initialisation failed unexpectedly.";
    redirect(`/admin/payment-requests?error=${encodeURIComponent(code)}&detail=${encodeURIComponent(`${provider}: ${detail}`)}`);
  }

  const {source: sourcePaymentRequest, reused} = result;
  const paymentRequest = {...sourcePaymentRequest, ...result.paymentRequest, order: sourcePaymentRequest.order, customer: sourcePaymentRequest.customer};
  const checkout = result.checkout || {provider: paymentRequest.provider, gatewayReference: paymentRequest.gatewayReference, paymentUrl: paymentRequest.paymentUrl};

  if (!reused && paymentRequest.customerId) {
    await prisma.buyerMessage.create({
        data: {
          customerId: paymentRequest.customerId,
          title: `Payment link for ${paymentRequest.order.code}`,
          body: `A payment link has been generated for order ${paymentRequest.order.code}.\\n\\nReference: ${paymentRequest.reference}\\nAmount: ${new Intl.NumberFormat("en-NG", {style: "currency", currency: "NGN", maximumFractionDigits: 0}).format(paymentRequest.amount)}\\nPayment link: ${checkout.paymentUrl}`,
          channel: "Portal",
          direction: "Outbound",
          status: "Unread",
          recipient: paymentRequest.order.phone,
          source: "Payment link",
          relatedType: "PaymentRequest",
          relatedId: paymentRequest.id,
          metadata: JSON.stringify({provider: checkout.provider, gatewayReference: checkout.gatewayReference}),
        },
    });
  }

  if (!reused && paymentRequest.customer?.email) {
    await sendTransactionalEmail({deduplicationKey: `payment-link:${paymentRequest.id}`, template: "payment-request", to: paymentRequest.customer.email, content: emailTemplates.paymentRequest(paymentRequest.customer.name, paymentRequest.order.code, new Intl.NumberFormat("en-NG", {style: "currency", currency: "NGN", maximumFractionDigits: 0}).format(paymentRequest.amount), checkout.paymentUrl, getEmailBaseUrl()), relatedType: "PaymentRequest", relatedId: paymentRequest.id});
  }

  await createAuditLog({actorName: staff.name, actorEmail: staff.email, actorRole: staff.role, action: reused ? "Reused active payment link" : "Generated payment link", entityType: "PaymentRequest", entityId: paymentRequest.id, entityLabel: paymentRequest.order.code, newValue: {provider: paymentRequest.provider, reference: paymentRequest.reference, reused}});

  revalidatePath("/admin/payment-requests");
  revalidatePath(`/admin/orders/${paymentRequest.orderId}`);
  revalidatePath("/buyer-account/payments");
  revalidatePath(`/buyer-account/orders/${paymentRequest.orderId}`);
  revalidatePath("/buyer-account/inbox");
  redirect(`/admin/payment-requests?paymentLink=${reused ? "reused" : "generated"}`);
}
export async function updatePaymentRequestStatusAction(formData: FormData) {
  await requireCapability("manage_payments");
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");

  await requireStaff();

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "Pending");
  const provider = String(formData.get("provider") || "Manual").trim();
  const gatewayReference = String(formData.get("gatewayReference") || "").trim();
  const paymentUrl = String(formData.get("paymentUrl") || "").trim();
  const bankName = String(formData.get("bankName") || "").trim();
  const accountNumber = String(formData.get("accountNumber") || "").trim();
  const accountName = String(formData.get("accountName") || "").trim();

  if (!id) {
    redirect("/admin/payment-requests?error=missing-id");
  }

  const paymentRequest = await prisma.paymentRequest.findUnique({
    where: {id},
    include: {
      order: true,
    },
  });

  if (!paymentRequest) {
    redirect("/admin/payment-requests?error=not-found");
  }

  const paidAt = status === "Paid" ? new Date() : null;

  await prisma.paymentRequest.update({
    where: {id},
    data: {
      status,
      provider,
      gatewayReference: gatewayReference || null,
      paymentUrl: paymentUrl || null,
      bankName: bankName || null,
      accountNumber: accountNumber || null,
      accountName: accountName || null,
      paidAt,
    },
  });

  if (status === "Paid") {
    const existingPayment = await prisma.payment.findFirst({
      where: {
        reference: paymentRequest.reference,
      },
    });

    const payment =
      existingPayment ||
      (await prisma.payment.create({
        data: {
          orderId: paymentRequest.orderId,
          reference: paymentRequest.reference,
          provider,
          amount: paymentRequest.amount,
          status: "Paid",
          paidAt: paidAt || new Date(),
        },
      }));

    await prisma.order.update({
      where: {id: paymentRequest.orderId},
      data: {
        paymentStatus: "Paid",
      },
    });

    if (paymentRequest.customerId) {
      await prisma.buyerMessage.create({
        data: {
          customerId: paymentRequest.customerId,
          title: `Payment received for ${paymentRequest.order.code}`,
          body: `Payment has been recorded for order ${paymentRequest.order.code}.\\n\\nReference: ${paymentRequest.reference}\\nAmount: ${new Intl.NumberFormat("en-NG", {style: "currency", currency: "NGN", maximumFractionDigits: 0}).format(paymentRequest.amount)}\\nStatus: Paid`,
          channel: "Portal",
          direction: "Outbound",
          status: "Unread",
          recipient: paymentRequest.order.phone,
          source: "Payment confirmation",
          relatedType: "Payment",
          relatedId: payment.id,
        },
      });
    }
  } else if (status === "Failed" || status === "Cancelled") {
    await prisma.order.update({
      where: {id: paymentRequest.orderId},
      data: {
        paymentStatus: status === "Failed" ? "Payment failed" : "Payment cancelled",
      },
    });
  } else {
    await prisma.order.update({
      where: {id: paymentRequest.orderId},
      data: {
        paymentStatus: "Payment pending",
      },
    });
  }

  revalidatePath("/admin/payment-requests");
  revalidatePath(`/admin/orders/${paymentRequest.orderId}`);
  revalidatePath("/buyer-account/orders");
  revalidatePath(`/buyer-account/orders/${paymentRequest.orderId}`);
  revalidatePath("/buyer-account/inbox");

  redirect("/admin/payment-requests?updated=1");
}
export async function issueReceiptFromPaymentRequestAction(formData: FormData) {
  const authoritativeStaff = await requireCapability("manage_payments");
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");

  await requireStaff();

  const id = String(formData.get("id") || "");

  if (!id) {
    redirect("/admin/payment-requests?error=missing-id");
  }

  const paymentRequest = await prisma.paymentRequest.findUnique({
    where: {id},
    include: {
      order: true,
      customer: true,
    },
  });

  if (!paymentRequest) {
    redirect("/admin/payment-requests?error=not-found");
  }

  if (paymentRequest.status !== "Paid") {
    redirect("/admin/payment-requests?error=not-paid");
  }

  const payment = await prisma.payment.findFirst({
    where: {
      reference: paymentRequest.reference,
      orderId: paymentRequest.orderId,
    },
  });

  if (!payment) {
    redirect("/admin/payment-requests?error=payment-missing");
  }

  const existingReceipt = await prisma.receipt.findFirst({
    where: {
      paymentId: payment.id,
    },
  });

  if (!existingReceipt) {
    const receiptCount = await prisma.receipt.count();
    const receiptCode = `RCT-${String(receiptCount + 1).padStart(6, "0")}`;

    const receipt = await prisma.receipt.create({
      data: {
        code: receiptCode,
        orderId: paymentRequest.orderId,
        customerId: paymentRequest.customerId || null,
        paymentId: payment.id,
        buyerName: paymentRequest.order.buyerName,
        buyerEmail: paymentRequest.customer?.receiptEmail || paymentRequest.customer?.email || null,
        amount: paymentRequest.amount,
        status: "Issued",
        issuedBy: authoritativeStaff.name,
      },
    });

    if (paymentRequest.customerId) {
      await prisma.buyerMessage.create({
        data: {
          customerId: paymentRequest.customerId,
          title: `Receipt issued for ${paymentRequest.order.code}`,
          body: `Receipt ${receipt.code} has been issued for order ${paymentRequest.order.code}.\\n\\nAmount: ${new Intl.NumberFormat("en-NG", {style: "currency", currency: "NGN", maximumFractionDigits: 0}).format(receipt.amount)}`,
          channel: "Portal",
          direction: "Outbound",
          status: "Unread",
          recipient: paymentRequest.order.phone,
          source: "Receipt issued",
          relatedType: "Receipt",
          relatedId: receipt.id,
        },
      });
    }

    if (receipt.buyerEmail) {
      await sendTransactionalEmail({deduplicationKey: `receipt:${receipt.id}`, template: "receipt-issued", to: receipt.buyerEmail, content: emailTemplates.receiptIssued(receipt.buyerName, receipt.code, new Intl.NumberFormat("en-NG", {style: "currency", currency: "NGN", maximumFractionDigits: 0}).format(receipt.amount), getEmailBaseUrl()), relatedType: "Receipt", relatedId: receipt.id});
    }
  }

  revalidatePath("/admin/payment-requests");
  revalidatePath(`/admin/orders/${paymentRequest.orderId}`);
  revalidatePath("/buyer-account/payments");
  revalidatePath(`/buyer-account/orders/${paymentRequest.orderId}`);
  revalidatePath("/buyer-account/inbox");

  redirect("/admin/payment-requests?receipt=issued");
}
