import Link from "next/link";
import {notFound} from "next/navigation";
import AdminPageShell from "@/components/AdminPageShell";
import StatusBadge from "@/components/admin/StatusBadge";
import {prisma} from "@/lib/prisma";
import {formatNaira} from "@/lib/format";
import {updateCustomerAccountAction} from "@/actions/createAdminRecords";

type CustomerDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const accountStatuses = [
  "Manual WhatsApp",
  "Approved recurring buyer",
  "Credit review",
  "Account login pending",
  "Account login ready",
  "Paused",
];

export default async function CustomerDetailPage({params}: CustomerDetailPageProps) {
  const {id} = await params;

  const customer = await prisma.customer.findUnique({
    where: {id},
    include: {
      orders: {
        orderBy: {createdAt: "desc"},
        include: {
          payments: {
            orderBy: {createdAt: "desc"},
          },
          receipts: {
            orderBy: {issuedAt: "desc"},
          },
        },
      },
      receipts: {
        orderBy: {issuedAt: "desc"},
        include: {
          order: true,
          payment: true,
        },
      },
      buyerContacts: {
        orderBy: {createdAt: "desc"},
      },
      buyerInvites: {
        orderBy: {createdAt: "desc"},
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const orderValue = customer.orders.reduce(
    (sum, order) => sum + order.estimatedTotal,
    0,
  );
  const paymentValue = customer.orders.reduce(
    (sum, order) =>
      sum + order.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0),
    0,
  );
  const receiptValue = customer.receipts.reduce(
    (sum, receipt) => sum + receipt.amount,
    0,
  );
  const availableCredit = Math.max(customer.creditLimit - customer.outstandingBalance, 0);

  return (
    <AdminPageShell
      title={customer.name}
      description="Buyer account control page for credit, balance, receipts, order history, and login-readiness."
    >
      <div className="grid gap-8">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/customers"
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white/75"
          >
            Back to customers
          </Link>
          <Link
            href="/admin/buyer-accounts"
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white/75"
          >
            Buyer accounts
          </Link>
          <Link
            href="/admin/receipts"
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white/75"
          >
            Issue receipt
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Order value" value={formatNaira(orderValue)} />
          <Metric label="Payments recorded" value={formatNaira(paymentValue)} />
          <Metric label="Receipts issued" value={formatNaira(receiptValue)} />
          <Metric label="Available credit" value={formatNaira(availableCredit)} />
        </section>

        <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <form
            action={updateCustomerAccountAction}
            className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm"
          >
            <input type="hidden" name="customerId" value={customer.id} />

            <h2 className="text-2xl font-black">Account controls</h2>
            <p className="mt-2 text-sm leading-7 text-[#405348]">
              Update recurring buyer settings before proper buyer login is connected.
              These controls prepare the account for receipts, credit limits, and approved access.
            </p>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold">
                Account status
                <select
                  name="accountStatus"
                  defaultValue={customer.accountStatus}
                  className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                >
                  {accountStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                Receipt email
                <input
                  name="receiptEmail"
                  type="email"
                  defaultValue={customer.receiptEmail || customer.email || ""}
                  className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Credit limit
                  <input
                    name="creditLimit"
                    type="number"
                    min="0"
                    defaultValue={customer.creditLimit}
                    className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  Outstanding balance
                  <input
                    name="outstandingBalance"
                    type="number"
                    min="0"
                    defaultValue={customer.outstandingBalance}
                    className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-semibold">
                Payment terms
                <textarea
                  name="paymentTerms"
                  defaultValue={customer.paymentTerms}
                  className="min-h-24 rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                Customer status
                <select
                  name="status"
                  defaultValue={customer.status}
                  className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                >
                  <option>Active</option>
                  <option>Needs review</option>
                  <option>Paused</option>
                </select>
              </label>

              <label className="flex items-center gap-3 rounded-2xl bg-[#f7f5ec] px-4 py-3 text-sm font-semibold">
                <input
                  name="accountLoginReady"
                  type="checkbox"
                  className="h-4 w-4"
                  defaultChecked={customer.accountLoginReady}
                />
                Mark buyer as login-ready when proper auth is connected
              </label>
            </div>

            <button
              type="submit"
              className="mt-6 rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#155c2f]"
            >
              Update account
            </button>
          </form>

          <div className="grid gap-4">
            <InfoPanel
              title="Buyer profile"
              rows={[
                ["Phone", customer.phone],
                ["Email", customer.email || "Not set"],
                ["Buyer type", customer.buyerType],
                ["Location", customer.location || "Not set"],
                ["Account status", customer.accountStatus],
                ["Login readiness", customer.accountLoginReady ? "Login ready" : "Manual account"],
                ["Approved by", customer.approvedBy || "Not approved yet"],
                ["Approved at", customer.approvedAt ? customer.approvedAt.toLocaleString() : "Not approved yet"],
              ]}
            />

            <InfoPanel
              title="Finance position"
              rows={[
                ["Credit limit", formatNaira(customer.creditLimit)],
                ["Outstanding balance", formatNaira(customer.outstandingBalance)],
                ["Available credit", formatNaira(availableCredit)],
                ["Order value", formatNaira(orderValue)],
                ["Payments recorded", formatNaira(paymentValue)],
                ["Receipts issued", formatNaira(receiptValue)],
              ]}
            />
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Buyer access controls</h2>
              <p className="mt-1 text-sm text-[#405348]">
                Authorised contacts and invite records prepared for future buyer login.
              </p>
            </div>
            <Link
              href="/admin/buyer-access"
              className="rounded-full bg-[#1f7a3f] px-4 py-2 text-sm font-bold text-white"
            >
              Manage access
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-[#f7f5ec] p-5">
              <p className="text-sm text-[#405348]">Authorised contacts</p>
              <p className="mt-2 text-3xl font-black">{customer.buyerContacts.length}</p>
            </div>
            <div className="rounded-2xl bg-[#f7f5ec] p-5">
              <p className="text-sm text-[#405348]">Invite records</p>
              <p className="mt-2 text-3xl font-black">{customer.buyerInvites.length}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {customer.buyerContacts.map((contact) => (
              <div key={contact.id} className="rounded-2xl bg-[#f7f5ec] p-4">
                <p className="font-black">{contact.name}</p>
                <p className="mt-1 text-sm text-[#405348]">
                  {contact.role} · {contact.email || "No email"} · {contact.phone || "No phone"}
                </p>
              </div>
            ))}

            {!customer.buyerContacts.length ? (
              <p className="rounded-2xl bg-[#f7f5ec] p-5 text-sm text-[#405348]">
                No authorised buyer contacts yet.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Order history</h2>
              <p className="mt-1 text-sm text-[#405348]">
                Linked order activity for this buyer.
              </p>
            </div>
            <Link
              href="/admin/create-order"
              className="rounded-full bg-[#1f7a3f] px-4 py-2 text-sm font-bold text-white"
            >
              Create order
            </Link>
          </div>

          <div className="mt-6 grid gap-4">
            {customer.orders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.code}`}
                className="rounded-2xl bg-[#f7f5ec] p-5 transition hover:bg-[#eef1e4]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-[#1f7a3f]">{order.code}</p>
                    <h3 className="mt-1 text-xl font-black">{formatNaira(order.estimatedTotal)}</h3>
                    <p className="mt-1 text-sm text-[#405348]">
                      {order.deliveryMethod} · {order.createdAt.toLocaleString()}
                    </p>
                  </div>
                  <div className="grid gap-2 md:justify-items-end">
                    <StatusBadge status={order.paymentStatus} />
                    <span className="rounded-full bg-[#102015]/10 px-3 py-1 text-xs font-bold text-[#102015]">
                      {order.fulfilmentStatus}
                    </span>
                    <span className="text-xs text-[#405348]">
                      {order.receipts.length} receipt(s)
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {!customer.orders.length ? (
              <p className="rounded-2xl bg-[#f7f5ec] p-5 text-sm text-[#405348]">
                No orders linked to this buyer yet.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
          <h2 className="text-2xl font-black">Receipt history</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#102015]/10 text-xs uppercase tracking-[0.18em] text-[#405348]">
                  <th className="py-3 pr-4">Receipt</th>
                  <th className="py-3 pr-4">Order</th>
                  <th className="py-3 pr-4">Amount</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Issued</th>
                </tr>
              </thead>
              <tbody>
                {customer.receipts.map((receipt) => (
                  <tr key={receipt.id} className="border-b border-[#102015]/10">
                    <td className="py-3 pr-4 font-bold">
                      <Link
                        href={`/admin/receipts/${receipt.code}`}
                        className="text-[#1f7a3f] underline-offset-4 hover:underline"
                      >
                        {receipt.code}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">{receipt.order.code}</td>
                    <td className="py-3 pr-4">{formatNaira(receipt.amount)}</td>
                    <td className="py-3 pr-4">{receipt.buyerEmail || "No email"}</td>
                    <td className="py-3 pr-4 text-[#405348]">
                      {receipt.issuedAt.toLocaleString()}
                    </td>
                  </tr>
                ))}

                {!customer.receipts.length ? (
                  <tr>
                    <td className="py-8 text-center text-[#405348]" colSpan={5}>
                      No receipts issued for this buyer yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}

function Metric({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white">
      <p className="text-sm text-white/50">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function InfoPanel({title, rows}: {title: string; rows: [string, string][]}) {
  return (
    <section className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
      <h2 className="text-2xl font-black">{title}</h2>
      <div className="mt-5 grid gap-3">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 border-b border-[#102015]/10 pb-3"
          >
            <span className="text-sm font-semibold text-[#405348]">{label}</span>
            <span className="text-right text-sm font-black">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
