import Link from "next/link";
import {AdminPage} from "@/components/portal/AdminPage";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const operationGroups = [
  {
    title: "WhatsApp commerce",
    description: "Tools for WhatsApp-first ordering, product lists, guest buyers and manual order creation.",
    items: [
      {
        title: "WhatsApp tools",
        href: "/admin/whatsapp-tools",
        description: "Copy-ready product list messages generated from the live catalogue.",
      },
      {
        title: "WhatsApp order entry",
        href: "/admin/whatsapp-orders/new",
        description: "Create database orders from WhatsApp conversations using live prices.",
      },
      {
        title: "Guest buyers",
        href: "/admin/guest-buyers",
        description: "Review unlinked WhatsApp/event buyers and account conversion candidates.",
      },
      {
        title: "Buyer messages",
        href: "/admin/buyer-messages",
        description: "Communication evidence log for WhatsApp, portal, support and account messages.",
      },
    ],
  },
  {
    title: "Orders, payments and delivery",
    description: "Operational controls for order fulfilment, payment confirmation and logistics.",
    items: [
      {
        title: "Orders",
        href: "/admin/orders",
        description: "Order list and order control centre.",
      },
      {
        title: "Payment requests",
        href: "/admin/payment-requests",
        description: "Track payment references, manual confirmations, provider details and receipts.",
      },
      {
        title: "Deliveries",
        href: "/admin/deliveries",
        description: "Assign delivery partners and track fulfilment progress.",
      },
      {
        title: "Delivery partners",
        href: "/admin/delivery-partners",
        description: "Manage logistics partners, access codes and delivery coverage.",
      },
    ],
  },
  {
    title: "Buyer accounts",
    description: "Account approvals, access, profile updates and buyer readiness.",
    items: [
      {
        title: "Buyer account requests",
        href: "/admin/buyer-account-requests",
        description: "Review public buyer account applications and convert suitable buyers.",
      },
      {
        title: "Buyer access",
        href: "/admin/buyer-access",
        description: "Manage buyer contacts and invite-code access.",
      },
      {
        title: "Buyer profile requests",
        href: "/admin/buyer-profile-requests",
        description: "Review account, contact, finance and profile update requests.",
      },
      {
        title: "Customers",
        href: "/admin/customers",
        description: "Buyer/customer account records and relationship management.",
      },
    ],
  },
  {
    title: "Launch and system checks",
    description: "Readiness checks, product catalogue, support flows and operational setup.",
    items: [
      {
        title: "Launch readiness",
        href: "/admin/launch-readiness",
        description: "Database, workflow and configuration checks before soft launch.",
      },
      {
        title: "Products",
        href: "/admin/products",
        description: "Manage produce catalogue, pricing, availability and grades.",
      },
      {
        title: "Receipts",
        href: "/admin/receipts",
        description: "Issued receipt records.",
      },
      {
        title: "Complaints",
        href: "/admin/complaints",
        description: "Buyer issues, fulfilment problems and complaint tracking.",
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
      title="Operations"
      subtitle="Control map for WhatsApp ordering, buyer accounts, payments, delivery and launch readiness."
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
                    Operations area
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
