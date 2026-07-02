import AdminPageShell from "@/components/AdminPageShell";
import { mockPickupLocations, opsBadgeClass } from "@/data/mockOperations";

export default function Page() {
  return (
    <AdminPageShell
      title="Pickup locations"
      description="Manage collection points, office pickup, weekend pickup partners, handling fees, active days, and location status."
      actionLabel="Add pickup point"
    >
      <section className="mt-10 rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Pickup locations table</h2>
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
                  <th className="px-4 py-2">Name</th>\n                  <th className="px-4 py-2">Area</th>\n                  <th className="px-4 py-2">Address</th>\n                  <th className="px-4 py-2">Fee</th>\n                  <th className="px-4 py-2">Days</th>\n                  <th className="px-4 py-2">Status</th>
              </tr>
            </thead>

            <tbody>
              {mockPickupLocations.map((item, index) => (
                <tr key={index} className="rounded-2xl bg-[#f7f5ec]">
                  <td className="rounded-l-2xl px-4 py-4 font-bold">{item.name}</td>\n                  <td className="px-4 py-4">{item.area}</td>\n                  <td className="px-4 py-4">{item.address}</td>\n                  <td className="px-4 py-4">{item.fee}</td>\n                  <td className="px-4 py-4">{item.days}</td>\n                  <td className="rounded-r-2xl px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${opsBadgeClass(item.status)}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminPageShell>
  );
}
