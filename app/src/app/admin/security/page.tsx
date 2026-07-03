import Link from "next/link";
import {getCurrentStaffActor} from "@/lib/currentStaff";

const readinessItems = [
  {
    title: "Temporary staff password gate",
    status: "Active locally",
    note: "Useful for local testing only. It must be replaced before Vercel team testing.",
  },
  {
    title: "Staff role records",
    status: "Foundation added",
    note: "Staff records exist locally for planning, but they are not real login identities yet.",
  },
  {
    title: "Audit attribution",
    status: "Improved",
    note: "Audit logs now use the selected staff name, email, and role from the temporary session.",
  },
  {
    title: "Buyer login",
    status: "Not active",
    note: "Recurring buyer login is planned, but no fake access is exposed.",
  },
  {
    title: "Production auth",
    status: "Required before testing",
    note: "Supabase Auth or equivalent should handle staff and buyer accounts before Vercel team testing.",
  },
];

export default async function SecurityPage() {
  const staff = await getCurrentStaffActor();

  return (
    <main className="space-y-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C95F3D]">
          Security readiness
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#101712]">
          Auth and access status
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[#1E2420]/70">
          This page keeps the MVP honest: local access is currently protected by
          a temporary password gate, while proper staff and recurring buyer auth
          remains a pre-live requirement.
        </p>
      </div>

      <section className="rounded-[1.5rem] bg-[#101712] p-6 text-white shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-[#F2B84B]">
          Current local session
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <Metric label="Staff name" value={staff.name} />
          <Metric label="Role" value={staff.role} />
          <Metric label="Email" value={staff.email || "Not set"} />
          <Metric label="Auth mode" value={staff.authMode} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {readinessItems.map((item) => (
          <article key={item.title} className="rounded-[1.5rem] bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-black text-[#101712]">{item.title}</h2>
              <span className="rounded-full bg-[#F2B84B]/20 px-3 py-1 text-xs font-black text-[#101712]">
                {item.status}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-[#1E2420]/70">{item.note}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-[#101712]">Pre-Vercel auth requirement</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#1E2420]/70">
          Before team testing on Vercel, the app should have proper staff login,
          recurring buyer login, role checks, and audit attribution backed by the
          production database/auth provider.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin/permissions"
            className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white"
          >
            View permissions
          </Link>
          <Link
            href="/admin/staff"
            className="rounded-full border border-[#101712]/10 px-5 py-3 text-sm font-bold text-[#101712]"
          >
            Staff records
          </Link>
        </div>
      </section>
    </main>
  );
}

function Metric({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-white/45">{label}</p>
      <p className="mt-2 break-words text-lg font-black text-[#F2B84B]">{value}</p>
    </div>
  );
}
