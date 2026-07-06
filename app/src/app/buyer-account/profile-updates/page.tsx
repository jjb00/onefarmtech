import BuyerPortalFrame from "@/components/BuyerPortalFrame";
import {createBuyerProfileUpdateRequestAction} from "@/actions/createAdminRecords";
import {requireBuyer} from "@/lib/currentBuyer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BuyerProfileUpdatesPage() {
  const {customer} = await requireBuyer();

  return (
    <BuyerPortalFrame customerName={customer.name} buyerType={customer.buyerType}>
      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-black">Profile update request</h2>
        <p className="mt-2 text-sm leading-7 text-[#405348]">
          Submit changes for admin review before approved account records are updated.
        </p>

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
            <Field name="companyInfo" label="Company information" placeholder="Business/group name, registration number, address, operating location, sector..." />
            <Field name="buyingProfile" label="Buying profile" placeholder="Regular produce needs, order frequency, average spend, delivery windows..." />
            <Field name="financeInfo" label="Finance / credit information" placeholder="Preferred payment terms, finance contact, receipt requirements, credit review notes..." />
            <Field name="contactInfo" label="Contact changes" placeholder="Add, remove or update authorised users, procurement contacts or finance contacts..." />
          </div>

          <Field name="documentsNote" label="Documents / verification note" rows={3} placeholder="Mention available business, tax, bank or invoice documents. Do not upload sensitive documents here yet." />
          <Field name="message" label="Extra message" rows={3} placeholder="Anything else the OneFarmTech team should review." />

          <button
            type="submit"
            className="rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
          >
            Submit update request
          </button>
        </form>
      </section>
    </BuyerPortalFrame>
  );
}

function Field({
  name,
  label,
  placeholder,
  rows = 4,
}: {
  name: string;
  label: string;
  placeholder: string;
  rows?: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#102015]">
      {label}
      <textarea
        name={name}
        rows={rows}
        className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
        placeholder={placeholder}
      />
    </label>
  );
}
