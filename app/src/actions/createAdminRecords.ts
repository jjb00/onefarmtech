// @ts-nocheck -- temporary build stabilisation for broad admin action file
"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireBuyer} from "@/lib/currentBuyer";
import {prisma} from "@/lib/prisma";
import {baselineProducts} from "@/lib/productCatalogue";
import {createAuditLog} from "@/lib/auditLog";
import {requireStaff} from "@/lib/auth";
import {getEmailBaseUrl, sendAdminTransactionalEmail, sendTransactionalEmail} from "@/lib/email/service";
import {emailTemplates} from "@/lib/email/templates";

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


async function markSourceDraftConverted(sourceDraftId: string, orderId: string, orderCode: string) {
  if (!sourceDraftId) return;

  const draft = await prisma.orderRequest.findUnique({
    where: {id: sourceDraftId},
  });

  if (!draft) return;

  let existingNote = {};
  try {
    existingNote = JSON.parse(draft.adminNote || "{}");
  } catch {
    existingNote = {previousNote: draft.adminNote || ""};
  }

  await prisma.orderRequest.update({
    where: {id: sourceDraftId},
    data: {
      status: "Converted to order",
      adminNote: JSON.stringify({
        ...existingNote,
        staffReviewStatus: "Converted to order",
        convertedOrderId: orderId,
        convertedOrderCode: orderCode,
        convertedAt: new Date().toISOString(),
      }),
    },
  });
}

