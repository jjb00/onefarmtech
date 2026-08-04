import AdminPageShell from "@/components/AdminPageShell";
import {AdminEmptyState, AdminPagination, AdminResultCount} from "@/components/admin/AdminListControls";
import {AdminStatusPill, adminToneFromStatus} from "@/components/admin/AdminViewControls";
import {updateCareerApplicationStatusAction} from "@/actions/publicApplications";
import {prisma} from "@/lib/prisma";
import {requireStaff} from "@/lib/auth";
import {adminListHref, adminResultRange, parseAdminPage, parseAdminPageSize} from "@/lib/adminListParams.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATUSES = ["New", "Reviewing", "Interviewed", "Hired", "Rejected"];

function formatDate(input: Date) {
  return new Intl.DateTimeFormat("en-GB", {timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short"}).format(input);
}

function value(input: string | string[] | undefined) {
  return String(Array.isArray(input) ? input[0] : input || "").trim();
}

export default async function CareerApplicationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff();
  const raw = await searchParams;
  const pageSize = parseAdminPageSize(value(raw?.pageSize));
  const page = parseAdminPage(value(raw?.page));

  const [total, applications] = await Promise.all([
    prisma.careerApplication.count(),
    prisma.careerApplication.findMany({
      orderBy: [{createdAt: "desc"}, {id: "desc"}],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const range = adminResultRange(page, pageSize, total);
  const params = {pageSize: String(pageSize)};

  return (
    <AdminPageShell
      title="Career applications"
      description="Applications submitted through the public careers page."
    >
      <AdminResultCount start={range.start} end={range.end} total={total} label="applications" />

      {applications.length === 0 ? (
        <AdminEmptyState title="No applications yet" description="Career applications submitted on the public site will appear here." />
      ) : (
        <div className="grid gap-4">
          {applications.map((application) => (
            <article key={application.id} className="rounded-[1.5rem] border border-[#102015]/10 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminStatusPill tone={adminToneFromStatus(application.status)}>{application.status}</AdminStatusPill>
                    <span className="text-xs font-bold text-[#587063]">{formatDate(application.createdAt)}</span>
                  </div>
                  <h3 className="mt-2 text-xl font-black text-[#102015]">{application.name}</h3>
                  <p className="mt-1 text-sm text-[#405348]">{application.role}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 rounded-2xl bg-[#f7f5ec] p-4 text-sm text-[#405348] sm:grid-cols-2">
                <p><span className="font-black text-[#102015]">Email:</span> {application.email}</p>
                <p><span className="font-black text-[#102015]">Phone:</span> {application.phone}</p>
                <p><span className="font-black text-[#102015]">Location:</span> {application.location}</p>
                <p><span className="font-black text-[#102015]">Consent:</span> {application.consent ? "Yes" : "No"}</p>
              </div>

              <p className="mt-3 text-sm leading-6 text-[#405348]">{application.experience}</p>

              <form action={updateCareerApplicationStatusAction} className="mt-4 grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end">
                <input type="hidden" name="id" value={application.id} />
                <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#587063]">
                  Status
                  <select name="status" defaultValue={application.status} className="rounded-xl border border-[#102015]/10 bg-white px-3 py-2 text-sm font-semibold text-[#102015]">
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#587063]">
                  Note
                  <input name="adminNote" defaultValue={application.adminNote || ""} className="rounded-xl border border-[#102015]/10 bg-white px-3 py-2 text-sm" placeholder="Internal note" />
                </label>
                <button type="submit" className="rounded-full bg-[#1f7a3f] px-5 py-2 text-sm font-black text-white hover:bg-[#155c2f]">
                  Save
                </button>
              </form>
            </article>
          ))}
        </div>
      )}

      <AdminPagination
        page={page}
        totalPages={totalPages}
        previousHref={page > 1 ? adminListHref("/admin/career-applications", {...params, page: String(page - 1)}) : undefined}
        nextHref={page < totalPages ? adminListHref("/admin/career-applications", {...params, page: String(page + 1)}) : undefined}
      />
    </AdminPageShell>
  );
}
