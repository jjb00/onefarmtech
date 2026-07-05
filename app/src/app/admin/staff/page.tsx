/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Staff account fields may evolve during the launch auth phase.

import AdminPageShell from "@/components/AdminPageShell";
import AdminDisclosure from "@/components/admin/AdminDisclosure";
import {prisma} from "@/lib/prisma";
import {staffRoles} from "@/lib/permissions";
import {staffStatusOptions} from "@/lib/formOptions";
import {createStaffUserAction} from "@/actions/createAdminRecords";

function formatDate(value?: Date | string | null) {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function StaffPage() {
  const staffUsers = await prisma.staffUser.findMany({
    orderBy: {createdAt: "desc"},
    take: 50,
  });

  return (
    <AdminPageShell
      title="Staff & roles"
      description="Plan staff access, role visibility and operational accountability for the controlled launch period. Full named staff login accounts come after the shared staff gate phase."
    >
      <div className="grid gap-6">
        <section className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
                Access model v1
              </p>
              <h2 className="mt-3 text-2xl font-black">Current launch access</h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-[#405348]">
                The admin area is protected by a shared staff password for the controlled launch.
                The selected session role now limits visible admin areas. The next phase is named
                staff accounts created by Super admin/Admin, with individual login credentials and
                stronger action-level permissions.
              </p>
            </div>

            <div className="rounded-2xl bg-[#f3f8ef] p-4 text-sm">
              <p className="font-black text-[#102015]">{staffUsers.length}</p>
              <p className="mt-1 text-[#405348]">staff records in database</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
                Super admin / Admin
              </p>
              <h2 className="mt-3 text-2xl font-black">Create staff record</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
                Add staff members and assign their launch role. This creates the staff register
                foundation now; individual password invites and named staff login come in the next auth phase.
              </p>
            </div>
          </div>

          <form action={createStaffUserAction} className="mt-6 grid gap-4 lg:grid-cols-4">
            <label className="grid gap-2 text-sm font-bold text-[#102015]">
              Staff name
              <input
                name="name"
                required
                className="rounded-2xl border border-[#102015]/10 bg-[#f8fbf5] px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="e.g. Operations lead"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[#102015]">
              Staff email
              <input
                name="email"
                type="email"
                required
                className="rounded-2xl border border-[#102015]/10 bg-[#f8fbf5] px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="name@example.com"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[#102015]">
              Role
              <select
                name="role"
                defaultValue="Operations"
                className="rounded-2xl border border-[#102015]/10 bg-[#f8fbf5] px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              >
                {staffRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-bold text-[#102015]">
              Status
              <select
                name="status"
                defaultValue="Active"
                className="rounded-2xl border border-[#102015]/10 bg-[#f8fbf5] px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              >
                {staffStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <div className="lg:col-span-4">
              <button
                type="submit"
                className="rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
              >
                Create staff record
              </button>
            </div>
          </form>
        </section>

        <AdminDisclosure
          title="Staff records"
          description="Existing database records are shown here for readiness review. Account creation and password invite flow should be added in the next staff-auth build."
          defaultOpen={staffUsers.length > 0}
        >
          <div className="grid gap-3">
            {staffUsers.length ? (
              staffUsers.map((staff) => (
                <article
                  key={staff.id}
                  className="rounded-[1.5rem] border border-[#102015]/10 bg-[#f8fbf5] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-[#102015]">
                        {staff.name || staff.fullName || staff.email || "Unnamed staff member"}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[#405348]">
                        {staff.email || "No email recorded"}
                        {staff.role ? ` · ${staff.role}` : ""}
                      </p>
                    </div>

                    <span className="rounded-full bg-[#F2B84B]/20 px-3 py-1 text-xs font-black text-[#102015]">
                      {staff.status || "Planned"}
                    </span>
                  </div>

                  <p className="mt-3 text-xs font-semibold text-[#587063]">
                    Created {formatDate(staff.createdAt)}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-[1.5rem] bg-[#f8fbf5] p-6 text-sm leading-7 text-[#405348]">
                No staff records yet. For launch, continue using the controlled staff password.
                Add named staff accounts in the next auth phase.
              </div>
            )}
          </div>
        </AdminDisclosure>
      </div>
    </AdminPageShell>
  );
}
