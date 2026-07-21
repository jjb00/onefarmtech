import type {StaffRole} from "@/lib/permissions";

const fullAccessRoles: StaffRole[] = ["Super admin", "Admin"];

const sharedAdminPaths = [
  "/admin",
  "/admin/logout",
  "/admin/deployment-readiness",
  "/admin/operating-manual",
];

const roleAllowedPaths: Record<StaffRole, string[]> = {
  "Super admin": ["/admin"],
  Admin: ["/admin"],

  Operations: [
    ...sharedAdminPaths,
    "/admin/launch-inbox",
    "/admin/create-order",
    "/admin/drafts",
    "/admin/orders",
    "/admin/order-requests",
    "/admin/products",
    "/admin/suppliers",
    "/admin/group-buys",
    "/admin/deliveries",
    "/admin/pickup-locations",
    "/admin/workflows",
    "/admin/whatsapp",
    "/admin/buyer-messages",
    "/admin/customers",
  ],

  Finance: [
    ...sharedAdminPaths,
    "/admin/payments",
    "/admin/receipts",
    "/admin/reports",
    "/admin/buyer-accounts",
    "/admin/buyer-access",
    "/admin/audit-log",
    "/admin/buyer-messages?view=reconciliation",
  ],

  Support: [
    ...sharedAdminPaths,
    "/admin/launch-inbox",
    "/admin/contact-enquiries",
    "/admin/career-applications",
    "/admin/buyer-account-requests",
    "/admin/complaints",
    "/admin/customers",
    "/admin/whatsapp",
    "/admin/buyer-messages",
  ],

  "Buyer account manager": [
    ...sharedAdminPaths,
    "/admin/launch-inbox",
    "/admin/buyer-account-requests",
    "/admin/buyer-accounts",
    "/admin/buyer-access",
    "/admin/customers",
    "/admin/contact-enquiries",
    "/admin/career-applications",
    "/admin/receipts",
  ],
};

export function canAccessAdminPath(role: StaffRole, pathname: string) {
  const [path, query = ""] = pathname.split("?");
  if (fullAccessRoles.includes(role)) {
    return true;
  }

  const allowedPaths = roleAllowedPaths[role] || sharedAdminPaths;

  return allowedPaths.some((allowedPath) => {
    const [allowedPathname, allowedQuery = ""] = allowedPath.split("?");
    if (allowedPathname === "/admin") {
      return path === "/admin";
    }
    const pathMatches = path === allowedPathname || path.startsWith(`${allowedPathname}/`);
    if (!pathMatches) return false;
    if (!allowedQuery) return true;
    const requested = new URLSearchParams(query);
    const required = new URLSearchParams(allowedQuery);
    return [...required].every(([key, value]) => requested.get(key) === value);
  });
}

export function filterAdminLinksForRole<
  T extends {href: string},
>(role: StaffRole, links: T[]) {
  return links.filter((link) => canAccessAdminPath(role, link.href));
}

export function getRoleAccessSummary(role: StaffRole) {
  if (fullAccessRoles.includes(role)) {
    return "Full admin access for this controlled staff session.";
  }

  return "Role-limited admin access for this controlled staff session.";
}
