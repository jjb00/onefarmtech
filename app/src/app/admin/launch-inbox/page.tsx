import Link from "next/link";
import AdminPageShell from "@/components/AdminPageShell";
import {prisma} from "@/lib/prisma";
import {
  convertBuyerAccountRequestToCustomerAction,
  updateBuyerAccountRequestStatusAction,
  updateContactEnquiryStatusAction,
  updateOrderRequestStatusAction,
} from "@/actions/createAdminRecords";

function whatsappHref(phone?: string | null, message?: string) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message || "Hello from OneFarmTech. We are following up on your request.")}`;
}

function emailHref(email?: string | null, subject?: string, body?: string) {
  if (!email) return null;
  return `mailto:${email}?subject=${encodeURIComponent(subject || "OneFarmTech request update")}&body=${encodeURIComponent(body || "Hello, thank you for contacting OneFarmTech. We are following up on your request.")}`;
}

function isOpenStatus(status: string) {
  return !["Closed", "Rejected", "Converted to customer", "Converted to order"].includes(status);
}

function statusBucket(status: string) {
  if (["Closed", "Rejected", "Converted to customer", "Converted to order"].includes(status)) {
    return "Converted / closed";
  }

  if (status.toLowerCase().includes("followed")) {
    return "Followed up";
  }

  if (status === "Reviewing") {
    return "Reviewing";
  }

  return "New";
}

function formatSubmittedAt(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function LaunchInboxPage() {
  const [buyerRequests, orderRequests, contactEnquiries] = await Promise.all([
    prisma.buyerAccountRequest.findMany({
      orderBy: {createdAt: "desc"},
      take: 40,
    }),
    prisma.orderRequest.findMany({
      orderBy: {createdAt: "desc"},
      take: 40,
    }),
    prisma.contactEnquiry.findMany({
      orderBy: {createdAt: "desc"},
      take: 40,
    }),
  ]);

  const openBuyerRequests = buyerRequests.filter((request) => isOpenStatus(request.status));
  const openOrderRequests = orderRequests.filter((request) => isOpenStatus(request.status));
  const openContactEnquiries = contactEnquiries.filter((enquiry) => isOpenStatus(enquiry.status));

  const totalOpen =
    openBuyerRequests.length + openOrderRequests.length + openContactEnquiries.length;

  const allItems = [
    ...buyerRequests.map((item) => ({status: item.status})),
    ...orderRequests.map((item) => ({status: item.status})),
    ...contactEnquiries.map((item) => ({status: item.status})),
  ];

  const statusSummary = ["New", "Reviewing", "Followed up", "Converted / closed"].map((label) => ({
    label,
    count: allItems.filter((item) => statusBucket(item.status) === label).length,
  }));

  return (
    <AdminPageShell
      title="Launch inbox"
      description="One place to review launch-day buyer requests, order requests, and contact enquiries before following up by WhatsApp, email, or internal admin action."
    >
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Open items" value={String(totalOpen)} />
          <Metric label="Buyer requests" value={String(openBuyerRequests.length)} />
          <Metric label="Order requests" value={String(openOrderRequests.length)} />
          <Metric label="Contact enquiries" value={String(openContactEnquiries.length)} />
        </section>

        <section className="grid gap-3 md:grid-cols-4">
          {statusSummary.map((item) => (
            <div
              key={item.label}
              className="rounded-[1.5rem] border border-[#102015]/10 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#587063]">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-black text-[#102015]">{item.count}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[2rem] border border-[#102015]/10 bg-white p-5 text-[#102015] shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">Launch-day operating rule</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
                Treat this as the first response queue. Open the request, follow up by
                WhatsApp or email, then mark the item as reviewing, followed up, converted,
                rejected, or closed. Keep the public workflow simple; keep the admin workflow structured.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/order-requests"
                className="rounded-full border border-[#102015]/10 bg-[#f3f8ef] px-4 py-2 text-xs font-black text-[#102015]"
              >
                Order requests
              </Link>
              <Link
                href="/admin/buyer-account-requests"
                className="rounded-full border border-[#102015]/10 bg-[#f3f8ef] px-4 py-2 text-xs font-black text-[#102015]"
              >
                Buyer requests
              </Link>
              <Link
                href="/admin/contact-enquiries"
                className="rounded-full border border-[#102015]/10 bg-[#f3f8ef] px-4 py-2 text-xs font-black text-[#102015]"
              >
                Contact enquiries
              </Link>
            </div>
          </div>
        </section>

        <InboxSection
          title="Buyer account requests"
          description="Approve credible recurring buyers by creating a buyer profile. Login invitations come later when auth is connected."
          count={buyerRequests.length}
          empty="No buyer account requests yet."
        >
          {buyerRequests.map((request) => {
            const wa = whatsappHref(
              request.phone,
              `Hello ${request.contactName}, thank you for requesting a OneFarmTech buyer account. We are reviewing your details and will get back to you within 2 working days.`,
            );
            const email = emailHref(
              request.email,
              "OneFarmTech buyer account request",
              `Hello ${request.contactName},\n\nThank you for requesting a OneFarmTech buyer account. We are reviewing your details and will get back to you within 2 working days.\n\nOneFarmTech`,
            );

            return (
              <article key={request.id} className="rounded-[1.5rem] border border-[#102015]/10 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C95F3D]">
                      Buyer account request · {request.buyerType}
                    </p>
                    <h3 className="mt-2 text-xl font-black text-[#102015]">
                      {request.organisationName || request.contactName}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[#405348]">
                      {request.contactName} · {request.phone}
                      {request.email ? ` · ${request.email}` : ""}
                      {request.location ? ` · ${request.location}` : ""}
                    </p>
                  </div>

                  <StatusPill status={request.status} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <SmallMetric label="Submitted" value={formatSubmittedAt(request.createdAt)} />
                  <SmallMetric label="Frequency" value={request.orderFrequency || "Not provided"} />
                  <SmallMetric label="Spend" value={request.estimatedSpend || "Not provided"} />
                  <SmallMetric label="Credit interest" value={request.interestedInCredit ? "Yes" : "No"} />
                </div>

                <p className="mt-4 rounded-2xl bg-[#f3f8ef] p-4 text-sm leading-7 text-[#405348]">
                  <strong className="text-[#102015]">Produce needs:</strong>{" "}
                  {request.usualProduceNeeds || "Not provided"}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {wa ? <ExternalButton href={wa} label="WhatsApp buyer" /> : null}
                  {email ? <ExternalButton href={email} label="Email buyer" /> : null}

                  <BuyerStatusButton requestId={request.id} status="Reviewing" label="Set reviewing" />
                  <BuyerStatusButton requestId={request.id} status="Followed up" label="Followed up" />
                  <BuyerStatusButton requestId={request.id} status="Rejected" label="Reject" danger />
                  <form action={convertBuyerAccountRequestToCustomerAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-[#1f7a3f] px-4 py-2 text-xs font-black text-white shadow-sm"
                    >
                      Approve + create buyer profile
                    </button>
                  </form>
                  <BuyerStatusButton requestId={request.id} status="Closed" label="Close" />
                </div>
              </article>
            );
          })}
        </InboxSection>

        <InboxSection
          title="Order requests"
          description="Review fresh produce requests and follow up before converting to confirmed orders or group-buy workflows."
          count={orderRequests.length}
          empty="No order requests yet."
        >
          {orderRequests.map((request) => {
            const wa = whatsappHref(
              request.phone,
              `Hello ${request.buyerName}, thank you for your OneFarmTech order request. We are reviewing the items and will follow up shortly.`,
            );
            const email = emailHref(
              request.email,
              "OneFarmTech order request",
              `Hello ${request.buyerName},\n\nThank you for your OneFarmTech order request. We are reviewing the items and will follow up shortly.\n\nOneFarmTech`,
            );

            return (
              <article key={request.id} className="rounded-[1.5rem] border border-[#102015]/10 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C95F3D]">
                      Order request · {request.buyerType}
                    </p>
                    <h3 className="mt-2 text-xl font-black text-[#102015]">
                      {request.buyerName}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[#405348]">
                      {request.phone}
                      {request.email ? ` · ${request.email}` : ""}
                      {request.location ? ` · ${request.location}` : ""}
                    </p>
                  </div>

                  <StatusPill status={request.status} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <SmallMetric label="Submitted" value={formatSubmittedAt(request.createdAt)} />
                  <SmallMetric label="Fulfilment" value={request.deliveryPreference} />
                  <SmallMetric label="Timing" value={request.timing || "Not provided"} />
                  <SmallMetric label="Group-buy" value={request.groupBuyInterest ? "Interested" : "No"} />
                </div>

                <p className="mt-4 rounded-2xl bg-[#f3f8ef] p-4 text-sm leading-7 text-[#405348]">
                  <strong className="text-[#102015]">Items:</strong> {request.items}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {wa ? <ExternalButton href={wa} label="WhatsApp buyer" /> : null}
                  {email ? <ExternalButton href={email} label="Email buyer" /> : null}

                  <OrderStatusButton requestId={request.id} status="Reviewing" label="Mark reviewing" />
                  <OrderStatusButton requestId={request.id} status="Followed up on WhatsApp" label="WhatsApp follow-up" />
                  <OrderStatusButton requestId={request.id} status="Converted to order" label="Converted to order" strong />
                  <OrderStatusButton requestId={request.id} status="Closed" label="Close" />
                  <OrderStatusButton requestId={request.id} status="Rejected" label="Reject" danger />
                </div>
              </article>
            );
          })}
        </InboxSection>

        <InboxSection
          title="Contact enquiries"
          description="Review support messages, partnership enquiries, media requests and general public contact form submissions."
          count={contactEnquiries.length}
          empty="No contact enquiries yet."
        >
          {contactEnquiries.map((enquiry) => {
            const wa = whatsappHref(
              enquiry.phone,
              `Hello ${enquiry.name}, thank you for contacting OneFarmTech. We are following up on your enquiry.`,
            );
            const email = emailHref(
              enquiry.email,
              "OneFarmTech enquiry",
              `Hello ${enquiry.name},\n\nThank you for contacting OneFarmTech. We are following up on your enquiry.\n\nOneFarmTech`,
            );

            return (
              <article key={enquiry.id} className="rounded-[1.5rem] border border-[#102015]/10 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C95F3D]">
                      Contact enquiry · {enquiry.enquiryType}
                    </p>
                    <h3 className="mt-2 text-xl font-black text-[#102015]">
                      {enquiry.organisation || enquiry.name}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[#405348]">
                      {enquiry.name}
                      {enquiry.email ? ` · ${enquiry.email}` : ""}
                      {enquiry.phone ? ` · ${enquiry.phone}` : ""}
                    </p>
                  </div>

                  <StatusPill status={enquiry.status} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <SmallMetric label="Submitted" value={formatSubmittedAt(enquiry.createdAt)} />
                  <SmallMetric label="Status bucket" value={statusBucket(enquiry.status)} />
                </div>

                <p className="mt-4 rounded-2xl bg-[#f3f8ef] p-4 text-sm leading-7 text-[#405348]">
                  {enquiry.message}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {wa ? <ExternalButton href={wa} label="WhatsApp contact" /> : null}
                  {email ? <ExternalButton href={email} label="Email contact" /> : null}

                  <ContactStatusButton enquiryId={enquiry.id} status="Reviewing" label="Set reviewing" />
                  <ContactStatusButton enquiryId={enquiry.id} status="Followed up" label="Followed up" strong />
                  <ContactStatusButton enquiryId={enquiry.id} status="Closed" label="Close" />
                  <ContactStatusButton enquiryId={enquiry.id} status="Rejected" label="Reject" danger />
                </div>
              </article>
            );
          })}
        </InboxSection>
      </div>
    </AdminPageShell>
  );
}

function InboxSection({
  title,
  description,
  count,
  empty,
  children,
}: {
  title: string;
  description: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-[#102015]/10 bg-[#f8fbf5] p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-[#102015]">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
            {description}
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#102015] shadow-sm">
          {count}
        </span>
      </div>

      <div className="grid gap-4">
        {count ? children : (
          <div className="rounded-[1.5rem] bg-white p-6 text-center text-sm font-semibold text-[#587063]">
            {empty}
          </div>
        )}
      </div>
    </section>
  );
}

function BuyerStatusButton({
  requestId,
  status,
  label,
  danger = false,
}: {
  requestId: string;
  status: string;
  label: string;
  danger?: boolean;
}) {
  return (
    <form action={updateBuyerAccountRequestStatusAction}>
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="status" value={status} />
      <ActionButton label={label} danger={danger} />
    </form>
  );
}

function OrderStatusButton({
  requestId,
  status,
  label,
  strong = false,
  danger = false,
}: {
  requestId: string;
  status: string;
  label: string;
  strong?: boolean;
  danger?: boolean;
}) {
  return (
    <form action={updateOrderRequestStatusAction}>
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="status" value={status} />
      <ActionButton label={label} strong={strong} danger={danger} />
    </form>
  );
}

function ContactStatusButton({
  enquiryId,
  status,
  label,
  strong = false,
  danger = false,
}: {
  enquiryId: string;
  status: string;
  label: string;
  strong?: boolean;
  danger?: boolean;
}) {
  return (
    <form action={updateContactEnquiryStatusAction}>
      <input type="hidden" name="enquiryId" value={enquiryId} />
      <input type="hidden" name="status" value={status} />
      <ActionButton label={label} strong={strong} danger={danger} />
    </form>
  );
}

function ActionButton({
  label,
  strong = false,
  danger = false,
}: {
  label: string;
  strong?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="submit"
      className={
        danger
          ? "rounded-full bg-[#C95F3D] px-4 py-2 text-xs font-black text-white shadow-sm"
          : strong
            ? "rounded-full bg-[#1f7a3f] px-4 py-2 text-xs font-black text-white shadow-sm"
            : "rounded-full border border-[#102015]/10 bg-white px-4 py-2 text-xs font-black text-[#102015] shadow-sm"
      }
    >
      {label}
    </button>
  );
}

function ExternalButton({href, label}: {href: string; label: string}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-full border border-[#102015]/10 bg-[#f3f8ef] px-4 py-2 text-xs font-black text-[#102015] shadow-sm"
    >
      {label}
    </a>
  );
}

function StatusPill({status}: {status: string}) {
  return (
    <span className="rounded-full bg-[#F2B84B]/20 px-3 py-1 text-xs font-black text-[#102015]">
      {status}
    </span>
  );
}

function Metric({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-[2rem] border border-[#102015]/10 bg-white p-5 text-[#102015] shadow-sm">
      <p className="text-2xl font-black text-[#1f7a3f]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[#405348]">{label}</p>
    </div>
  );
}

function SmallMetric({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-2xl border border-[#102015]/10 bg-[#f3f8ef] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#587063]">
        {label}
      </p>
      <p className="mt-2 text-sm font-black text-[#102015]">{value}</p>
    </div>
  );
}
