import Link from "next/link";
import AdminPageShell from "@/components/AdminPageShell";
import {prisma} from "@/lib/prisma";

function money(value: number) {
  return `₦${value.toLocaleString()}`;
}

export default async function BuyerAccountsPage() {
  const customers = await prisma.customer.findMany({
    orderBy: {createdAt: "desc"},
    include: {
      orders: {
        select: {
          id: true,
          estimatedTotal: true,
          paymentStatus: true,
          createdAt: true,
        },
      },
      receipts: {
        select: {
          id: true,
          amount: true,
          status: true,
        },
      },
    },
  });

  const accountReady = customers.filter((customer) => customer.accountLoginReady).length;
  const totalCreditLimit = customers.reduce((sum, customer) => sum + customer.creditLimit, 0);
  const outstandingBalance = customers.reduce(
    (sum, customer) => sum + customer.outstandingBalance,
    0,
  );

  return (
    <AdminPageShell
      title="Recurring buyer accounts"
      description="Internal account-readiness view for restaurants, hotels, caterers, food vendors, retailers, large households, and buying groups. This prepares the platform for receipts, credit limits, balances, and approved buyer login."
    >
      <div className="grid gap-6">

      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Account-login ready" value={String(accountReady)} />
        <Metric label="Total approved credit" value={money(totalCreditLimit)} />
        <Metric label="Outstanding balance" value={money(outstandingBalance)} />
      </section>

      <section className="grid gap-4">
        {customers.map((customer) => {
          const orderTotal = customer.orders.reduce(
            (sum, order) => sum + order.estimatedTotal,
            0,
          );
          const receiptTotal = customer.receipts.reduce(
            (sum, receipt) => sum + receipt.amount,
            0,
          );

          return (
            <Link href={`/admin/customers/${customer.id}`}
              key={customer.id}
              className="rounded-[1.5rem] border border-[#102015]/10 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#102015]">{customer.name}</h2>
                  <p className="mt-1 text-sm text-[#587063]">
                    {customer.buyerType} · {customer.location || "Location not set"} ·{" "}
                    {customer.phone}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#3E7A4C]/10 px-3 py-1 text-xs font-black text-[#3E7A4C]">
                    {customer.accountStatus}
                  </span>
                  <span className="rounded-full bg-[#F2B84B]/20 px-3 py-1 text-xs font-black text-[#102015]">
                    {customer.accountLoginReady ? "Login ready" : "Manual account"}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <SmallMetric label="Credit limit" value={money(customer.creditLimit)} />
                <SmallMetric
                  label="Outstanding"
                  value={money(customer.outstandingBalance)}
                />
                <SmallMetric label="Order value" value={money(orderTotal)} />
                <SmallMetric label="Receipts issued" value={money(receiptTotal)} />
              </div>

              <div className="mt-4 rounded-2xl bg-[#f3f8ef] p-4 text-sm leading-7 text-[#405348]">
                <strong>Payment terms:</strong> {customer.paymentTerms}
                <br />
                <strong>Receipt email:</strong>{" "}
                {customer.receiptEmail || customer.email || "Not set"}
              </div>
            </Link>
          );
        })}

        {!customers.length ? (
          <div className="rounded-[1.5rem] bg-white p-8 text-center text-[#587063]">
            No buyers have been created yet.
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

function SmallMetric({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-2xl border border-[#102015]/10 bg-[#f3f8ef] p-4">
      <p className="text-lg font-black">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#587063]">
        {label}
      </p>
    </div>
  );
}
