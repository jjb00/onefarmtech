import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {
  createBuyerAccountInviteAction,
  createBuyerContactAction,
} from "@/actions/createAdminRecords";

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
    <main className="space-y-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C95F3D]">
          Buyer access
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#101712]">
          Buyer contacts and account invites
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[#1E2420]/70">
          Prepare approved recurring buyers for real login without exposing fake access.
          Track who is allowed to place orders, view receipts, see credit, and receive future account invitations.
        </p>
      </div>

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
          <h2 className="text-2xl font-black text-[#101712]">Add authorised buyer contact</h2>
          <p className="mt-2 text-sm leading-7 text-[#1E2420]/65">
            Use this for restaurant owners, procurement leads, finance contacts,
            store managers, or authorised staff who will eventually access the buyer portal.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold md:col-span-2">
              Buyer account
              <select
                name="customerId"
                required
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
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
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="e.g. Procurement lead"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Role
              <select
                name="role"
                defaultValue="Buyer user"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
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
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="optional"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Phone
              <input
                name="phone"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="+234..."
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Status
              <select
                name="status"
                defaultValue="Active"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              >
                <option>Active</option>
                <option>Pending verification</option>
                <option>Paused</option>
              </select>
            </label>

            <div className="grid gap-3 rounded-2xl bg-[#F8F1E7] p-4 md:col-span-2">
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
          <h2 className="text-2xl font-black text-[#101712]">Prepare account invite</h2>
          <p className="mt-2 text-sm leading-7 text-[#1E2420]/65">
            This creates an invite record only. It does not send email, SMS, or open real login access yet.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold md:col-span-2">
              Buyer account
              <select
                name="customerId"
                required
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
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
              Invite email
              <input
                name="email"
                type="email"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="optional"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Invite phone
              <input
                name="phone"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="+234..."
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Invite role
              <select
                name="role"
                defaultValue="Buyer user"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              >
                {buyerContactRoles.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Status
              <select
                name="status"
                defaultValue="Draft"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
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
            Create invite record
          </button>
        </form>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-[#101712]">Authorised buyer contacts</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-[1000px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#101712]/10 text-xs uppercase tracking-[0.18em] text-[#1E2420]/50">
                <th className="py-3 pr-4">Contact</th>
                <th className="py-3 pr-4">Buyer</th>
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 pr-4">Access</th>
                <th className="py-3 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-b border-[#101712]/10">
                  <td className="py-4 pr-4">
                    <div className="font-black">{contact.name}</div>
                    <div className="text-xs text-[#1E2420]/55">
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
                  <td className="py-8 text-center text-[#1E2420]/55" colSpan={5}>
                    No authorised buyer contacts yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-[#101712]">Account invite records</h2>
        <div className="mt-6 grid gap-4">
          {invites.map((invite) => (
            <article key={invite.id} className="rounded-2xl bg-[#F8F1E7] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-[#C95F3D]">{invite.inviteCode}</p>
                  <h3 className="mt-1 text-xl font-black">{invite.customer.name}</h3>
                  <p className="mt-1 text-sm text-[#1E2420]/60">
                    {invite.email || "No email"} · {invite.phone || "No phone"} · {invite.role}
                  </p>
                </div>
                <span className="rounded-full bg-[#3E7A4C]/10 px-3 py-1 text-xs font-black text-[#3E7A4C]">
                  {invite.status}
                </span>
              </div>
            </article>
          ))}

          {!invites.length ? (
            <p className="rounded-2xl bg-[#F8F1E7] p-5 text-sm text-[#1E2420]/60">
              No buyer invite records yet.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function Metric({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-[1.5rem] bg-[#101712] p-5 text-white shadow-sm">
      <p className="text-2xl font-black text-[#F2B84B]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-white/70">{label}</p>
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
