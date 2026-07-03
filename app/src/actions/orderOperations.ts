"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {createAuditLog} from "@/lib/auditLog";

function readText(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readNumber(formData: FormData, key: string) {
  const value = formData.get(key);
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? Math.round(numberValue) : 0;
}

function makePaymentReference(orderCode: string) {
  return `PAY-${orderCode}-${String(Date.now()).slice(-6)}`;
}

async function makeComplaintCode() {
  const count = await prisma.complaint.count();
  return `CMP-${String(count + 1).padStart(3, "0")}`;
}

async function makeReceiptCode() {
  const count = await prisma.receipt.count();
  return `RCT-${String(count + 1).padStart(4, "0")}`;
}

export async function createPaymentAction(formData: FormData) {
  const orderId = readText(formData, "orderId");
  const orderCode = readText(formData, "orderCode");
  const provider = readText(formData, "provider", "Manual transfer");
  const amount = readNumber(formData, "amount");
  const status = readText(formData, "status", "Fully paid");
  const referenceInput = readText(formData, "reference");

  if (!orderId || !orderCode || amount <= 0) {
    throw new Error("Order, order code, and payment amount are required.");
  }

  const reference = referenceInput || makePaymentReference(orderCode);
  const isPaid = status.toLowerCase().includes("paid") || status.toLowerCase().includes("approved");

  await prisma.payment.create({
    data: {
      orderId,
      reference,
      provider,
      amount,
      status,
      paidAt: isPaid ? new Date() : null,
    },
  });

  if (isPaid) {
    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        paymentStatus: status,
      },
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/payments");
  revalidatePath(`/admin/orders/${orderCode}`);
  redirect(`/admin/orders/${orderCode}`);
}

export async function createComplaintAction(formData: FormData) {
  const orderId = readText(formData, "orderId");
  const orderCode = readText(formData, "orderCode");
  const issue = readText(formData, "issue");
  const priority = readText(formData, "priority", "Medium");
  const status = readText(formData, "status", "Open");
  const resolution = readText(formData, "resolution");

  if (!orderId || !orderCode || !issue) {
    throw new Error("Order and complaint issue are required.");
  }

  const code = await makeComplaintCode();

  await prisma.complaint.create({
    data: {
      orderId,
      code,
      issue,
      priority,
      status,
      resolution: resolution || null,
    },
  });

  await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      fulfilmentStatus: status === "Open" ? "Issue reported" : undefined,
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/complaints");
  revalidatePath(`/admin/orders/${orderCode}`);
  redirect(`/admin/orders/${orderCode}`);
}

export async function createPickupLocationAction(formData: FormData) {
  const name = readText(formData, "name");
  const area = readText(formData, "area");
  const address = readText(formData, "address");
  const fee = readNumber(formData, "fee");
  const days = readText(formData, "days", "To be confirmed");
  const status = readText(formData, "status", "Active");

  if (!name || !area || !address) {
    throw new Error("Pickup location name, area, and address are required.");
  }

  await prisma.pickupLocation.create({
    data: {
      name,
      area,
      address,
      fee,
      days,
      status,
    },
  });

  revalidatePath("/admin/pickup-locations");
  redirect("/admin/pickup-locations");
}


export async function issueReceiptAction(formData: FormData) {
  const orderId = readText(formData, "orderId");
  const paymentIdInput = readText(formData, "paymentId");
  const amountInput = readNumber(formData, "amount");
  const buyerEmailInput = readText(formData, "buyerEmail");
  const issuedBy = readText(formData, "issuedBy", "Local admin");

  if (!orderId) {
    throw new Error("Order is required.");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  const selectedPayment = paymentIdInput
    ? order.payments.find((payment) => payment.id === paymentIdInput)
    : order.payments[0];

  const amount = amountInput || selectedPayment?.amount || order.estimatedTotal;

  if (amount <= 0) {
    throw new Error("Receipt amount must be greater than zero.");
  }

  const code = await makeReceiptCode();

  const receipt = await prisma.receipt.create({
    data: {
      code,
      orderId: order.id,
      customerId: order.customerId || null,
      paymentId: selectedPayment?.id || null,
      buyerName: order.buyerName,
      buyerEmail:
        buyerEmailInput ||
        order.customer?.receiptEmail ||
        order.customer?.email ||
        null,
      amount,
      issuedBy,
      status: "Issued",
    },
  });

  await createAuditLog({
    action: "Issued receipt",
    entityType: "Receipt",
    entityId: receipt.id,
    entityLabel: receipt.code,
    newValue: {
      orderCode: order.code,
      buyerName: receipt.buyerName,
      amount: receipt.amount,
      buyerEmail: receipt.buyerEmail,
      paymentReference: selectedPayment?.reference || null,
    },
    actorRole: "Finance",
  });

  revalidatePath("/admin/receipts");
  revalidatePath("/admin/buyer-accounts");
  revalidatePath("/admin/audit-log");
  revalidatePath(`/admin/orders/${order.code}`);
  redirect("/admin/receipts");
}
