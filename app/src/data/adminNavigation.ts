export const adminNavigationGroups = [
  {
    title: "Orders",
    links: [
      {
        title: "Dashboard",
        href: "/admin",
        description: "Operations overview",
      },
      {
        title: "Launch inbox",
        href: "/admin/launch-inbox",
        description: "Requests and follow-ups",
      },
      {
        title: "Create order",
        href: "/admin/create-order",
        description: "Manual order entry",
      },
      {
        title: "Draft orders",
        href: "/admin/drafts",
        description: "Local saved drafts",
      },
      {
        title: "Orders",
        href: "/admin/orders",
        description: "Order queue",
      },
    ],
  },
  {
    title: "Buyer management",
    links: [
      {
        title: "Customers",
        href: "/admin/customers",
        description: "Buyer records",
      },
      {
        title: "Contact enquiries",
        href: "/admin/contact-enquiries",
        description: "Public forms and partnerships",
      },
      {
        title: "Buyer accounts",
        href: "/admin/buyer-accounts",
        description: "Credit, balances, receipts",
      },
      {
        title: "Account requests",
        href: "/admin/buyer-account-requests",
        description: "Public buyer onboarding",
      },
      {
        title: "Buyer access",
        href: "/admin/buyer-access",
        description: "Contacts and invites",
      },
    ],
  },
  {
    title: "Finance & reporting",
    links: [
      {
        title: "Payments",
        href: "/admin/payments",
        description: "References and status",
      },
      {
        title: "Receipts",
        href: "/admin/receipts",
        description: "Electronic receipt issue log",
      },
      {
        title: "Reports",
        href: "/admin/reports",
        description: "Company metrics and investor update snapshot",
      },
    
      {
        title: "Guest buyers",
        href: "/admin/guest-buyers",
        description: "Review unlinked WhatsApp and event buyers before deciding whether to create an account.",
      },],
  },
  {
    title: "Supply",
    links: [
      {
        title: "Products",
        href: "/admin/products",
        description: "Produce catalogue",
      },
      {
        title: "Suppliers",
        href: "/admin/suppliers",
        description: "Farmers and supply partners",
      },
      {
        title: "Group-buys",
        href: "/admin/group-buys",
        description: "Bulk buying opportunities",
      },
    ],
  },
  {
    title: "Operations",
    links: [
      {
        title: "Deliveries",
        href: "/admin/deliveries",
        description: "Dispatch and delivery",
      },
      {
        title: "Delivery partners",
        href: "/admin/delivery-partners",
        description: "Manage logistics partners, access codes and delivery assignment readiness.",
      },
      {
        title: "Operations hub",
        href: "/admin/operations",
        description: "Control map for WhatsApp ordering, payments, delivery, buyer accounts and launch checks.",
      },
      {
        title: "Pickup locations",
        href: "/admin/pickup-locations",
        description: "Collection points",
      },
      {
        title: "Complaints",
        href: "/admin/complaints",
        description: "Issues and resolutions",
      },
      {
        title: "Workflows",
        href: "/admin/workflows",
        description: "SOPs and rules",
      },
      {
        title: "Operating manual",
        href: "/admin/operating-manual",
        description: "Staff SOP guide",
      },
      {
        title: "WhatsApp ops",
        href: "/admin/whatsapp",
        description: "Manual message centre",
      },
      {
        title: "WhatsApp message tools",
        href: "/admin/whatsapp-tools",
        description: "Copy-ready product list and buyer update messages generated from live records.",
      },
      {
        title: "Create WhatsApp order",
        href: "/admin/whatsapp-orders/new",
        description: "Turn a WhatsApp buyer conversation into an order, payment request and delivery record.",
      },
    
      {
        title: "Launch readiness",
        href: "/admin/launch-readiness",
        description: "Check database, products, WhatsApp ordering, payments, delivery and production setup.",
      },
      {
        title: "Buyer messages",
        href: "/admin/buyer-messages",
        description: "Communication evidence log for WhatsApp, email, support, portal and account notices.",
      },],
  },
  {
    title: "Control",
    links: [
      {
        title: "Staff & roles",
        href: "/admin/staff",
        description: "Access role planning",
      },
      {
        title: "Permissions",
        href: "/admin/permissions",
        description: "Role matrix",
      },
      {
        title: "Security",
        href: "/admin/security",
        description: "Auth readiness",
      },
      {
        title: "Deployment",
        href: "/admin/deployment-readiness",
        description: "Prelaunch checks",
      },
      {
        title: "Audit log",
        href: "/admin/audit-log",
        description: "Backend action history",
      },
    ],
  },
];

