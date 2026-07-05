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
  ],

  Finance: [
    ...sharedAdminPaths,
    "/admin/payments",
    "/admin/receipts",
    "/admin/reports",
    "/admin/buyer-accounts",
    "/admin/buyer-access",
    "/admin/audit-log",
  ],

  Support: [
    ...sharedAdminPaths,
    "/admin/launch-inbox",
    "/admin/contact-enquiries",
    "/admin/buyer-account-requests",
    "/admin/complaints",
    "/admin/customers",
    "/admin/whatsapp",
  ],

  "Buyer account manager": [
    ...sharedAdminPaths,
    "/admin/launch-inbox",
    "/admin/buyer-account-requests",
    "/admin/buyer-accounts",
    "/admin/buyer-access",
    "/admin/customers",
    "/admin/contact-enquiries",
    "/admin/receipts",
  ],
};

export function canAccessAdminPath(role: StaffRole, pathname: string) {
  if (fullAccessRoles.includes(role)) {
    return true;
  }

  const allowedPaths = roleAllowedPaths[role] || sharedAdminPaths;

  return allowedPaths.some((allowedPath) => {
    if (allowedPath === "/admin") {
      return pathname === "/admin";
    }

    return pathname === allowedPath || pathname.startsWith(`${allowedPath}/`);
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