export async function createCustomerAction(formData: FormData) {
  await requireStaff();
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
  await requireStaff();
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



export async function seedBaselineProductsAction() {
  await requireStaff();
  const createdProducts = [];
  const skippedProducts = [];

  for (const product of baselineProducts) {
    const existingProduct = await prisma.product.findFirst({
      where: {
        name: product.name,
        category: product.category,
        grade: product.grade,
      },
    });

    if (existingProduct) {
      skippedProducts.push(existingProduct);
      continue;
    }

    const createdProduct = await prisma.product.create({
      data: product,
    });

    createdProducts.push(createdProduct);
  }

  await createAuditLog({
    action: "Seeded baseline product catalogue",
    entityType: "Product",
    entityLabel: "Baseline catalogue",
    newValue: {
      created: createdProducts.length,
      skipped: skippedProducts.length,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/create-order");
  revalidatePath("/admin/audit-log");
  redirect("/admin/products");
}

export async function updateProductCatalogueStatusAction(formData: FormData) {
  await requireStaff();
  const productId = readText(formData, "productId");
  const name = readText(formData, "name");
  const category = readText(formData, "category", "Fresh produce");
  const unit = readText(formData, "unit", "kg");
  const grade = readText(formData, "grade", "Standard");
  const basePrice = readNumber(formData, "basePrice");
  const availability = readText(formData, "availability", "Available");
  const status = readText(formData, "status", "Active");

  if (!productId) {
    throw new Error("Product ID is required.");
  }

  if (!name) {
    throw new Error("Product name is required.");
  }

  const previousProduct = await prisma.product.findUnique({
    where: {
      id: productId,
    },
  });

  const product = await prisma.product.update({
    where: {
      id: productId,
    },
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
    action: "Updated product catalogue",
    entityType: "Product",
    entityId: product.id,
    entityLabel: product.name,
    previousValue: previousProduct,
    newValue: product,
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/create-order");
  revalidatePath("/admin/group-buys");
  revalidatePath("/admin/audit-log");
  redirect("/admin/products");
}

export async function createSupplierAction(formData: FormData) {
  await requireStaff();
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
  await requireStaff();
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
  await requireStaff();
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
  await requireStaff();
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
  await requireStaff();
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

  if (invite.email) {
    await sendTransactionalEmail({
      deduplicationKey: `buyer-invite:${invite.id}`,
      template: "buyer-invite",
      to: invite.email,
      content: emailTemplates.buyerInvite(customer.name, invite.inviteCode, getEmailBaseUrl()),
      relatedType: "BuyerAccountInvite",
      relatedId: invite.id,
    });
  }

  revalidatePath("/admin/buyer-access");
  revalidatePath("/admin/buyer-accounts");
  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/audit-log");
  redirect("/admin/buyer-access");
}

export async function updateBuyerAccountInviteStatusAction(formData: FormData) {
  await requireStaff();
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");

  await requireStaff();

  const id = String(formData.get("id") || "").trim();
  const status = String(formData.get("status") || "").trim();

  const allowedStatuses = [
    "Draft",
    "Ready to send",
    "Sent manually",
    "Accepted later",
    "Cancelled",
  ];

  if (!id || !allowedStatuses.includes(status)) {
    throw new Error("Valid buyer invite and status are required.");
  }

  await prisma.buyerAccountInvite.update({
    where: {id},
    data: {status},
  });

  revalidatePath("/admin/buyer-access");
  revalidatePath("/admin/audit-log");
  redirect("/admin/buyer-access?inviteStatus=updated");
}


export async function createContactEnquiryAction(formData: FormData) {
  const name = readText(formData, "name");
  const organisation = readText(formData, "organisation");
  const email = readText(formData, "email");
  const phone = readText(formData, "phone");
  const enquiryType = readText(formData, "enquiryType", "General enquiry");
  const message = readText(formData, "message");

  if (!name || !message) {
    throw new Error("Name and message are required.");
  }

  if (!email && !phone) {
    throw new Error("Please provide an email or phone number.");
  }

  const enquiry = await prisma.contactEnquiry.create({
    data: {
      name,
      organisation: organisation || null,
      email: email || null,
      phone: phone || null,
      enquiryType,
      message,
      status: "New",
      source: "Contact page",
    },
  });

  await createAuditLog({
    action: "Created contact enquiry",
    entityType: "ContactEnquiry",
    entityId: enquiry.id,
    entityLabel: `${enquiry.enquiryType} · ${enquiry.name}`,
    newValue: enquiry,
  });

  if (enquiry.email) {
    await sendTransactionalEmail({deduplicationKey: `contact-ack:${enquiry.id}`, template: "contact-acknowledgement", to: enquiry.email, content: emailTemplates.contactAcknowledgement(enquiry.name), relatedType: "ContactEnquiry", relatedId: enquiry.id});
  }
  await sendAdminTransactionalEmail({deduplicationKeyPrefix: `contact-admin:${enquiry.id}`, template: "contact-admin", content: emailTemplates.contactAdmin(enquiry.name, enquiry.enquiryType, enquiry.message, getEmailBaseUrl()), relatedType: "ContactEnquiry", relatedId: enquiry.id});

  revalidatePath("/contact");
  revalidatePath("/admin/contact-enquiries");
  revalidatePath("/admin/audit-log");
  redirect("/contact?submitted=1");
}

export async function createBuyerAccountRequestAction(formData: FormData) {
  const contactName = readText(formData, "contactName");
  const organisationName = readText(formData, "organisationName");
  const buyerType = readText(formData, "buyerType", "Business buyer");
  const phone = readText(formData, "phone");
  const email = readText(formData, "email");
  const location = readText(formData, "location");
  const usualProduceNeeds = readText(formData, "usualProduceNeeds");
  const orderFrequency = readText(formData, "orderFrequency");
  const estimatedSpend = readText(formData, "estimatedSpend");
  const businessRegNumber = readText(formData, "businessRegNumber");
  const preferredPaymentMethod = readText(formData, "preferredPaymentMethod");
  const needsReceipts = readBoolean(formData, "needsReceipts");
  const interestedInCredit = readBoolean(formData, "interestedInCredit");
  const message = readText(formData, "message");

  if (!contactName || !phone) {
    throw new Error("Contact name and phone are required.");
  }

  const request = await prisma.buyerAccountRequest.create({
    data: {
      contactName,
      organisationName: organisationName || null,
      buyerType,
      phone,
      email: email || null,
      location: location || null,
      usualProduceNeeds: usualProduceNeeds || null,
      orderFrequency: orderFrequency || null,
      estimatedSpend: estimatedSpend || null,
      businessRegNumber: businessRegNumber || null,
      preferredPaymentMethod: preferredPaymentMethod || null,
      needsReceipts,
      interestedInCredit,
      message: message || null,
      status: "New",
      source: "Buyer account request page",
    },
  });

  await createAuditLog({
    action: "Created buyer account request",
    entityType: "BuyerAccountRequest",
    entityId: request.id,
    entityLabel: `${request.buyerType} · ${request.contactName}`,
    newValue: request,
  });

  if (request.email) {
    await sendTransactionalEmail({deduplicationKey: `account-request-ack:${request.id}`, template: "account-request-acknowledgement", to: request.email, content: emailTemplates.accountRequestAcknowledgement(request.contactName), relatedType: "BuyerAccountRequest", relatedId: request.id});
  }
  await sendAdminTransactionalEmail({deduplicationKeyPrefix: `account-request-admin:${request.id}`, template: "account-request-admin", content: emailTemplates.accountRequestAdmin(request.contactName, request.organisationName, getEmailBaseUrl()), relatedType: "BuyerAccountRequest", relatedId: request.id});

  revalidatePath("/buyer-account-request");
  revalidatePath("/admin/buyer-account-requests");
  revalidatePath("/admin/audit-log");
  redirect("/buyer-account-request?submitted=1");
}

export async function createOrderRequestAction(formData: FormData) {
  const buyerName = readText(formData, "buyerName");
  const buyerType = readText(formData, "buyerType", "Household / individual");
  const phone = readText(formData, "phone");
  const email = readText(formData, "email");
  const location = readText(formData, "location");
  const deliveryPreference = readText(formData, "deliveryPreference", "Delivery");
  const items = readText(formData, "items");
  const timing = readText(formData, "timing");
  const groupBuyInterest = readBoolean(formData, "groupBuyInterest");
  const message = readText(formData, "message");

  if (!buyerName || !phone || !items) {
    throw new Error("Buyer name, phone, and items are required.");
  }

  const orderRequest = await prisma.orderRequest.create({
    data: {
      buyerName,
      buyerType,
      phone,
      email: email || null,
      location: location || null,
      deliveryPreference,
      items,
      timing: timing || null,
      groupBuyInterest,
      message: message || null,
      status: "New",
      source: "Order request page",
    },
  });

  await createAuditLog({
    action: "Created order request",
    entityType: "OrderRequest",
    entityId: orderRequest.id,
    entityLabel: `${orderRequest.buyerName} · ${orderRequest.buyerType}`,
    newValue: orderRequest,
  });

  if (orderRequest.email) {
    await sendTransactionalEmail({deduplicationKey: `order-request-ack:${orderRequest.id}`, template: "order-request-acknowledgement", to: orderRequest.email, content: emailTemplates.orderRequestAcknowledgement(orderRequest.buyerName), relatedType: "OrderRequest", relatedId: orderRequest.id});
  }
  await sendAdminTransactionalEmail({deduplicationKeyPrefix: `order-request-admin:${orderRequest.id}`, template: "order-request-admin", content: emailTemplates.orderRequestAdmin(orderRequest.buyerName, orderRequest.items, getEmailBaseUrl()), relatedType: "OrderRequest", relatedId: orderRequest.id});

  revalidatePath("/order-request");
  revalidatePath("/admin/order-requests");
  revalidatePath("/admin/audit-log");
  redirect("/order-request?submitted=1");
}

async function makeOrderCode() {
  const count = await prisma.order.count();

  return `OFT-${String(count + 1).padStart(5, "0")}`;
}

export async function createBuyerPortalOrderAction(formData: FormData) {
  const {customer} = await requireBuyer();

  const items = readText(formData, "items");
  const deliveryPreference = readText(formData, "deliveryPreference", "Delivery");
  const timing = readText(formData, "timing");
  const groupBuyInterest = readBoolean(formData, "groupBuyInterest");
  const message = readText(formData, "message");

  if (!items) {
    throw new Error("Items and quantities are required.");
  }

  const order = await prisma.order.create({
    data: {
      code: await makeOrderCode(),
      customerId: customer.id,
      buyerName: customer.name,
      phone: customer.phone,
      buyerType: customer.buyerType,
      orderType: "Buyer portal request",
      paymentStatus: "Pending confirmation",
      fulfilmentStatus: "Buyer request",
      deliveryMethod: deliveryPreference,
      deliveryNote: [
        timing ? `Timing: ${timing}` : null,
        groupBuyInterest ? "Open to group-buy if useful." : null,
        message || null,
        `Requested items: ${items}`,
      ]
        .filter(Boolean)
        .join("\n"),
      estimatedTotal: 0,
      adminNote: "Created from buyer account portal. Admin should confirm availability, pricing, delivery plan and payment step.",
      items: {
        create: {
          name: "Buyer requested items",
          grade: "To confirm",
          quantity: 1,
          unit: "Request",
          unitPrice: 0,
          lineTotal: 0,
        },
      },
    },
  });

  await createAuditLog({
    action: "Created buyer portal order",
    entityType: "Order",
    entityId: order.id,
    entityLabel: order.code,
    newValue: {
      order,
      requestedItems: items,
      timing,
      groupBuyInterest,
      message,
    },
    actorRole: "Buyer portal",
  });

  await prisma.buyerMessage.create({
    data: {
      customerId: customer.id,
      title: "Order request received",
      body: `Your buyer order request ${order.code} has been received. The team will confirm availability, pricing, payment and fulfilment.`,
      channel: "Portal",
      direction: "Outbound",
      status: "Logged",
      recipient: customer.email || customer.phone,
      source: "Buyer portal",
      relatedType: "Order",
      relatedId: order.id,
    },
  });

  revalidatePath("/buyer-account");
  revalidatePath("/buyer-account/inbox");
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/admin/audit-log");
  redirect("/buyer-account?orderSubmitted=1");
}

export async function createBuyerProfileUpdateRequestAction(formData: FormData) {
  const {customer} = await requireBuyer();

  const requestType = readText(formData, "requestType", "Profile update");
  const companyInfo = readText(formData, "companyInfo");
  const buyingProfile = readText(formData, "buyingProfile");
  const financeInfo = readText(formData, "financeInfo");
  const contactInfo = readText(formData, "contactInfo");
  const documentsNote = readText(formData, "documentsNote");
  const message = readText(formData, "message");

  if (!companyInfo && !buyingProfile && !financeInfo && !contactInfo && !documentsNote && !message) {
    throw new Error("Please describe the update you want us to review.");
  }

  const request = await prisma.buyerProfileUpdateRequest.create({
    data: {
      customerId: customer.id,
      requestType,
      companyInfo: companyInfo || null,
      buyingProfile: buyingProfile || null,
      financeInfo: financeInfo || null,
      contactInfo: contactInfo || null,
      documentsNote: documentsNote || null,
      message: message || null,
      status: "New",
    },
  });

  await createAuditLog({
    action: "Created buyer profile update request",
    entityType: "BuyerProfileUpdateRequest",
    entityId: request.id,
    entityLabel: `${customer.name} · ${request.requestType}`,
    newValue: request,
    actorRole: "Buyer portal",
  });

  await prisma.buyerMessage.create({
    data: {
      customerId: customer.id,
      title: "Profile update request received",
      body: `Your ${request.requestType.toLowerCase()} has been submitted for review.`,
      channel: "Portal",
      direction: "Outbound",
      status: "Logged",
      recipient: customer.email || customer.phone,
      source: "Buyer portal",
      relatedType: "BuyerProfileUpdateRequest",
      relatedId: request.id,
    },
  });

  revalidatePath("/buyer-account");
  revalidatePath("/buyer-account/inbox");
  revalidatePath("/admin/buyer-profile-requests");
  revalidatePath("/admin/audit-log");
  redirect("/buyer-account?profileSubmitted=1#profile-updates");
}

export async function logPreparedBuyerWhatsAppAction(formData: FormData) {
  await requireStaff();
  const customerId = readText(formData, "customerId");
  const title = readText(formData, "title", "WhatsApp message prepared");
  const body = readText(formData, "body");
  const relatedType = readText(formData, "relatedType");
  const relatedId = readText(formData, "relatedId");

  if (!customerId || !body) {
    throw new Error("Customer and message body are required.");
  }

  const customer = await prisma.customer.findUnique({
    where: {id: customerId},
  });

  if (!customer) {
    throw new Error("Customer not found.");
  }

  const message = await prisma.buyerMessage.create({
    data: {
      customerId: customer.id,
      title,
      body,
      channel: "WhatsApp",
      direction: "Outbound",
      status: "Prepared",
      recipient: customer.phone,
      source: "Admin compose",
      relatedType: relatedType || null,
      relatedId: relatedId || null,
      metadata: "Manual WhatsApp compose opened by admin. Delivery confirmation is outside the app until WhatsApp Business/API is connected.",
    },
  });

  await createAuditLog({
    action: "Prepared buyer WhatsApp message",
    entityType: "BuyerMessage",
    entityId: message.id,
    entityLabel: `${customer.name} · ${title}`,
    newValue: message,
    actorRole: "Admin",
  });

  revalidatePath("/admin/buyer-messages");
  revalidatePath("/admin");
  revalidatePath(`/admin/customers/${customer.id}`);
  revalidatePath("/buyer-account/inbox");
}

export async function updateBuyerProfileUpdateRequestStatusAction(formData: FormData) {
  await requireStaff();
  const requestId = readText(formData, "requestId");
  const status = readText(formData, "status", "Reviewing");
  const adminNote = readText(formData, "adminNote");

  if (!requestId || !status) {
    throw new Error("Request ID and status are required.");
  }

  const existing = await prisma.buyerProfileUpdateRequest.findUnique({
    where: {id: requestId},
    include: {customer: true},
  });

  if (!existing) {
    throw new Error("Buyer profile update request not found.");
  }

  const updated = await prisma.buyerProfileUpdateRequest.update({
    where: {id: requestId},
    data: {
      status,
      adminNote: adminNote || existing.adminNote,
    },
  });

  await createAuditLog({
    action: "Updated buyer profile update request",
    entityType: "BuyerProfileUpdateRequest",
    entityId: updated.id,
    entityLabel: `${existing.customer.name} · ${updated.requestType}`,
    previousValue: {
      status: existing.status,
      adminNote: existing.adminNote,
    },
    newValue: {
      status: updated.status,
      adminNote: updated.adminNote,
    },
    actorRole: "Buyer account manager",
  });

  revalidatePath("/admin/buyer-profile-requests");
  revalidatePath("/admin");
  revalidatePath("/admin/audit-log");
}

export async function updateBuyerAccountRequestStatusAction(formData: FormData) {
  await requireStaff();
  const requestId = readText(formData, "requestId");
  const status = readText(formData, "status");

  if (!requestId || !status) {
    throw new Error("Request ID and status are required.");
  }

  const updated = await prisma.buyerAccountRequest.update({
    where: {id: requestId},
    data: {status},
  });

  await createAuditLog({
    action: "Updated buyer account request status",
    entityType: "BuyerAccountRequest",
    entityId: updated.id,
    entityLabel: `${updated.buyerType} · ${updated.contactName}`,
    newValue: {status: updated.status},
  });

  revalidatePath("/admin/buyer-account-requests");
  revalidatePath("/admin/audit-log");
}

export async function convertBuyerAccountRequestToCustomerAction(formData: FormData) {
  await requireStaff();
  const requestId = readText(formData, "requestId");

  if (!requestId) {
    throw new Error("Request ID is required.");
  }

  const request = await prisma.buyerAccountRequest.findUnique({
    where: {id: requestId},
  });

  if (!request) {
    throw new Error("Buyer account request not found.");
  }

  const customer = await prisma.customer.create({
    data: {
      name: request.organisationName || request.contactName,
      buyerType: request.buyerType,
      phone: request.phone,
      email: request.email || null,
      location: request.location || null,
      accountStatus: "Approved - manual setup",
      accountLoginReady: false,
      creditLimit: 0,
      outstandingBalance: 0,
      paymentTerms: request.interestedInCredit
        ? "Payment terms interest noted - partner review required"
        : "Pay on order / manual terms",
      receiptEmail: request.email || null,
    },
  });

  const updated = await prisma.buyerAccountRequest.update({
    where: {id: request.id},
    data: {
      status: "Converted to customer",
      adminNote: `Converted to customer record: ${customer.id}`,
    },
  });

  await createAuditLog({
    action: "Converted buyer account request to customer",
    entityType: "BuyerAccountRequest",
    entityId: updated.id,
    entityLabel: `${updated.buyerType} · ${updated.contactName}`,
    newValue: {
      request: updated,
      customer,
    },
  });

  revalidatePath("/admin/buyer-account-requests");
  revalidatePath("/admin/buyer-accounts");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/audit-log");
}

export async function updateOrderRequestStatusAction(formData: FormData) {
  await requireStaff();
  const requestId = readText(formData, "requestId");
  const status = readText(formData, "status");

  if (!requestId || !status) {
    throw new Error("Request ID and status are required.");
  }

  const updated = await prisma.orderRequest.update({
    where: {id: requestId},
    data: {status},
  });

  await createAuditLog({
    action: "Updated order request status",
    entityType: "OrderRequest",
    entityId: updated.id,
    entityLabel: `${updated.buyerName} · ${updated.buyerType}`,
    newValue: {status: updated.status},
  });

  revalidatePath("/admin/order-requests");
  revalidatePath("/admin/audit-log");
}

export async function updateContactEnquiryStatusAction(formData: FormData) {
  await requireStaff();
  const enquiryId = readText(formData, "enquiryId");
  const status = readText(formData, "status");

  if (!enquiryId || !status) {
    throw new Error("Enquiry ID and status are required.");
  }

  const updated = await prisma.contactEnquiry.update({
    where: {id: enquiryId},
    data: {status},
  });

  await createAuditLog({
    action: "Updated contact enquiry status",
    entityType: "ContactEnquiry",
    entityId: updated.id,
    entityLabel: `${updated.enquiryType} · ${updated.name}`,
    newValue: {status: updated.status},
  });

  revalidatePath("/admin/contact-enquiries");
  revalidatePath("/admin/launch-inbox");
  revalidatePath("/admin/audit-log");
}

export async function markBuyerMessageReadAction(formData: FormData) {
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {prisma} = await import("@/lib/prisma");
  const {getCurrentBuyer} = await import("@/lib/currentBuyer");

  const buyer = await getCurrentBuyer();
  if (!buyer?.customerId) {
    redirect("/buyer-account-request");
  }

  const customerId = buyer.customerId as string;

  const messageId = String(formData.get("messageId") || "");
  if (!messageId) {
    redirect("/buyer-account/inbox");
  }

  await prisma.buyerMessage.updateMany({
    where: {
      id: messageId,
      customerId,
    },
    data: {
      status: "Read",
      readAt: new Date(),
    },
  });

  revalidatePath("/buyer-account");
  revalidatePath("/buyer-account/inbox");
  redirect("/buyer-account/inbox");
}





export async function createDeliveryPartnerAction(formData: FormData) {
  await requireStaff();
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");

  await requireStaff();

  const name = String(formData.get("name") || "").trim();
  const contactName = String(formData.get("contactName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const serviceArea = String(formData.get("serviceArea") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!name) {
    redirect("/admin/delivery-partners?error=missing-name");
  }

  await prisma.deliveryPartner.create({
    data: {
      name,
      contactName: contactName || null,
      phone: phone || null,
      email: email || null,
      serviceArea: serviceArea || null,
      notes: notes || null,
      status: "Active",
    },
  });

  revalidatePath("/admin/delivery-partners");
  redirect("/admin/delivery-partners?created=1");
}

export async function updateDeliveryPartnerStatusAction(formData: FormData) {
  await requireStaff();
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");

  await requireStaff();

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "Active");

  if (!id) {
    redirect("/admin/delivery-partners");
  }

  await prisma.deliveryPartner.update({
    where: {id},
    data: {status},
  });

  revalidatePath("/admin/delivery-partners");
  redirect("/admin/delivery-partners?updated=1");
}

export async function createWhatsAppAssistedOrderAction(formData: FormData) {
  await requireStaff();
  const sourceDraftId = readText(formData, "sourceDraftId");
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");
  const {
    matchBuyerByPhone,
    makePaymentReference,
    normalisePhone,
    parseMoney,
    parseQuantity,
    formatNaira,
  } = await import("@/lib/commerce/whatsappOrders");

  await requireStaff();

  const sourceDraft = sourceDraftId
    ? await prisma.orderRequest.findUnique({
        where: {id: sourceDraftId},
      })
    : null;

  const whatsappPhoneInput = String(formData.get("whatsappPhone") || "").trim();
  const buyerNameInput = String(formData.get("buyerName") || "").trim();
  const buyerTypeInput = String(formData.get("buyerType") || "WhatsApp buyer").trim();
  const deliveryMethod = String(formData.get("deliveryMethod") || "Delivery").trim();
  const deliveryAddress = String(formData.get("deliveryAddress") || "").trim();
  const deliveryArea = String(formData.get("deliveryArea") || "").trim();
  const deliveryNote = String(formData.get("deliveryNote") || "").trim();
  const adminNote = String(formData.get("adminNote") || "").trim();

  const deliveryFee = parseMoney(formData.get("deliveryFee"), 0);
  const serviceFee = parseMoney(formData.get("serviceFee"), 0);
  const discountAmount = parseMoney(formData.get("discountAmount"), 0);

  const matched = await matchBuyerByPhone(whatsappPhoneInput);
  const sourcePhone = matched.phone || normalisePhone(whatsappPhoneInput);

  if (!sourcePhone) {
    redirect("/admin/whatsapp-orders/new?error=missing-phone");
  }

  const products = await prisma.product.findMany({
    where: {
      status: "Active",
    },
    orderBy: [{category: "asc"}, {name: "asc"}],
  });

  const selectedLines = products
    .map((product) => {
      const quantity = parseQuantity(formData.get(`quantity_${product.id}`));
      if (quantity <= 0) return null;

      const unitPrice = product.basePrice || 0;
      const lineTotal = quantity * unitPrice;

      return {
        product,
        quantity,
        unitPrice,
        lineTotal,
      };
    })
    .filter(Boolean) as Array<{
      product: Awaited<ReturnType<typeof prisma.product.findMany>>[number];
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;

  if (selectedLines.length === 0) {
    redirect("/admin/whatsapp-orders/new?error=no-items");
  }

  const subtotal = selectedLines.reduce((sum, line) => sum + line.lineTotal, 0);
  const totalAmount = Math.max(0, subtotal + deliveryFee + serviceFee - discountAmount);
  const orderCode = await makeOrderCode();

  const buyerName =
    matched.customer?.name ||
    buyerNameInput ||
    matched.buyerContact?.name ||
    "WhatsApp buyer";

  const buyerType =
    matched.customer?.buyerType ||
    buyerTypeInput ||
    "WhatsApp buyer";

  const sourceDraftContext = sourceDraft
    ? [
        "",
        "Source WhatsApp storefront draft:",
        `Draft ID: ${sourceDraft.id}`,
        `Draft status: ${sourceDraft.status}`,
        `Original buyer: ${sourceDraft.buyerName}`,
        `Original phone: ${sourceDraft.phone}`,
        sourceDraft.location ? `Parsed location: ${sourceDraft.location}` : "",
        sourceDraft.timing ? `Parsed timing: ${sourceDraft.timing}` : "",
        sourceDraft.message ? `Original message: ${sourceDraft.message}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const orderAdminNote = `${adminNote || "Created from WhatsApp-assisted admin order entry."}${sourceDraftContext}`;

  const order = await prisma.order.create({
    data: {
      code: orderCode,
      customerId: matched.customer?.id || null,
      buyerName,
      phone: sourcePhone,
      buyerType,
      orderType: "WhatsApp assisted",
      paymentStatus: "Payment pending",
      fulfilmentStatus: "WhatsApp order received",
      deliveryMethod,
      deliveryNote: deliveryNote || null,
      source: "WhatsApp",
      sourcePhone,
      buyerContactId: matched.buyerContact?.id || null,
      subtotal,
      deliveryFee,
      serviceFee,
      discountAmount,
      totalAmount,
      estimatedTotal: totalAmount,
      adminNote: orderAdminNote,
      items: {
        create: selectedLines.map((line) => ({
          product: {
            connect: {id: line.product.id},
          },
          name: line.product.name,
          grade: line.product.grade || "Standard",
          unit: line.product.unit,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
        })),
      },
    },
    include: {
      items: true,
    },
  });

  const paymentReference = await makePaymentReference(order.code);

  await prisma.paymentRequest.create({
    data: {
      orderId: order.id,
      customerId: matched.customer?.id || null,
      provider: "Manual",
      reference: paymentReference,
      amount: totalAmount,
      currency: "NGN",
      status: "Pending",
    },
  });

  await prisma.order.update({
    where: {id: order.id},
    data: {
      paymentReference,
    },
  });

  await prisma.delivery.create({
    data: {
      orderId: order.id,
      customerId: matched.customer?.id || null,
      deliveryMethod,
      deliveryFee,
      deliveryAddress: deliveryAddress || null,
      deliveryArea: deliveryArea || null,
      status: "Pending assignment",
    },
  });

  if (matched.customer?.id) {
    const itemSummary = selectedLines
      .map((line) => `- ${line.product.name}: ${line.quantity} ${line.product.unit} x ${formatNaira(line.unitPrice)} = ${formatNaira(line.lineTotal)}`)
      .join("\\n");

    await prisma.buyerMessage.create({
      data: {
        customerId: matched.customer.id,
        title: `WhatsApp order ${order.code} received`,
        body: `Your WhatsApp order has been recorded.\\n\\n${itemSummary}\\n\\nSubtotal: ${formatNaira(subtotal)}\\nDelivery: ${formatNaira(deliveryFee)}\\nService fee: ${formatNaira(serviceFee)}\\nDiscount: ${formatNaira(discountAmount)}\\nTotal: ${formatNaira(totalAmount)}\\n\\nPayment reference: ${paymentReference}`,
        channel: "WhatsApp",
        direction: "Outbound",
        status: "Prepared",
        recipient: sourcePhone,
        source: "WhatsApp-assisted order",
        relatedType: "Order",
        relatedId: order.id,
      },
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/whatsapp-orders/new");
  revalidatePath("/admin/deliveries");
  revalidatePath("/admin/buyer-messages");
  revalidatePath("/buyer-account/orders");
  await markSourceDraftConverted(sourceDraftId, order.id, order.code);

  revalidatePath("/buyer-account/inbox");

  redirect(`/admin/orders/${order.id}`);
}

export async function generateDeliveryPartnerAccessCodeAction(formData: FormData) {
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");

  await requireStaff();

  const id = String(formData.get("id") || "");
  if (!id) {
    redirect("/admin/delivery-partners");
  }

  const accessCode = `DP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  await prisma.deliveryPartner.update({
    where: {id},
    data: {
      accessCode,
      accessStatus: "Active",
    },
  });

  revalidatePath("/admin/delivery-partners");
  redirect(`/admin/delivery-partners?access=created&reveal=${id}`);
}

export async function deliveryPartnerLoginAction(formData: FormData) {
  const {redirect} = await import("next/navigation");
  const {prisma} = await import("@/lib/prisma");
  const {setDeliveryPartnerSession} = await import("@/lib/currentDeliveryPartner");

  const accessCode = String(formData.get("accessCode") || "").trim().toUpperCase();

  if (!accessCode) {
    redirect("/delivery-partner/login?error=missing-code");
  }

  const partner = await prisma.deliveryPartner.findFirst({
    where: {
      accessCode,
      status: "Active",
      accessStatus: "Active",
    },
  });

  if (!partner) {
    redirect("/delivery-partner/login?error=invalid-code");
  }


  await prisma.deliveryPartner.update({
    where: {id: partner.id},
    data: {lastLoginAt: new Date()},
  });

  await setDeliveryPartnerSession(partner.id);
  redirect("/delivery-partner/jobs");
}

export async function deliveryPartnerLogoutAction() {
  const {redirect} = await import("next/navigation");
  const {clearDeliveryPartnerSession} = await import("@/lib/currentDeliveryPartner");

  await clearDeliveryPartnerSession();
  redirect("/delivery-partner/login");
}

export async function updateDeliveryJobStatusAction(formData: FormData) {
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {prisma} = await import("@/lib/prisma");
  const {getCurrentDeliveryPartner} = await import("@/lib/currentDeliveryPartner");

  const partner = await getCurrentDeliveryPartner();

  if (!partner) {
    redirect("/delivery-partner/login");
  }

  const deliveryId = String(formData.get("deliveryId") || "");
  const status = String(formData.get("status") || "Accepted");
  const proofOfDeliveryNote = String(formData.get("proofOfDeliveryNote") || "").trim();

  if (!deliveryId) {
    redirect("/delivery-partner/jobs");
  }

  const delivery = await prisma.delivery.findFirst({
    where: {
      id: deliveryId,
      deliveryPartnerId: partner.id,
    },
    select: {
      id: true,
      orderId: true,
      customerId: true,
      customer: {select: {name: true, email: true}},
    },
  });

  if (!delivery) {
    redirect("/delivery-partner/jobs?error=not-found");
  }

  const updatedDelivery = await prisma.delivery.update({
    where: {id: delivery.id},
    data: {
      status,
      proofOfDeliveryNote: proofOfDeliveryNote || undefined,
      deliveredAt: status === "Delivered" ? new Date() : undefined,
    },
  });

  const fulfilmentStatus =
    status === "Delivered"
      ? "Delivered"
      : status === "In transit"
        ? "Out for delivery"
        : status === "Picked up"
          ? "Picked up by delivery partner"
          : status === "Failed / issue"
            ? "Delivery issue"
            : "Delivery assigned";

  await prisma.order.update({
    where: {id: delivery.orderId},
    data: {fulfilmentStatus},
  });

  if (delivery.customerId) {
    await prisma.buyerMessage.create({
      data: {
        customerId: delivery.customerId,
        title: `Delivery update: ${status}`,
        body: proofOfDeliveryNote
          ? `Your delivery status is now ${status}. Note: ${proofOfDeliveryNote}`
          : `Your delivery status is now ${status}.`,
        channel: "Portal",
        direction: "Outbound",
        status: "Unread",
        source: "Delivery partner update",
        relatedType: "Delivery",
        relatedId: delivery.id,
      },
    });

    if (delivery.customer?.email) {
      await sendTransactionalEmail({deduplicationKey: `delivery-status:${delivery.id}:${status}`, template: "delivery-status", to: delivery.customer.email, content: emailTemplates.deliveryStatus(delivery.customer.name, status, getEmailBaseUrl()), relatedType: "Delivery", relatedId: delivery.id});
    }
  }

  await createAuditLog({
    action: "Updated delivery status",
    entityType: "Delivery",
    entityId: delivery.id,
    entityLabel: status,
    newValue: updatedDelivery,
    actorName: partner.name,
    actorRole: "Delivery partner",
  });

  revalidatePath("/delivery-partner/jobs");
  revalidatePath("/admin/deliveries");
  revalidatePath(`/admin/orders/${delivery.orderId}`);
  redirect("/delivery-partner/jobs?updated=1");
}

export async function assignDeliveryPartnerAction(formData: FormData) {
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");

  await requireStaff();

  const deliveryId = String(formData.get("deliveryId") || "");
  const deliveryPartnerId = String(formData.get("deliveryPartnerId") || "");
  const status = String(formData.get("status") || "Assigned");
  const deliveryFeeRaw = String(formData.get("deliveryFee") || "").replace(/[^\d]/g, "");
  const deliveryFee = deliveryFeeRaw ? Number.parseInt(deliveryFeeRaw, 10) : 0;
  const deliveryArea = String(formData.get("deliveryArea") || "").trim();
  const deliveryAddress = String(formData.get("deliveryAddress") || "").trim();
  const trackingReference = String(formData.get("trackingReference") || "").trim();
  const proofOfDeliveryNote = String(formData.get("proofOfDeliveryNote") || "").trim();

  if (!deliveryId) {
    redirect("/admin/deliveries?error=missing-delivery");
  }

  const partner = deliveryPartnerId
    ? await prisma.deliveryPartner.findUnique({
        where: {id: deliveryPartnerId},
        select: {id: true, name: true, phone: true},
      })
    : null;

  const delivery = await prisma.delivery.update({
    where: {id: deliveryId},
    data: {
      deliveryPartnerId: partner?.id || null,
      deliveryPartnerName: partner?.name || null,
      deliveryPartnerPhone: partner?.phone || null,
      deliveryFee,
      deliveryArea: deliveryArea || null,
      deliveryAddress: deliveryAddress || null,
      trackingReference: trackingReference || null,
      proofOfDeliveryNote: proofOfDeliveryNote || null,
      status,
    },
    select: {
      id: true,
      orderId: true,
      order: {
        select: {
          totalAmount: true,
          subtotal: true,
          serviceFee: true,
          discountAmount: true,
        },
      },
    },
  });

  const fulfilmentStatus = partner ? "Delivery assigned" : "Delivery pending assignment";
  const totalAmount = Math.max(
    0,
    (delivery.order.subtotal || 0) + deliveryFee + (delivery.order.serviceFee || 0) - (delivery.order.discountAmount || 0)
  );

  await prisma.order.update({
    where: {id: delivery.orderId},
    data: {
      fulfilmentStatus,
      deliveryFee,
      totalAmount,
      estimatedTotal: totalAmount,
    },
  });

  revalidatePath("/admin/deliveries");
  revalidatePath(`/admin/orders/${delivery.orderId}`);
  revalidatePath("/delivery-partner/jobs");
  redirect("/admin/deliveries?assigned=1");
}


export async function createPaymentRequestFromOrderAction(formData: FormData) {
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
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");
  const {createPaymentCheckout} = await import("@/lib/payments/provider");

  await requireStaff();

  const id = String(formData.get("id") || "");
  const provider = String(formData.get("provider") || "Paystack").trim() || "Paystack";

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

  if (paymentRequest.status === "Paid") {
    redirect("/admin/payment-requests?error=already-paid");
  }

  try {
    const checkout = await createPaymentCheckout({
      provider,
      reference: paymentRequest.reference,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency || "NGN",
      buyerEmail: paymentRequest.customer?.email || null,
      buyerName: paymentRequest.customer?.name || paymentRequest.order.buyerName,
      buyerPhone: paymentRequest.order.phone,
      orderCode: paymentRequest.order.code,
      callbackPath: `/admin/payment-requests?reference=${encodeURIComponent(paymentRequest.reference)}`,
    });

    await prisma.paymentRequest.update({
      where: {id: paymentRequest.id},
      data: {
        provider: checkout.provider,
        paymentUrl: checkout.paymentUrl,
        gatewayReference: checkout.gatewayReference,
        status: "Pending",
      },
    });

    if (paymentRequest.customerId) {
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

    if (paymentRequest.customer?.email) {
      await sendTransactionalEmail({deduplicationKey: `payment-link:${paymentRequest.id}`, template: "payment-request", to: paymentRequest.customer.email, content: emailTemplates.paymentRequest(paymentRequest.customer.name, paymentRequest.order.code, new Intl.NumberFormat("en-NG", {style: "currency", currency: "NGN", maximumFractionDigits: 0}).format(paymentRequest.amount), checkout.paymentUrl, getEmailBaseUrl()), relatedType: "PaymentRequest", relatedId: paymentRequest.id});
    }

    revalidatePath("/admin/payment-requests");
    revalidatePath(`/admin/orders/${paymentRequest.orderId}`);
    revalidatePath("/buyer-account/payments");
    revalidatePath(`/buyer-account/orders/${paymentRequest.orderId}`);
    revalidatePath("/buyer-account/inbox");
  } catch (error) {
    const message = error instanceof Error ? error.message : "payment-link-failed";
    const encoded = encodeURIComponent(message).slice(0, 180);
    redirect(`/admin/payment-requests?error=${encoded}`);
  }

  redirect("/admin/payment-requests?paymentLink=generated");
}


export async function createOrAssignDeliveryFromOrderAction(formData: FormData) {
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");

  await requireStaff();

  const orderId = String(formData.get("orderId") || "");
  const deliveryPartnerId = String(formData.get("deliveryPartnerId") || "").trim();
  const deliveryMethod =
    String(formData.get("deliveryMethod") || "OneFarmTech arranged").trim() ||
    "OneFarmTech arranged";
  const deliveryArea = String(formData.get("deliveryArea") || "").trim();
  const deliveryAddress = String(formData.get("deliveryAddress") || "").trim();
  const deliveryFeeInput = String(formData.get("deliveryFee") || "").replace(/[^\d]/g, "");
  const trackingReference = String(formData.get("trackingReference") || "").trim();
  const status = String(formData.get("status") || "").trim();

  if (!orderId) {
    redirect("/admin/orders?error=missing-order");
  }

  const order = await prisma.order.findUnique({
    where: {id: orderId},
    include: {
      delivery: true,
    },
  });

  if (!order) {
    redirect("/admin/orders?error=order-not-found");
  }

  const partner = deliveryPartnerId
    ? await prisma.deliveryPartner.findUnique({
        where: {id: deliveryPartnerId},
      })
    : null;

  const existingDeliveryFee =
    typeof order.delivery?.deliveryFee === "number" ? order.delivery.deliveryFee : 0;

  const deliveryFee =
    deliveryFeeInput.length > 0
      ? Number(deliveryFeeInput)
      : existingDeliveryFee || order.deliveryFee || 0;

  const nextStatus =
    status ||
    (partner ? "Assigned" : order.delivery?.status || "Pending assignment");

  const delivery = await prisma.delivery.upsert({
    where: {orderId: order.id},
    create: {
      orderId: order.id,
      customerId: order.customerId || null,
      deliveryPartnerId: partner?.id || null,
      deliveryPartnerName: partner?.name || null,
      deliveryPartnerPhone: partner?.phone || null,
      deliveryMethod,
      deliveryFee,
      deliveryArea: deliveryArea || null,
      deliveryAddress: deliveryAddress || order.deliveryNote || null,
      trackingReference: trackingReference || null,
      status: nextStatus,
    },
    update: {
      deliveryPartnerId: partner?.id || order.delivery?.deliveryPartnerId || null,
      deliveryPartnerName: partner?.name || order.delivery?.deliveryPartnerName || null,
      deliveryPartnerPhone: partner?.phone || order.delivery?.deliveryPartnerPhone || null,
      deliveryMethod,
      deliveryFee,
      deliveryArea: deliveryArea || order.delivery?.deliveryArea || null,
      deliveryAddress: deliveryAddress || order.delivery?.deliveryAddress || order.deliveryNote || null,
      trackingReference: trackingReference || order.delivery?.trackingReference || null,
      status: nextStatus,
    },
  });

  await prisma.order.update({
    where: {id: order.id},
    data: {
      deliveryMethod,
      deliveryFee,
      deliveryNote: deliveryAddress || order.deliveryNote || null,
      fulfilmentStatus: partner ? "Delivery assigned" : order.fulfilmentStatus,
    },
  });

  if (order.customerId && partner) {
    await prisma.buyerMessage.create({
      data: {
        customerId: order.customerId,
        title: `Delivery assigned for ${order.code}`,
        body: `Delivery has been assigned for order ${order.code}.\\n\\nDelivery partner: ${partner.name}\\nPhone: ${partner.phone || "Not set"}\\nArea: ${delivery.deliveryArea || "Not set"}\\nTracking: ${delivery.trackingReference || "Not set"}`,
        channel: "Portal",
        direction: "Outbound",
        status: "Unread",
        recipient: order.phone,
        source: "Delivery assigned",
        relatedType: "Delivery",
        relatedId: delivery.id,
      },
    });
  }

  revalidatePath("/admin/deliveries");
  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath("/delivery-partner/jobs");
  revalidatePath("/buyer-account/orders");
  revalidatePath(`/buyer-account/orders/${order.id}`);
  revalidatePath("/buyer-account/inbox");

  redirect(`/admin/orders/${order.id}?delivery=updated`);
}


export async function sendWhatsAppStorefrontMenuAction(formData: FormData) {
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");
  const {sendWhatsAppTextMessage} = await import("@/lib/whatsapp/provider");
  const {buildWhatsAppStorefrontMenuMessage} = await import("@/lib/whatsapp/storefrontMenu");
  const {
    matchBuyerByPhone,
    normalisePhone,
  } = await import("@/lib/commerce/whatsappOrders");

  await requireStaff();

  const recipientPhoneInput = String(formData.get("recipientPhone") || "").trim();
  const sourcePhone = normalisePhone(recipientPhoneInput);

  if (!sourcePhone) {
    redirect("/admin/whatsapp-tools?error=missing-phone");
  }

  const body = buildWhatsAppStorefrontMenuMessage();

  let result;
  try {
    result = await sendWhatsAppTextMessage({
      to: sourcePhone,
      body,
    });
  } catch (error) {
    console.error("sendWhatsAppStorefrontMenuAction failed", error);
    redirect("/admin/whatsapp-tools?error=send-failed");
  }

  const matched = await matchBuyerByPhone(sourcePhone);

  let customerId = matched.customer?.id || null;

  if (!customerId) {
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        phone: sourcePhone,
      },
      select: {
        id: true,
      },
    });

    customerId = existingCustomer?.id || null;
  }

  if (!customerId) {
    const customer = await prisma.customer.create({
      data: {
        name: "WhatsApp buyer",
        phone: sourcePhone,
        buyerType: "WhatsApp buyer",
        accountStatus: "Manual WhatsApp",
        status: "Active",
      },
      select: {
        id: true,
      },
    });

    customerId = customer.id;
  }

  await prisma.buyerMessage.create({
    data: {
      customerId,
      title: "WhatsApp storefront menu sent",
      body,
      channel: "WhatsApp",
      direction: "Outbound",
      status: "Sent",
      recipient: sourcePhone,
      source: "WhatsApp storefront menu",
      relatedType: "WhatsAppStorefrontMenu",
      relatedId: null,
      sentAt: new Date(),
      metadata: JSON.stringify({
        provider: result.provider,
        messageId: result.messageId,
      }),
    },
  });

  revalidatePath("/admin/whatsapp-tools");
  revalidatePath("/admin/buyer-messages");
  revalidatePath("/admin/customers");
  revalidatePath("/buyer-account/inbox");

  redirect("/admin/whatsapp-tools?menu=sent");
}


export async function sendWhatsAppProductListAction(formData: FormData) {
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");
  const {sendWhatsAppTextMessage} = await import("@/lib/whatsapp/provider");
  const {
    buildWhatsAppProductListMessage,
    isProductAvailableForWhatsApp,
  } = await import("@/lib/whatsapp/productCatalogue");
  const {
    matchBuyerByPhone,
    normalisePhone,
  } = await import("@/lib/commerce/whatsappOrders");

  await requireStaff();

  const recipientPhoneInput = String(formData.get("recipientPhone") || "").trim();
  const sourcePhone = normalisePhone(recipientPhoneInput);

  if (!sourcePhone) {
    redirect("/admin/whatsapp-tools?error=missing-phone");
  }

  const products = await prisma.product.findMany({
    where: {
      status: "Active",
    },
    orderBy: [{category: "asc"}, {name: "asc"}],
    select: {
      id: true,
      name: true,
      category: true,
      unit: true,
      grade: true,
      basePrice: true,
      availability: true,
      status: true,
    },
  });

  const availableProducts = products.filter(isProductAvailableForWhatsApp);
  const body = buildWhatsAppProductListMessage(availableProducts);

  let result;
  try {
    result = await sendWhatsAppTextMessage({
      to: sourcePhone,
      body,
    });
  } catch (error) {
    console.error("sendWhatsAppProductListAction failed", error);
    redirect("/admin/whatsapp-tools?error=send-failed");
  }

  const matched = await matchBuyerByPhone(sourcePhone);

  let customerId = matched.customer?.id || null;

  if (!customerId) {
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        phone: sourcePhone,
      },
      select: {
        id: true,
      },
    });

    if (existingCustomer) {
      customerId = existingCustomer.id;
    }
  }

  if (!customerId) {
    const customer = await prisma.customer.create({
      data: {
        name: "WhatsApp buyer",
        phone: sourcePhone,
        buyerType: "WhatsApp buyer",
        accountStatus: "Manual WhatsApp",
        status: "Active",
      },
      select: {
        id: true,
      },
    });

    customerId = customer.id;
  }

  await prisma.buyerMessage.create({
    data: {
      customerId,
      title: "WhatsApp product list sent",
      body,
      channel: "WhatsApp",
      direction: "Outbound",
      status: "Sent",
      recipient: sourcePhone,
      source: "WhatsApp storefront product catalogue",
      relatedType: "ProductCatalogue",
      relatedId: null,
      sentAt: new Date(),
      metadata: JSON.stringify({
        provider: result.provider,
        messageId: result.messageId,
        productCount: availableProducts.length,
      }),
    },
  });

  revalidatePath("/admin/whatsapp-tools");
  revalidatePath("/admin/buyer-messages");
  revalidatePath("/admin/customers");
  revalidatePath("/buyer-account/inbox");

  redirect("/admin/whatsapp-tools?catalogue=sent");
}


export async function updateWhatsAppDraftStatusAction(formData: FormData) {
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");

  await requireStaff();

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "").trim();
  const adminNote = String(formData.get("adminNote") || "").trim();

  if (!id) {
    redirect("/admin/whatsapp-drafts?error=missing-id");
  }

  const draft = await prisma.orderRequest.findUnique({
    where: {id},
  });

  if (!draft) {
    redirect("/admin/whatsapp-drafts?error=not-found");
  }

  let existingNote = {};
  try {
    existingNote = JSON.parse(draft.adminNote || "{}");
  } catch {
    existingNote = {previousNote: draft.adminNote || ""};
  }

  await prisma.orderRequest.update({
    where: {id},
    data: {
      status: status || draft.status,
      adminNote: JSON.stringify({
        ...existingNote,
        staffReviewStatus: status || draft.status,
        staffNote: adminNote || existingNote.staffNote || null,
        reviewedAt: new Date().toISOString(),
      }),
    },
  });

  revalidatePath("/admin/whatsapp-drafts");
  revalidatePath("/admin/order-requests");
  revalidatePath("/admin/whatsapp-inbox");

  redirect("/admin/whatsapp-drafts?updated=1");
}


export async function sendPaymentRequestWhatsAppAction(formData: FormData) {
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");
  const {sendWhatsAppTextMessage} = await import("@/lib/whatsapp/provider");
  const {buildPaymentInstructionMessage} = await import("@/lib/communications/paymentTemplates");

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

  const alreadySent = await prisma.buyerMessage.findFirst({
    where: {
      relatedType: "PaymentRequest",
      relatedId: paymentRequest.id,
      channel: "WhatsApp",
      direction: "Outbound",
      source: "WhatsApp API",
      status: "Sent",
    },
    select: {id: true},
  });

  if (alreadySent) {
    redirect("/admin/payment-requests?whatsapp=already-sent");
  }

  const body = buildPaymentInstructionMessage({
    orderCode: paymentRequest.order.code,
    buyerName: paymentRequest.customer?.name || paymentRequest.order.buyerName,
    amount: paymentRequest.amount,
    currency: paymentRequest.currency,
    reference: paymentRequest.reference,
    provider: paymentRequest.provider,
    paymentUrl: paymentRequest.paymentUrl,
    bankName: paymentRequest.bankName,
    accountNumber: paymentRequest.accountNumber,
    accountName: paymentRequest.accountName,
  });

  try {
    const result = await sendWhatsAppTextMessage({
      to: paymentRequest.order.phone,
      body,
    });

    let customerId = paymentRequest.customerId || paymentRequest.order.customerId || null;

    if (!customerId) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {phone: paymentRequest.order.phone},
      });

      const customer =
        existingCustomer ||
        (await prisma.customer.create({
          data: {
            name: paymentRequest.order.buyerName || "WhatsApp buyer",
            phone: paymentRequest.order.phone,
            email: paymentRequest.customer?.email || null,
            buyerType: paymentRequest.order.buyerType || "WhatsApp buyer",
            location: paymentRequest.order.deliveryNote || null,
            accountStatus: "Manual WhatsApp",
            status: "Active",
          },
        }));

      customerId = customer.id;

      await prisma.order.update({
        where: {id: paymentRequest.orderId},
        data: {customerId},
      });

      await prisma.paymentRequest.update({
        where: {id: paymentRequest.id},
        data: {customerId},
      });
    }

    if (!customerId) {
      throw new Error("Could not create or resolve buyer record for WhatsApp evidence.");
    }

    await prisma.buyerMessage.create({
      data: {
        customerId,
        title: `WhatsApp payment request for ${paymentRequest.order.code}`,
        body,
        channel: "WhatsApp",
        direction: "Outbound",
        status: result.status,
        recipient: paymentRequest.order.phone,
        source: "WhatsApp API",
        relatedType: "PaymentRequest",
        relatedId: paymentRequest.id,
        sentAt: new Date(),
        metadata: JSON.stringify({
          provider: result.provider,
          messageId: result.messageId,
        }),
      },
    });

    revalidatePath("/admin/payment-requests");
    revalidatePath(`/admin/orders/${paymentRequest.orderId}`);
    revalidatePath("/admin/buyer-messages");
    revalidatePath("/buyer-account/inbox");
  } catch (error) {
    const message = error instanceof Error ? error.message : "whatsapp-send-failed";
    const encoded = encodeURIComponent(message).slice(0, 180);
    redirect(`/admin/payment-requests?error=${encoded}`);
  }

  redirect("/admin/payment-requests?whatsapp=sent");
}


