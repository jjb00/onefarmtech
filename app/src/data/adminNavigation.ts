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
        description: "Farmers and aggregators",
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
        title: "Payments",
        href: "/admin/payments",
        description: "References and status",
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
    title: "Review drafts",
    href: "/admin/drafts",
    description: "Check local browser drafts before database integration.",
  },
  {
    title: "Check payments",
    href: "/admin/payments",
    description: "Review deposits, full payments, unpaid orders, and credit approvals.",
  },
  {
    title: "Handle complaint",
    href: "/admin/complaints",
    description: "Resolve quality, delivery, refund, and buyer support issues.",
  },
];

export const adminOperationalTimeline = [
  {
    stage: "Order capture",
    owner: "Admin / WhatsApp operator",
    status: "Live in demo",
    note: "Create order form can capture buyer, produce, payment, fulfilment, and delivery details.",
  },
  {
    stage: "Draft saving",
    owner: "Admin",
    status: "Local only",
    note: "Drafts save to browser localStorage until database is added.",
  },
  {
    stage: "Payment confirmation",
    owner: "Admin / finance",
    status: "Mock workflow",
    note: "Payment instruction preview exists. Gateway integration comes later.",
  },
  {
    stage: "Allocation",
    owner: "Ops team",
    status: "Mock workflow",
    note: "Supplier/product pages exist as management screens before real database records.",
  },
  {
    stage: "Quality check",
    owner: "Ops team",
    status: "SOP defined",
    note: "Workflow rules exist. Later add checklists and image upload.",
  },
  {
    stage: "Delivery / pickup",
    owner: "Dispatch",
    status: "Mock workflow",
    note: "Delivery and pickup modules exist for manual operations planning.",
  },
];

export const adminHealthCards = [
  {
    title: "Frontend shell",
    status: "Healthy",
    description: "Core public, buyer, and admin pages are building successfully.",
  },
  {
    title: "Order workflow",
    status: "Demo ready",
    description: "Create-order form, previews, order details, and draft saving are in place.",
  },
  {
    title: "Database",
    status: "Not connected",
    description: "Current data is mock/static/local browser storage.",
  },
  {
    title: "Payments",
    status: "Pending integration",
    description: "Payment instruction preview exists. Paystack/Flutterwave comes later.",
  },
  {
    title: "WhatsApp",
    status: "Manual first",
    description: "WhatsApp links and copy-ready messages exist. Business API comes later.",
  },
  {
    title: "Authentication",
    status: "Not connected",
    description: "Admin pages are not protected yet. Auth should come after database setup.",
  },
];