export const adminQuickActions = [
  {
    title: "Create new order",
    href: "/admin/create-order",
    description: "Capture a WhatsApp, phone, group-buy, or business order.",
  },
  {
    title: "Review buyer accounts",
    href: "/admin/buyer-accounts",
    description: "Check credit limits, balances, receipt readiness, and login readiness.",
  },
  {
    title: "Check payments",
    href: "/admin/payments",
    description: "Review deposits, full payments, unpaid orders, and credit approvals.",
  },
  {
    title: "Issue receipt",
    href: "/admin/receipts",
    description: "Create electronic receipt records from paid or approved orders.",
  },
  {
    title: "Review audit log",
    href: "/admin/audit-log",
    description: "Check who changed important backend records.",
  },
];

export const adminOperationalTimeline = [
  {
    stage: "Order capture",
    owner: "Admin / WhatsApp operator",
    status: "Live",
    note: "Create order form captures buyer, produce, payment, fulfilment, and delivery details.",
  },
  {
    stage: "Buyer account readiness",
    owner: "Commercial / account manager",
    status: "Foundation added",
    note: "Recurring buyer accounts now track credit limits, balances, receipt email, and login readiness.",
  },
  {
    stage: "Payment confirmation",
    owner: "Finance",
    status: "Manual workflow",
    note: "Manual payment recording exists. Paystack integration comes after auth/database architecture is stable.",
  },
  {
    stage: "Allocation",
    owner: "Operations team",
    status: "Manual workflow",
    note: "Products, suppliers, pickup points, and group-buy records support coordinated fulfilment.",
  },
  {
    stage: "Quality check",
    owner: "Operations team",
    status: "SOP defined",
    note: "Workflow rules exist. Later add checklists, image upload, and supplier reliability scoring.",
  },
  {
    stage: "Delivery / pickup",
    owner: "Dispatch",
    status: "Manual workflow",
    note: "Delivery and pickup modules support manual planning before automation.",
  },
  {
    stage: "Accountability",
    owner: "Super admin",
    status: "Audit foundation added",
    note: "Audit log records important backend actions while proper staff auth is prepared.",
  },
];

export const adminHealthCards = [
  {
    title: "Production database",
    status: "Healthy",
    description: "Orders, customers, products, suppliers, payments, complaints, group-buys, receipts, and audit logs are database-backed.",
  },
  {
    title: "Order workflow",
    status: "Operational",
    description: "Create-order, order details, payment recording, complaints, and fulfilment status changes are connected to the database.",
  },
  {
    title: "Buyer accounts",
    status: "Foundation added",
    description: "Recurring buyers can now carry credit limits, balances, receipt emails, and login-readiness flags.",
  },
  {
    title: "Payments",
    status: "Manual first",
    description: "Payment recording is manual. Paystack links and webhooks come later.",
  },
  {
    title: "WhatsApp",
    status: "Manual first",
    description: "WhatsApp links and copy-ready messages exist. Business API comes later.",
  },
  {
    title: "Authentication",
    status: "Temporary gate",
    description: "Admin still uses the basic local password gate. Proper staff/buyer auth is required before Vercel team testing.",
  },
];
