import AdminPageShell from "@/components/AdminPageShell";
import { getDbComplaints } from "@/data/dbAdmin";

export default async function ComplaintsPage() {
  const complaints = await getDbComplaints();

  return (
    <AdminPageShell
      title="Complaints"
      description="Track buyer issues, priority, resolution status, and linked orders."
    >
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-[0.18em] text-white/45">
            <tr>
              <th className="px-5 py-4 font-semibold">Complaint</th>
              <th className="px-5 py-4 font-semibold">Order</th>
              <th className="px-5 py-4 font-semibold">Buyer</th>
              <th className="px-5 py-4 font-semibold">Issue</th>
              <th className="px-5 py-4 font-semibold">Priority</th>
              <th className="px-5 py-4 font-semibold">Resolution</th>
              <th className="px-5 py-4 font-semibold">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {complaints.map((complaint) => (
              <tr key={complaint.id} className="text-white/75">
                <td className="px-5 py-4 font-semibold text-white">{complaint.code}</td>
                <td className="px-5 py-4">{complaint.order.code}</td>
                <td className="px-5 py-4">{complaint.order.customer?.name || complaint.order.buyerName}</td>
                <td className="px-5 py-4">{complaint.issue}</td>
                <td className="px-5 py-4">{complaint.priority}</td>
                <td className="px-5 py-4">{complaint.resolution || "Not resolved yet"}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/70">
                    {complaint.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminPageShell>
  );
}
