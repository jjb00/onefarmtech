import BuyerPortalFrame from "@/components/BuyerPortalFrame";
import SupportChatLauncher from "@/components/SupportChatLauncher";
import {createBuyerProfileUpdateRequestAction} from "@/actions/createAdminRecords";
import {requireBuyer} from "@/lib/currentBuyer";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BuyerProfilePage() {
  const {buyer, customer} = await requireBuyer();
  const unreadMessageCount = await prisma.buyerMessage.count({
    where: {
      customerId: customer.id,
      OR: [{readAt: null}, {status: {in: ["Unread", "Prepared", "Sent"]}}],
    },
  });

  return (
    <BuyerPortalFrame
      customerName={customer.name}
      buyerType={customer.buyerType}
      unreadMessageCount={unreadMessageCount}
    >
      <section className="rounded-[2rem] border border-[#102015]/10 bg-white/95 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Profile
            </p>
            <h2 className="mt-2 text-3xl font-black">{customer.name}</h2>
            <p className="mt-2 text-sm leading-7 text-[#405348]">
              One place for company details, authorised contacts and profile change requests.
            </p>
          </div>

          <SupportChatLauncher
            label="Profile support"
            context={`Buyer profile: ${customer.name}`}
            defaultMessage={`I need help with the buyer profile for ${customer.name}.`}
            variant="green"
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <Panel title="Account details">
            <InfoRow label="Buyer name" value={customer.name} />
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
      </section>

      <section className="rounded-[2rem] border border-[#102015]/10 bg-white/95 p-6 shadow-sm backdrop-blur">
        <details>
          <summary className="cursor-pointer list-none">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#C95F3D]">
                Request changes
              </p>
              <h2 className="mt-2 text-2xl font-black">Update profile or contacts</h2>
              <p className="mt-2 text-sm leading-7 text-[#405348]">
                Use this form for company details, contact changes, buying profile updates or payment-term review requests.
              </p>
            </div>
          </summary>

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
            <Field
              name="companyInfo"
              label="Company / buyer information"
              placeholder="Business or group name, operating location, registration or tax details if relevant..."
            />
            <Field
              name="contactInfo"
              label="Contact changes"
              placeholder="Add, remove or update authorised users, procurement contacts or finance contacts..."
            />
            <Field
              name="buyingProfile"
              label="Buying profile"
              placeholder="Regular produce needs, order frequency, average spend, delivery windows..."
            />
            <Field
              name="financeInfo"
              label="Finance / credit information"
              placeholder="Preferred payment terms, finance contact, receipt requirements, credit review notes..."
            />
          </div>

          <Field
            name="documentsNote"
            label="Documents / verification note"
            rows={3}
            placeholder="Mention available business, tax, bank or invoice documents. Do not upload sensitive documents here yet."
          />

          <Field
            name="message"
            label="Extra message"
            rows={3}
            placeholder="Anything else the OneFarmTech team should review."
          />

          <button
            type="submit"
            className="rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
          >
            Submit change request
          </button>
          </form>
        </details>
      </section>
    </BuyerPortalFrame>
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
    <section className="rounded-[2rem] border border-[#102015]/10 bg-[#fbfff8] p-5">
      <h3 className="text-xl font-black">{title}</h3>
      <div className="mt-4">{children}</div>
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

function Pill({label}: {label: string}) {
  return (
    <span className="rounded-full bg-[#3E7A4C]/10 px-3 py-1 text-xs font-bold text-[#3E7A4C]">
      {label}
    </span>
  );
}
