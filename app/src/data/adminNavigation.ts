export const adminNavigationGroups = [
  {
    title: "Daily operations",
    links: [
      {
        title: "Today’s work",
        href: "/admin/whatsapp-workflow",
        description: "Daily WhatsApp workflow, checklist, payment, delivery and support queue.",
        priority: true,
      },
      {
        title: "Operations hub",
        href: "/admin/operations",
        description: "Control map for orders, payments, delivery, buyer accounts and launch checks.",
        priority: true,
      },
      {
        title: "Orders",
        href: "/admin/orders",
        description: "Order queue and transaction control centre.",
        priority: true,
      },
      {
        title: "Deliveries",
        href: "/admin/deliveries",
        description: "Dispatch, delivery partners, tracking and fulfilment progress.",
        priority: true,
      },
      {
        title: "Complaints",
        href: "/admin/complaints",
        description: "Buyer issues, fulfilment problems and resolution tracking.",
        priority: true,
      },
    ],
  },
  {
    title: "WhatsApp storefront",
    links: [
      {
        title: "WhatsApp command centre",
        href: "/admin/whatsapp",
        description: "Main WhatsApp storefront hub for product discovery, orders, payments and support.",
        priority: true,
      },
      {
        title: "WhatsApp inbox",
        href: "/admin/whatsapp-inbox",
        description: "Inbound WhatsApp messages, intent routing and next actions.",
        priority: true,
      },
      {
        title: "WhatsApp drafts",
        href: "/admin/whatsapp-drafts",
        description: "Order-intent drafts awaiting review or conversion.",
        priority: true,
      },
      {
        title: "Message tools",
        href: "/admin/whatsapp-tools",
        description: "Send storefront menu, catalogue, payment and buyer update messages.",
        priority: true,
      },
      {
        title: "Create WhatsApp order",
        href: "/admin/whatsapp-orders/new",
        description: "Turn a WhatsApp buyer conversation into an order.",
      },
      {
        title: "Buyer message log",
        href: "/admin/buyer-messages",
        description: "Evidence log for WhatsApp, portal, email and account messages.",
        secondary: true,
      },
    ],
  },
  {
    title: "Commerce",
    links: [
      {
        title: "Products",
        href: "/admin/products",
        description: "Produce catalogue, prices, grades and availability.",
        priority: true,
      },
      {
        title: "Group-buys",
        href: "/admin/group-buys",
        description: "Bulk buying opportunities and reservation progress.",
        priority: true,
      },
      {
        title: "Payment requests",
        href: "/admin/payment-requests",
        description: "Payment links, references, buyer follow-up and provider status.",
        priority: true,
      },
      {
        title: "Payments",
        href: "/admin/payments",
        description: "Recorded payments, references and reconciliation status.",
      },
      {
        title: "Receipts",
        href: "/admin/receipts",
        description: "Electronic receipt issue log.",
        secondary: true,
      },
      {
        title: "Suppliers",
        href: "/admin/suppliers",
        description: "Farmers, supply partners and sourcing relationships.",
      },
      {
        title: "Pickup locations",
        href: "/admin/pickup-locations",
        description: "Collection points and pickup readiness.",
        secondary: true,
      },
      {
        title: "Delivery partners",
        href: "/admin/delivery-partners",
        description: "Logistics partners, access codes and delivery assignment readiness.",
      },
    ],
  },
  {
    title: "Buyers",
    links: [
      {
        title: "Customers",
        href: "/admin/customers",
        description: "Buyer records and relationship management.",
        priority: true,
      },
      {
        title: "Buyer accounts",
        href: "/admin/buyer-accounts",
        description: "Approved buyer accounts, balances, receipts and login readiness.",
        priority: true,
      },
      {
        title: "Account requests",
        href: "/admin/buyer-account-requests",
        description: "Public buyer onboarding requests awaiting review.",
        priority: true,
      },
      {
        title: "Buyer access",
        href: "/admin/buyer-access",
        description: "Contacts, invites and buyer access codes.",
      },
      {
        title: "Profile updates",
        href: "/admin/buyer-profile-requests",
        description: "Buyer-submitted company, contact and finance update requests.",
      },
      {
        title: "Guest buyers",
        href: "/admin/guest-buyers",
        description: "Unlinked WhatsApp/event buyers and account conversion candidates.",
        secondary: true,
      },
      {
        title: "Contact enquiries",
        href: "/admin/contact-enquiries",
        description: "Public form, support, media and partnership enquiries.",
        secondary: true,
      },
    ],
  },
  {
    title: "Reports/settings",
    links: [
      {
        title: "Dashboard",
        href: "/admin",
        description: "Company operating snapshot and attention items.",
        priority: true,
      },
      {
        title: "Reports",
        href: "/admin/reports",
        description: "Company metrics and investor update snapshot.",
      },
      {
        title: "Launch readiness",
        href: "/admin/launch-readiness",
        description: "Workflow, database, payment, WhatsApp and production readiness checks.",
      },
      {
        title: "Operating manual",
        href: "/admin/operating-manual",
        description: "Staff SOP guide.",
      },
      {
        title: "Workflows",
        href: "/admin/workflows",
        description: "SOPs, rules and operating process notes.",
        secondary: true,
      },
      {
        title: "Deployment",
        href: "/admin/deployment-readiness",
        description: "Environment and deployment checks.",
        secondary: true,
      },
      {
        title: "Security",
        href: "/admin/security",
        description: "Auth readiness and access controls.",
      },
      {
        title: "Permissions",
        href: "/admin/permissions",
        description: "Role matrix.",
        secondary: true,
      },
      {
        title: "Staff & roles",
        href: "/admin/staff",
        description: "Staff access and role planning.",
      },
      {
        title: "Audit log",
        href: "/admin/audit-log",
        description: "Backend action history.",
        secondary: true,
      },
      {
        title: "Launch inbox",
        href: "/admin/launch-inbox",
        description: "Legacy request and launch follow-up inbox.",
        secondary: true,
      },
      {
        title: "Create order",
        href: "/admin/create-order",
        description: "Manual non-WhatsApp order entry.",
        secondary: true,
      },
      {
        title: "Draft orders",
        href: "/admin/drafts",
        description: "Local saved draft records.",
        secondary: true,
      },
    ],
  },
];

