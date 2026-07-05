import AdminPageShell from "@/components/AdminPageShell";
import { getDbProducts } from "@/data/dbAdmin";
import { createProductAction, seedBaselineProductsAction, updateProductCatalogueStatusAction } from "@/actions/createAdminRecords";
import { produceGrades } from "@/constants/orderOptions";
import {productAvailabilityOptions, productCategoryOptions, productStatusOptions, productUnitOptions} from "@/lib/formOptions";

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
        <section className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
                Product catalogue
              </p>
              <h2 className="mt-3 text-2xl font-black">Baseline product list</h2>
              <p className="mt-2 max-w-4xl text-sm leading-7 text-[#405348]">
                Seed regular and seasonal products across vegetables, fruits, poultry, meat, fish, grains, seeds, tubers and spices.
                Existing matching products are skipped, so the action is safe to run more than once.
              </p>
            </div>

            <form action={seedBaselineProductsAction}>
              <button
                type="submit"
                className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
              >
                Seed baseline catalogue
              </button>
            </form>
          </div>
        </section>

        <form
          action={createProductAction}
          className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm"
        >
          <h2 className="text-2xl font-bold">Create product</h2>
          <p className="mt-2 text-sm text-[#405348]">
            Add produce items that admins can use when creating orders. Items marked unavailable or paused should be hidden from future client-facing product lists.
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
              <select
                name="category"
                defaultValue="Vegetables"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              >
                {productCategoryOptions.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Unit
              <select
                name="unit"
                defaultValue="kg"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              >
                {productUnitOptions.map((unit) => (
                  <option key={unit}>{unit}</option>
                ))}
              </select>
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
                {productAvailabilityOptions.map((availability) => (
                  <option key={availability}>{availability}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Status
              <select
                name="status"
                defaultValue="Active"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              >
                {productStatusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
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

        <div className="overflow-hidden rounded-3xl border border-[#102015]/10 bg-white">
          <table className="min-w-full divide-y divide-[#102015]/10 text-sm">
            <thead className="bg-[#f3f8ef] text-left text-xs uppercase tracking-[0.18em] text-[#405348]">
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

            <tbody className="divide-y divide-[#102015]/10">
              {products.map((product) => (
                <tr key={product.id} className="text-[#405348]">
                  <td className="px-5 py-4 font-semibold text-[#102015]">
                    {product.name}
                  </td>
                  <td className="px-5 py-4">{product.category}</td>
                  <td className="px-5 py-4">{product.unit}</td>
                  <td className="px-5 py-4">{product.grade}</td>
                  <td className="px-5 py-4">{formatNaira(product.basePrice)}</td>
                  <td className="px-5 py-4">
                    <form action={updateProductCatalogueStatusAction} className="grid gap-2">
                      <input type="hidden" name="productId" value={product.id} />
                      <select
                        name="availability"
                        defaultValue={product.availability}
                        className="rounded-xl border border-[#102015]/10 bg-white px-3 py-2 text-xs font-bold text-[#102015]"
                      >
                        {productAvailabilityOptions.map((availability) => (
                          <option key={availability}>{availability}</option>
                        ))}
                      </select>
                      <select
                        name="status"
                        defaultValue={product.status}
                        className="rounded-xl border border-[#102015]/10 bg-white px-3 py-2 text-xs font-bold text-[#102015]"
                      >
                        {productStatusOptions.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-full bg-[#1f7a3f] px-3 py-2 text-xs font-black text-white"
                      >
                        Update
                      </button>
                    </form>
                  </td>
                  <td className="px-5 py-4">{product.orderItems.length}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full border border-[#102015]/10 bg-white px-3 py-1 text-xs font-semibold text-[#405348]">
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
