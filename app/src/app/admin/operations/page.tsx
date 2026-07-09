import Link from "next/link";
import {AdminPage} from "@/components/portal/AdminPage";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const operationGroups = [
  {
    title: "New order intake",
    description: "Start here when buyers send requests, ask for prices or need assisted ordering.",
    items: [
      {
        title: "Message inbox",
        href: "/admin/whatsapp-inbox",
        description: "Review inbound buyer messages and route the next action.",
      },
      {
        title: "Order drafts",
        href: "/admin/whatsapp-drafts",
        description: "Convert buyer order drafts into confirmed orders.",
      },
      {
        title: "Assisted order entry",
        href: "/admin/whatsapp-orders/new",
        description: "Create an order from a buyer conversation using live catalogue prices.",
      },
      {
        title: "Create manual order",
        href: "/admin/create-order",
        description: "Use for phone, offline, business or exceptional orders.",
      },
    ],
  },
  {
    title: "Orders needing action",
    description: "Keep active orders moving through payment and fulfilment.",
    items: [
      {
        title: "Orders",
        href: "/admin/orders",
        description: "Open order queue and individual order control centres.",
      },
      {
        title: "Payment requests",
        href: "/admin/payment-requests",
        description: "Review unpaid requests, checkout links and buyer payment follow-up.",
      },
      {
        title: "Deliveries",
        href: "/admin/deliveries",
        description: "Assign delivery partners and update fulfilment progress.",
      },
      {
        title: "Complaints",
        href: "/admin/complaints",
        description: "Resolve quality, delivery and support issues.",
      },
    ],
  },
  {
    title: "Order support tools",
    description: "Open only when an active order requires supporting records.",
    items: [
      {
        title: "Products",
        href: "/admin/products",
        description: "Check or update product availability and pricing.",
      },
      {
        title: "Customers",
        href: "/admin/customers",
        description: "Check buyer record, account status or contact details.",
      },
      {
        title: "Message templates",
        href: "/admin/whatsapp-tools",
        description: "Send catalogue, payment or delivery update messages.",
      },
      {
        title: "Buyer message log",
        href: "/admin/buyer-messages",
        description: "Review message evidence linked to buyer follow-up.",
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
      subtitle="Daily desk for order intake, open orders, payments, delivery handoff and buyer follow-up."
    >
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-[2rem] bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a7d55]">Open orders</p>
          <p className="mt-3 text-3xl font-black text-[#102015]">{openOrders}</p>
        </div>
        <div className="rounded-[2rem] bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a7d55]">Pending payments</p>
          <p className="mt-3 text-3xl font-black text-[#102015]">{pendingPayments}</p>
        </div>
        <div className="rounded-[2rem] bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a7d55]">Active deliveries</p>
          <p className="mt-3 text-3xl font-black text-[#102015]">{pendingDeliveries}</p>
        </div>
        <div className="rounded-[2rem] bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a7d55]">Guest orders</p>
          <p className="mt-3 text-3xl font-black text-[#102015]">{guestOrders}</p>
        </div>
        <div className="rounded-[2rem] bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a7d55]">Messages</p>
          <p className="mt-3 text-3xl font-black text-[#102015]">{buyerMessages}</p>
        </div>
        <div className="rounded-[2rem] bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a7d55]">Available products</p>
          <p className="mt-3 text-3xl font-black text-[#102015]">{availableProducts}</p>
        </div>
      </section>

      <section className="grid gap-4">
        {operationGroups.map((group, index) => (
          <details
            key={group.title}
            open={index === 0}
            className="rounded-[2rem] bg-white p-6 shadow-sm"
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
                <span className="rounded-full bg-[#f3f8ef] px-4 py-2 text-sm font-black text-[#1f7a3f]">
                  {group.items.length} links
                </span>
              </div>
            </summary>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-[1.5rem] border border-[#102015]/10 p-5 transition hover:-translate-y-0.5 hover:bg-[#f7f5ec]"
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a7d55]">
                    Open
                  </p>
                  <h3 className="mt-3 text-lg font-black text-[#102015]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#405348]">{item.description}</p>
                </Link>
              ))}
            </div>
          </details>
        ))}
      </section>
    </AdminPage>
  );
}
