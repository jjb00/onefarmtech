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
    title: "Commercial",
    links: [
      {
        title: "Customers",
        href: "/admin/customers",
        description: "Buyer records",
      },
      {
        title: "Buyer accounts",
        href: "/admin/buyer-accounts",
        description: "Credit, balances, receipts",
      },
      {
        title: "Buyer access",
        href: "/admin/buyer-access",
        description: "Contacts and invites",
      },
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
    ],
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
    ],
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
    status: "Live locally",
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
    title: "Local SQLite database",
    status: "Healthy",
    description: "Orders, customers, products, suppliers, payments, complaints, group-buys, receipts, and audit logs are local database-backed.",
  },
  {
    title: "Order workflow",
    status: "Operational locally",
    description: "Create-order, order details, payment recording, complaints, and fulfilment status changes are connected to local SQLite.",
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
