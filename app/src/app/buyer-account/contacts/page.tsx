import BuyerPortalFrame from "@/components/BuyerPortalFrame";
import SupportChatLauncher from "@/components/SupportChatLauncher";
import {requireBuyer} from "@/lib/currentBuyer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BuyerContactsPage() {
  const {customer} = await requireBuyer();

  return (
    <BuyerPortalFrame customerName={customer.name} buyerType={customer.buyerType}>
      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-black">Authorised contacts</h2>

        <div className="mt-6 grid gap-3">
          {customer.buyerContacts.map((contact) => (
            <div key={contact.id} className="rounded-2xl border border-[#102015]/10 bg-[#fbfff8] p-4">
              <p className="font-black">{contact.name}</p>
              <p className="mt-1 text-sm text-[#405348]">
                {contact.role} · {contact.email || "No email"} · {contact.phone || "No phone"}
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

        <div className="mt-6">
          <SupportChatLauncher
            label="Update contacts"
            context={`Buyer account: ${customer.name} · Contact update`}
            defaultMessage={`I need to update authorised contacts for ${customer.name}'s OneFarmTech buyer account.`}
          />
        </div>
      </section>
    </BuyerPortalFrame>
  );
}

function Pill({label}: {label: string}) {
  return (
    <span className="rounded-full bg-[#3E7A4C]/10 px-3 py-1 text-xs font-bold text-[#3E7A4C]">
      {label}
    </span>
  );
}
