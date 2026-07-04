"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {createAuditLog} from "@/lib/auditLog";

function readText(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

function readNumber(formData: FormData, key: string) {
  const value = formData.get(key);
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? Math.round(numberValue) : 0;
}

export async function createCustomerAction(formData: FormData) {
  const name = readText(formData, "name");
  const phone = readText(formData, "phone");
  const email = readText(formData, "email");
  const buyerType = readText(formData, "buyerType", "Individual");
  const location = readText(formData, "location");
  const paymentTerms = readText(formData, "paymentTerms", "Full payment before order allocation");
  const creditLimit = readNumber(formData, "creditLimit");
  const outstandingBalance = readNumber(formData, "outstandingBalance");
  const accountStatus = readText(formData, "accountStatus", "Manual WhatsApp");
  const accountLoginReady = readBoolean(formData, "accountLoginReady");
  const receiptEmail = readText(formData, "receiptEmail");
  const status = readText(formData, "status", "Active");

  if (!name || !phone) {
    throw new Error("Customer name and phone are required.");
  }

  const customer = await prisma.customer.create({
    data: {
      name,
      phone,
      email: email || null,
      buyerType,
      location: location || null,
      paymentTerms,
      creditLimit,
      outstandingBalance,
      accountStatus,
      accountLoginReady,
      receiptEmail: receiptEmail || email || null,
      status,
    },
  });

  await createAuditLog({
    action: "Created customer",
    entityType: "Customer",
    entityId: customer.id,
    entityLabel: customer.name,
    newValue: customer,
  });

  revalidatePath("/admin/customers");
  revalidatePath("/admin/buyer-accounts");
  revalidatePath("/admin/audit-log");
  redirect("/admin/customers");
}

export async function createProductAction(formData: FormData) {
  const name = readText(formData, "name");
  const category = readText(formData, "category", "Fresh produce");
  const unit = readText(formData, "unit", "kg");
  const grade = readText(formData, "grade", "Standard");
  const basePrice = readNumber(formData, "basePrice");
  const availability = readText(formData, "availability", "Available");
  const status = readText(formData, "status", "Active");

  if (!name) {
    throw new Error("Product name is required.");
  }

  const product = await prisma.product.create({
    data: {
      name,
      category,
      unit,
      grade,
      basePrice,
      availability,
      status,
    },
  });

  await createAuditLog({
    action: "Created product",
    entityType: "Product",
    entityId: product.id,
    entityLabel: product.name,
    newValue: product,
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/audit-log");
  redirect("/admin/products");
}

export async function createSupplierAction(formData: FormData) {
  const name = readText(formData, "name");
  const type = readText(formData, "type", "Farm / supply partner");
  const phone = readText(formData, "phone");
  const location = readText(formData, "location");
  const produceFocus = readText(formData, "produceFocus");
  const reliability = readText(formData, "reliability", "Unrated");
  const paymentMethod = readText(formData, "paymentMethod", "Bank transfer");
  const status = readText(formData, "status", "Active");

  if (!name || !location || !produceFocus) {
    throw new Error("Supplier name, location, and produce focus are required.");
  }

  const supplier = await prisma.supplier.create({
    data: {
      name,
      type,
      phone: phone || null,
      location,
      produceFocus,
      reliability,
      paymentMethod,
      status,
    },
  });

  await createAuditLog({
    action: "Created supplier",
    entityType: "Supplier",
    entityId: supplier.id,
    entityLabel: supplier.name,
    newValue: supplier,
  });

  revalidatePath("/admin/suppliers");
  revalidatePath("/admin/audit-log");
  redirect("/admin/suppliers");
}


export async function createStaffUserAction(formData: FormData) {
  const name = readText(formData, "name");
  const email = readText(formData, "email");
  const role = readText(formData, "role", "Operations");
  const status = readText(formData, "status", "Active");

  if (!name || !email) {
    throw new Error("Staff name and email are required.");
  }

  const staffUser = await prisma.staffUser.create({
    data: {
      name,
      email,
      role,
      status,
    },
  });

  await createAuditLog({
    action: "Created staff user",
    entityType: "StaffUser",
    entityId: staffUser.id,
    entityLabel: staffUser.email,
    newValue: staffUser,
    actorRole: "Super admin",
  });

  revalidatePath("/admin/staff");
  revalidatePath("/admin/audit-log");
  redirect("/admin/staff");
}

export async function updateCustomerAccountAction(formData: FormData) {
  const customerId = readText(formData, "customerId");
  const paymentTerms = readText(formData, "paymentTerms", "Full payment before order allocation");
  const creditLimit = readNumber(formData, "creditLimit");
  const outstandingBalance = readNumber(formData, "outstandingBalance");
  const accountStatus = readText(formData, "accountStatus", "Manual WhatsApp");
  const accountLoginReady = readBoolean(formData, "accountLoginReady");
  const receiptEmail = readText(formData, "receiptEmail");
  const status = readText(formData, "status", "Active");

  if (!customerId) {
    throw new Error("Customer is required.");
  }

  const existingCustomer = await prisma.customer.findUnique({
    where: {id: customerId},
  });

  if (!existingCustomer) {
    throw new Error("Customer not found.");
  }

  const updatedCustomer = await prisma.customer.update({
    where: {id: customerId},
    data: {
      paymentTerms,
      creditLimit,
      outstandingBalance,
      accountStatus,
      accountLoginReady,
      receiptEmail: receiptEmail || null,
      status,
      approvedAt:
        accountLoginReady && !existingCustomer.approvedAt
          ? new Date()
          : existingCustomer.approvedAt,
      approvedBy:
        accountLoginReady && !existingCustomer.approvedBy
          ? "Local admin"
          : existingCustomer.approvedBy,
    },
  });

  await createAuditLog({
    action: "Updated buyer account",
    entityType: "Customer",
    entityId: updatedCustomer.id,
    entityLabel: updatedCustomer.name,
    previousValue: {
      paymentTerms: existingCustomer.paymentTerms,
      creditLimit: existingCustomer.creditLimit,
      outstandingBalance: existingCustomer.outstandingBalance,
      accountStatus: existingCustomer.accountStatus,
      accountLoginReady: existingCustomer.accountLoginReady,
      receiptEmail: existingCustomer.receiptEmail,
      status: existingCustomer.status,
    },
    newValue: {
      paymentTerms: updatedCustomer.paymentTerms,
      creditLimit: updatedCustomer.creditLimit,
      outstandingBalance: updatedCustomer.outstandingBalance,
      accountStatus: updatedCustomer.accountStatus,
      accountLoginReady: updatedCustomer.accountLoginReady,
      receiptEmail: updatedCustomer.receiptEmail,
      status: updatedCustomer.status,
    },
    actorRole: "Buyer account manager",
  });

  revalidatePath("/admin/customers");
  revalidatePath("/admin/buyer-accounts");
  revalidatePath("/admin/audit-log");
  revalidatePath(`/admin/customers/${customerId}`);
  redirect(`/admin/customers/${customerId}`);
}

function makeInviteCode(customerName: string) {
  const cleanName = customerName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6) || "BUYER";

  return `INV-${cleanName}-${String(Date.now()).slice(-6)}`;
}

export async function createBuyerContactAction(formData: FormData) {
  const customerId = readText(formData, "customerId");
  const name = readText(formData, "name");
  const email = readText(formData, "email");
  const phone = readText(formData, "phone");
  const role = readText(formData, "role", "Buyer user");
  const canPlaceOrders = readBoolean(formData, "canPlaceOrders");
  const canViewReceipts = readBoolean(formData, "canViewReceipts");
  const canViewCredit = readBoolean(formData, "canViewCredit");
  const status = readText(formData, "status", "Active");

  if (!customerId || !name) {
    throw new Error("Customer and contact name are required.");
  }

  const customer = await prisma.customer.findUnique({
    where: {id: customerId},
  });

  if (!customer) {
    throw new Error("Customer not found.");
  }

  const contact = await prisma.buyerContact.create({
    data: {
      customerId,
      name,
      email: email || null,
      phone: phone || null,
      role,
      canPlaceOrders,
      canViewReceipts,
      canViewCredit,
      status,
    },
  });

  await createAuditLog({
    action: "Created buyer contact",
    entityType: "BuyerContact",
    entityId: contact.id,
    entityLabel: `${customer.name} · ${contact.name}`,
    newValue: contact,
    actorRole: "Buyer account manager",
  });

  revalidatePath("/admin/buyer-access");
  revalidatePath("/admin/buyer-accounts");
  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/audit-log");
  redirect("/admin/buyer-access");
}

export async function createBuyerAccountInviteAction(formData: FormData) {
  const customerId = readText(formData, "customerId");
  const email = readText(formData, "email");
  const phone = readText(formData, "phone");
  const role = readText(formData, "role", "Buyer user");
  const status = readText(formData, "status", "Draft");

  if (!customerId) {
    throw new Error("Customer is required.");
  }

  const customer = await prisma.customer.findUnique({
    where: {id: customerId},
  });

  if (!customer) {
    throw new Error("Customer not found.");
  }

  if (!email && !phone) {
    throw new Error("Invite email or phone is required.");
  }

  const invite = await prisma.buyerAccountInvite.create({
    data: {
      customerId,
      inviteCode: makeInviteCode(customer.name),
      email: email || null,
      phone: phone || null,
      role,
      status,
      createdBy: "Local staff user",
    },
  });

  await createAuditLog({
    action: "Created buyer account invite",
    entityType: "BuyerAccountInvite",
    entityId: invite.id,
    entityLabel: `${customer.name} · ${invite.inviteCode}`,
    newValue: invite,
    actorRole: "Buyer account manager",
  });

  revalidatePath("/admin/buyer-access");
  revalidatePath("/admin/buyer-accounts");
  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/audit-log");
  redirect("/admin/buyer-access");
}
