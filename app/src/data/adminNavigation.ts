export type AdminNavigationLink = {
  title: string;
  href: string;
  description: string;
  activePaths?: string[];
  priority?: boolean;
};

export const adminNavigationGroups: Array<{title: string; links: AdminNavigationLink[]}> = [
  {
    title: "Daily work",
    links: [
      {
        title: "Today",
        href: "/admin",
        description: "Work requiring attention now.",
        priority: true,
      },
      {
        title: "Orders",
        href: "/admin/orders",
        description: "Orders, fulfilment, delivery and complaints.",
        activePaths: [
          "/admin/operations",
          "/admin/order-requests",
          "/admin/create-order",
          "/admin/whatsapp-orders",
          "/admin/deliveries",
          "/admin/complaints",
        ],
        priority: true,
      },
      {
        title: "WhatsApp",
        href: "/admin/buyer-messages?view=whatsapp",
        description: "Operational WhatsApp conversations and unknown contacts.",
        activePaths: [
          "/admin/buyer-messages",
          "/admin/whatsapp",
          "/admin/whatsapp-inbox",
          "/admin/whatsapp-tools",
          "/admin/whatsapp-drafts",
          "/admin/drafts",
        ],
        priority: true,
      },
      {
        title: "Buyers",
        href: "/admin/customers",
        description: "Customers, guests, applications and login access.",
        activePaths: [
          "/admin/buyer-accounts",
          "/admin/guest-buyers",
          "/admin/buyer-account-requests",
          "/admin/buyer-access",
          "/admin/buyer-profile-requests",
        ],
        priority: true,
      },
      {
        title: "Money",
        href: "/admin/payment-requests",
        description: "Payment follow-up, confirmed payments and receipts.",
        activePaths: [
          "/admin/payments",
          "/admin/receipts",
        ],
        priority: true,
      },
      {
        title: "Products",
        href: "/admin/products",
        description: "Products, prices, supply and collection points.",
        activePaths: [
          "/admin/group-buys",
          "/admin/suppliers",
          "/admin/pickup-locations",
          "/admin/delivery-partners",
        ],
        priority: true,
      },
      {
        title: "Settings",
        href: "/admin/staff",
        description: "Staff, roles and restricted system tools.",
        activePaths: [
          "/admin/audit-log",
          "/admin/security",
          "/admin/permissions",
          "/admin/operational-events",
          "/admin/deployment-readiness",
          "/admin/integration-readiness",
          "/admin/launch-readiness",
          "/admin/launch-smoke-test",
          "/admin/operating-manual",
          "/admin/workflows",
          "/admin/whatsapp-workflow",
          "/admin/reports",
        ],
      },
    ],
  },
];

export function isAdminNavigationLinkActive(link: AdminNavigationLink, pathname: string, search = "") {
  const [hrefPath, hrefQuery] = link.href.split("?");
  const pathMatches = hrefPath === "/admin" ? pathname === "/admin" : pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
  if (pathMatches && (!hrefQuery || new URLSearchParams(search).toString() === hrefQuery)) return true;
  return (link.activePaths || []).includes(pathname);
}

export const adminQuickActions = [
  {title: "Open order desk", href: "/admin/operations", description: "Review daily intake, payments, delivery and urgent issues."},
  {title: "Review orders", href: "/admin/orders", description: "Open all orders and transaction controls."},
  {title: "Check payment requests", href: "/admin/payment-requests", description: "Review payment links and provider status."},
  {title: "Open inbox", href: "/admin/buyer-messages", description: "Review buyer communications and delivery evidence."},
  {title: "Review applications", href: "/admin/buyer-account-requests", description: "Review buyers requesting account access."},
];

export const adminOperationalTimeline = [
  {stage: "Catalogue", owner: "Catalogue & supply", status: "Operational", note: "Products, prices, grades and availability are managed from the catalogue."},
  {stage: "Order intake", owner: "Sales / operations", status: "Operational", note: "Orders can be captured from buyer conversations, forms or direct staff entry."},
  {stage: "Buyer account setup", owner: "Buyer accounts", status: "Live foundation", note: "Buyer accounts track access, contacts, balances, receipts and profile updates."},
  {stage: "Payment confirmation", owner: "Finance", status: "Integrated", note: "Payment requests, checkout links, Paystack webhook confirmation and buyer evidence are connected."},
  {stage: "Group buying", owner: "Sales / supply", status: "Manual windows", note: "Group-buy windows stay closed by default and are opened manually on selected order days."},
  {stage: "Fulfilment", owner: "Operations / delivery", status: "Operational", note: "Delivery handoff, partner assignment and buyer update messages are supported."},
];

export const adminHealthCards = [
  {title: "Database", status: "Healthy", description: "Orders, buyers, products, payments, complaints, receipts, messages and audit records are database-backed."},
  {title: "Order operations", status: "Operational", description: "Order intake, order details, payment requests, complaints and fulfilment status are connected."},
  {title: "Buyer accounts", status: "Foundation added", description: "Buyer accounts support contacts, access codes, credit, balances, receipts and profile requests."},
  {title: "Payments", status: "Paystack tested", description: "Payment links, hosted checkout and webhook confirmation have been validated."},
  {title: "Communications", status: "Operational foundation", description: "Buyer messaging, catalogue sending, inbound routing and follow-up evidence are in place."},
  {title: "Role access", status: "Department-ready", description: "Navigation is grouped by departments so future roles can see only relevant areas."},
];
