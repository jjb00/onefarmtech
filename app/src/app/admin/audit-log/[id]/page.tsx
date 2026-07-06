import Link from "next/link";
import {notFound} from "next/navigation";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AuditLogDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function prettyJson(value: string | null) {
  if (!value) {
    return "None";
  }

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

export default async function AuditLogDetailPage({params}: AuditLogDetailPageProps) {
  const {id} = await params;

  const log = await prisma.auditLog.findUnique({
    where: {id},
  });

  if (!log) {
    notFound();
  }

  return (
    <main className="space-y-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C95F3D]">
          Audit event
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#101712]">{log.action}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[#1E2420]/70">
          Detailed backend action record for operational accountability.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/audit-log"
          className="rounded-full border border-[#101712]/10 px-5 py-3 text-sm font-bold text-[#101712]"
        >
          Back to audit log
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <InfoCard
          title="Actor"
          rows={[
            ["Name", log.actorName],
            ["Email", log.actorEmail || "Not set"],
            ["Role", log.actorRole],
            ["Time", log.createdAt.toLocaleString()],
          ]}
        />

        <InfoCard
          title="Record"
          rows={[
            ["Entity type", log.entityType],
            ["Entity label", log.entityLabel || "Not set"],
            ["Entity id", log.entityId || "Not set"],
            ["Action", log.action],
          ]}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <JsonPanel title="Previous value" value={prettyJson(log.previousValue)} />
        <JsonPanel title="New value" value={prettyJson(log.newValue)} />
        <JsonPanel title="Metadata" value={prettyJson(log.metadata)} />
      </section>
    </main>
  );
}

function InfoCard({title, rows}: {title: string; rows: [string, string][]}) {
  return (
    <section className="rounded-[1.5rem] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-[#101712]">{title}</h2>
      <div className="mt-5 grid gap-3">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 border-b border-[#101712]/10 pb-3"
          >
            <span className="text-sm font-semibold text-[#1E2420]/55">{label}</span>
            <span className="text-right text-sm font-black text-[#101712]">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function JsonPanel({title, value}: {title: string; value: string}) {
  return (
    <section className="rounded-[1.5rem] bg-white p-5 text-[#102015] shadow-sm">
      <h2 className="text-lg font-black text-[#1f7a3f]">{title}</h2>
      <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl bg-[#102015] p-4 text-xs leading-6 text-white/80">
        {value}
      </pre>
    </section>
  );
}
