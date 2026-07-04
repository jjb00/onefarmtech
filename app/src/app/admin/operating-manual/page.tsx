import Link from "next/link";
import AdminPageShell from "@/components/AdminPageShell";

const manuals = [
  {
    title: "WhatsApp order intake",
    owner: "Admin / Support",
    steps: [
      "Confirm buyer name, phone, buyer type, location, items, quantities, delivery/pickup preference, and timing.",
      "Create or link the buyer record before creating the order where possible.",
      "Create the order in admin and keep the buyer informed by WhatsApp.",
      "Do not promise fulfilment until allocation, payment terms, and logistics are confirmed.",
    ],
  },
  {
    title: "Payment handling",
    owner: "Finance",
    steps: [
      "Confirm payment amount, provider, and reference.",
      "Record payment against the correct order.",
      "Update payment status only when reference or internal approval is clear.",
      "Issue receipt after payment or approved credit terms are recorded.",
    ],
  },
  {
    title: "Order allocation and fulfilment",
    owner: "Operations",
    steps: [
      "Move orders through allocation, packing, dispatch, delivery, or pickup statuses.",
      "Use admin notes for supplier, route, quality, or exception details.",
      "Avoid weak public language such as searching or sourcing; use allocation and fulfilment language.",
      "Escalate unclear quality, quantity, or route issues before confirming completion.",
    ],
  },
  {
    title: "Complaint handling",
    owner: "Support",
    steps: [
      "Log complaint from the order detail page.",
      "Set priority and clear issue description.",
      "Use resolution field once action is taken.",
      "Keep the buyer updated on WhatsApp until resolved.",
    ],
  },
  {
    title: "Group-buy handling",
    owner: "Operations / Commercial",
    steps: [
      "Create city or private group buys as admin-reviewed offers.",
      "Track reservations, payment collection, reserved quantity, and target quantity.",
      "Only move to active fulfilment after minimum quantity/payment rules are met.",
      "Use group-buy notes for pickup window, allocation route, and buyer communication.",
    ],
  },
  {
    title: "Buyer account management",
    owner: "Buyer account manager",
    steps: [
      "Maintain receipt email, payment terms, credit limit, outstanding balance, and account status.",
      "Only mark buyers login-ready when proper auth is connected.",
      "Review credit exposure before allowing post-paid or credit-term orders.",
      "Use receipts and order history to support recurring buyer relationships.",
    ],
  },
];

export default function OperatingManualPage() {
  return (
    <AdminPageShell
      title="Operating manual"
      description="Practical working guide for the WhatsApp-first operations desk. This keeps staff aligned before automation, Paystack, Supabase Auth, and WhatsApp API are added."
    >
      <div className="grid gap-6">
        <section className="grid gap-5 lg:grid-cols-2">
          {manuals.map((manual) => (
            <article
              key={manual.title}
              className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <h2 className="text-xl font-black text-[#102015]">
                  {manual.title}
                </h2>

                <span className="rounded-full bg-[#3E7A4C]/10 px-3 py-1 text-xs font-black text-[#3E7A4C]">
                  {manual.owner}
                </span>
              </div>

              <ol className="mt-5 grid gap-3">
                {manual.steps.map((step, index) => (
                  <li
                    key={step}
                    className="rounded-2xl bg-[#f3f8ef] p-4 text-sm leading-7 text-[#405348]"
                  >
                    <strong className="text-[#102015]">
                      Step {index + 1}:
                    </strong>{" "}
                    {step}
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm">
          <h2 className="text-2xl font-black text-[#102015]">
            Daily operating rhythm
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <QuickLink href="/admin/workflows" title="Morning workflow review" />
            <QuickLink href="/admin/payments" title="Finance/payment check" />
            <QuickLink href="/admin/complaints" title="Issue watch" />
            <QuickLink href="/admin/group-buys" title="Group-buy progress" />
            <QuickLink href="/admin/receipts" title="Receipt issue queue" />
            <QuickLink href="/admin/audit-log" title="Audit review" />
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}

function QuickLink({href, title}: {href: string; title: string}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[#102015]/10 bg-[#f3f8ef] p-4 text-sm font-bold text-[#1f7a3f]"
    >
      {title}
    </Link>
  );
}
