import {prisma} from "@/lib/prisma";
import {createStaffUserAction} from "@/actions/createAdminRecords";

const roleDescriptions = [
  {
    role: "Super admin",
    description: "Full access, staff management, auth settings, audit review, and final control.",
  },
  {
    role: "Admin",
    description: "General operations access across orders, buyers, products, and fulfilment.",
  },
  {
    role: "Operations",
    description: "Order allocation, pickup, delivery, suppliers, group-buys, and fulfilment updates.",
  },
  {
    role: "Finance",
    description: "Payments, receipts, balances, credit limits, and payment status changes.",
  },
  {
    role: "Support",
    description: "Complaints, buyer communication, issue resolution, and WhatsApp follow-up.",
  },
  {
    role: "Buyer account manager",
    description: "Recurring buyer onboarding, account readiness, receipt email, and credit profile.",
  },
];

export default async function StaffPage() {
  const staffUsers = await prisma.staffUser.findMany({
    orderBy: {createdAt: "desc"},
  });

  return (
    <main className="space-y-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C95F3D]">
          Access planning
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#101712]">Staff & roles</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[#1E2420]/70">
          Local role planning for the proper auth phase. The temporary admin password
          gate remains in place until Supabase Auth or equivalent is connected.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        {roleDescriptions.map((item) => (
          <article key={item.role} className="rounded-[1.5rem] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-[#101712]">{item.role}</h2>
            <p className="mt-2 text-sm leading-7 text-[#1E2420]/70">
              {item.description}
            </p>
          </article>
        ))}
      </section>

      <form action={createStaffUserAction} className="rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-[#101712]">Add staff user</h2>
        <p className="mt-2 text-sm text-[#1E2420]/60">
          This creates a local staff record for role planning. It is not a real login yet.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <label className="grid gap-2 text-sm font-semibold">
            Name
            <input
              name="name"
              required
              className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              placeholder="Staff name"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Email
            <input
              name="email"
              type="email"
              required
              className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              placeholder="name@onefarmtech..."
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Role
            <select
              name="role"
              defaultValue="Operations"
              className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
            >
              {roleDescriptions.map((item) => (
                <option key={item.role}>{item.role}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Status
            <select
              name="status"
              defaultValue="Active"
              className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
            >
              <option>Active</option>
              <option>Pending</option>
              <option>Paused</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          className="mt-6 rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white"
        >
          Save staff record
        </button>
      </form>

      <section className="overflow-hidden rounded-[1.5rem] border border-[#101712]/10 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#101712] text-white">
            <tr>
              <th className="px-4 py-3">Staff</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {staffUsers.map((staff) => (
              <tr key={staff.id} className="border-t border-[#101712]/10">
                <td className="px-4 py-3">
                  <div className="font-bold">{staff.name}</div>
                  <div className="text-xs text-[#1E2420]/55">{staff.email}</div>
                </td>
                <td className="px-4 py-3">{staff.role}</td>
                <td className="px-4 py-3">{staff.status}</td>
                <td className="px-4 py-3 text-[#1E2420]/60">
                  {staff.createdAt.toLocaleString()}
                </td>
              </tr>
            ))}

            {!staffUsers.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-[#1E2420]/60" colSpan={4}>
                  No staff records yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}
