"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireBuyer} from "@/lib/currentBuyer";
import {prisma} from "@/lib/prisma";
import {baselineProducts} from "@/lib/productCatalogue";
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



export async function seedBaselineProductsAction() {
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
