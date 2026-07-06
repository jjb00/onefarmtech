import Link from "next/link";
import {AdminPage} from "@/components/portal/AdminPage";
import {requireStaff} from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const operations = [
  {
    title: "WhatsApp order entry",
    href: "/admin/whatsapp-orders/new",
    description: "Create database orders from WhatsApp conversations using live product prices.",
  },
  {
    title: "Buyer messages",
    href: "/admin/buyer-messages",
    description: "View buyer communication evidence, prepared WhatsApp messages and account notices.",
  },
  {
    title: "Deliveries",
    href: "/admin/deliveries",
    description: "Track fulfilment, delivery assignment and delivery status.",
  },
  {
    title: "Delivery partners",
    href: "/admin/delivery-partners",
    description: "Manage delivery partners, contact details, areas and status.",
  },
  {
    title: "Buyer profile requests",
    href: "/admin/buyer-profile-requests",
    description: "Review buyer account, profile, contact and credit update requests.",
  },
  {
    title: "Launch readiness",
    href: "/admin/launch-readiness",
    description: "Review launch blockers, environment configuration and operational readiness.",
  },
];

export default async function AdminOperationsPage() {
  await requireStaff();

  return (
    <AdminPage
      title="Operations"
      subtitle="Shortcuts for WhatsApp order intake, buyer communications, delivery and launch readiness."
    >
      <section className="grid gap-4 md:grid-cols-2">
        {operations.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[2rem] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Open
            </p>
            <h2 className="mt-3 text-2xl font-black text-[#102015]">{item.title}</h2>
            <p className="mt-2 text-sm leading-7 text-[#405348]">{item.description}</p>
          </Link>
        ))}
      </section>
    </AdminPage>
  );
}
