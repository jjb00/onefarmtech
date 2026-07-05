/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Staff account fields may evolve during the launch auth phase.

import AdminPageShell from "@/components/AdminPageShell";
import {prisma} from "@/lib/prisma";
import {staffRoles, rolePermissions} from "@/lib/permissions";

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
          <h2 className="text-2xl font-black">Role permissions</h2>
          <p className="mt-2 text-sm leading-7 text-[#405348]">
            These are the operational roles currently available on the staff login screen.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {staffRoles.map((role) => (
              <article
                key={role}
                className="rounded-[1.5rem] border border-[#102015]/10 bg-[#f8fbf5] p-5"
              >
                <h3 className="text-lg font-black text-[#102015]">{role}</h3>
                <ul className="mt-4 grid gap-2 text-sm leading-6 text-[#405348]">
                  {(rolePermissions[role] || []).map((permission) => (
                    <li key={permission} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1f7a3f]" />
                      <span>{permission}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm">
          <h2 className="text-2xl font-black">Staff records</h2>
          <p className="mt-2 text-sm leading-7 text-[#405348]">
            Existing database records are shown here for readiness review. Account creation and password
            invite flow should be added in the next staff-auth build.
          </p>

          <div className="mt-6 grid gap-3">
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
        </section>
      </div>
    </AdminPageShell>
  );
}
