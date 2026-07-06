import BuyerPortalFrame from "@/components/BuyerPortalFrame";
import SupportChatLauncher from "@/components/SupportChatLauncher";
import {requireBuyer} from "@/lib/currentBuyer";
import {formatNaira} from "@/lib/format";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BuyerCreditPage() {
  const {customer} = await requireBuyer();
  const availableCredit = Math.max(customer.creditLimit - customer.outstandingBalance, 0);

  return (
    <BuyerPortalFrame customerName={customer.name} buyerType={customer.buyerType}>
      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-black">Credit & partner readiness</h2>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Metric label="Payment terms" value={customer.paymentTerms} />
          <Metric label="Credit limit" value={formatNaira(customer.creditLimit)} />
          <Metric label="Outstanding" value={formatNaira(customer.outstandingBalance)} />
          <Metric label="Available" value={formatNaira(availableCredit)} />
        </div>

        <div className="mt-6 rounded-2xl border border-[#F2B84B]/40 bg-[#fff8e6] p-4 text-sm leading-7 text-[#5d4716]">
          Credit terms are reviewed manually. Order history, payment records,
          business profile and authorised contacts help support review.
        </div>

        <div className="mt-6">
          <SupportChatLauncher
            label="Request credit review"
            context={`Buyer account: ${customer.name} · Credit review`}
            defaultMessage={`I would like a credit/payment terms review for ${customer.name}. Current credit limit: ${formatNaira(customer.creditLimit)}. Outstanding balance: ${formatNaira(customer.outstandingBalance)}.`}
          />
        </div>
      </section>
    </BuyerPortalFrame>
  );
}

function Metric({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-2xl border border-[#102015]/10 bg-[#fbfff8] p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#587063]">{label}</p>
      <p className="mt-2 text-lg font-black text-[#102015]">{value}</p>
    </div>
  );
}
