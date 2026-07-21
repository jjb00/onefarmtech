/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Staff account fields may evolve during the launch auth phase.

import AdminPageShell from "@/components/AdminPageShell";
import AdminDisclosure from "@/components/admin/AdminDisclosure";
import {prisma} from "@/lib/prisma";
import {staffRoles} from "@/lib/permissions";
import {staffStatusOptions} from "@/lib/formOptions";
import {createStaffUserAction} from "@/actions/createAdminRecords";
import {setStaffStatusAction, updateStaffAccountAction} from "@/actions/manageStaff";
import {requireStaffRole} from "@/lib/auth";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";
import AdminActionFeedback from "@/components/admin/AdminActionFeedback";
import {rolePermissions} from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatDate(value?: Date | string | null) {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

type StaffPageProps = {searchParams?: Promise<{success?: string; error?: string}>};

const successMessages: Record<string, string> = {
  updated: "Staff account updated. Existing sessions for that account have been invalidated.",
  deactivated: "Staff account deactivated. Existing sessions for that account have been invalidated.",
  reactivated: "Staff account reactivated.",
};
const errorMessages: Record<string, string> = {
  invalid: "Enter a valid name, email, role and status.",
  "not-found": "That staff account could not be found.",
  "self-deactivate": "You cannot deactivate your own signed-in Super Admin account.",
  "last-super-admin": "The last active Super Admin cannot be deactivated or assigned another role.",
  failed: "The staff account could not be updated. Please try again.",
};

export default async function StaffPage({searchParams}: StaffPageProps) {
  const currentStaff = await requireStaffRole("Super admin");
  const params = await searchParams;
  const staffUsers = await prisma.staffUser.findMany({
    orderBy: {createdAt: "desc"},
    take: 50,
  });

  return (
    <AdminPageShell
      title="Staff & roles"
      description="Manage named staff identities, assigned roles and operational accountability."
    >
      <div className="grid gap-6">
        <AdminActionFeedback success={params?.success} error={params?.error} messages={{...successMessages, ...errorMessages}} />
        <section className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
                Authoritative access
              </p>
              <h2 className="mt-3 text-2xl font-black">Current launch access</h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-[#405348]">
                Each login maps to an active staff record. The server assigns the role and enforces
                capabilities again for protected actions; staff cannot choose a role at sign-in.
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
                Add a staff identity and assign its role. A matching server-side password hash must
                be configured before that account can sign in.
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
          description="Existing authoritative staff records and their assigned access roles."
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
                    Created {formatDate(staff.createdAt)} · Last updated {formatDate(staff.updatedAt)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[#587063]">{rolePermissions[staff.role]?.slice(0, 3).join(" · ") || "No recognised role permissions."}</p>

                  <details className="mt-4 rounded-2xl border border-[#102015]/10 bg-white p-4">
                    <summary className="cursor-pointer text-sm font-black text-[#1f7a3f]">Edit account</summary>
                    <form action={updateStaffAccountAction} className="mt-4 grid gap-3 sm:grid-cols-2">
                      <input type="hidden" name="staffId" value={staff.id} />
                      <label className="grid gap-1 text-xs font-bold">Name
                        <input name="name" required defaultValue={staff.name} className="rounded-xl border border-[#102015]/15 px-3 py-2 text-sm font-normal" />
                      </label>
                      <label className="grid gap-1 text-xs font-bold">Email
                        <input name="email" type="email" required defaultValue={staff.email} className="rounded-xl border border-[#102015]/15 px-3 py-2 text-sm font-normal" />
                      </label>
                      <label className="grid gap-1 text-xs font-bold">Role
                        <select name="role" defaultValue={staff.role} className="rounded-xl border border-[#102015]/15 px-3 py-2 text-sm font-normal">
                          {staffRoles.map((role) => <option key={role} value={role}>{role}</option>)}
                        </select>
                      </label>
                      <label className="grid gap-1 text-xs font-bold">Status
                        <select name="status" defaultValue={staff.status} className="rounded-xl border border-[#102015]/15 px-3 py-2 text-sm font-normal">
                          {staffStatusOptions.filter((status) => status === "Active" || status === "Inactive").map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                      </label>
                      <button type="submit" className="rounded-full bg-[#1f7a3f] px-5 py-2.5 text-sm font-black text-white sm:col-span-2 sm:justify-self-start">Save changes</button>
                    </form>
                  </details>

                  <form action={setStaffStatusAction} className="mt-3">
                    <input type="hidden" name="staffId" value={staff.id} />
                    <input type="hidden" name="status" value={staff.status === "Active" ? "Inactive" : "Active"} />
                    <ConfirmSubmitButton label={staff.status === "Active" ? "Deactivate" : "Reactivate"} pendingLabel="Updating…" confirmMessage={staff.status === "Active" ? `Deactivate ${staff.name}? Their current sessions will stop working.` : undefined} disabled={staff.id === currentStaff.id && staff.status === "Active"} className="rounded-full border border-[#102015]/15 px-4 py-2 text-xs font-black text-[#102015] disabled:cursor-not-allowed disabled:opacity-40" />
                    {staff.id === currentStaff.id && staff.status === "Active" ? (
                      <p className="mt-2 text-xs text-[#587063]">Your current account cannot be deactivated here.</p>
                    ) : null}
                  </form>
                </article>
              ))
            ) : (
              <div className="rounded-[1.5rem] bg-[#f8fbf5] p-6 text-sm leading-7 text-[#405348]">
                No staff records yet. Create a named staff identity before enabling staff login.
              </div>
            )}
          </div>
        </AdminDisclosure>
      </div>
    </AdminPageShell>
  );
}
