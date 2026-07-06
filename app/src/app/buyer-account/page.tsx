import Link from "next/link";
import {
  buyerLogoutAction,
} from "@/actions/auth";
import {createBuyerProfileUpdateRequestAction} from "@/actions/createAdminRecords";
import SupportChatLauncher from "@/components/SupportChatLauncher";
import {requireBuyer} from "@/lib/currentBuyer";
import {formatNaira} from "@/lib/format";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const navItems = [
  ["Overview", "#overview"],
  ["Company profile", "#company-profile"],
  ["Orders", "#orders"],
  ["Payments", "#payments"],
  ["Credit readiness", "#credit-readiness"],
  ["Contacts", "#contacts"],
  ["Profile updates", "#profile-updates"],
  ["Support", "#support"],
];

export default async function BuyerAccountPage({
  searchParams,
}: {
  searchParams?: Promise<{orderSubmitted?: string; profileSubmitted?: string}>;
}) {
  const params = await searchParams;
  const orderSubmitted = params?.orderSubmitted === "1";
  const profileSubmitted = params?.profileSubmitted === "1";

  const {buyer, customer} = await requireBuyer();

  const availableCredit = Math.max(
    customer.creditLimit - customer.outstandingBalance,
    0,
  );

  const partnerReadiness = [
    {
      label: "Approved buyer account",
      status: customer.accountLoginReady ? "Ready" : "Pending",
      detail: customer.accountLoginReady
        ? "This buyer can access the account portal."
        : "Admin has not enabled portal access yet.",
    },
    {
      label: "Receipt/payment records",
      status: customer.receiptEmail ? "Ready" : "Needs email",
      detail: customer.receiptEmail
        ? `Receipts can be routed to ${customer.receiptEmail}.`
        : "Add a receipt email for cleaner payment records.",
    },
    {
      label: "Credit information",
      status: customer.creditLimit > 0 ? "Limit set" : "Manual review",
      detail:
        customer.creditLimit > 0
          ? `Approved limit: ${formatNaira(customer.creditLimit)}.`
          : "Credit can be reviewed manually by admin or a partner workflow.",
    },
    {
      label: "Authorised contacts",
      status: customer.buyerContacts.length ? "Added" : "Missing",
      detail: customer.buyerContacts.length
        ? `${customer.buyerContacts.length} contact(s) attached.`
        : "Add finance/procurement contacts for stronger account controls.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f5ec] px-4 py-6 text-[#102015] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[17rem_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Buyer portal
            </p>
            <h1 className="mt-2 text-2xl font-black">{customer.name}</h1>
            <p className="mt-2 text-sm leading-7 text-[#405348]">
              {customer.buyerType}
            </p>

            <div className="mt-5 grid gap-2">
              {navItems.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-2xl bg-[#f3f8ef] px-4 py-3 text-sm font-black text-[#102015] hover:bg-[#e8f2e2]"
                >
                  {label}
                </a>
              ))}
            </div>

            <div className="mt-5 grid gap-3">
              <Link
                href="/buyer-account/order"
                className="rounded-full bg-[#1f7a3f] px-5 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
              >
                New buyer order
              </Link>

              <form action={buyerLogoutAction}>
                <button
                  type="submit"
                  className="w-full rounded-full border border-[#102015]/15 bg-white px-5 py-3 text-sm font-black text-[#102015] shadow-sm hover:bg-[#f3f8ef]"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div className="grid gap-6">
          {orderSubmitted ? (
            <div className="rounded-[2rem] border border-[#3E7A4C]/20 bg-[#3E7A4C]/10 p-5 text-sm font-bold leading-7 text-[#1f7a3f]">
              Your buyer-linked order request has been submitted. It is now attached to your buyer account history.
            </div>
          ) : null}

          {profileSubmitted ? (
            <div className="rounded-[2rem] border border-[#3E7A4C]/20 bg-[#3E7A4C]/10 p-5 text-sm font-bold leading-7 text-[#1f7a3f]">
              Your profile update request has been submitted for admin review.
            </div>
          ) : null}

          <section id="overview" className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
                  Account overview
                </p>
                <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                  Welcome, {customer.name}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
                  This dashboard is for repeat buying, receipts, credit/payment terms,
                  authorised contacts, support, and partner-readiness records.
                </p>
              </div>

              <SupportChatLauncher
                label="Ask account support"
                context={`Buyer account: ${customer.name}`}
                defaultMessage={`I need support with my OneFarmTech buyer account for ${customer.name}.`}
                variant="green"
              />
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-4">
              <Metric label="Account status" value={customer.accountStatus} />
              <Metric label="Payment terms" value={customer.paymentTerms} />
              <Metric label="Credit limit" value={formatNaira(customer.creditLimit)} />
              <Metric label="Outstanding" value={formatNaira(customer.outstandingBalance)} />
            </div>

            <div className="mt-4 rounded-2xl border border-[#102015]/10 bg-[#f3f8ef] p-4 text-sm leading-7 text-[#405348]">
              <strong className="text-[#102015]">Available credit:</strong>{" "}
              {formatNaira(availableCredit)}. Credit limits, partner-readiness and
              payment terms are controlled by the OneFarmTech admin team.
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#C95F3D]">
                  Buyer partner tools
                </p>
                <h2 className="mt-2 text-2xl font-black">Account actions</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
                  Use these for repeat buying, bulk pricing, account support, payment proof,
                  credit review, order issues and contact updates.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <article className="rounded-2xl border border-[#102015]/10 bg-[#fbfff8] p-5">
                <h3 className="text-lg font-black">Repeat or place order</h3>
                <p className="mt-2 min-h-14 text-sm leading-7 text-[#405348]">
                  Submit a buyer-linked order request so it appears in your account history.
                </p>
                <Link
                  href="/buyer-account/order"
                  className="mt-4 inline-flex rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
                >
                  Start buyer order
                </Link>
              </article>

              <BuyerActionCard
                title="Request bulk quote"
                description="Useful for restaurants, caterers, retailers, buying groups and planned large orders."
                actionLabel="Request quote"
                message={`I need a bulk produce quote for ${customer.name}. Please help me with availability, pricing, delivery timing and minimum quantity.`}
                context={`Buyer account: ${customer.name} · Bulk quote`}
              />

              <BuyerActionCard
                title="Request credit review"
                description="Ask the admin team to review payment terms or credit limit for recurring supply."
                actionLabel="Request review"
                message={`I would like a credit/payment terms review for ${customer.name}. Current credit limit shown: ${formatNaira(customer.creditLimit)}. Current outstanding balance shown: ${formatNaira(customer.outstandingBalance)}.`}
                context={`Buyer account: ${customer.name} · Credit review`}
              />

              <BuyerActionCard
                title="Send payment proof"
                description="Start a payment confirmation workflow for transfer, receipt or balance updates."
                actionLabel="Send proof"
                message={`I want to send payment proof for ${customer.name}. Please help me confirm the order/payment reference and receipt update.`}
                context={`Buyer account: ${customer.name} · Payment proof`}
              />

              <BuyerActionCard
                title="Report order issue"
                description="Raise a delivery, quality, shortage, substitution or fulfilment concern."
                actionLabel="Report issue"
                message={`I need to report an issue with a OneFarmTech order for ${customer.name}. Please help me log the issue and next step.`}
                context={`Buyer account: ${customer.name} · Order issue`}
              />

              <BuyerActionCard
                title="Update contacts"
                description="Ask to add, pause or change authorised people on this buyer account."
                actionLabel="Update contacts"
                message={`I need to update authorised contacts for ${customer.name}'s OneFarmTech buyer account.`}
                context={`Buyer account: ${customer.name} · Contact update`}
              />
            </div>
          </section>

          <section id="company-profile" className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Panel title="Company / buyer profile">
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

            <Panel title="Partner readiness">
              <div className="grid gap-3">
                {partnerReadiness.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-[#102015]/10 bg-[#fbfff8] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{item.label}</p>
                        <p className="mt-1 text-sm leading-6 text-[#405348]">
                          {item.detail}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#3E7A4C]/10 px-3 py-1 text-xs font-black text-[#3E7A4C]">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </section>

          <section id="orders" className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Panel title="Recent orders">
              <div className="mb-5 flex flex-wrap gap-3">
                <Link
                  href="/buyer-account/order"
                  className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
                >
                  New buyer order
                </Link>
                <SupportChatLauncher
                  label="Order support"
                  context={`Buyer orders: ${customer.name}`}
                  defaultMessage={`I need help with my OneFarmTech orders for ${customer.name}.`}
                />
              </div>

              <div className="grid gap-3">
                {customer.orders.map((order) => (
                  <Link
                    key={order.id}
                    href="/buyer-account/order"
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
                    No orders are linked to this account yet. Use “New buyer order”
                    so the request attaches to this account.
                  </p>
                ) : null}
              </div>
            </Panel>

            <Panel title="Buying profile">
              <p className="text-sm leading-7 text-[#405348]">
                This area will become the buyer’s structured buying profile for
                preferred produce, average order value, order frequency, fulfilment
                preferences and repeat buying rules.
              </p>
              <div className="mt-5 grid gap-3">
                <SmallNote title="Preferred produce" body="Use profile updates to add regular buying needs." />
                <SmallNote title="Repeat buying" body="Use buyer-linked orders so history becomes reusable." />
                <SmallNote title="Group-buy interest" body="Admin can route suitable orders into group-buy workflows." />
              </div>
            </Panel>
          </section>

          <section id="payments" className="grid gap-6 xl:grid-cols-2">
            <Panel title="Payments & receipts">
              <InfoRow label="Receipt email" value={customer.receiptEmail || customer.email || "Not set"} />
              <InfoRow label="Receipts issued" value={String(customer.receipts.length)} />
              <InfoRow label="Outstanding balance" value={formatNaira(customer.outstandingBalance)} />
              <div className="mt-5 grid gap-3">
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

            <Panel title="Payment support">
              <p className="text-sm leading-7 text-[#405348]">
                Use this for transfer confirmation, receipt correction, payment
                allocation or balance questions.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <SupportChatLauncher
                  label="Send payment proof"
                  context={`Buyer account: ${customer.name} · Payment proof`}
                  defaultMessage={`I want to send payment proof for ${customer.name}.`}
                />
                <SupportChatLauncher
                  label="Receipt help"
                  context={`Buyer account: ${customer.name} · Receipt help`}
                  defaultMessage={`I need help with a receipt or payment record for ${customer.name}.`}
                />
              </div>
            </Panel>
          </section>

          <section id="credit-readiness" className="grid gap-6 xl:grid-cols-2">
            <Panel title="Credit / partner readiness">
              <InfoRow label="Payment terms" value={customer.paymentTerms} />
              <InfoRow label="Credit limit" value={formatNaira(customer.creditLimit)} />
              <InfoRow label="Outstanding balance" value={formatNaira(customer.outstandingBalance)} />
              <InfoRow label="Available credit" value={formatNaira(availableCredit)} />
              <div className="mt-5 rounded-2xl border border-[#F2B84B]/40 bg-[#fff8e6] p-4 text-sm leading-7 text-[#5d4716]">
                Credit terms are not automatic. OneFarmTech admin or future finance
                partners can review the account based on order history, payment records,
                business profile and approved verification information.
              </div>
            </Panel>

            <Panel title="Partner assessment data">
              <div className="grid gap-3">
                <SmallNote title="Company identity" body="Business name, registration/tax ID and trading location can be requested for review." />
                <SmallNote title="Buying behaviour" body="Order frequency, categories and average spend improve partner assessment." />
                <SmallNote title="Payment discipline" body="Receipts, payments and outstanding balance create useful history." />
                <SmallNote title="Authorised finance contact" body="A finance contact helps with invoice and credit workflows." />
              </div>
            </Panel>
          </section>

          <section id="contacts">
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
          </section>

          <section id="profile-updates" className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#C95F3D]">
                Editable by request
              </p>
              <h2 className="mt-2 text-2xl font-black">Request company/profile changes</h2>
              <p className="mt-2 text-sm leading-7 text-[#405348]">
                For account integrity, profile and company information is reviewed before
                it changes approved buyer records. This is important for credit, partner
                assessment, receipts and authorised access.
              </p>
            </div>

            <form action={createBuyerProfileUpdateRequestAction} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-bold text-[#102015]">
                Request type
                <select
                  name="requestType"
                  defaultValue="Profile update"
                  className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                >
                  <option>Profile update</option>
                  <option>Company information update</option>
                  <option>Buying profile update</option>
                  <option>Credit/payment review</option>
                  <option>Authorised contact update</option>
                  <option>Partner assessment information</option>
                </select>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-[#102015]">
                  Company information
                  <textarea
                    name="companyInfo"
                    rows={4}
                    className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                    placeholder="Business/group name, registration number, address, operating location, sector..."
                  />
                </label>

                <label className="grid gap-2 text-sm font-bold text-[#102015]">
                  Buying profile
                  <textarea
                    name="buyingProfile"
                    rows={4}
                    className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                    placeholder="Regular produce needs, order frequency, average spend, delivery windows..."
                  />
                </label>

                <label className="grid gap-2 text-sm font-bold text-[#102015]">
                  Finance / credit information
                  <textarea
                    name="financeInfo"
                    rows={4}
                    className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                    placeholder="Preferred payment terms, finance contact, receipt requirements, credit review notes..."
                  />
                </label>

                <label className="grid gap-2 text-sm font-bold text-[#102015]">
                  Contact changes
                  <textarea
                    name="contactInfo"
                    rows={4}
                    className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                    placeholder="Add, remove or update authorised users, procurement contacts or finance contacts..."
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-bold text-[#102015]">
                Documents / verification note
                <textarea
                  name="documentsNote"
                  rows={3}
                  className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  placeholder="Mention any business registration, tax, bank, invoice or partner documents that may be available later. Do not upload sensitive documents here yet."
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#102015]">
                Extra message
                <textarea
                  name="message"
                  rows={3}
                  className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  placeholder="Anything else the OneFarmTech team should review."
                />
              </label>

              <button
                type="submit"
                className="rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
              >
                Submit profile update request
              </button>
            </form>
          </section>

          <section id="support" className="rounded-[2rem] bg-[#102015] p-6 text-white shadow-sm">
            <h2 className="text-2xl font-black">Need help with this account?</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-white/75">
              Use support if your account profile, credit terms, receipts, authorised
              contacts or order history need attention.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <SupportChatLauncher
                label="Contact support"
                context={`Buyer account: ${customer.name}`}
                defaultMessage={`I need help with my OneFarmTech buyer account for ${customer.name}.`}
              />
              <Link
                href="/buyer-account/order"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-black text-white"
              >
                Place buyer order
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function BuyerActionCard({
  title,
  description,
  actionLabel,
  message,
  context,
}: {
  title: string;
  description: string;
  actionLabel: string;
  message: string;
  context: string;
}) {
  return (
    <article className="rounded-2xl border border-[#102015]/10 bg-[#fbfff8] p-5">
      <h3 className="text-lg font-black">{title}</h3>
      <p className="mt-2 min-h-14 text-sm leading-7 text-[#405348]">{description}</p>
      <div className="mt-4">
        <SupportChatLauncher
          label={actionLabel}
          context={context}
          defaultMessage={message}
        />
      </div>
    </article>
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

function SmallNote({title, body}: {title: string; body: string}) {
  return (
    <div className="rounded-2xl border border-[#102015]/10 bg-[#fbfff8] p-4">
      <p className="font-black">{title}</p>
      <p className="mt-1 text-sm leading-6 text-[#405348]">{body}</p>
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
