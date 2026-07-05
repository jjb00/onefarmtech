import Link from "next/link";
import AdminPageShell from "@/components/AdminPageShell";
import {getPrelaunchChecks, type PrelaunchCheckStatus} from "@/lib/prelaunchChecks";

function badgeClass(status: PrelaunchCheckStatus) {
  if (status === "pass") {
    return "bg-[#3E7A4C]/10 text-[#3E7A4C]";
  }

  if (status === "warn") {
    return "bg-[#F2B84B]/20 text-[#102015]";
  }

  return "bg-[#C95F3D]/15 text-[#8f351c]";
}

function label(status: PrelaunchCheckStatus) {
  if (status === "pass") return "Pass";
  if (status === "warn") return "Needs attention";
  return "Blocked";
}

export default async function DeploymentReadinessPage() {
  const readiness = await getPrelaunchChecks();

  return (
    <AdminPageShell
      title="Deployment readiness"
      description="This page prevents accidental deployment assumptions. The app can keep progressing through controlled launch checks, but wider team testing should wait until database and authentication foundations are production-ready."
    >
      <div className="grid gap-6">
        <section className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
                Overall status
              </p>

              <h2 className="mt-2 text-3xl font-black text-[#102015]">
                {readiness.overallStatus === "fail"
                  ? "Blocked for deployment"
                  : readiness.overallStatus === "warn"
                    ? "Proceed with caution"
                    : "Ready for next review"}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#405348]">
                Local building can continue. Deployment should only happen after
                blocked items are resolved and Supabase/Postgres/auth are
                deliberately connected.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <Metric label="Pass" value={String(readiness.summary.pass)} />
              <Metric label="Warn" value={String(readiness.summary.warn)} />
              <Metric label="Blocked" value={String(readiness.summary.fail)} />
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          {readiness.checks.map((check) => (
            <article
              key={check.title}
              className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#102015]">
                    {check.title}
                  </h2>

                  <p className="mt-2 text-sm leading-7 text-[#405348]">
                    {check.detail}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${badgeClass(
                    check.status,
                  )}`}
                >
                  {label(check.status)}
                </span>
              </div>

              <div className="mt-4 rounded-2xl bg-[#f3f8ef] p-4 text-sm leading-7 text-[#405348]">
                <strong className="text-[#102015]">Recommendation:</strong>{" "}
                {check.recommendation}
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm">
          <h2 className="text-2xl font-black text-[#102015]">Next safe path</h2>

          <ol className="mt-5 grid gap-3 text-sm leading-7 text-[#405348]">
            <li>1. Continue controlled product/admin build while the database is stable.</li>
            <li>2. Reset the compromised Supabase database password.</li>
            <li>3. Create a dedicated Supabase migration branch.</li>
            <li>
              4. Keep Prisma on Postgres and test safely against
              Supabase.
            </li>
            <li>
              5. Replace temporary staff password gate with real staff/buyer auth.
            </li>
            <li>6. Only then deploy to Vercel for team testing.</li>
          </ol>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/admin/security"
              className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white"
            >
              Security status
            </Link>

            <Link
              href="/admin/permissions"
              className="rounded-full border border-[#102015]/10 bg-white px-5 py-3 text-sm font-bold text-[#102015]"
            >
              Permissions matrix
            </Link>
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}

function Metric({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-2xl border border-[#102015]/10 bg-[#f3f8ef] px-5 py-4">
      <p className="text-2xl font-black text-[#1f7a3f]">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#587063]">
        {label}
      </p>
    </div>
  );
}
