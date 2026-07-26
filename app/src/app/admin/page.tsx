import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import {prisma} from "@/lib/prisma";
import {nonOperationalWhatsAppPhrases} from "@/lib/whatsappClassification.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AdminDashboardPageProps = {
  searchParams?: Promise<{access?: string}>;
};

export default async function AdminDashboardPage({
  searchParams,
}: AdminDashboardPageProps) {
  const params = await searchParams;

  const [
    newRequests,
    ordersNeedingAction,
    paymentsNeedingFollowUp,
    fulfilmentDue,
    buyerApplications,
    profileUpdates,
    openComplaints,
    knownWhatsAppExceptions,
    unknownWhatsAppExceptions,
  ] = await Promise.all([
    prisma.orderRequest.count({where: {status: {in: ["New", "Reviewing"]}}}),
    prisma.order.count({
      where: {
        OR: [
          {paymentStatus: {in: ["Unpaid", "Pending", "Failed"]}},
          {fulfilmentStatus: {in: ["New order", "Pending", "Confirmed"]}},
          {paymentRequests: {some: {status: {in: ["Failed", "Expired"]}}}},
          {complaints: {some: {status: {notIn: ["Resolved", "Closed"]}}}},
        ],
      },
    }),
    prisma.paymentRequest.count({where: {status: {in: ["Pending", "Failed"]}}}),
    prisma.order.count({
      where: {
        paymentStatus: {in: ["Paid", "Approved"]},
        fulfilmentStatus: {
          notIn: ["Delivered", "Collected", "Completed", "Cancelled"],
        },
      },
    }),
    prisma.buyerAccountRequest.count({
      where: {status: {in: ["New", "Reviewing"]}},
    }),
    prisma.buyerProfileUpdateRequest.count({
      where: {status: {in: ["New", "Reviewing"]}},
    }),
    prisma.complaint.count({
      where: {status: {notIn: ["Resolved", "Closed"]}},
    }),
    prisma.buyerMessage.count({
      where: {
        channel: "WhatsApp",
        direction: "Inbound",
        status: {notIn: ["Replied", "Closed", "Resolved", "Archived"]},
      },
    }),
    prisma.contactEnquiry.count({
      where: {
        enquiryType: "WhatsApp inbound",
        status: {in: ["New", "Open"]},
        OR: [
          {adminNote: {contains: "classification: operational"}},
          {
            AND: nonOperationalWhatsAppPhrases.map((phrase) => ({
              message: {not: {contains: phrase}},
            })),
          },
        ],
      },
    }),
  ]);

  const whatsappExceptions =
    knownWhatsAppExceptions + unknownWhatsAppExceptions;

  const queues = [
    {
      label: "New order requests",
      value: newRequests,
      href: "/admin/orders?view=new-requests",
      action: "Review requests",
    },
    {
      label: "Orders needing action",
      value: ordersNeedingAction,
      href: "/admin/orders?view=needs-action",
      action: "Open orders",
    },
    {
      label: "Payment follow-up",
      value: paymentsNeedingFollowUp,
      href: "/admin/payments?status=pending",
      action: "Open payments",
    },
    {
      label: "Fulfilment",
      value: fulfilmentDue,
      href: "/admin/orders?view=fulfilment",
      action: "Open fulfilment",
    },
    {
      label: "Buyer applications",
      value: buyerApplications,
      href: "/admin/customers?view=applications",
      action: "Review applications",
    },
    {
      label: "Profile updates",
      value: profileUpdates,
      href: "/admin/customers?view=updates",
      action: "Review updates",
    },
    {
      label: "Open complaints",
      value: openComplaints,
      href: "/admin/complaints",
      action: "Open complaints",
    },
    ...(whatsappExceptions
      ? [{
          label: "Messages needing a reply",
          value: whatsappExceptions,
          href: "/admin/buyer-messages?view=needs-reply",
          action: "Review messages",
        }]
      : []),
  ];

  return (
    <AdminShell
      title="Today"
      description="Work that needs attention."
      action={
        <Link
          href="/admin/create-order"
          className="inline-flex min-h-11 items-center rounded-xl bg-[#1f7a3f] px-5 text-sm font-black text-white"
        >
          New order
        </Link>
      }
    >
      <div className="grid gap-5">
        {params?.access === "denied" ? (
          <div className="rounded-xl border border-[#c2410c]/20 bg-[#fff4ef] px-4 py-3 text-sm font-bold text-[#9b2f12]">
            Your account does not have access to that page.
          </div>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {queues.map((queue) => (
            <Link
              key={queue.label}
              href={queue.href}
              className="group rounded-2xl border border-[#102015]/10 bg-white p-5 shadow-sm transition hover:border-[#1f7a3f]/35 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-[#587063]">{queue.label}</p>
                  <p className="mt-2 text-4xl font-black text-[#102015]">
                    {queue.value}
                  </p>
                </div>
                <span className="text-xl text-[#1f7a3f]" aria-hidden="true">›</span>
              </div>
              <p className="mt-5 text-sm font-black text-[#1f7a3f]">
                {queue.action}
              </p>
            </Link>
          ))}
        </section>

        {!queues.some((queue) => queue.value > 0) ? (
          <div className="rounded-2xl border border-[#102015]/10 bg-white p-8 text-center">
            <h2 className="text-xl font-black">Nothing needs attention</h2>
            <p className="mt-2 text-sm text-[#587063]">
              New work will appear here as it arrives.
            </p>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
