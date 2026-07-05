import AdminPageShell from "@/components/AdminPageShell";
import { getDbSuppliers } from "@/data/dbAdmin";
import { createSupplierAction } from "@/actions/createAdminRecords";

export default async function SuppliersPage() {
  const suppliers = await getDbSuppliers();

  return (
    <AdminPageShell
      title="Suppliers"
      description="Track farms, aggregators, produce focus, reliability, and payment methods."
    >
      <div className="grid gap-8">
        <form
          action={createSupplierAction}
          className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm"
        >
          <h2 className="text-2xl font-bold">Create supplier</h2>
          <p className="mt-2 text-sm text-[#405348]">
            Add farms, aggregators, cooperatives, and supply partners for fresh food operations.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Supplier name
              <input
                name="name"
                required
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="e.g. Oyo Fresh Produce Aggregator"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Type
              <select
                name="type"
                defaultValue="Aggregator"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              >
                <option>Aggregator</option>
                <option>Farm</option>
                <option>Cooperative</option>
                <option>Processor</option>
                <option>Logistics partner</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Phone
              <input
                name="phone"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="+234..."
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Location
              <input
                name="location"
                required
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="e.g. Ibadan, Oyo"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Produce focus
              <input
                name="produceFocus"
                required
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="e.g. Vegetables, grains, tubers"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Reliability
              <select
                name="reliability"
                defaultValue="Unrated"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              >
                <option>Unrated</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
                <option>Needs review</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Payment method
              <select
                name="paymentMethod"
                defaultValue="Bank transfer"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              >
                <option>Bank transfer</option>
                <option>Cash on pickup</option>
                <option>Mobile money</option>
                <option>Wallet</option>
                <option>Invoice</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Status
              <select
                name="status"
                defaultValue="Active"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              >
                <option>Active</option>
                <option>Needs review</option>
                <option>Paused</option>
              </select>
            </label>
          </div>

          <button
            type="submit"
            className="mt-6 rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#155c2f]"
          >
            Save supplier
          </button>
        </form>

        <div className="overflow-hidden rounded-3xl border border-[#102015]/10 bg-white">
          <table className="min-w-full divide-y divide-[#102015]/10 text-sm">
            <thead className="bg-[#f3f8ef] text-left text-xs uppercase tracking-[0.18em] text-[#405348]">
              <tr>
                <th className="px-5 py-4 font-semibold">Supplier</th>
                <th className="px-5 py-4 font-semibold">Type</th>
                <th className="px-5 py-4 font-semibold">Phone</th>
                <th className="px-5 py-4 font-semibold">Location</th>
                <th className="px-5 py-4 font-semibold">Produce focus</th>
                <th className="px-5 py-4 font-semibold">Reliability</th>
                <th className="px-5 py-4 font-semibold">Payment method</th>
                <th className="px-5 py-4 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#102015]/10">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="text-[#405348]">
                  <td className="px-5 py-4 font-semibold text-[#102015]">
                    {supplier.name}
                  </td>
                  <td className="px-5 py-4">{supplier.type}</td>
                  <td className="px-5 py-4">{supplier.phone || "No phone yet"}</td>
                  <td className="px-5 py-4">{supplier.location}</td>
                  <td className="px-5 py-4">{supplier.produceFocus}</td>
                  <td className="px-5 py-4">{supplier.reliability}</td>
                  <td className="px-5 py-4">{supplier.paymentMethod}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full border border-[#102015]/10 bg-white px-3 py-1 text-xs font-semibold text-[#405348]">
                      {supplier.status}
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
