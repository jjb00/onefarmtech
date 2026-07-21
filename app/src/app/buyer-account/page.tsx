import Link from "next/link";
import BuyerPortalFrame from "@/components/BuyerPortalFrame";
import SupportChatLauncher from "@/components/SupportChatLauncher";
import {requireBuyer} from "@/lib/currentBuyer";
import {formatNaira} from "@/lib/format";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BuyerAccountPage({
  searchParams,
}: {
  searchParams?: Promise<{orderSubmitted?: string; profileSubmitted?: string; permission?: string}>;
}) {
  const params = await searchParams;
  const orderSubmitted = params?.orderSubmitted === "1";
  const profileSubmitted = params?.profileSubmitted === "1";

  const {buyer, customer} = await requireBuyer();
  const unreadMessageCount = await prisma.buyerMessage.count({
    where: {
      customerId: customer.id,
      OR: [{readAt: null}, {status: {in: ["Unread", "Prepared", "Sent"]}}],
    },
  });
  const availableCredit = Math.max(customer.creditLimit - customer.outstandingBalance, 0);
  const recentOrders = customer.orders.slice(0, 3);
  const recentReceipts = customer.receipts.slice(0, 3);

  return (
    <BuyerPortalFrame
      customerName={customer.name}
      buyerType={customer.buyerType}
      unreadMessageCount={unreadMessageCount}
    >
      {orderSubmitted ? (
        <Alert>
          Your buyer-linked order request has been submitted and added to this account.
        </Alert>
      ) : null}

      {profileSubmitted ? (
        <Alert>Your profile update request has been submitted for admin review.</Alert>
      ) : null}
      {params?.permission ? <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">You do not have permission to use that buyer-account feature. Ask an authorised buyer contact or OneFarmTech support.</div> : null}

      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Account overview
            </p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">
              {customer.name}
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#405348]">
              Check what needs attention, place a new order, review payments, and keep your buyer details up to date.
            </p>
          </div>

          <SupportChatLauncher
            label="Ask support"
            context={`Buyer account: ${customer.name}`}
            defaultMessage={`I need support with my OneFarmTech buyer account for ${customer.name}.`}
            variant="green"
          />
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Metric label="Status" value={customer.accountStatus} />
          <Metric label="Payment terms" value={customer.paymentTerms} />
          {buyer.canViewCredit ? <Metric label="Available credit" value={formatNaira(availableCredit)} /> : null}
          {buyer.canViewCredit ? <Metric label="Outstanding" value={formatNaira(customer.outstandingBalance)} /> : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {buyer.canPlaceOrders ? <ActionCard
          title="Place buyer order"
          body="Send a fresh produce request linked to this account."
          href="/buyer-account/order"
          label="New order"
          primary
        /> : null}
        {buyer.canViewReceipts ? <ActionCard
          title="Payments and receipts"
          body="Open payment requests, confirmed payments and receipt records."
          href="/buyer-account/payments"
          label="View payments"
        /> : null}
        <ActionCard
          title="Inbox"
          body="Read order, payment, receipt and account messages from OneFarmTech."
          href="/buyer-account/inbox"
          label={unreadMessageCount > 0 ? `${unreadMessageCount} unread` : "Open inbox"}
        />
        <ActionCard
          title="Profile"
          body="View company details, authorised contacts and request account changes."
          href="/buyer-account/profile"
          label="Open profile"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel title="Recent orders" href="/buyer-account/orders">
          <div className="grid gap-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="rounded-2xl bg-[#f7f5ec] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{order.code}</p>
                    <p className="mt-1 text-sm text-[#405348]">
                      {order.deliveryMethod} · {order.fulfilmentStatus}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black">{formatNaira(order.estimatedTotal)}</p>
                    <p className="mt-1 text-xs font-bold text-[#405348]">
                      {order.paymentStatus}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {!recentOrders.length ? (
              <p className="rounded-2xl bg-[#f7f5ec] p-4 text-sm text-[#405348]">
                No linked orders yet.
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel title="Recent receipts" href="/buyer-account/payments">
          <div className="grid gap-3">
            {recentReceipts.map((receipt) => (
              <div key={receipt.id} className="rounded-2xl bg-[#f7f5ec] p-4">
                <div className="flex items-start justify-between gap-3">
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

            {!recentReceipts.length ? (
              <p className="rounded-2xl bg-[#f7f5ec] p-4 text-sm text-[#405348]">
                No receipts issued yet.
              </p>
            ) : null}
          </div>
        </Panel>
      </section>
    </BuyerPortalFrame>
  );
}

function Alert({children}: {children: React.ReactNode}) {
  return (
    <div className="rounded-[2rem] border border-[#3E7A4C]/20 bg-[#3E7A4C]/10 p-5 text-sm font-bold leading-7 text-[#1f7a3f]">
      {children}
    </div>
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

function ActionCard({
  title,
  body,
  href,
  label,
  primary = false,
}: {
  title: string;
  body: string;
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-[2rem] p-5 shadow-sm transition ${
        primary
          ? "bg-[#1f7a3f] text-white hover:bg-[#155c2f]"
          : "bg-white text-[#102015] hover:bg-[#f3f8ef]"
      }`}
    >
      <h3 className="text-xl font-black">{title}</h3>
      <p className={`mt-2 text-sm leading-7 ${primary ? "text-white/80" : "text-[#405348]"}`}>
        {body}
      </p>
      <span
        className={`mt-4 inline-flex rounded-full px-5 py-3 text-sm font-black ${
          primary ? "bg-white text-[#102015]" : "bg-[#1f7a3f] text-white"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

function Panel({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <details className="rounded-[2rem] border border-[#102015]/10 bg-white/95 p-6 text-[#102015] shadow-sm backdrop-blur">
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black">{title}</h2>
          <span className="rounded-full bg-[#f3f8ef] px-4 py-2 text-sm font-black text-[#1f7a3f]">
            Open
          </span>
        </div>
      </summary>
      <div className="mt-5">
        <div className="mb-4">
          <Link href={href} className="text-sm font-black text-[#1f7a3f]">
            View all
          </Link>
        </div>
        {children}
      </div>
    </details>
  );
}
