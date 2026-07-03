import {prisma} from "@/lib/prisma";

export default async function AuditLogPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: {createdAt: "desc"},
    take: 75,
  });

  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C95F3D]">
          Control centre
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#101712]">Audit log</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[#1E2420]/70">
          Tracks important backend actions so admin, operations, finance, and support
          work can be reviewed before the platform goes live.
        </p>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-[#101712]/10 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#101712] text-white">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Record</th>
              <th className="px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-[#101712]/10">
                <td className="px-4 py-3 text-[#1E2420]/70">
                  {log.createdAt.toLocaleString()}
                </td>
                <td className="px-4 py-3 font-bold">{log.actorName}</td>
                <td className="px-4 py-3">{log.action}</td>
                <td className="px-4 py-3">
                  <span className="font-bold">{log.entityType}</span>
                  {log.entityLabel ? (
                    <span className="text-[#1E2420]/60"> · {log.entityLabel}</span>
                  ) : null}
                </td>
                <td className="px-4 py-3">{log.actorRole}</td>
              </tr>
            ))}

            {!logs.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-[#1E2420]/60" colSpan={5}>
                  No audit events recorded yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
