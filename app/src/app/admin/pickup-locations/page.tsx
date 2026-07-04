import AdminPageShell from "@/components/AdminPageShell";
import { getDbPickupLocations } from "@/data/dbAdmin";
import { createPickupLocationAction } from "@/actions/orderOperations";

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
      <div className="grid gap-8">
        <form
          action={createPickupLocationAction}
          className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm"
        >
          <h2 className="text-2xl font-bold">Create pickup location</h2>
          <p className="mt-2 text-sm text-[#405348]">
            Add manual pickup points before delivery-zone automation is added.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Location name
              <input
                name="name"
                required
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="e.g. Yaba Collection Point"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Area
              <input
                name="area"
                required
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="e.g. Yaba"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold md:col-span-2">
              Address
              <input
                name="address"
                required
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="Full pickup address"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Pickup fee
              <input
                name="fee"
                type="number"
                min="0"
                defaultValue="0"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Pickup days
              <input
                name="days"
                defaultValue="Saturday"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="e.g. Saturdays, Wednesdays"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Status
              <select
                name="status"
                defaultValue="Active"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              >
                <option>Active</option>
                <option>Limited</option>
                <option>Paused</option>
              </select>
            </label>
          </div>

          <button
            type="submit"
            className="mt-6 rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#155c2f]"
          >
            Save pickup location
          </button>
        </form>

        <div className="overflow-hidden rounded-3xl border border-[#102015]/10 bg-white">
          <table className="min-w-full divide-y divide-[#102015]/10 text-sm">
            <thead className="bg-[#f3f8ef] text-left text-xs uppercase tracking-[0.18em] text-[#405348]">
              <tr>
                <th className="px-5 py-4 font-semibold">Location</th>
                <th className="px-5 py-4 font-semibold">Area</th>
                <th className="px-5 py-4 font-semibold">Address</th>
                <th className="px-5 py-4 font-semibold">Fee</th>
                <th className="px-5 py-4 font-semibold">Days</th>
                <th className="px-5 py-4 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#102015]/10">
              {pickupLocations.map((location) => (
                <tr key={location.id} className="text-[#405348]">
                  <td className="px-5 py-4 font-semibold text-[#102015]">
                    {location.name}
                  </td>
                  <td className="px-5 py-4">{location.area}</td>
                  <td className="px-5 py-4">{location.address}</td>
                  <td className="px-5 py-4">{formatNaira(location.fee)}</td>
                  <td className="px-5 py-4">{location.days}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full border border-[#102015]/10 bg-white px-3 py-1 text-xs font-semibold text-[#405348]">
                      {location.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageShell>
  );
}
