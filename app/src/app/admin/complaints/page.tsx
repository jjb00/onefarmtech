import AdminPageShell from "@/components/AdminPageShell";
import { getDbComplaints } from "@/data/dbAdmin";

export default async function ComplaintsPage() {
  const complaints = await getDbComplaints();

  return (
    <AdminPageShell
      title="Complaints"
      description="Track buyer issues, priority, resolution status, and linked orders."
    >
      <div className="overflow-hidden rounded-3xl border border-[#102015]/10 bg-white">
        <table className="min-w-full divide-y divide-[#102015]/10 text-sm">
          <thead className="bg-[#f3f8ef] text-left text-xs uppercase tracking-[0.18em] text-[#405348]">
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

          <tbody className="divide-y divide-[#102015]/10">
            {complaints.map((complaint) => (
              <tr key={complaint.id} className="text-[#405348]">
                <td className="px-5 py-4 font-semibold text-[#102015]">{complaint.code}</td>
                <td className="px-5 py-4">{complaint.order.code}</td>
                <td className="px-5 py-4">{complaint.order.customer?.name || complaint.order.buyerName}</td>
                <td className="px-5 py-4">{complaint.issue}</td>
                <td className="px-5 py-4">{complaint.priority}</td>
                <td className="px-5 py-4">{complaint.resolution || "Not resolved yet"}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full border border-[#102015]/10 bg-white px-3 py-1 text-xs font-semibold text-[#405348]">
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