export const adminQuickActions = [
  {
    title: "Today’s WhatsApp work",
    href: "/admin/whatsapp-workflow",
    description: "Open the staff checklist for inbound WhatsApp, drafts, payment, delivery and support follow-up.",
  },
  {
    title: "WhatsApp command centre",
    href: "/admin/whatsapp",
    description: "Run the storefront menu, product discovery, inbox, drafts and support workflow.",
  },
  {
    title: "Review orders",
    href: "/admin/orders",
    description: "Open the order queue and transaction control centre.",
  },
  {
    title: "Check payment requests",
    href: "/admin/payment-requests",
    description: "Review payment links, buyer follow-up and provider status.",
  },
  {
    title: "Review buyer requests",
    href: "/admin/buyer-account-requests",
    description: "Approve recurring buyers and prepare account access.",
  },
];

export const adminOperationalTimeline = [
  {
    stage: "WhatsApp discovery",
    owner: "WhatsApp operator",
    status: "Live",
    note: "Staff can send the guided storefront menu and live product catalogue from active product records.",
  },
  {
    stage: "Order capture",
    owner: "Admin / WhatsApp operator",
    status: "Live",
    note: "WhatsApp order intent creates drafts, and staff can convert drafts or manually create orders with context preserved.",
  },
  {
    stage: "Buyer account readiness",
    owner: "Commercial / account manager",
    status: "Live foundation",
    note: "Recurring buyer accounts track access, contacts, balances, receipts and profile update requests.",
  },
  {
    stage: "Payment confirmation",
    owner: "Finance",
    status: "Integrated",
    note: "Payment requests, hosted checkout links, Paystack webhook confirmation and buyer message evidence are connected.",
  },
  {
    stage: "Allocation",
    owner: "Operations team",
    status: "Manual workflow",
    note: "Products, suppliers, pickup points and group-buy records support coordinated fulfilment.",
  },
  {
    stage: "Delivery / pickup",
    owner: "Dispatch",
    status: "Operational",
    note: "Delivery handoff, partner assignment, status tracking and WhatsApp-ready delivery messages are supported.",
  },
  {
    stage: "Accountability",
    owner: "Super admin",
    status: "Evidence-backed",
    note: "Buyer messages, receipts, complaints and audit logs preserve operational evidence.",
  },
];

export const adminHealthCards = [
  {
    title: "Production database",
    status: "Healthy",
    description: "Orders, customers, products, suppliers, payments, complaints, group-buys, receipts, buyer messages and audit logs are database-backed.",
  },
  {
    title: "WhatsApp workflow",
    status: "Operational",
    description: "WhatsApp menu, catalogue sender, inbound intent routing, draft conversion, payment follow-up and delivery/complaint routing are in place.",
  },
  {
    title: "Order workflow",
    status: "Operational",
    description: "Create-order, order details, payment requests, payment recording, complaints and fulfilment status changes are connected to the database.",
  },
  {
    title: "Buyer accounts",
    status: "Foundation added",
    description: "Recurring buyers can carry access codes, contacts, credit limits, balances, receipt emails and login-readiness flags.",
  },
  {
    title: "Payments",
    status: "Paystack tested",
    description: "Payment links, Paystack hosted checkout and webhook confirmation have been validated. Flutterwave support remains lower-priority unless needed.",
  },
  {
    title: "Authentication",
    status: "Staff gate active",
    description: "Staff access is role-filtered in admin. Keep security and deployment readiness checks visible before wider team testing.",
  },
];
