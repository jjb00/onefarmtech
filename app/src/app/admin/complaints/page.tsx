import AdminPageShell from "@/components/AdminPageShell";
import { mockComplaints, opsBadgeClass } from "@/data/mockOperations";

export default function Page() {
  return (
    <AdminPageShell
      title="Complaints"
      description="Manage quality complaints, delivery issues, refund requests, buyer disputes, and resolution notes."
      actionLabel="Log complaint"
    >
      <section className="mt-10 rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Complaints table</h2>
            <p className="mt-2 text-sm text-[#405348]">
              MVP mock data. Later this will connect to database records and admin actions.
            </p>
          </div>

          <div className="rounded-full bg-[#f7f5ec] px-4 py-2 text-sm font-semibold text-[#405348]">
            Mock admin module
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-y-3 text-left text-sm">
            <thead>
              <tr className="text-[#405348]">
                  <th className="px-4 py-2">Code</th>\n                  <th className="px-4 py-2">Order</th>\n                  <th className="px-4 py-2">Buyer</th>\n                  <th className="px-4 py-2">Issue</th>\n                  <th className="px-4 py-2">Priority</th>\n                  <th className="px-4 py-2">Status</th>\n                  <th className="px-4 py-2">Resolution</th>
              </tr>
            </thead>

            <tbody>
              {mockComplaints.map((item, index) => (
                <tr key={index} className="rounded-2xl bg-[#f7f5ec]">
                  <td className="rounded-l-2xl px-4 py-4 font-bold">{item.code}</td>\n                  <td className="px-4 py-4">{item.order}</td>\n                  <td className="px-4 py-4">{item.buyer}</td>\n                  <td className="px-4 py-4">{item.issue}</td>\n                  <td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${opsBadgeClass(item.priority)}`}>{item.priority}</span></td>\n                  <td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${opsBadgeClass(item.status)}`}>{item.status}</span></td>\n                  <td className="rounded-r-2xl px-4 py-4">{item.resolution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminPageShell>
  );
}
