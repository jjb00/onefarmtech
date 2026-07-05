import AdminPageShell from "@/components/AdminPageShell";
import {prisma} from "@/lib/prisma";
import {updateOrderRequestStatusAction} from "@/actions/createAdminRecords";

export default async function OrderRequestsPage() {
  const requests = await prisma.orderRequest.findMany({
    orderBy: {createdAt: "desc"},
    take: 100,
  });

  const newCount = requests.filter((request) => request.status === "New").length;
  const groupBuyCount = requests.filter((request) => request.groupBuyInterest).length;
  const deliveryCount = requests.filter((request) =>
    request.deliveryPreference.toLowerCase().includes("delivery"),
  ).length;

  return (
    <AdminPageShell
      title="Order requests"
      description="Review public fresh produce requests before converting them into confirmed orders, group-buys, pickup plans, or delivery follow-ups."
    >
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Total requests" value={String(requests.length)} />
          <Metric label="New" value={String(newCount)} />
          <Metric label="Group-buy interest" value={String(groupBuyCount)} />
          <Metric label="Delivery-related" value={String(deliveryCount)} />
        </section>

        <section className="grid gap-4">
          {requests.map((request) => (
            <article
              key={request.id}
              className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-[#C95F3D]">
                    {request.buyerType}
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-[#102015]">
                    {request.buyerName}
                  </h2>

                  <p className="mt-2 text-sm leading-7 text-[#405348]">
                    {request.phone}
                    {request.email ? ` · ${request.email}` : ""}
                    {request.location ? ` · ${request.location}` : ""}
                  </p>
                </div>

                <span className="rounded-full bg-[#F2B84B]/20 px-3 py-1 text-xs font-black text-[#102015]">
                  {request.status}
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <SmallMetric
                  label="Fulfilment"
                  value={request.deliveryPreference}
                />
                <SmallMetric
                  label="Timing"
                  value={request.timing || "Not provided"}
                />
                <SmallMetric
                  label="Group-buy"
                  value={request.groupBuyInterest ? "Interested" : "No"}
                />
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl bg-[#f3f8ef] p-4 text-sm leading-7 text-[#405348]">
                  <strong className="text-[#102015]">Items:</strong>{" "}
                  {request.items}
                </div>

                <div className="rounded-2xl bg-[#f3f8ef] p-4 text-sm leading-7 text-[#405348]">
                  <strong className="text-[#102015]">Message:</strong>{" "}
                  {request.message || "No extra message provided."}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <StatusButton requestId={request.id} status="Reviewing" label="Mark reviewing" />
                <StatusButton requestId={request.id} status="Converted to order" label="Converted to order" strong />
                <StatusButton requestId={request.id} status="Followed up on WhatsApp" label="WhatsApp follow-up" />
                <StatusButton requestId={request.id} status="Closed" label="Close" />
                <StatusButton requestId={request.id} status="Rejected" label="Reject" danger />
              </div>

              <p className="mt-4 text-xs font-semibold text-[#587063]">
                Submitted {request.createdAt.toLocaleString()} · Source: {request.source}
              </p>
            </article>
          ))}

          {!requests.length ? (
            <div className="rounded-[2rem] border border-[#102015]/10 bg-white p-8 text-center text-[#587063] shadow-sm">
              No order requests yet.
            </div>
          ) : null}
        </section>
      </div>
    </AdminPageShell>
  );
}

function StatusButton({
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
    </form>
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
