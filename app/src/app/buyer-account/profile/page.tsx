import Link from "next/link";
import BuyerPortalFrame from "@/components/BuyerPortalFrame";
import {requireBuyer} from "@/lib/currentBuyer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BuyerProfilePage() {
  const {buyer, customer} = await requireBuyer();

  return (
    <BuyerPortalFrame customerName={customer.name} buyerType={customer.buyerType}>
      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-black">Profile</h2>
        <p className="mt-2 text-sm leading-7 text-[#405348]">
          Approved buyer account details.
        </p>

        <div className="mt-6 grid gap-3">
          <InfoRow label="Buyer name" value={customer.name} />
          <InfoRow label="Buyer type" value={customer.buyerType} />
          <InfoRow label="Phone" value={customer.phone} />
          <InfoRow label="Email" value={customer.email || "Not set"} />
          <InfoRow label="Location" value={customer.location || "Not set"} />
          <InfoRow label="Receipt email" value={customer.receiptEmail || customer.email || "Not set"} />
          <InfoRow label="Signed in as" value={buyer.contactName || buyer.contactRole || "Approved buyer"} />
        </div>

        <Link
          href="/buyer-account/profile-updates"
          className="mt-6 inline-flex rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white"
        >
          Request profile change
        </Link>
      </section>
    </BuyerPortalFrame>
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
