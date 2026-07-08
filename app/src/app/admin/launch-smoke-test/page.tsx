import Link from "next/link";
import {AdminPage} from "@/components/portal/AdminPage";
import {requireStaff} from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const sections = [
  {
    title: "Public ordering",
    checks: [
      "Open /order and confirm buyer can understand how to place an order.",
      "Submit /order-request with a test phone number.",
      "Confirm the request appears in /admin/order-requests.",
    ],
  },
  {
    title: "WhatsApp-assisted order",
    checks: [
      "Open /admin/whatsapp-orders/new.",
      "Create a test WhatsApp-assisted order.",
      "Confirm order appears in /admin/orders.",
      "Confirm payment request is created or can be created from order detail.",
    ],
  },
  {
    title: "Payment",
    checks: [
      "Generate Paystack payment link from /admin/payment-requests.",
      "Generate Flutterwave payment link if keys are configured.",
      "Confirm manual bank transfer details can still be saved.",
      "Mark payment Paid manually if webhook is not live.",
      "Issue receipt after payment is Paid.",
    ],
  },
  {
    title: "WhatsApp messaging",
    checks: [
      "Copy WhatsApp payment message from order detail/payment request.",
      "Send WhatsApp payment request through API if Meta keys are configured.",
      "Send inbound WhatsApp test message to connected number.",
      "Confirm message appears in /admin/whatsapp-inbox.",
      "If message looks like an order, confirm draft appears in /admin/whatsapp-drafts.",
    ],
  },
  {
    title: "Draft conversion",
    checks: [
      "Open /admin/whatsapp-drafts.",
      "Click Create order from draft.",
      "Confirm order form shows the source draft panel.",
      "Create confirmed WhatsApp order after staff review.",
      "Mark draft Converted to order.",
    ],
  },
  {
    title: "Delivery",
    checks: [
      "Create or assign delivery from order detail.",
      "Confirm /admin/deliveries shows the delivery.",
      "Confirm delivery partner portal shows assigned job if partner access is configured.",
    ],
  },
];

export default async function LaunchSmokeTestPage() {
  await requireStaff();

  return (
    <AdminPage
      title="Launch smoke test"
      subtitle="Manual end-to-end checklist for the team before production launch."
    >
      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Launch QA
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#102015]">
              End-to-end operating checklist
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
              Use this after provider credentials are configured. The goal is to prove the whole manual operating flow works before relying on automation.
            </p>
          </div>

          <Link
            href="/admin/integration-readiness"
            className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white hover:bg-[#155c2f]"
          >
            Check integrations
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <article key={section.title} className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h3 className="text-xl font-black text-[#102015]">{section.title}</h3>
            <ol className="mt-4 grid gap-3">
              {section.checks.map((check, index) => (
                <li key={check} className="flex gap-3 rounded-2xl bg-[#f7f5ec] p-4 text-sm leading-6 text-[#405348]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-[#1f7a3f]">
                    {index + 1}
                  </span>
                  <span>{check}</span>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </section>
    </AdminPage>
  );
}
