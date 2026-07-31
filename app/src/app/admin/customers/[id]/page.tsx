import Link from "next/link";
import {notFound} from "next/navigation";
import AdminPageShell from "@/components/AdminPageShell";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";
import {prisma} from "@/lib/prisma";
import {formatNaira} from "@/lib/format";
import {requireStaff} from "@/lib/auth";
import {updateCustomerAccountAction} from "@/actions/createAdminRecords";
import {permanentlyDeleteAdminMessageAction} from "@/actions/adminRecordDeletion";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CustomerDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{section?: string}>;
};
const detailSections = ["overview", "access", "orders", "finance", "communications"];

const accountStatuses = [
  "Manual WhatsApp",
  "Approved recurring buyer",
  "Credit review",
  "Credit hold",
  "Account login pending",
  "Account login ready",
  "Paused",
  "Archived",
];

export default async function CustomerDetailPage({params, searchParams}: CustomerDetailPageProps) {
  const staff = await requireStaff();
  const {id} = await params;
  const requestedSection = String((await searchParams)?.section || "overview").toLowerCase();
  const section = detailSections.includes(requestedSection) ? requestedSection : "overview";

  const customer = await prisma.customer.findUnique({
    where: {id},
    include: {
      orders: {
        orderBy: {createdAt: "desc"},
        take: 25,
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
        take: 25,
        include: {
          order: true,
          payment: true,
        },
      },
      buyerContacts: {
        orderBy: {createdAt: "desc"},
        take: 25,
      },
      buyerInvites: {
        orderBy: {createdAt: "desc"},
        take: 25,
      },
      buyerMessages: {orderBy: {createdAt: "desc"}, take: 25},
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
  const isUnmanagedWhatsAppContact = customer.accountStatus === "Manual WhatsApp";

  return (
    <AdminPageShell
      title={customer.name}
      description="Buyer details, access, orders and account controls."
    >
      <div className="grid gap-8">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/customers"
            className="rounded-full border border-[#102015]/15 px-4 py-2 text-sm font-bold text-[#405348]"
          >
            Back to buyers
          </Link>
        </div>

        <nav aria-label="Buyer detail sections" className="flex gap-2 overflow-x-auto border-b pb-3">{detailSections.map((item) => <Link key={item} href={`/admin/customers/${customer.id}?section=${item}`} aria-current={section === item ? "page" : undefined} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-black ${section === item ? "bg-[#102015] text-white" : "bg-white text-[#405348]"}`}>{({overview: "Overview", access: "Contacts & access", orders: "Orders", finance: "Finance", communications: "Communications", activity: "Activity"} as Record<string, string>)[item]}</Link>)}</nav>

        {section === "overview" ? <>
        <section className="grid gap-4 md:grid-cols-3">
          <Metric label="Order value" value={formatNaira(orderValue)} />
          <Metric label="Payments recorded" value={formatNaira(paymentValue)} />
          <Metric label="Receipts issued" value={formatNaira(receiptValue)} />
        </section>

        {isUnmanagedWhatsAppContact ? (
          <section className="rounded-[2rem] border border-[#1f7a3f]/20 bg-[#eef8f0] p-6">
            <h2 className="text-xl font-black text-[#102015]">Not yet reviewed as a buyer account</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#405348]">
              This record exists because a WhatsApp message was sent to this number -- it hasn't been
              through account review, so there's no credit limit, payment terms or portal access set up
              for it yet. Approve it as a recurring buyer to unlock those controls, or leave it as-is if
              this is a one-off contact.
            </p>
            <form action={updateCustomerAccountAction} className="mt-4">
              <input type="hidden" name="customerId" value={customer.id} />
              <input type="hidden" name="accountStatus" value="Approved recurring buyer" />
              <input type="hidden" name="receiptEmail" value={customer.receiptEmail || customer.email || ""} />
              <input type="hidden" name="creditLimit" value={customer.creditLimit} />
              <input type="hidden" name="outstandingBalance" value={customer.outstandingBalance} />
              <input type="hidden" name="paymentTerms" value={customer.paymentTerms} />
              <input type="hidden" name="status" value={customer.status} />
              {customer.accountLoginReady ? <input type="hidden" name="accountLoginReady" value="on" /> : null}
              <button
                type="submit"
                className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#155c2f]"
              >
                Approve as recurring buyer
              </button>
            </form>
          </section>
        ) : null}

        <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <form
            action={updateCustomerAccountAction}
            className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm"
          >
            <input type="hidden" name="customerId" value={customer.id} />

            <h2 className="text-2xl font-black">Account controls</h2>
            <p className="mt-2 text-sm leading-7 text-[#405348]">
              Keep ordering, login and finance settings accurate. These controls are the
              manual backup when an automated process needs intervention.
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

              {!isUnmanagedWhatsAppContact ? (
                <>
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
                </>
              ) : (
                <>
                  <input type="hidden" name="creditLimit" value={customer.creditLimit} />
                  <input type="hidden" name="outstandingBalance" value={customer.outstandingBalance} />
                  <input type="hidden" name="paymentTerms" value={customer.paymentTerms} />
                </>
              )}

              <label className="grid gap-2 text-sm font-semibold">
                Ordering status
                <select
                  name="status"
                  defaultValue={customer.status}
                  className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                >
                  <option>Active</option>
                  <option>Needs review</option>
                  <option>Paused</option>
                  <option>Archived</option>
                </select>
              </label>

              <label className="flex items-center gap-3 rounded-2xl bg-[#f7f5ec] px-4 py-3 text-sm font-semibold">
                <input
                  name="accountLoginReady"
                  type="checkbox"
                  className="h-4 w-4"
                  defaultChecked={customer.accountLoginReady}
                />
                Allow buyer portal login
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
                [
                  "Account status",
                  customer.status === "Active" && customer.accountLoginReady
                    ? "Approved for login"
                    : "Pending login approval",
                ],
                ["Account type", customer.accountStatus],
                ["Portal access", customer.accountLoginReady ? "Enabled" : "Disabled"],
                ["Ordering status", customer.status],
                ["Approved by", customer.approvedBy || "Not approved yet"],
              ]}
            />

            {!isUnmanagedWhatsAppContact ? (
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
            ) : null}
          </div>
        </section>
        </> : null}

        {section === "access" ?
        <section className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Buyer access controls</h2>
              <p className="mt-1 text-sm text-[#405348]">
                Add authorised contacts, correct email addresses and permissions. Email OTP is recommended; access codes remain a legacy fallback.
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

          {staff.role === "Super admin" ? (
            <div className="mt-6 rounded-2xl border border-[#9b2f12]/20 bg-[#fff4ef] p-4">
              {customer.orders.length ? (
                <p className="text-xs font-semibold text-[#9b2f12]">
                  This buyer has order history, so the account can't be permanently deleted.
                  Set the ordering status to Archived from the Overview tab instead.
                </p>
              ) : (
                <details>
                  <summary className="cursor-pointer text-sm font-black text-[#9b2f12]">
                    Delete this buyer account
                  </summary>
                  <p className="mt-2 text-xs font-semibold text-[#587063]">
                    Permanently removes this buyer, its contacts and access codes.
                    Only available when the account has no order history. This cannot be undone.
                  </p>
                  <form action={permanentlyDeleteAdminMessageAction} className="mt-3 grid gap-2 sm:max-w-sm">
                    <input type="hidden" name="recordType" value="Customer" />
                    <input type="hidden" name="recordId" value={customer.id} />
                    <input type="hidden" name="returnTo" value="/admin/customers?deleted=1" />
                    <label className="grid gap-1 text-xs font-bold">
                      Deletion reason
                      <input name="reason" required minLength={10} className="rounded-lg border px-3 py-2" />
                    </label>
                    <label className="grid gap-1 text-xs font-bold">
                      Type DELETE
                      <input name="confirmation" required pattern="DELETE" autoComplete="off" className="rounded-lg border px-3 py-2" />
                    </label>
                    <label className="grid gap-1 text-xs font-bold">
                      Confirm your password
                      <input name="password" type="password" required autoComplete="current-password" className="rounded-lg border px-3 py-2" />
                    </label>
                    <ConfirmSubmitButton
                      label="Delete buyer account permanently"
                      pendingLabel="Deleting…"
                      confirmMessage="Final confirmation: permanently delete this buyer account? This cannot be undone."
                      className="rounded-lg bg-[#9b2f12] px-3 py-2 text-xs font-black text-white"
                    />
                  </form>
                </details>
              )}
            </div>
          ) : null}
        </section> : null}

        {section === "orders" ?
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
                      {order.deliveryMethod} · {order.createdAt.toLocaleString("en-GB", {timeZone: "Africa/Lagos"})}
                    </p>
                  </div>
                  <div className="grid gap-2 md:justify-items-end">
                    <StatusBadge status={order.paymentStatus} />
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#102015]">
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
        </section> : null}

        {section === "finance" ?
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
                      {receipt.issuedAt.toLocaleString("en-GB", {timeZone: "Africa/Lagos"})}
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
        </section> : null}
        {section === "communications" ? <section className="rounded-[2rem] bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">Recent communications</h2><div className="mt-4 grid gap-3">{customer.buyerMessages.map((message) => <article key={message.id} className="rounded-xl bg-[#f3f8ef] p-4"><p className="font-black">{message.title}</p><p className="mt-1 text-sm text-[#405348]">{message.channel} · {message.direction} · {message.status}</p><p className="mt-2 text-sm">{message.body.slice(0, 180)}{message.body.length > 180 ? "…" : ""}</p></article>)}</div><Link href={`/admin/buyer-messages?q=${encodeURIComponent(customer.name)}`} className="mt-4 inline-flex font-black text-[#1f7a3f]">View all communications</Link></section> : null}
      </div>
    </AdminPageShell>
  );
}

function Metric({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-3xl border border-[#102015]/10 bg-white p-5 text-[#102015]">
      <p className="text-sm text-[#587063]">{label}</p>
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
