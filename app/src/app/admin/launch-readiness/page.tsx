import Link from "next/link";
import {AdminPage} from "@/components/portal/AdminPage";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function CheckRow({
  title,
  detail,
  ok,
  href,
}: {
  title: string;
  detail: string;
  ok: boolean;
  href?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#102015]/10 py-5 last:border-b-0">
      <div>
        <h3 className="font-black text-[#102015]">{title}</h3>
        <p className="mt-1 max-w-3xl text-sm leading-7 text-[#405348]">{detail}</p>
        {href ? (
          <Link
            href={href}
            className="mt-2 inline-flex text-sm font-black text-[#1f7a3f] underline underline-offset-4"
          >
            Open
          </Link>
        ) : null}
      </div>

      <span
        className={`rounded-full px-3 py-1 text-xs font-black ${
          ok ? "bg-[#eef6ea] text-[#1f7a3f]" : "bg-[#fff6d6] text-[#7a4a00]"
        }`}
      >
        {ok ? "Ready" : "Needs work"}
      </span>
    </div>
  );
}

export default async function LaunchReadinessPage() {
  await requireStaff();

  let databaseConnected = false;

  const counts = {
    customers: 0,
    orders: 0,
    products: 0,
    availableProducts: 0,
    paymentRequests: 0,
    deliveryPartners: 0,
    buyerMessages: 0,
    guestOrders: 0,
  };

  try {
    const [
      customers,
      orders,
      products,
      availableProducts,
      paymentRequests,
      deliveryPartners,
      buyerMessages,
      guestOrders,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.order.count(),
      prisma.product.count(),
      prisma.product.count({
        where: {
          status: "Active",
          availability: {
            in: ["Available", "In stock", "Active"],
          },
        },
      }),
      prisma.paymentRequest.count(),
      prisma.deliveryPartner.count(),
      prisma.buyerMessage.count(),
      prisma.order.count({
        where: {
          customerId: null,
        },
      }),
    ]);

    databaseConnected = true;
    counts.customers = customers;
    counts.orders = orders;
    counts.products = products;
    counts.availableProducts = availableProducts;
    counts.paymentRequests = paymentRequests;
    counts.deliveryPartners = deliveryPartners;
    counts.buyerMessages = buyerMessages;
    counts.guestOrders = guestOrders;
  } catch {
    databaseConnected = false;
  }

  const supportWhatsAppConfigured = Boolean(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP);
  const databasePoolConfigured = Boolean(process.env.DATABASE_POOL_MAX);
  const hasProducts = counts.availableProducts > 0;
  const hasDeliveryPartner = counts.deliveryPartners > 0;

  const checks = [
    {
      title: "Database connection",
      detail: databaseConnected
        ? `Connected. Current records: ${counts.customers} customers, ${counts.orders} orders, ${counts.products} products, ${counts.paymentRequests} payment requests.`
        : "Database query failed. Check DATABASE_URL, Supabase pooler settings and Prisma client generation.",
      ok: databaseConnected,
    },
    {
      title: "Available product catalogue",
      detail: hasProducts
        ? `${counts.availableProducts} active available products can be used for buyer ordering and catalogue messages.`
        : "No active available products found. Order entry and catalogue messages need available products and prices.",
      ok: hasProducts,
      href: "/admin/products",
    },
    {
      title: "Assisted order workflow",
      detail: "Staff can create orders from buyer conversations and preserve order, payment and delivery context.",
      ok: true,
      href: "/admin/whatsapp-orders/new",
    },
    {
      title: "Guest buyer handling",
      detail: `${counts.guestOrders} unlinked guest orders. Guest buyers can remain unlinked unless they become recurring or high-value.`,
      ok: true,
      href: "/admin/guest-buyers",
    },
    {
      title: "Buyer communication evidence",
      detail: `${counts.buyerMessages} buyer messages logged. Buyer inbox and admin evidence log are available.`,
      ok: true,
      href: "/admin/buyer-messages",
    },
    {
      title: "Payment request workflow",
      detail: "Payment requests, hosted checkout links, buyer follow-up and payment evidence are available. Paystack hosted checkout/webhook flow has been tested; Flutterwave remains optional unless needed.",
      ok: true,
      href: "/admin/payment-requests",
    },
    {
      title: "Delivery partner setup",
      detail: hasDeliveryPartner
        ? `${counts.deliveryPartners} delivery partners are registered.`
        : "No delivery partners registered yet. Add at least one partner before delivery testing.",
      ok: hasDeliveryPartner,
      href: "/admin/delivery-partners",
    },
    {
      title: "Delivery partner portal",
      detail: "Partner login and jobs page exist. Jobs appear after admin assigns deliveries to a partner.",
      ok: true,
      href: "/delivery-partner",
    },
    {
      title: "Support WhatsApp number",
      detail: supportWhatsAppConfigured
        ? "NEXT_PUBLIC_SUPPORT_WHATSAPP is configured."
        : "NEXT_PUBLIC_SUPPORT_WHATSAPP is not configured. Set the real WhatsApp Business/support number before public use.",
      ok: supportWhatsAppConfigured,
    },
    {
      title: "Database pool limit",
      detail: databasePoolConfigured
        ? `DATABASE_POOL_MAX is set to ${process.env.DATABASE_POOL_MAX}.`
        : "DATABASE_POOL_MAX is not set. Set DATABASE_POOL_MAX=1 on Vercel to reduce Supabase pool pressure during server rendering.",
      ok: databasePoolConfigured,
    },
    {
      title: "Payment gateway integration",
      detail: "Paystack checkout and webhook handling have been validated in the workflow. Before production, confirm live keys, live webhook URL and settlement/reconciliation process.",
      ok: true,
      href: "/admin/integration-readiness",
    },
    {
      title: "Prisma migration history",
      detail: "Temporary sync path uses prisma db push + prisma generate because old migration history has sqlite/provider mismatch. Clean Postgres migration baseline is still needed before serious production data growth.",
      ok: false,
    },
  ];

  return (
    <AdminPage
      title="Launch readiness"
      subtitle="System and launch checklist for database, ordering, payments, delivery, buyer accounts, integrations and production configuration."
    >
      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              System & launch
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#102015]">
              Readiness checks
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
              This page separates what is usable now from what still needs configuration or integration before launch.
            </p>
          </div>

          <Link
            href="/admin/deployment-readiness"
            className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
          >
            Operations
          </Link>
        </div>

        <div className="mt-6">
          {checks.map((check) => (
            <CheckRow key={check.title} {...check} />
          ))}
        </div>
      </section>
    </AdminPage>
  );
}
