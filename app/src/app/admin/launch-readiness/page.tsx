import Link from "next/link";
import {AdminPage} from "@/components/portal/AdminPage";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function StatusPill({ok, label}: {ok: boolean; label: string}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
        ok ? "bg-[#eef6ea] text-[#1f7a3f]" : "bg-[#fff6d6] text-[#7a4a00]"
      }`}
    >
      {label}
    </span>
  );
}

function Row({
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
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#102015]/10 py-4 last:border-b-0">
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
      <StatusPill ok={ok} label={ok ? "Ready" : "Needs work"} />
    </div>
  );
}

export default async function LaunchReadinessPage() {
  await requireStaff();

  let databaseConnected = false;
  let counts = {
    customers: 0,
    orders: 0,
    buyerMessages: 0,
    products: 0,
  };

  try {
    const [customers, orders, buyerMessages, products] = await Promise.all([
      prisma.customer.count(),
      prisma.order.count(),
      prisma.buyerMessage.count(),
      prisma.product.count(),
    ]);

    databaseConnected = true;
    counts = {customers, orders, buyerMessages, products};
  } catch {
    databaseConnected = false;
  }

  const supportWhatsAppConfigured = Boolean(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP);
  const databasePoolConfigured = Boolean(process.env.DATABASE_POOL_MAX);

  const checks = [
    {
      title: "Database connection",
      detail: databaseConnected
        ? `Connected. Current counts: ${counts.customers} customers, ${counts.orders} orders, ${counts.products} products, ${counts.buyerMessages} buyer messages.`
        : "Database query failed. Check DATABASE_URL, Supabase pooler settings and Prisma client generation.",
      ok: databaseConnected,
    },
    {
      title: "Buyer account requests",
      detail: "Public buyer account request and admin review flow should be available.",
      ok: true,
      href: "/admin/buyer-account-requests",
    },
    {
      title: "Buyer access codes",
      detail: "Invite-code buyer login is the current fastest auth route. Confirm approved buyers have active access codes.",
      ok: true,
      href: "/admin/buyer-access",
    },
    {
      title: "Buyer messages evidence log",
      detail: "BuyerMessage exists and admin has a communication evidence page.",
      ok: true,
      href: "/admin/buyer-messages",
    },
    {
      title: "Support WhatsApp number",
      detail: supportWhatsAppConfigured
        ? "NEXT_PUBLIC_SUPPORT_WHATSAPP is configured."
        : "NEXT_PUBLIC_SUPPORT_WHATSAPP is not configured. Set the real WhatsApp Business number before public launch.",
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
      title: "Payment gateway",
      detail: "Payment gateway/API is not yet connected. For launch, use manual proof-of-payment and admin confirmation unless gateway is added.",
      ok: false,
    },
    {
      title: "Email delivery",
      detail: "Transactional email provider is not yet connected. Buyer notifications are logged internally, but automated email sending is still pending.",
      ok: false,
    },
    {
      title: "WhatsApp API",
      detail: "Manual WhatsApp compose is acceptable for v1. API/webhook delivery status is a later integration.",
      ok: false,
    },
    {
      title: "Prisma migration history",
      detail: "Current temporary safe sync path is prisma db push + prisma generate because old migration lock references sqlite. Clean migration baseline is needed before serious production data growth.",
      ok: false,
    },
  ];

  return (
    <AdminPage
      title="Launch readiness"
      subtitle="Operational checklist for database, buyer workflows, communications and launch blockers."
    >
      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Launch hardening
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#102015]">
              Readiness checks
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
              This page separates what is usable now from what still needs configuration before a full public launch.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-full border border-[#102015]/15 bg-white px-4 py-2 text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="mt-6">
          {checks.map((check) => (
            <Row key={check.title} {...check} />
          ))}
        </div>
      </section>
    </AdminPage>
  );
}
