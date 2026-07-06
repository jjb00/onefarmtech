import Link from "next/link";
import AdminPageShell from "@/components/AdminPageShell";
import {prisma} from "@/lib/prisma";
import {
  createBuyerAccountInviteAction,
  createBuyerContactAction,
} from "@/actions/createAdminRecords";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const buyerContactRoles = [
  "Owner / director",
  "Procurement lead",
  "Finance contact",
  "Kitchen manager",
  "Store manager",
  "Buyer user",
];

export default async function BuyerAccessPage() {
  const [customers, contacts, invites] = await Promise.all([
    prisma.customer.findMany({
      orderBy: {createdAt: "desc"},
      select: {
        id: true,
        name: true,
        buyerType: true,
        phone: true,
        email: true,
        accountStatus: true,
        accountLoginReady: true,
      },
    }),
    prisma.buyerContact.findMany({
      orderBy: {createdAt: "desc"},
      include: {customer: true},
      take: 100,
    }),
    prisma.buyerAccountInvite.findMany({
      orderBy: {createdAt: "desc"},
      include: {customer: true},
      take: 100,
    }),
  ]);

  return (
    <AdminPageShell
      title="Buyer contacts and account invites"
      description="Prepare approved recurring buyers for real login without exposing fake access. Track who is allowed to place orders, view receipts, see credit, and receive future account invitations."
    >
      <div className="grid gap-6">

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Buyer contacts" value={String(contacts.length)} />
        <Metric label="Account invites" value={String(invites.length)} />
        <Metric
          label="Login-ready buyers"
          value={String(customers.filter((customer) => customer.accountLoginReady).length)}
        />
        <Metric
          label="Approved accounts"
          value={String(customers.filter((customer) => customer.accountStatus.includes("Approved")).length)}
        />
      </section>

      <section className="grid gap-8 xl:grid-cols-2">
        <form action={createBuyerContactAction} className="rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-[#102015]">Add authorised buyer contact</h2>
          <p className="mt-2 text-sm leading-7 text-[#405348]">
            Use this for restaurant owners, procurement leads, finance contacts,
            store managers, or authorised staff who will eventually access the buyer portal.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold md:col-span-2">
              Buyer account
              <select
                name="customerId"
                required
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-[#102015] font-normal outline-none focus:border-[#1f7a3f]"
              >
                <option value="">Select buyer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} · {customer.buyerType} · {customer.accountStatus}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Contact name
              <input
                name="name"
                required
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-[#102015] font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="e.g. Procurement lead"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Role
              <select
                name="role"
                defaultValue="Buyer user"
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-[#102015] font-normal outline-none focus:border-[#1f7a3f]"
              >
                {buyerContactRoles.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Email
              <input
                name="email"
                type="email"
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-[#102015] font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="optional"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Phone
              <input
                name="phone"
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-[#102015] font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="+234..."
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Status
              <select
                name="status"
                defaultValue="Active"
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-[#102015] font-normal outline-none focus:border-[#1f7a3f]"
              >
                <option>Active</option>
                <option>Pending verification</option>
                <option>Paused</option>
              </select>
            </label>

            <div className="grid gap-3 rounded-2xl bg-[#f3f8ef] p-4 md:col-span-2">
              <label className="flex items-center gap-3 text-sm font-semibold">
                <input name="canPlaceOrders" type="checkbox" defaultChecked />
                Can place orders
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold">
                <input name="canViewReceipts" type="checkbox" defaultChecked />
                Can view receipts
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold">
                <input name="canViewCredit" type="checkbox" />
                Can view credit/balance
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white"
          >
            Save buyer contact
          </button>
        </form>

        <form action={createBuyerAccountInviteAction} className="rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-[#102015]">Generate buyer login access code</h2>
          <p className="mt-2 text-sm leading-7 text-[#405348]">
            Use this after a buyer account has been approved. Choose the approved buyer, add the buyer email or phone, then generate the code they will use in the Buyer login pop-up.
          </p>
          <div className="mt-4 rounded-2xl bg-[#f7f5ec] p-4 text-sm leading-7 text-[#405348]">
            This does not send WhatsApp or email automatically yet. After the code is generated, copy the message shown below and send it manually.
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold md:col-span-2">
              Buyer account
              <select
                name="customerId"
                required
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-[#102015] font-normal outline-none focus:border-[#1f7a3f]"
              >
                <option value="">Select buyer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} · {customer.buyerType} · {customer.accountStatus}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Buyer login email
              <input
                name="email"
                type="email"
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-[#102015] font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="optional"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Buyer login phone
              <input
                name="phone"
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-[#102015] font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="+234..."
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Buyer login role
              <select
                name="role"
                defaultValue="Buyer user"
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-[#102015] font-normal outline-none focus:border-[#1f7a3f]"
              >
                {buyerContactRoles.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Access status
              <select
                name="status"
                defaultValue="Ready to send"
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-[#102015] font-normal outline-none focus:border-[#1f7a3f]"
              >
                <option>Draft</option>
                <option>Ready to send</option>
                <option>Sent manually</option>
                <option>Accepted later</option>
                <option>Cancelled</option>
              </select>
            </label>
          </div>

          <button
            type="submit"
            className="mt-6 rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white"
          >
            Generate access code
          </button>
        </form>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-[#102015]">Authorised buyer contacts</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-[1000px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#102015]/10 text-xs uppercase tracking-[0.18em] text-[#587063]">
                <th className="py-3 pr-4">Contact</th>
                <th className="py-3 pr-4">Buyer</th>
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 pr-4">Access</th>
                <th className="py-3 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-b border-[#102015]/10">
                  <td className="py-4 pr-4">
                    <div className="font-black">{contact.name}</div>
                    <div className="text-xs text-[#587063]">
                      {contact.email || "No email"} · {contact.phone || "No phone"}
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <Link
                      href={`/admin/customers/${contact.customerId}`}
                      className="font-bold text-[#1f7a3f] underline-offset-4 hover:underline"
                    >
                      {contact.customer.name}
                    </Link>
                  </td>
                  <td className="py-4 pr-4">{contact.role}</td>
                  <td className="py-4 pr-4">
                    <div className="flex flex-wrap gap-2">
                      {contact.canPlaceOrders ? <Pill label="Orders" /> : null}
                      {contact.canViewReceipts ? <Pill label="Receipts" /> : null}
                      {contact.canViewCredit ? <Pill label="Credit" /> : null}
                    </div>
                  </td>
                  <td className="py-4 pr-4">{contact.status}</td>
                </tr>
              ))}

              {!contacts.length ? (
                <tr>
                  <td className="py-8 text-center text-[#587063]" colSpan={5}>
                    No authorised buyer contacts yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-[#102015]">Generated buyer login access codes</h2>
        <div className="mt-6 grid gap-4">
          {invites.map((invite) => {
            const buyerName = invite.customer.name;
            const contactTarget = invite.email || invite.phone || "buyer";
            const shareMessage = `Hello ${buyerName}, your OneFarmTech buyer account has been approved. Use this access code to sign in: ${invite.inviteCode}. If you need help, contact the OneFarmTech team.`;

            return (
              <article key={invite.id} className="rounded-2xl border border-[#102015]/10 bg-[#f3f8ef] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C95F3D]">
                      Buyer access code
                    </p>
                    <p className="mt-2 rounded-2xl bg-white px-4 py-3 font-mono text-2xl font-black text-[#102015] shadow-sm">
                      {invite.inviteCode}
                    </p>
                    <h3 className="mt-4 text-xl font-black">{buyerName}</h3>
                    <p className="mt-1 text-sm text-[#587063]">
                      Send to: {contactTarget} · Role: {invite.role}
                    </p>
                  </div>

                  <span className="rounded-full bg-[#3E7A4C]/10 px-3 py-1 text-xs font-black text-[#3E7A4C]">
                    {invite.status}
                  </span>
                </div>

                <div className="mt-5 rounded-2xl bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#587063]">
                    Manual WhatsApp/email message
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#405348]">
                    {shareMessage}
                  </p>
                </div>

                <p className="mt-4 text-xs font-semibold leading-6 text-[#587063]">
                  For now, copy this message and send it manually by WhatsApp or email. Automatic notification can be wired later once the WhatsApp/email provider is ready.
                </p>
              </article>
            );
          })}

          {!invites.length ? (
            <p className="rounded-2xl bg-[#f3f8ef] p-5 text-sm text-[#587063]">
              No buyer login access codes generated yet.
            </p>
          ) : null}
        </div>
      </section>
      </div>
    </AdminPageShell>
  );
}

function Metric({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-[1.5rem] bg-white p-5 text-[#102015] shadow-sm">
      <p className="text-2xl font-black text-[#1f7a3f]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[#405348]">{label}</p>
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
