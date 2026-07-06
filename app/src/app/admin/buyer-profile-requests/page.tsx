import Link from "next/link";
import AdminPageShell from "@/components/AdminPageShell";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BuyerProfileRequestsAdminPage() {
  const requests = await prisma.buyerProfileUpdateRequest.findMany({
    orderBy: {createdAt: "desc"},
    include: {customer: true},
    take: 100,
  });

  const newCount = requests.filter((request) => request.status === "New").length;
  const reviewCount = requests.filter((request) => request.status === "Reviewing").length;

  return (
    <AdminPageShell
      title="Buyer profile update requests"
      description="Review buyer-submitted company, buying profile, finance, contact and partner-readiness information before changing approved account records."
    >
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-3">
          <Metric label="New requests" value={String(newCount)} />
          <Metric label="Under review" value={String(reviewCount)} />
          <Metric label="Total requests" value={String(requests.length)} />
        </section>

        <section className="grid gap-4">
          {requests.map((request) => (
            <article
              key={request.id}
              className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C95F3D]">
                    {request.requestType}
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#102015]">
                    {request.customer.name}
                  </h2>
                  <p className="mt-1 text-sm text-[#405348]">
                    {request.customer.buyerType} · {request.customer.phone} ·{" "}
                    {request.createdAt.toLocaleString()}
                  </p>
                </div>

                <span className="rounded-full bg-[#F2B84B]/20 px-3 py-1 text-xs font-black text-[#102015]">
                  {request.status}
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <RequestBlock title="Company information" value={request.companyInfo} />
                <RequestBlock title="Buying profile" value={request.buyingProfile} />
                <RequestBlock title="Finance / credit information" value={request.financeInfo} />
                <RequestBlock title="Contact changes" value={request.contactInfo} />
                <RequestBlock title="Documents / verification note" value={request.documentsNote} />
                <RequestBlock title="Extra message" value={request.message} />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/admin/customers/${request.customerId}`}
                  className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white"
                >
                  Open buyer account
                </Link>
                <Link
                  href="/admin/buyer-access"
                  className="rounded-full border border-[#102015]/15 px-5 py-3 text-sm font-black text-[#102015]"
                >
                  Manage access
                </Link>
              </div>
            </article>
          ))}

          {!requests.length ? (
            <div className="rounded-[2rem] bg-white p-8 text-center text-[#405348] shadow-sm">
              No buyer profile update requests yet.
            </div>
          ) : null}
        </section>
      </div>
    </AdminPageShell>
  );
}

function Metric({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-[1.5rem] bg-white p-5 text-[#102015] shadow-sm">
      <p className="text-2xl font-black text-[#1f7a3f]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[#405348]">{label}</p>
    </div>
  );
}

function RequestBlock({title, value}: {title: string; value: string | null}) {
  return (
    <div className="rounded-2xl bg-[#f3f8ef] p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#587063]">
        {title}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#102015]">
        {value || "No update provided."}
      </p>
    </div>
  );
}
