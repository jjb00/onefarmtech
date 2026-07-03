import AdminPageShell from "@/components/AdminPageShell";
import { getDbPickupLocations } from "@/data/dbAdmin";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function PickupLocationsPage() {
  const pickupLocations = await getDbPickupLocations();

  return (
    <AdminPageShell
      title="Pickup locations"
      description="Manage manual pickup points, areas, fees, collection days, and status."
    >
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-[0.18em] text-white/45">
            <tr>
              <th className="px-5 py-4 font-semibold">Location</th>
              <th className="px-5 py-4 font-semibold">Area</th>
              <th className="px-5 py-4 font-semibold">Address</th>
              <th className="px-5 py-4 font-semibold">Fee</th>
              <th className="px-5 py-4 font-semibold">Days</th>
              <th className="px-5 py-4 font-semibold">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {pickupLocations.map((location) => (
              <tr key={location.id} className="text-white/75">
                <td className="px-5 py-4 font-semibold text-white">{location.name}</td>
                <td className="px-5 py-4">{location.area}</td>
                <td className="px-5 py-4">{location.address}</td>
                <td className="px-5 py-4">{formatNaira(location.fee)}</td>
                <td className="px-5 py-4">{location.days}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/70">
                    {location.status}
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
