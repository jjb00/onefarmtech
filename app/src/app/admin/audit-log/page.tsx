import Link from "next/link";
import AdminPageShell from "@/components/AdminPageShell";
import {prisma} from "@/lib/prisma";

export default async function AuditLogPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: {createdAt: "desc"},
    take: 75,
  });

  return (
    <AdminPageShell
      title="Audit log"
      description="Tracks important backend actions so admin, operations, finance, and support work can be reviewed before the platform goes live."
    >
      <div className="overflow-hidden rounded-[2rem] border border-[#102015]/10 bg-white text-[#102015] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-[#f3f8ef] text-[#405348]">
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
                <tr key={log.id} className="border-t border-[#102015]/10">
                  <td className="px-4 py-3 text-[#405348]">
                    {log.createdAt.toLocaleString()}
                  </td>

                  <td className="px-4 py-3 font-bold text-[#102015]">
                    {log.actorName}
                  </td>

                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/audit-log/${log.id}`}
                      className="font-bold text-[#1f7a3f] underline-offset-4 hover:underline"
                    >
                      {log.action}
                    </Link>
                  </td>

                  <td className="px-4 py-3 text-[#102015]">
                    <span className="font-bold">{log.entityType}</span>
                    {log.entityLabel ? (
                      <span className="text-[#587063]"> · {log.entityLabel}</span>
                    ) : null}
                  </td>

                  <td className="px-4 py-3 text-[#405348]">{log.actorRole}</td>
                </tr>
              ))}

              {!logs.length ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[#587063]" colSpan={5}>
                    No audit events recorded yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageShell>
  );
}
