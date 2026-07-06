import BuyerPortalFrame from "@/components/BuyerPortalFrame";
import SupportChatLauncher from "@/components/SupportChatLauncher";
import {requireBuyer} from "@/lib/currentBuyer";
import {formatNaira} from "@/lib/format";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BuyerPaymentsPage() {
  const {customer} = await requireBuyer();

  return (
    <BuyerPortalFrame customerName={customer.name} buyerType={customer.buyerType}>
      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-black">Payments & receipts</h2>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <Metric label="Receipt email" value={customer.receiptEmail || customer.email || "Not set"} />
          <Metric label="Receipts" value={String(customer.receipts.length)} />
          <Metric label="Outstanding" value={formatNaira(customer.outstandingBalance)} />
        </div>

        <div className="mt-6 grid gap-3">
          {customer.receipts.map((receipt) => (
            <div key={receipt.id} className="rounded-2xl border border-[#102015]/10 bg-[#fbfff8] p-4">
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

          {!customer.receipts.length ? (
            <p className="rounded-2xl bg-[#f7f5ec] p-4 text-sm text-[#405348]">
              No receipts issued yet.
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
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
