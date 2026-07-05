import AdminPageShell from "@/components/AdminPageShell";
import {prisma} from "@/lib/prisma";
import {
  convertBuyerAccountRequestToCustomerAction,
  updateBuyerAccountRequestStatusAction,
} from "@/actions/createAdminRecords";

export default async function BuyerAccountRequestsPage() {
  const requests = await prisma.buyerAccountRequest.findMany({
    orderBy: {createdAt: "desc"},
    take: 100,
  });

  const newCount = requests.filter((request) => request.status === "New").length;
  const creditInterest = requests.filter((request) => request.interestedInCredit).length;

  return (
    <AdminPageShell
      title="Buyer account requests"
      description="Review public account setup requests from recurring buyers, businesses, offices, households, and group-buy organisers."
    >
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-3">
          <Metric label="Total requests" value={String(requests.length)} />
          <Metric label="New" value={String(newCount)} />
          <Metric label="Credit/payment interest" value={String(creditInterest)} />
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
                    {request.organisationName || request.contactName}
                  </h2>

                  <p className="mt-2 text-sm leading-7 text-[#405348]">
                    Contact: <strong>{request.contactName}</strong> · {request.phone}
                    {request.email ? ` · ${request.email}` : ""}
                  </p>
                </div>

                <span className="rounded-full bg-[#F2B84B]/20 px-3 py-1 text-xs font-black text-[#102015]">
                  {request.status}
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <SmallMetric label="Location" value={request.location || "Not provided"} />
                <SmallMetric label="Frequency" value={request.orderFrequency || "Not provided"} />
                <SmallMetric label="Estimated spend" value={request.estimatedSpend || "Not provided"} />
                <SmallMetric label="Payment method" value={request.preferredPaymentMethod || "Not provided"} />
                <SmallMetric label="Receipts needed" value={request.needsReceipts ? "Yes" : "No"} />
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl bg-[#f3f8ef] p-4 text-sm leading-7 text-[#405348]">
                  <strong className="text-[#102015]">Usual produce:</strong>{" "}
                  {request.usualProduceNeeds || "Not provided"}
                </div>

                <div className="rounded-2xl bg-[#f3f8ef] p-4 text-sm leading-7 text-[#405348]">
                  <strong className="text-[#102015]">Credit/payment interest:</strong>{" "}
                  {request.interestedInCredit ? "Yes" : "No"}
                  {request.message ? (
                    <>
                      <br />
                      <strong className="text-[#102015]">Message:</strong>{" "}
                      {request.message}
                    </>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <form action={updateBuyerAccountRequestStatusAction}>
                  <input type="hidden" name="requestId" value={request.id} />
                  <input type="hidden" name="status" value="Reviewing" />
                  <button
                    type="submit"
                    className="rounded-full border border-[#102015]/10 bg-white px-4 py-2 text-xs font-black text-[#102015] shadow-sm"
                  >
                    Set reviewing
                  </button>
                </form>

                <form action={updateBuyerAccountRequestStatusAction}>
                  <input type="hidden" name="requestId" value={request.id} />
                </form>

                <form action={updateBuyerAccountRequestStatusAction}>
                  <input type="hidden" name="requestId" value={request.id} />
                  <input type="hidden" name="status" value="Rejected" />
                  <button
                    type="submit"
                    className="rounded-full bg-[#C95F3D] px-4 py-2 text-xs font-black text-white shadow-sm"
                  >
                    Reject
                  </button>
                </form>

                <form action={convertBuyerAccountRequestToCustomerAction}>
                  <input type="hidden" name="requestId" value={request.id} />
                  <button
                    type="submit"
                    className="rounded-full bg-[#102015] px-4 py-2 text-xs font-black text-white shadow-sm"
                  >
                    Approve + create buyer profile
                  </button>
                </form>

                <form action={updateBuyerAccountRequestStatusAction}>
                  <input type="hidden" name="requestId" value={request.id} />
                  <input type="hidden" name="status" value="Closed" />
                  <button
                    type="submit"
                    className="rounded-full border border-[#102015]/10 bg-[#f3f8ef] px-4 py-2 text-xs font-black text-[#102015]"
                  >
                    Close
                  </button>
                </form>
              </div>

              <p className="mt-4 text-xs font-semibold text-[#587063]">
                Submitted {request.createdAt.toLocaleString()} · Source: {request.source}
              </p>
            </article>
          ))}

          {!requests.length ? (
            <div className="rounded-[2rem] border border-[#102015]/10 bg-white p-8 text-center text-[#587063] shadow-sm">
              No buyer account requests yet.
            </div>
          ) : null}
        </section>
      </div>
    </AdminPageShell>
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
