export const adminNavigationGroups = [
  {
    title: "Dashboard",
    links: [
      {
        title: "Company dashboard",
        href: "/admin",
        description: "Senior snapshot of orders, buyers, finance, fulfilment and issues.",
        priority: true,
      },
    ],
  },
  {
    title: "Operations",
    links: [
      {
        title: "Order desk",
        href: "/admin/operations",
        description: "Daily workbench for order intake, payments, delivery handoff and urgent issues.",
        priority: true,
      },
      {
        title: "Orders",
        href: "/admin/orders",
        description: "All order records and order control pages.",
        priority: true,
      },
      {
        title: "Deliveries",
        href: "/admin/deliveries",
        description: "Delivery queue, status updates and handoff tracking.",
        priority: true,
      },
      {
        title: "Complaints",
        href: "/admin/complaints",
        description: "Quality, delivery and buyer issue resolution.",
        priority: true,
      },
    ],
  },
  {
    title: "Sales",
    links: [
      {
        title: "New order",
        href: "/admin/create-order",
        description: "Create an order manually when staff need direct entry.",
        priority: true,
      },
      {
        title: "Order drafts",
        href: "/admin/whatsapp-drafts",
        description: "Buyer order drafts awaiting review or conversion.",
      },
      {
        title: "Message centre",
        href: "/admin/whatsapp",
        description: "Buyer enquiries, message inbox, templates and communication follow-up.",
        priority: true,
      },
      {
        title: "WhatsApp inbox",
        href: "/admin/whatsapp-inbox",
        description: "Inbound WhatsApp messages from matched and unrecognised senders.",
        priority: true,
      },
      {
        title: "Contact enquiries",
        href: "/admin/contact-enquiries",
        description: "Public contact submissions and unmatched WhatsApp senders.",
        priority: true,
      },
    ],
  },
  {
    title: "Finance",
    links: [
      {
        title: "Payment requests",
        href: "/admin/payment-requests",
        description: "Payment links, references and buyer payment follow-up.",
        priority: true,
      },
      {
        title: "Payments",
        href: "/admin/payments",
        description: "Confirmed payments and reconciliation records.",
        priority: true,
      },
      {
        title: "Receipts",
        href: "/admin/receipts",
        description: "Issued receipt records.",
      },
      {
        title: "Reports",
        href: "/admin/reports",
        description: "Company metrics and investor-ready reporting.",
      },
    ],
  },
  {
    title: "Buyer accounts",
    links: [
      {
        title: "Buyer accounts",
        href: "/admin/buyer-accounts",
        description: "Approved buyers, credit, balances, receipts and login readiness.",
        priority: true,
      },
      {
        title: "Account requests",
        href: "/admin/buyer-account-requests",
        description: "New buyer applications awaiting review.",
        priority: true,
      },
      {
        title: "Buyer access",
        href: "/admin/buyer-access",
        description: "Contacts, invite codes and portal access.",
      },
      {
        title: "Customers",
        href: "/admin/customers",
        description: "Underlying buyer/customer master records.",
        secondary: true,
      },
      {
        title: "Profile updates",
        href: "/admin/buyer-profile-requests",
        description: "Buyer-submitted company, contact and finance update requests.",
        secondary: true,
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
    title: "System",
    links: [
      {
        title: "Launch & system checks",
        href: "/admin/launch-readiness",
        description: "Launch, integration, deployment and production readiness.",
        priority: true,
      },
      {
        title: "Staff & roles",
        href: "/admin/staff",
        description: "Staff access and role planning.",
        priority: true,
      },
      {
        title: "Security",
        href: "/admin/security",
        description: "Auth readiness and access controls.",
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
        title: "Deployment",
        href: "/admin/deployment-readiness",
        description: "Environment and deployment checks.",
        secondary: true,
      },
      {
        title: "Integration readiness",
        href: "/admin/integration-readiness",
        description: "Payment, messaging and external integration checks.",
        secondary: true,
      },
      {
        title: "Workflow test",
        href: "/admin/whatsapp-workflow",
        description: "End-to-end QA checklist for order, payment, delivery and support flow.",
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
    description: "Review daily order intake, payments, delivery and urgent issues.",
  },
  {
    title: "Review orders",
    href: "/admin/orders",
    description: "Open all orders and transaction control pages.",
  },
  {
    title: "Check payment requests",
    href: "/admin/payment-requests",
    description: "Review payment links, buyer follow-up and provider status.",
  },
  {
    title: "Open message centre",
    href: "/admin/whatsapp",
    description: "Review buyer enquiries, inbox, templates and message evidence.",
  },
  {
    title: "Review buyer requests",
    href: "/admin/buyer-account-requests",
    description: "Approve recurring buyers and prepare account access.",
  },
];

export const adminOperationalTimeline = [
  {
    stage: "Catalogue",
    owner: "Catalogue & supply",
    status: "Operational",
    note: "Products, prices, grades and availability are managed from the catalogue.",
  },
  {
    stage: "Order intake",
    owner: "Sales / operations",
    status: "Operational",
    note: "Orders can be captured from buyer conversations, forms or direct staff entry.",
  },
  {
    stage: "Buyer account setup",
    owner: "Buyer accounts",
    status: "Live foundation",
    note: "Buyer accounts track access, contacts, balances, receipts and profile updates.",
  },
  {
    stage: "Payment confirmation",
    owner: "Finance",
    status: "Integrated",
    note: "Payment requests, checkout links, Paystack webhook confirmation and buyer evidence are connected.",
  },
  {
    stage: "Group buying",
    owner: "Sales / supply",
    status: "Manual windows",
    note: "Group-buy windows stay closed by default and are opened manually on selected order days.",
  },
  {
    stage: "Fulfilment",
    owner: "Operations / delivery",
    status: "Operational",
    note: "Delivery handoff, partner assignment and buyer update messages are supported.",
  },
];

export const adminHealthCards = [
  {
    title: "Database",
    status: "Healthy",
    description: "Orders, buyers, products, payments, complaints, receipts, messages and audit records are database-backed.",
  },
  {
    title: "Order operations",
    status: "Operational",
    description: "Order intake, order details, payment requests, complaints and fulfilment status are connected.",
  },
  {
    title: "Buyer accounts",
    status: "Foundation added",
    description: "Buyer accounts support contacts, access codes, credit, balances, receipts and profile requests.",
  },
  {
    title: "Payments",
    status: "Paystack tested",
    description: "Payment links, hosted checkout and webhook confirmation have been validated.",
  },
  {
    title: "Communications",
    status: "Operational foundation",
    description: "Buyer messaging, catalogue sending, inbound routing and follow-up evidence are in place.",
  },
  {
    title: "Role access",
    status: "Department-ready",
    description: "Navigation is grouped by departments so future roles can see only relevant areas.",
  },
];
