export const adminNavigationGroups = [
  {
    title: "Sales & orders",
    links: [
      {
        title: "Dashboard",
        href: "/admin",
        description: "Company operating snapshot, alerts and priority actions.",
        priority: true,
      },
      {
        title: "Order desk",
        href: "/admin/operations",
        description: "Daily order intake, open orders, payment follow-up and fulfilment queue.",
        priority: true,
      },
      {
        title: "Orders",
        href: "/admin/orders",
        description: "Order queue and transaction control centre.",
        priority: true,
      },
      {
        title: "Create order",
        href: "/admin/create-order",
        description: "Manual order entry for phone, offline, business or exceptional orders.",
      },
      {
        title: "Order drafts",
        href: "/admin/whatsapp-drafts",
        description: "Buyer order drafts awaiting review or conversion.",
      },
      {
        title: "Create assisted order",
        href: "/admin/whatsapp-orders/new",
        description: "Create an order from a buyer conversation using live catalogue records.",
        secondary: true,
      },
    ],
  },
  {
    title: "Buyer accounts",
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
        description: "Contacts, invite codes and buyer portal access.",
      },
      {
        title: "Profile updates",
        href: "/admin/buyer-profile-requests",
        description: "Buyer-submitted company, contact and finance update requests.",
      },
      {
        title: "Guest buyers",
        href: "/admin/guest-buyers",
        description: "Unlinked buyers and account conversion candidates.",
        secondary: true,
      },
    ],
  },
  {
    title: "Catalogue & supply",
    links: [
      {
        title: "Products",
        href: "/admin/products",
        description: "Produce catalogue, prices, grades and availability.",
        priority: true,
      },
      {
        title: "Group buys",
        href: "/admin/group-buys",
        description: "Bulk-buy windows opened manually on selected order days.",
        priority: true,
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
    ],
  },
  {
    title: "Payments & receipts",
    links: [
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
        priority: true,
      },
      {
        title: "Receipts",
        href: "/admin/receipts",
        description: "Electronic receipt issue log.",
      },
      {
        title: "Reports",
        href: "/admin/reports",
        description: "Company metrics and investor update snapshot.",
        secondary: true,
      },
    ],
  },
  {
    title: "Fulfilment & issues",
    links: [
      {
        title: "Deliveries",
        href: "/admin/deliveries",
        description: "Dispatch, tracking and fulfilment progress.",
        priority: true,
      },
      {
        title: "Delivery partners",
        href: "/admin/delivery-partners",
        description: "Logistics partners, access codes and delivery assignment readiness.",
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
    title: "Communications",
    links: [
      {
        title: "Message centre",
        href: "/admin/whatsapp",
        description: "Buyer messaging hub for inbound messages, order drafts and follow-up.",
        priority: true,
      },
      {
        title: "Message inbox",
        href: "/admin/whatsapp-inbox",
        description: "Inbound buyer messages, intent routing and next actions.",
        priority: true,
      },
      {
        title: "Message templates",
        href: "/admin/whatsapp-tools",
        description: "Send catalogue, menu, payment and buyer update messages.",
        priority: true,
      },
      {
        title: "Buyer message log",
        href: "/admin/buyer-messages",
        description: "Evidence log for buyer messages across channels.",
      },
      {
        title: "Contact enquiries",
        href: "/admin/contact-enquiries",
        description: "Public form, support, media and partnership enquiries.",
        secondary: true,
      },
      {
        title: "Launch inbox",
        href: "/admin/launch-inbox",
        description: "Legacy launch request and follow-up inbox.",
        secondary: true,
      },
    ],
  },
  {
    title: "System & launch",
    links: [
      {
        title: "Launch readiness",
        href: "/admin/launch-readiness",
        description: "Operational, configuration and production readiness checks.",
        priority: true,
      },
      {
        title: "Integration readiness",
        href: "/admin/integration-readiness",
        description: "Payment, messaging and external integration checks.",
      },
      {
        title: "Deployment",
        href: "/admin/deployment-readiness",
        description: "Environment and deployment checks.",
      },
      {
        title: "Security",
        href: "/admin/security",
        description: "Auth readiness and access controls.",
        priority: true,
      },
      {
        title: "Staff & roles",
        href: "/admin/staff",
        description: "Staff access and role planning.",
        priority: true,
      },
      {
        title: "Permissions",
        href: "/admin/permissions",
        description: "Department and role access matrix.",
      },
      {
        title: "Operating manual",
        href: "/admin/operating-manual",
        description: "Staff SOP guide.",
      },
      {
        title: "Workflow test",
        href: "/admin/whatsapp-workflow",
        description: "End-to-end launch QA checklist for order, payment, delivery and support flow.",
        secondary: true,
      },
      {
        title: "Launch smoke test",
        href: "/admin/launch-smoke-test",
        description: "Technical launch smoke-test page.",
        secondary: true,
      },
      {
        title: "Workflows",
        href: "/admin/workflows",
        description: "SOPs, rules and operating process notes.",
        secondary: true,
      },
      {
        title: "Audit log",
        href: "/admin/audit-log",
        description: "Backend action history.",
        secondary: true,
      },
    ],
  },
];

export const adminQuickActions = [
  {
    title: "Open order desk",
    href: "/admin/operations",
    description: "Review daily order intake, payment follow-up, delivery and issue queues.",
  },
  {
    title: "Open message centre",
    href: "/admin/whatsapp",
    description: "Review buyer messages, drafts and communication follow-up.",
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
    stage: "Product catalogue",
    owner: "Catalogue / supply team",
    status: "Operational",
    note: "Products, prices, grades and availability are managed from the catalogue and used in buyer-facing messages.",
  },
  {
    stage: "Order intake",
    owner: "Sales / order desk",
    status: "Operational",
    note: "Orders can be captured from buyer conversations, forms, assisted entry or direct manual entry.",
  },
  {
    stage: "Buyer account readiness",
    owner: "Buyer accounts team",
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
    stage: "Group buying",
    owner: "Sales / supply team",
    status: "Manual windows",
    note: "Group-buy windows stay closed by default and are opened manually on selected order days.",
  },
  {
    stage: "Delivery / pickup",
    owner: "Fulfilment",
    status: "Operational",
    note: "Delivery handoff, partner assignment, status tracking and buyer update messages are supported.",
  },
  {
    stage: "Accountability",
    owner: "Admin / super admin",
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
    title: "Order operations",
    status: "Operational",
    description: "Order intake, order details, payment requests, complaints and fulfilment status changes are connected to the database.",
  },
  {
    title: "Buyer accounts",
    status: "Foundation added",
    description: "Recurring buyers can carry access codes, contacts, credit limits, balances, receipt emails and login-readiness flags.",
  },
  {
    title: "Payments",
    status: "Paystack tested",
    description: "Payment links, Paystack hosted checkout and webhook confirmation have been validated. Flutterwave remains lower-priority unless needed.",
  },
  {
    title: "Communications",
    status: "Operational foundation",
    description: "Buyer messaging, catalogue sending, inbound routing, draft conversion and follow-up evidence are in place.",
  },
  {
    title: "Role access",
    status: "Department-ready",
    description: "Admin navigation is grouped by operating departments so future role access can expose only the relevant sections.",
  },
];
