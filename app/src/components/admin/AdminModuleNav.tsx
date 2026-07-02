import Link from "next/link";

export const adminModuleLinks = [
  {
    title: "Orders",
    href: "/admin/orders",
    description: "Track order queue, payments, sourcing, and delivery status.",
  },
  {
    title: "Create order",
    href: "/admin/create-order",
    description: "Manually enter WhatsApp, phone, business, and group-buy orders.",
  },
  {
    title: "Customers",
    href: "/admin/customers",
    description: "Manage buyer profiles, credit terms, and business accounts.",
  },
  {
    title: "Products",
    href: "/admin/products",
    description: "Manage produce categories, units, grades, and availability.",
  },
  {
    title: "Farmers & suppliers",
    href: "/admin/suppliers",
    description: "Track trusted rural suppliers, harvest notes, and reliability.",
  },
  {
    title: "Group-buys",
    href: "/admin/group-buys",
    description: "Create and monitor split bulk-buy opportunities.",
  },
  {
    title: "Deliveries",
    href: "/admin/deliveries",
    description: "Manage pickup points, delivery methods, and dispatch status.",
  },
  {
    title: "Payments",
    href: "/admin/payments",
    description: "Track deposits, full payments, references, and credit approvals.",
  },
  {
    title: "Complaints",
    href: "/admin/complaints",
    description: "Manage quality issues, delivery disputes, and resolutions.",
  },
  {
    title: "Pickup locations",
    href: "/admin/pickup-locations",
    description: "Manage office pickup, collection points, and handling fees.",
  },
  {
    title: "Workflows",
    href: "/admin/workflows",
    description: "Review order rules, payment rules, statuses, and admin SOPs.",
  },
];

export default function AdminModuleNav() {
  return (
    <section className="mt-8 grid gap-4 md:grid-cols-3">
      {adminModuleLinks.map((module) => (
        <Link
          key={module.title}
          href={module.href}
          className="rounded-2xl bg-white/10 p-6 transition hover:bg-white/15"
        >
          <h2 className="text-xl font-bold text-white">{module.title}</h2>
          <p className="mt-3 text-sm leading-6 text-[#d8e8dc]">
            {module.description}
          </p>
        </Link>
      ))}
    </section>
  );
}
