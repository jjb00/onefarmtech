import Link from "next/link";
import {AdminPage} from "@/components/portal/AdminPage";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const operationGroups = [
  {
    title: "Intake",
    description: "Capture new requests and convert buyer drafts.",
    items: [
      {
        title: "Message inbox",
        href: "/admin/whatsapp-inbox",
        description: "Review buyer enquiries and order-intent messages.",
      },
      {
        title: "Order drafts",
        href: "/admin/whatsapp-drafts",
        description: "Convert draft requests into confirmed orders.",
      },
      {
        title: "New order",
        href: "/admin/create-order",
        description: "Create a manual order for phone, offline or exceptional cases.",
      },
    ],
  },
  {
    title: "Active work",
    description: "Move current orders through payment, delivery and issue resolution.",
    items: [
      {
        title: "Orders",
        href: "/admin/orders",
        description: "Open order records and transaction control pages.",
      },
      {
        title: "Payment requests",
        href: "/admin/payment-requests",
        description: "Review unpaid requests and checkout links.",
      },
      {
        title: "Deliveries",
        href: "/admin/deliveries",
        description: "Assign and update delivery handoff.",
      },
      {
        title: "Complaints",
        href: "/admin/complaints",
        description: "Resolve buyer, quality and delivery issues.",
      },
    ],
  },
  {
    title: "Reference",
    description: "Use only when an order needs supporting data.",
    items: [
      {
        title: "Products",
        href: "/admin/products",
        description: "Check product availability and pricing.",
      },
      {
        title: "Buyer accounts",
        href: "/admin/buyer-accounts",
        description: "Check buyer account status and balances.",
      },
      {
        title: "Message templates",
        href: "/admin/whatsapp-tools",
        description: "Send catalogue, payment or delivery updates.",
      },
    ],
  },
];

export default async function AdminOperationsPage() {
  await requireStaff();

  const [
    openOrders,
    pendingPayments,
    pendingDeliveries,
    guestOrders,
    buyerMessages,
    availableProducts,
  ] = await Promise.all([
    prisma.order.count({
      where: {
        fulfilmentStatus: {
          notIn: ["Delivered", "Cancelled"],
        },
      },
    }),
    prisma.paymentRequest.count({
      where: {
        status: {
          not: "Paid",
        },
      },
    }),
    prisma.delivery.count({
      where: {
        status: {
          notIn: ["Delivered"],
        },
      },
    }),
    prisma.order.count({
      where: {
        customerId: null,
      },
    }),
    prisma.buyerMessage.count(),
    prisma.product.count({
      where: {
        status: "Active",
        availability: {
          in: ["Available", "In stock", "Active"],
        },
      },
    }),
  ]);

  return (
    <AdminPage
      title="Order desk"
      subtitle="Daily workbench for intake, open orders, payments, delivery handoff and urgent issues."
    >
      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a7d55]">Open orders</p>
          <p className="mt-3 text-3xl font-black text-[#102015]">{openOrders}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a7d55]">Pending payments</p>
          <p className="mt-3 text-3xl font-black text-[#102015]">{pendingPayments}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a7d55]">Active deliveries</p>
          <p className="mt-3 text-3xl font-black text-[#102015]">{pendingDeliveries}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a7d55]">Guest orders</p>
          <p className="mt-3 text-3xl font-black text-[#102015]">{guestOrders}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a7d55]">Messages</p>
          <p className="mt-3 text-3xl font-black text-[#102015]">{buyerMessages}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a7d55]">Available products</p>
          <p className="mt-3 text-3xl font-black text-[#102015]">{availableProducts}</p>
        </div>
      </section>

      <section className="grid gap-4">
        {operationGroups.map((group, index) => (
          <details
            key={group.title}
            open={index === 0}
            className="rounded-2xl bg-white p-4 shadow-sm"
          >
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
                    Order desk
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#102015]">{group.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
                    {group.description}
                  </p>
                </div>
                <span className="rounded-full bg-[#f3f8ef] px-3 py-1 text-xs font-black text-[#1f7a3f]">
                  {group.items.length}
                </span>
              </div>
            </summary>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-[#102015]/10 p-4 transition hover:-translate-y-0.5 hover:bg-[#f7f5ec]"
                >
                  <h3 className="text-base font-black text-[#102015]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#405348]">{item.description}</p>
                </Link>
              ))}
            </div>
          </details>
        ))}
      </section>
    </AdminPage>
  );
}
