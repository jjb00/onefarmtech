import AdminPageShell from "@/components/AdminPageShell";
import {prisma} from "@/lib/prisma";
import {createStaffUserAction} from "@/actions/createAdminRecords";

const roleDescriptions = [
  {
    role: "Super admin",
    description:
      "Full access, staff management, auth settings, audit review, and final control.",
  },
  {
    role: "Admin",
    description:
      "General operations access across orders, buyers, products, and fulfilment.",
  },
  {
    role: "Operations",
    description:
      "Order allocation, pickup, delivery, suppliers, group-buys, and fulfilment updates.",
  },
  {
    role: "Finance",
    description:
      "Payments, receipts, balances, credit limits, and payment status changes.",
  },
  {
    role: "Support",
    description:
      "Complaints, buyer communication, issue resolution, and WhatsApp follow-up.",
  },
  {
    role: "Buyer account manager",
    description:
      "Recurring buyer onboarding, account readiness, receipt email, and credit profile.",
  },
];

export default async function StaffPage() {
  const staffUsers = await prisma.staffUser.findMany({
    orderBy: {createdAt: "desc"},
  });

  return (
    <AdminPageShell
      title="Staff & roles"
      description="Local role planning for the proper auth phase. The temporary admin password gate remains in place until Supabase Auth or equivalent is connected."
    >
      <div className="grid gap-6">
        <section className="grid gap-4 lg:grid-cols-3">
          {roleDescriptions.map((item) => (
            <article
              key={item.role}
              className="rounded-[2rem] border border-[#102015]/10 bg-white p-5 text-[#102015] shadow-sm"
            >
              <h2 className="text-lg font-black text-[#102015]">
                {item.role}
              </h2>

              <p className="mt-2 text-sm leading-7 text-[#405348]">
                {item.description}
              </p>
            </article>
          ))}
        </section>

        <form
          action={createStaffUserAction}
          className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm"
        >
          <h2 className="text-2xl font-black text-[#102015]">Add staff user</h2>

          <p className="mt-2 text-sm text-[#405348]">
            This creates a local staff record for role planning. It is not a real
            login yet.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <label className="grid gap-2 text-sm font-semibold text-[#102015]">
              Name
              <input
                name="name"
                required
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 font-normal text-[#102015] outline-none focus:border-[#1f7a3f]"
                placeholder="Staff name"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-[#102015]">
              Email
              <input
                name="email"
                type="email"
                required
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 font-normal text-[#102015] outline-none focus:border-[#1f7a3f]"
                placeholder="name@onefarmtech..."
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-[#102015]">
              Role
              <select
                name="role"
                defaultValue="Operations"
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 font-normal text-[#102015] outline-none focus:border-[#1f7a3f]"
              >
                {roleDescriptions.map((item) => (
                  <option key={item.role}>{item.role}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold text-[#102015]">
              Status
              <select
                name="status"
                defaultValue="Active"
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 font-normal text-[#102015] outline-none focus:border-[#1f7a3f]"
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

        <section className="overflow-hidden rounded-[2rem] border border-[#102015]/10 bg-white text-[#102015] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="bg-[#f3f8ef] text-[#405348]">
                <tr>
                  <th className="px-4 py-3">Staff</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>

              <tbody>
                {staffUsers.map((staff) => (
                  <tr key={staff.id} className="border-t border-[#102015]/10">
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#102015]">{staff.name}</div>
                      <div className="text-xs text-[#587063]">{staff.email}</div>
                    </td>

                    <td className="px-4 py-3 text-[#102015]">{staff.role}</td>
                    <td className="px-4 py-3 text-[#102015]">{staff.status}</td>

                    <td className="px-4 py-3 text-[#405348]">
                      {staff.createdAt.toLocaleString()}
                    </td>
                  </tr>
                ))}

                {!staffUsers.length ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-[#587063]" colSpan={4}>
                      No staff records yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}
