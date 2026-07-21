export const staffRoles = [
  "Super admin",
  "Admin",
  "Operations",
  "Finance",
  "Support",
  "Buyer account manager",
] as const;

export type StaffRole = (typeof staffRoles)[number];

export const staffCapabilities = [
  "manage_staff", "manage_buyer_access", "manage_finance", "manage_payments",
  "manage_orders", "manage_fulfilment", "manage_suppliers", "manage_products",
  "manage_delivery_partners", "manage_delivery_access", "manage_group_buys",
  "manage_support", "manage_communications", "manage_admin_configuration",
] as const;
export type StaffCapability = (typeof staffCapabilities)[number];

const allCapabilities = [...staffCapabilities];
export const roleCapabilities: Record<StaffRole, StaffCapability[]> = {
  "Super admin": allCapabilities,
  Admin: allCapabilities.filter((capability) => !["manage_staff", "manage_admin_configuration"].includes(capability)),
  Operations: ["manage_orders", "manage_fulfilment", "manage_suppliers", "manage_products", "manage_delivery_partners", "manage_delivery_access", "manage_group_buys", "manage_communications"],
  Finance: ["manage_finance", "manage_payments"],
  Support: ["manage_support", "manage_communications"],
  "Buyer account manager": ["manage_buyer_access", "manage_finance", "manage_communications"],
};

export function roleHasCapability(role: StaffRole, capability: StaffCapability) {
  return roleCapabilities[role].includes(capability);
}

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
