import AdminPageShell from "@/components/AdminPageShell";
import {
  AdminCompactMetric,
  AdminStatusPill,
  AdminViewBar,
  adminToneFromStatus,
} from "@/components/admin/AdminViewControls";
import {prisma} from "@/lib/prisma";
import {
  convertBuyerAccountRequestToCustomerAction,
  updateBuyerAccountRequestStatusAction,
} from "@/actions/createAdminRecords";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  searchParams?: Promise<{
    status?: string;
    date?: string;
    sort?: string;
  }>;
};

function hrefFor(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }

  const query = search.toString();
  return query ? `/admin/buyer-account-requests?${query}` : "/admin/buyer-account-requests";
}

function inDateRange(value: Date, range: string) {
  if (range === "all") return true;

  const now = new Date();
  const date = new Date(value);

  if (range === "today") return date.toDateString() === now.toDateString();

  if (range === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return date >= weekAgo;
  }

  if (range === "month") return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  if (range === "year") return date.getFullYear() === now.getFullYear();

  return true;
}

export default async function BuyerAccountRequestsPage({searchParams}: PageProps) {
  const params = await searchParams;
  const status = params?.status || "all";
  const date = params?.date || "all";
  const sort = params?.sort || "newest";

  const requests = await prisma.buyerAccountRequest.findMany({
    orderBy: {createdAt: "desc"},
    take: 200,
  });

  const newCount = requests.filter((request) => request.status === "New").length;
  const reviewingCount = requests.filter((request) => request.status === "Reviewing").length;
  const creditInterest = requests.filter((request) => request.interestedInCredit).length;
  const closedCount = requests.filter((request) => ["Closed", "Rejected"].includes(request.status)).length;

  const filtered = requests.filter((request) => {
    const statusMatch =
      status === "all" ||
      (status === "credit" && request.interestedInCredit) ||
      request.status.toLowerCase() === status;

    return statusMatch && inDateRange(request.createdAt, date);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "oldest") return a.createdAt.getTime() - b.createdAt.getTime();
    if (sort === "credit") return Number(b.interestedInCredit) - Number(a.interestedInCredit);
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const base = {status, date, sort};

  return (
    <AdminPageShell
      title="Account requests"
      description="Review and approve recurring buyer applications."
    >
      <div className="grid gap-5">
        <section className="grid gap-3 md:grid-cols-4">
          <AdminCompactMetric label="New" value={String(newCount)} tone="amber" href={hrefFor({...base, status: "new"})} />
          <AdminCompactMetric label="Reviewing" value={String(reviewingCount)} tone="blue" href={hrefFor({...base, status: "reviewing"})} />
          <AdminCompactMetric label="Credit interest" value={String(creditInterest)} tone="green" href={hrefFor({...base, status: "credit"})} />
          <AdminCompactMetric label="Closed" value={String(closedCount)} tone="neutral" href={hrefFor({...base, status: "closed"})} />
        </section>

        <AdminViewBar
          title="Request controls"
          description={`${sorted.length} request${sorted.length === 1 ? "" : "s"} shown.`}
          filterOptions={[
            {label: "All", href: hrefFor({...base, status: "all"}), active: status === "all"},
            {label: "New", href: hrefFor({...base, status: "new"}), active: status === "new"},
            {label: "Reviewing", href: hrefFor({...base, status: "reviewing"}), active: status === "reviewing"},
            {label: "Credit", href: hrefFor({...base, status: "credit"}), active: status === "credit"},
            {label: "Closed", href: hrefFor({...base, status: "closed"}), active: status === "closed"},
          ]}
          dateOptions={[
            {label: "All time", href: hrefFor({...base, date: "all"}), active: date === "all"},
            {label: "Today", href: hrefFor({...base, date: "today"}), active: date === "today"},
            {label: "7 days", href: hrefFor({...base, date: "week"}), active: date === "week"},
            {label: "This month", href: hrefFor({...base, date: "month"}), active: date === "month"},
            {label: "This year", href: hrefFor({...base, date: "year"}), active: date === "year"},
          ]}
          sortOptions={[
            {label: "Newest", href: hrefFor({...base, sort: "newest"}), active: sort === "newest"},
            {label: "Oldest", href: hrefFor({...base, sort: "oldest"}), active: sort === "oldest"},
            {label: "Credit first", href: hrefFor({...base, sort: "credit"}), active: sort === "credit"},
          ]}
        />

        <section className="hidden overflow-hidden rounded-2xl border border-[#102015]/10 bg-white shadow-sm md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
              <thead className="bg-[#f3f8ef] text-xs uppercase tracking-[0.14em] text-[#405348]">
                <tr>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Frequency</th>
                  <th className="px-4 py-3">Credit</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Manage</th>
                </tr>
              </thead>

              <tbody>
                {sorted.map((request) => (
                  <tr key={request.id} className="border-t border-[#102015]/10 align-top text-[#405348]">
                    <td className="px-4 py-3">
                      <p className="font-black text-[#102015]">{request.organisationName || request.contactName}</p>
                      <p className="text-xs">{request.buyerType}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#102015]">{request.contactName}</p>
                      <p className="text-xs">{request.phone}</p>
                      <p className="text-xs">{request.email || "No email"}</p>
                    </td>
                    <td className="px-4 py-3">{request.location || "Not provided"}</td>
                    <td className="px-4 py-3">{request.orderFrequency || "Not provided"}</td>
                    <td className="px-4 py-3">
                      <AdminStatusPill tone={request.interestedInCredit ? "green" : "neutral"}>
                        {request.interestedInCredit ? "Interested" : "No"}
                      </AdminStatusPill>
                    </td>
                    <td className="px-4 py-3">
                      <AdminStatusPill tone={adminToneFromStatus(request.status)}>
                        {request.status}
                      </AdminStatusPill>
                    </td>
                    <td className="px-4 py-3">{request.createdAt.toLocaleDateString("en-GB")}</td>
                    <td className="px-4 py-3">
                      <RequestActions request={request} />
                    </td>
                  </tr>
                ))}

                {!sorted.length ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-[#587063]" colSpan={8}>
                      No requests match this view.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-3 md:hidden">
          {sorted.map((request) => (
            <article key={request.id} className="rounded-2xl border border-[#102015]/10 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-black text-[#102015]">{request.organisationName || request.contactName}</h2>
                  <p className="mt-1 text-sm text-[#405348]">{request.buyerType} · {request.location || "Location not set"}</p>
                  <p className="mt-1 text-xs text-[#587063]">{request.phone}</p>
                </div>
                <AdminStatusPill tone={adminToneFromStatus(request.status)}>
                  {request.status}
                </AdminStatusPill>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-[#f3f8ef] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#587063]">Frequency</p>
                  <p className="mt-1 font-bold text-[#102015]">{request.orderFrequency || "N/A"}</p>
                </div>
                <div className="rounded-xl bg-[#f3f8ef] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#587063]">Credit</p>
                  <p className="mt-1 font-bold text-[#102015]">{request.interestedInCredit ? "Interested" : "No"}</p>
                </div>
              </div>

              <div className="mt-3">
                <RequestActions request={request} />
              </div>
            </article>
          ))}

          {!sorted.length ? (
            <p className="rounded-2xl bg-white p-5 text-center text-sm font-semibold text-[#587063]">
              No requests match this view.
            </p>
          ) : null}
        </section>
      </div>
    </AdminPageShell>
  );
}

function RequestActions({request}: {request: any}) {
  return (
    <details className="rounded-xl border border-[#102015]/10 bg-[#fbfff8] p-3">
      <summary className="cursor-pointer text-xs font-black text-[#1f7a3f]">Manage</summary>

      <div className="mt-3 grid gap-3">
        <details className="rounded-xl border border-[#102015]/10 bg-white p-3">
          <summary className="cursor-pointer text-xs font-black text-[#102015]">Details</summary>
          <div className="mt-2 grid gap-2 text-sm leading-6 text-[#405348]">
            <p><strong className="text-[#102015]">Spend:</strong> {request.estimatedSpend || "Not provided"}</p>
            <p><strong className="text-[#102015]">Payment:</strong> {request.preferredPaymentMethod || "Not provided"}</p>
            <p><strong className="text-[#102015]">Produce:</strong> {request.usualProduceNeeds || "Not provided"}</p>
            {request.message ? <p><strong className="text-[#102015]">Message:</strong> {request.message}</p> : null}
          </div>
        </details>

        <div className="grid gap-2 sm:grid-cols-2">
          <form action={updateBuyerAccountRequestStatusAction}>
            <input type="hidden" name="requestId" value={request.id} />
            <input type="hidden" name="status" value="Reviewing" />
            <button type="submit" className="w-full rounded-full border border-[#102015]/10 bg-white px-4 py-2 text-xs font-black text-[#102015]">
              Review
            </button>
          </form>

          <form action={convertBuyerAccountRequestToCustomerAction}>
            <input type="hidden" name="requestId" value={request.id} />
            <button type="submit" className="w-full rounded-full bg-[#1f7a3f] px-4 py-2 text-xs font-black text-white">
              Approve
            </button>
          </form>

          <form action={updateBuyerAccountRequestStatusAction}>
            <input type="hidden" name="requestId" value={request.id} />
            <input type="hidden" name="status" value="Rejected" />
            <button type="submit" className="w-full rounded-full bg-[#C95F3D] px-4 py-2 text-xs font-black text-white">
              Reject
            </button>
          </form>

          <form action={updateBuyerAccountRequestStatusAction}>
            <input type="hidden" name="requestId" value={request.id} />
            <input type="hidden" name="status" value="Closed" />
            <button type="submit" className="w-full rounded-full border border-[#102015]/10 bg-white px-4 py-2 text-xs font-black text-[#102015]">
              Close
            </button>
          </form>
        </div>
      </div>
    </details>
  );
}
