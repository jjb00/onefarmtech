import AdminPageShell from "@/components/AdminPageShell";
import { getDbProducts } from "@/data/dbAdmin";
import { createProductAction } from "@/actions/createAdminRecords";
import { produceGrades } from "@/constants/orderOptions";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function ProductsPage() {
  const products = await getDbProducts();

  return (
    <AdminPageShell
      title="Products"
      description="Manage produce, pricing, grades, availability, and internal procurement catalogue."
    >
      <div className="grid gap-8">
        <form
          action={createProductAction}
          className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm"
        >
          <h2 className="text-2xl font-bold">Create product</h2>
          <p className="mt-2 text-sm text-[#405348]">
            Add produce items that admins can use when creating orders.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Product name
              <input
                name="name"
                required
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="e.g. Tomatoes"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Category
              <input
                name="category"
                defaultValue="Fresh produce"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Unit
              <input
                name="unit"
                defaultValue="kg"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Grade
              <select
                name="grade"
                defaultValue="Standard"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              >
                {produceGrades.map((grade) => (
                  <option key={grade}>{grade}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Base price
              <input
                name="basePrice"
                type="number"
                min="0"
                defaultValue="0"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Availability
              <select
                name="availability"
                defaultValue="Available"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              >
                <option>Available</option>
                <option>Limited</option>
                <option>Seasonal</option>
                <option>Unavailable</option>
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
                <option>Paused</option>
                <option>Archived</option>
              </select>
            </label>
          </div>

          <button
            type="submit"
            className="mt-6 rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#155c2f]"
          >
            Save product
          </button>
        </form>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-[0.18em] text-white/45">
              <tr>
                <th className="px-5 py-4 font-semibold">Product</th>
                <th className="px-5 py-4 font-semibold">Category</th>
                <th className="px-5 py-4 font-semibold">Unit</th>
                <th className="px-5 py-4 font-semibold">Grade</th>
                <th className="px-5 py-4 font-semibold">Base price</th>
                <th className="px-5 py-4 font-semibold">Availability</th>
                <th className="px-5 py-4 font-semibold">Orders</th>
                <th className="px-5 py-4 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {products.map((product) => (
                <tr key={product.id} className="text-white/75">
                  <td className="px-5 py-4 font-semibold text-white">
                    {product.name}
                  </td>
                  <td className="px-5 py-4">{product.category}</td>
                  <td className="px-5 py-4">{product.unit}</td>
                  <td className="px-5 py-4">{product.grade}</td>
                  <td className="px-5 py-4">{formatNaira(product.basePrice)}</td>
                  <td className="px-5 py-4">{product.availability}</td>
                  <td className="px-5 py-4">{product.orderItems.length}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/70">
                      {product.status}
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
