import Link from "next/link";
import AdminPageShell from "@/components/AdminPageShell";
import {requireStaffRole} from "@/lib/auth";

const readinessItems = [
  {
    title: "Named staff authentication",
    status: "Active",
    note: "Each active staff identity uses an individually configured server-side password hash.",
  },
  {
    title: "Staff role records",
    status: "Authoritative",
    note: "The active database record supplies the staff identity and assigned role.",
  },
  {
    title: "Audit attribution",
    status: "Authoritative",
    note: "Audit logs use the authenticated database identity rather than submitted actor fields.",
  },
  {
    title: "Buyer login",
    status: "Not active",
    note: "Recurring buyer login is planned, but no fake access is exposed.",
  },
  {
    title: "Action authorization",
    status: "Active",
    note: "Sensitive server actions enforce assigned capabilities independently of page visibility.",
  },
];

export default async function SecurityPage() {
  const staff = await requireStaffRole("Super admin");

  return (
    <AdminPageShell
      title="Auth and access status"
      description="Security readiness for staff access, buyer accounts, audit attribution, and the move from local testing to proper production authentication."
    >
      <div className="grid gap-6">
        <section className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
            Current staff session
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
            <article
              key={item.title}
              className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-black text-[#102015]">
                  {item.title}
                </h2>

                <span className="shrink-0 rounded-full bg-[#F2B84B]/20 px-3 py-1 text-xs font-black text-[#102015]">
                  {item.status}
                </span>
              </div>

              <p className="mt-3 text-sm leading-7 text-[#405348]">
                {item.note}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm">
          <h2 className="text-2xl font-black text-[#102015]">
            Access maintenance
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#405348]">
            Keep staff records active only while access is required, rotate individual
            credential hashes securely, and review audit events after role changes.
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
              className="rounded-full border border-[#102015]/10 bg-white px-5 py-3 text-sm font-bold text-[#102015]"
            >
              Staff records
            </Link>
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}

function Metric({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-2xl border border-[#102015]/10 bg-[#f3f8ef] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#587063]">
        {label}
      </p>
      <p className="mt-2 break-words text-lg font-black text-[#1f7a3f]">
        {value}
      </p>
    </div>
  );
}
