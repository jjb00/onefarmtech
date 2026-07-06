import Link from "next/link";
import {buyerLogoutAction} from "@/actions/auth";
import {requireBuyer} from "@/lib/currentBuyer";
import {formatNaira} from "@/lib/format";
import SupportChatLauncher from "@/components/SupportChatLauncher";

export default async function BuyerAccountPage() {
  const {buyer, customer} = await requireBuyer();

  const availableCredit = Math.max(
    customer.creditLimit - customer.outstandingBalance,
    0,
  );

  return (
    <main className="min-h-screen bg-[#f7f5ec] px-4 py-6 text-[#102015] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
                OneFarmTech buyer account
              </p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                Welcome, {customer.name}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
                This is your approved buyer account area for order history, receipts,
                account terms, authorised contacts, and credit/balance visibility.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/order"
                className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
              >
                Place order
              </Link>

              <form action={buyerLogoutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-[#102015]/15 bg-white px-5 py-3 text-sm font-black text-[#102015] shadow-sm hover:bg-[#f3f8ef]"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <Metric label="Account status" value={customer.accountStatus} />
            <Metric label="Payment terms" value={customer.paymentTerms} />
            <Metric label="Credit limit" value={formatNaira(customer.creditLimit)} />
            <Metric label="Outstanding" value={formatNaira(customer.outstandingBalance)} />
          </div>

          <div className="mt-4 rounded-2xl border border-[#102015]/10 bg-[#f3f8ef] p-4 text-sm leading-7 text-[#405348]">
            <strong className="text-[#102015]">Available credit:</strong>{" "}
            {formatNaira(availableCredit)}. Credit limits and payment terms are set manually
            by the OneFarmTech admin team.
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-6">
            <Panel title="Buyer profile">
              <InfoRow label="Buyer type" value={customer.buyerType} />
              <InfoRow label="Phone" value={customer.phone} />
              <InfoRow label="Email" value={customer.email || "Not set"} />
              <InfoRow label="Location" value={customer.location || "Not set"} />
              <InfoRow
                label="Receipt email"
                value={customer.receiptEmail || customer.email || "Not set"}
              />
              <InfoRow
                label="Signed in as"
                value={buyer.contactName || buyer.contactRole || "Approved buyer"}
              />
            </Panel>

            <Panel title="Authorised contacts">
              <div className="grid gap-3">
                {customer.buyerContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="rounded-2xl border border-[#102015]/10 bg-[#fbfff8] p-4"
                  >
                    <p className="font-black">{contact.name}</p>
                    <p className="mt-1 text-sm text-[#405348]">
                      {contact.role} · {contact.email || "No email"} ·{" "}
                      {contact.phone || "No phone"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {contact.canPlaceOrders ? <Pill label="Orders" /> : null}
                      {contact.canViewReceipts ? <Pill label="Receipts" /> : null}
                      {contact.canViewCredit ? <Pill label="Credit" /> : null}
                    </div>
                  </div>
                ))}

                {!customer.buyerContacts.length ? (
                  <p className="rounded-2xl bg-[#f7f5ec] p-4 text-sm text-[#405348]">
                    No authorised contacts have been added yet.
                  </p>
                ) : null}
              </div>
            </Panel>
          </div>

          <div className="grid gap-6">
            <Panel title="Recent orders">
              <div className="grid gap-3">
                {customer.orders.map((order) => (
                  <Link
                    key={order.id}
                    href="/order"
                    className="rounded-2xl border border-[#102015]/10 bg-[#fbfff8] p-4 transition hover:bg-[#f3f8ef]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{order.code}</p>
                        <p className="mt-1 text-sm text-[#405348]">
                          {order.deliveryMethod} · {order.fulfilmentStatus}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black">
                          {formatNaira(order.estimatedTotal)}
                        </p>
                        <p className="mt-1 text-xs font-bold text-[#405348]">
                          {order.paymentStatus}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}

                {!customer.orders.length ? (
                  <p className="rounded-2xl bg-[#f7f5ec] p-4 text-sm text-[#405348]">
                    No orders are linked to this account yet.
                  </p>
                ) : null}
              </div>
            </Panel>

            <Panel title="Recent receipts">
              <div className="grid gap-3">
                {customer.receipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="rounded-2xl border border-[#102015]/10 bg-[#fbfff8] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{receipt.code}</p>
                        <p className="mt-1 text-sm text-[#405348]">
                          {receipt.status} · {receipt.issuedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-black">{formatNaira(receipt.amount)}</p>
                    </div>
                  </div>
                ))}

                {!customer.receipts.length ? (
                  <p className="rounded-2xl bg-[#f7f5ec] p-4 text-sm text-[#405348]">
                    No receipts have been issued yet.
                  </p>
                ) : null}
              </div>
            </Panel>

            <Panel title="Access records">
              <div className="grid gap-3">
                {customer.buyerInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="rounded-2xl border border-[#102015]/10 bg-[#fbfff8] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{invite.role}</p>
                        <p className="mt-1 text-sm text-[#405348]">
                          {invite.email || invite.phone || "No contact target"}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#3E7A4C]/10 px-3 py-1 text-xs font-black text-[#3E7A4C]">
                        {invite.status}
                      </span>
                    </div>
                  </div>
                ))}

                {!customer.buyerInvites.length ? (
                  <p className="rounded-2xl bg-[#f7f5ec] p-4 text-sm text-[#405348]">
                    No access records have been generated yet.
                  </p>
                ) : null}
              </div>
            </Panel>
          </div>
        </section>

        <section className="rounded-[2rem] bg-[#102015] p-6 text-white shadow-sm">
          <h2 className="text-2xl font-black">Need help with this account?</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-white/75">
            Contact the OneFarmTech team if your credit terms, receipts, authorised
            contacts, or order history look incorrect.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <SupportChatLauncher
              label="Contact support"
              context={`Buyer account: ${customer.name}`}
            />
            <Link
              href="/order"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-black text-white"
            >
              Place another order
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-2xl border border-[#102015]/10 bg-[#fbfff8] p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#587063]">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-[#102015]">{value}</p>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
      <h2 className="text-2xl font-black">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function InfoRow({label, value}: {label: string; value: string}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#102015]/10 py-3 text-sm">
      <span className="font-semibold text-[#405348]">{label}</span>
      <span className="text-right font-black text-[#102015]">{value}</span>
    </div>
  );
}

function Pill({label}: {label: string}) {
  return (
    <span className="rounded-full bg-[#3E7A4C]/10 px-3 py-1 text-xs font-bold text-[#3E7A4C]">
      {label}
    </span>
  );
}
