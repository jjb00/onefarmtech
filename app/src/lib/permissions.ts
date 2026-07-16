export const staffRoles = [
  "Super admin",
  "Admin",
  "Operations",
  "Finance",
  "Support",
  "Buyer account manager",
] as const;

export type StaffRole = (typeof staffRoles)[number];

export const rolePermissions: Record<StaffRole, string[]> = {
  "Super admin": [
    "Manage staff roles",
    "Review audit logs",
    "Change security settings",
    "Manage all orders",
    "Manage payments and receipts",
    "Manage buyer accounts and credit",
    "Manage suppliers and products",
    "Handle complaints",
    "Access all admin pages",
  ],
  Admin: [
    "Manage orders",
    "Manage customers",
    "Manage products",
    "Manage suppliers",
    "Review payments",
    "Review complaints",
    "Access operational dashboards",
  ],
  Operations: [
    "Manage order fulfilment",
    "Manage allocation status",
    "Manage pickup and delivery",
    "Manage suppliers",
    "Manage group-buys",
    "Update fulfilment notes",
  ],
  Finance: [
    "Record payments",
    "Issue receipts",
    "Review balances",
    "Review credit limits",
    "Update payment status",
    "Review finance-related audit events",
  ],
  Support: [
    "Log complaints",
    "Update complaint status",
    "Review buyer communication",
    "Use WhatsApp message centre",
    "Escalate order issues",
  ],
  "Buyer account manager": [
    "Create customer records",
    "Update buyer account readiness",
    "Manage receipt email",
    "Review recurring buyer profile",
    "Review credit and outstanding balances",
  ],
};

export const protectedAdminAreas = [
  {
    area: "Orders",
    requiredRoles: ["Super admin", "Admin", "Operations"] as StaffRole[],
    note: "Order capture, fulfilment status, delivery notes, and admin notes.",
  },
  {
    area: "Payments",
    requiredRoles: ["Super admin", "Admin", "Finance"] as StaffRole[],
    note: "Manual payment recording, payment status, and finance review.",
  },
  {
    area: "Receipts",
    requiredRoles: ["Super admin", "Finance"] as StaffRole[],
    note: "Manual electronic receipt issue log before automated PDFs/email.",
  },
  {
    area: "Buyer accounts",
    requiredRoles: ["Super admin", "Admin", "Finance", "Buyer account manager"] as StaffRole[],
    note: "Credit limits, outstanding balances, account readiness, and receipt email.",
  },
  {
    area: "Complaints",
    requiredRoles: ["Super admin", "Admin", "Support", "Operations"] as StaffRole[],
    note: "Issue handling, support records, and resolution notes.",
  },
  {
    area: "Communications",
    requiredRoles: ["Super admin", "Admin", "Operations", "Support", "Finance"] as StaffRole[],
    note: "Operations and Support use communication views; Finance is restricted to payment reconciliation.",
  },
  {
    area: "Staff & roles",
    requiredRoles: ["Super admin"] as StaffRole[],
    note: "Staff access planning and future role assignment.",
  },
  {
    area: "Audit log",
    requiredRoles: ["Super admin", "Admin"] as StaffRole[],
    note: "Backend accountability and operational review.",
  },
];

export function isStaffRole(value: string): value is StaffRole {
  return staffRoles.includes(value as StaffRole);
}
