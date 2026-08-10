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
        description: "Orders and fulfilment.",
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
        title: "Buyers",
        href: "/admin/customers",
        description: "Buyers and account access.",
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
        title: "Payments",
        href: "/admin/payments",
        description: "Payment requests and receipts.",
        activePaths: [
          "/admin/payments",
          "/admin/receipts",
        ],
        priority: true,
      },
      {
        title: "Products",
        href: "/admin/products",
        description: "Products and group buys.",
        activePaths: [
          "/admin/group-buys",
          "/admin/suppliers",
          "/admin/pickup-locations",
          "/admin/delivery-partners",
        ],
        priority: true,
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