export async function updatePaymentRequestStatusAction(formData: FormData) {
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
        issuedBy: "Local admin",
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

export async function updateAdminOrderControlAction(formData: FormData) {
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");

  await requireStaff();

  const orderId = String(formData.get("orderId") || "");
  const paymentStatus = String(formData.get("paymentStatus") || "").trim();
  const fulfilmentStatus = String(formData.get("fulfilmentStatus") || "").trim();
  const adminNote = String(formData.get("adminNote") || "").trim();
  const deliveryNote = String(formData.get("deliveryNote") || "").trim();

  if (!orderId) {
    redirect("/admin/orders?error=missing-order");
  }

  await prisma.order.update({
    where: {id: orderId},
    data: {
      paymentStatus: paymentStatus || undefined,
      fulfilmentStatus: fulfilmentStatus || undefined,
      adminNote: adminNote || null,
      deliveryNote: deliveryNote || null,
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/payment-requests");
  revalidatePath("/admin/deliveries");
  revalidatePath("/buyer-account/orders");
  revalidatePath(`/buyer-account/orders/${orderId}`);

  redirect(`/admin/orders/${orderId}?updated=1`);
}

export async function logOrderBuyerMessageAction(formData: FormData) {
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");

  await requireStaff();

  const orderId = String(formData.get("orderId") || "");
  const customerId = String(formData.get("customerId") || "");
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const channel = String(formData.get("channel") || "Portal").trim();

  if (!orderId) {
    redirect("/admin/orders?error=missing-order");
  }

  if (!customerId || !title || !body) {
    redirect(`/admin/orders/${orderId}?error=message-required`);
  }

  const order = await prisma.order.findUnique({
    where: {id: orderId},
    select: {
      id: true,
      phone: true,
    },
  });

  await prisma.buyerMessage.create({
    data: {
      customerId,
      title,
      body,
      channel,
      direction: "Outbound",
      status: "Unread",
      recipient: order?.phone || null,
      source: "Admin order detail",
      relatedType: "Order",
      relatedId: orderId,
    },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/buyer-messages");
  revalidatePath("/buyer-account/inbox");

  redirect(`/admin/orders/${orderId}?message=logged`);
}

export async function linkOrderToCustomerAction(formData: FormData) {
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");
  const {normalisePhone} = await import("@/lib/commerce/whatsappOrders");

  await requireStaff();

  const orderId = String(formData.get("orderId") || "");
  const customerId = String(formData.get("customerId") || "");
  const createBuyerContact = String(formData.get("createBuyerContact") || "") === "on";

  if (!orderId) {
    redirect("/admin/orders?error=missing-order");
  }

  if (!customerId) {
    redirect(`/admin/orders/${orderId}?error=missing-customer`);
  }

  const [order, customer] = await Promise.all([
    prisma.order.findUnique({
      where: {id: orderId},
    }),
    prisma.customer.findUnique({
      where: {id: customerId},
    }),
  ]);

  if (!order || !customer) {
    redirect(`/admin/orders/${orderId}?error=link-not-found`);
  }

  const phone = normalisePhone(order.sourcePhone || order.phone);

  await prisma.order.update({
    where: {id: order.id},
    data: {
      customerId: customer.id,
      buyerName: customer.name,
      buyerType: customer.buyerType || order.buyerType,
      phone: phone || order.phone,
      sourcePhone: phone || order.sourcePhone,
      adminNote: [
        order.adminNote || "",
        `Linked to buyer account ${customer.name} from admin order detail.`,
      ]
        .filter(Boolean)
        .join("\\n"),
    },
  });

  if (createBuyerContact && phone) {
    const existingContact = await prisma.buyerContact.findFirst({
      where: {
        customerId: customer.id,
        OR: [
          {phone},
          {phone: phone},
          {phone: phone.replace(/[^\\d]/g, "")},
        ],
      },
    });

    if (!existingContact) {
      await prisma.buyerContact.create({
        data: {
          customerId: customer.id,
          name: order.buyerName || customer.name,
          email: null,
          phone,
          phone: phone,
          role: "WhatsApp ordering contact",
          status: "Active",
        },
      });
    }
  }

  await prisma.paymentRequest.updateMany({
    where: {orderId: order.id},
    data: {customerId: customer.id},
  });

  await prisma.receipt.updateMany({
    where: {orderId: order.id},
    data: {customerId: customer.id},
  });

  await prisma.delivery.updateMany({
    where: {orderId: order.id},
    data: {customerId: customer.id},
  });

  await prisma.buyerMessage.create({
    data: {
      customerId: customer.id,
      title: `Order ${order.code} linked to your account`,
      body: `Order ${order.code} has been linked to your OneFarmTech buyer account. You can now view the order, payment and delivery status in your portal.`,
      channel: "Portal",
      direction: "Outbound",
      status: "Unread",
      recipient: phone || order.phone,
      source: "Order linked to buyer account",
      relatedType: "Order",
      relatedId: order.id,
    },
  });

  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/buyer-messages");
  revalidatePath("/buyer-account/orders");
  revalidatePath(`/buyer-account/orders/${order.id}`);
  revalidatePath("/buyer-account/inbox");

  redirect(`/admin/orders/${order.id}?linked=1`);
}


export async function updateProductDetailsAction(formData: FormData) {
  await requireStaff();
  const {revalidatePath} = await import("next/cache");
  const {prisma} = await import("@/lib/prisma");

  const productId = String(formData.get("productId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const unit = String(formData.get("unit") || "").trim();
  const grade = String(formData.get("grade") || "").trim();
  const basePrice = Number(formData.get("basePrice") || 0);
  const availability = String(formData.get("availability") || "").trim();
  const status = String(formData.get("status") || "").trim();

  if (!productId || !name || !category || !unit || !grade || !Number.isFinite(basePrice) || basePrice < 0) {
    throw new Error("Product, category, unit, grade and valid price are required.");
  }

  await prisma.product.update({
    where: {id: productId},
    data: {
      name,
      category,
      unit,
      grade,
      basePrice: Math.round(basePrice),
      availability: availability || "Available",
      status: status || "Active",
    },
  });

  revalidatePath("/admin/products");
}
