export type AdminNavigationLink = {
  title: string;
  href: string;
  description: string;
  activePaths?: string[];
  priority?: boolean;
};

export const adminNavigationGroups: Array<{title: string; links: AdminNavigationLink[]}> = [
  {title: "Dashboard", links: [
    {title: "Company dashboard", href: "/admin", description: "Company performance and operational attention."},
  ]},
  {title: "Operations", links: [
    {title: "Order desk", href: "/admin/operations", description: "Daily intake, payment, delivery and support work.", activePaths: ["/admin/launch-inbox", "/admin/order-requests", "/admin/drafts", "/admin/whatsapp-drafts"], priority: true},
    {title: "Orders", href: "/admin/orders", description: "All orders and transaction control.", activePaths: ["/admin/create-order", "/admin/whatsapp-orders/new"], priority: true},
    {title: "Deliveries", href: "/admin/deliveries", description: "Assignment, handoff and delivery status."},
    {title: "Issues", href: "/admin/complaints", description: "Current complaint queue and issue follow-up."},
  ]},
  {title: "Communications", links: [
    {title: "Inbox", href: "/admin/buyer-messages", description: "Buyer messages, email delivery and operational follow-up.", activePaths: ["/admin/whatsapp", "/admin/whatsapp-inbox", "/admin/contact-enquiries"], priority: true},
    {title: "WhatsApp tools", href: "/admin/whatsapp-tools", description: "Send storefront menus and product messages."},
  ]},
  {title: "Buyers", links: [
    {title: "All buyers", href: "/admin/customers", description: "Buyer master records and account status.", activePaths: ["/admin/buyer-accounts"], priority: true},
    {title: "Guest buyers", href: "/admin/customers?view=guests", description: "Unlinked buyers and account candidates.", activePaths: ["/admin/guest-buyers"]},
    {title: "Applications", href: "/admin/customers?view=applications", description: "New buyer applications awaiting review.", activePaths: ["/admin/buyer-account-requests"]},
    {title: "Access", href: "/admin/customers?view=access", description: "Buyer contacts, invitations and portal access.", activePaths: ["/admin/buyer-access"]},
    {title: "Update requests", href: "/admin/customers?view=updates", description: "Buyer-submitted profile and account changes.", activePaths: ["/admin/buyer-profile-requests"]},
  ]},
  {title: "Finance", links: [
    {title: "Payment requests", href: "/admin/payment-requests", description: "Payment links and buyer follow-up.", priority: true},
    {title: "Payments", href: "/admin/payments", description: "Confirmed payments and transaction records."},
    {title: "Receipts", href: "/admin/receipts", description: "Issued receipt records."},
    {title: "Reconciliation", href: "/admin/buyer-messages?view=reconciliation", description: "Payment incidents requiring finance review."},
  ]},
  {title: "Catalogue & supply", links: [
    {title: "Products", href: "/admin/products", description: "Catalogue, prices and availability.", priority: true},
    {title: "Group buys", href: "/admin/group-buys", description: "Bulk-buy windows and reservations."},
    {title: "Suppliers", href: "/admin/suppliers", description: "Supply partners and sourcing relationships."},
    {title: "Pickup locations", href: "/admin/pickup-locations", description: "Collection points and pickup readiness."},
    {title: "Delivery partners", href: "/admin/delivery-partners", description: "Logistics partners and delivery access."},
  ]},
  {title: "Reports", links: [
    {title: "Reports", href: "/admin/reports", description: "Company metrics and performance reporting."},
  ]},
  {title: "System & settings", links: [
    {title: "Staff & roles", href: "/admin/staff", description: "Staff records and role planning."},
    {title: "Audit log", href: "/admin/audit-log", description: "Administrative action history."},
    {title: "System status", href: "/admin/launch-readiness", description: "Production, deployment and integration readiness.", activePaths: ["/admin/deployment-readiness", "/admin/integration-readiness", "/admin/launch-smoke-test", "/admin/security", "/admin/permissions", "/admin/workflows", "/admin/whatsapp-workflow"]},
    {title: "Operating manual", href: "/admin/operating-manual", description: "Staff operating procedures and workflow guidance."},
  ]},
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
