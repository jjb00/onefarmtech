import AdminPageShell from "@/components/AdminPageShell";
import {
  AdminCompactMetric,
  AdminStatusPill,
  AdminViewBar,
  adminToneFromStatus,
} from "@/components/admin/AdminViewControls";
import { getDbProducts } from "@/data/dbAdmin";
import {
  createProductAction,
  seedBaselineProductsAction,
  updateProductDetailsAction,
} from "@/actions/createAdminRecords";
import { produceGrades } from "@/constants/orderOptions";
import {
  productAvailabilityOptions,
  productCategoryOptions,
  productStatusOptions,
  productUnitOptions,
} from "@/lib/formOptions";

type ProductsPageProps = {
  searchParams?: Promise<{
    status?: string;
    category?: string;
    sort?: string;
  }>;
};

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function hrefFor(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }

  const query = search.toString();
  return query ? `/admin/products?${query}` : "/admin/products";
}

export default async function ProductsPage({searchParams}: ProductsPageProps) {
  const params = await searchParams;
  const status = params?.status || "all";
  const category = params?.category || "all";
  const sort = params?.sort || "name";

  const products = await getDbProducts();

  const activeProducts = products.filter((product) => product.status === "Active");
  const availableProducts = products.filter((product) => product.availability === "Available");
  const unavailableProducts = products.filter(
    (product) => product.availability !== "Available" || product.status !== "Active",
  );

  const filtered = products.filter((product) => {
    const statusMatch =
      status === "all" ||
      `${product.status} ${product.availability}`.toLowerCase().includes(status);

    const categoryMatch = category === "all" || product.category === category;

    return statusMatch && categoryMatch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "price-high") return b.basePrice - a.basePrice;
    if (sort === "price-low") return a.basePrice - b.basePrice;
    if (sort === "orders") return b.orderItems.length - a.orderItems.length;
    return a.name.localeCompare(b.name);
  });

  const base = {status, category, sort};

  return (
    <AdminPageShell
      title="Products"
      description="Catalogue, prices, grades and availability."
    >
      <div className="grid gap-5">
        <section className="grid gap-3 md:grid-cols-4">
          <AdminCompactMetric label="Products" value={String(products.length)} tone="blue" />
          <AdminCompactMetric label="Active" value={String(activeProducts.length)} tone="green" href={hrefFor({...base, status: "active"})} />
          <AdminCompactMetric label="Available" value={String(availableProducts.length)} tone="green" href={hrefFor({...base, status: "available"})} />
          <AdminCompactMetric label="Unavailable / paused" value={String(unavailableProducts.length)} tone="amber" href={hrefFor({...base, status: "unavailable"})} />
        </section>

        <AdminViewBar
          title="Product controls"
          description={`${sorted.length} product${sorted.length === 1 ? "" : "s"} shown.`}
          filterOptions={[
            {label: "All", href: hrefFor({...base, status: "all"}), active: status === "all"},
            {label: "Active", href: hrefFor({...base, status: "active"}), active: status === "active"},
            {label: "Available", href: hrefFor({...base, status: "available"}), active: status === "available"},
            {label: "Unavailable", href: hrefFor({...base, status: "unavailable"}), active: status === "unavailable"},
            {label: "Paused", href: hrefFor({...base, status: "paused"}), active: status === "paused"},
          ]}
          sortOptions={[
            {label: "Name", href: hrefFor({...base, sort: "name"}), active: sort === "name"},
            {label: "Price high", href: hrefFor({...base, sort: "price-high"}), active: sort === "price-high"},
            {label: "Price low", href: hrefFor({...base, sort: "price-low"}), active: sort === "price-low"},
            {label: "Orders", href: hrefFor({...base, sort: "orders"}), active: sort === "orders"},
          ]}
        >
          <div className="flex flex-wrap gap-2">
            <a
              href={hrefFor({...base, category: "all"})}
              className={`rounded-full px-3 py-1.5 text-xs font-black ${
                category === "all"
                  ? "bg-[#102015] text-white"
                  : "border border-[#102015]/10 bg-[#f7f5ec] text-[#102015] hover:bg-[#eef6ea]"
              }`}
            >
              All categories
            </a>
            {productCategoryOptions.map((option) => (
              <a
                key={option}
                href={hrefFor({...base, category: option})}
                className={`rounded-full px-3 py-1.5 text-xs font-black ${
                  category === option
                    ? "bg-[#102015] text-white"
                    : "border border-[#102015]/10 bg-[#f7f5ec] text-[#102015] hover:bg-[#eef6ea]"
                }`}
              >
                {option}
              </a>
            ))}
          </div>
        </AdminViewBar>

        <details className="rounded-2xl border border-[#102015]/10 bg-white p-4 text-[#102015] shadow-sm">
          <summary className="cursor-pointer list-none">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black">Add product</h2>
              <span className="rounded-full bg-[#f3f8ef] px-4 py-2 text-sm font-black text-[#1f7a3f]">
                Open
              </span>
            </div>
          </summary>

          <div className="mt-5 flex flex-wrap gap-3">
            <form action={seedBaselineProductsAction}>
              <button
                type="submit"
                className="rounded-full border border-[#102015]/10 bg-[#fbfff8] px-4 py-2 text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
              >
                Seed baseline catalogue
              </button>
            </form>
          </div>

          <form action={createProductAction} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Product name
              <input name="name" required className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]" placeholder="e.g. Tomatoes" />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Category
              <select name="category" defaultValue="Vegetables" className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]">
                {productCategoryOptions.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Unit
              <select name="unit" defaultValue="kg" className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]">
                {productUnitOptions.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Grade
              <select name="grade" defaultValue="Standard" className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]">
                {produceGrades.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Base price
              <input name="basePrice" type="number" min="0" defaultValue="0" className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]" />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Availability
              <select name="availability" defaultValue="Available" className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]">
                {productAvailabilityOptions.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Status
              <select name="status" defaultValue="Active" className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]">
                {productStatusOptions.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            <div className="md:col-span-2">
              <button type="submit" className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white hover:bg-[#155c2f]">
                Save product
              </button>
            </div>
          </form>
        </details>

        <section className="hidden overflow-hidden rounded-2xl border border-[#102015]/10 bg-white shadow-sm md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
              <thead className="bg-[#f3f8ef] text-xs uppercase tracking-[0.14em] text-[#405348]">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Grade</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Availability</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Edit</th>
                </tr>
              </thead>

              <tbody>
                {sorted.map((product) => (
                  <tr key={product.id} className="border-t border-[#102015]/10 align-top text-[#405348]">
                    <td className="px-4 py-3 font-black text-[#102015]">{product.name}</td>
                    <td className="px-4 py-3">{product.category}</td>
                    <td className="px-4 py-3">{product.unit}</td>
                    <td className="px-4 py-3">{product.grade}</td>
                    <td className="px-4 py-3 font-black text-[#102015]">{formatNaira(product.basePrice)}</td>
                    <td className="px-4 py-3">
                      <AdminStatusPill tone={adminToneFromStatus(`${product.availability} ${product.status}`)}>
                        {product.availability} · {product.status}
                      </AdminStatusPill>
                    </td>
                    <td className="px-4 py-3">{product.orderItems.length}</td>
                    <td className="px-4 py-3">
                      <ProductEditForm product={product} />
                    </td>
                  </tr>
                ))}

                {!sorted.length ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-[#587063]" colSpan={8}>
                      No products match this view.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-3 md:hidden">
          {sorted.map((product) => (
            <article key={product.id} className="rounded-2xl border border-[#102015]/10 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-black text-[#102015]">{product.name}</h2>
                  <p className="mt-1 text-sm text-[#405348]">
                    {product.category} · {product.grade} · {product.unit}
                  </p>
                  <p className="mt-2 text-lg font-black text-[#102015]">
                    {formatNaira(product.basePrice)}
                  </p>
                </div>
                <AdminStatusPill tone={adminToneFromStatus(`${product.availability} ${product.status}`)}>
                  {product.availability}
                </AdminStatusPill>
              </div>
              <div className="mt-3">
                <ProductEditForm product={product} />
              </div>
            </article>
          ))}

          {!sorted.length ? (
            <p className="rounded-2xl bg-white p-5 text-center text-sm font-semibold text-[#587063]">
              No products match this view.
            </p>
          ) : null}
        </section>
      </div>
    </AdminPageShell>
  );
}

function ProductEditForm({product}: {product: any}) {
  return (
    <details className="rounded-xl border border-[#102015]/10 bg-[#fbfff8] p-3">
      <summary className="cursor-pointer text-xs font-black text-[#1f7a3f]">Edit</summary>

      <form action={updateProductDetailsAction} className="mt-3 grid min-w-[18rem] gap-3">
        <input type="hidden" name="productId" value={product.id} />

        <input name="name" required defaultValue={product.name} className="rounded-xl border border-[#102015]/15 bg-white px-3 py-2 text-sm text-[#102015]" />

        <select name="category" defaultValue={product.category} className="rounded-xl border border-[#102015]/15 bg-white px-3 py-2 text-sm text-[#102015]">
          {productCategoryOptions.map((item) => <option key={item}>{item}</option>)}
        </select>

        <div className="grid gap-2 sm:grid-cols-2">
          <select name="unit" defaultValue={product.unit} className="rounded-xl border border-[#102015]/15 bg-white px-3 py-2 text-sm text-[#102015]">
            {productUnitOptions.map((item) => <option key={item}>{item}</option>)}
          </select>

          <select name="grade" defaultValue={product.grade} className="rounded-xl border border-[#102015]/15 bg-white px-3 py-2 text-sm text-[#102015]">
            {produceGrades.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>

        <input name="basePrice" type="number" min="0" defaultValue={String(product.basePrice)} className="rounded-xl border border-[#102015]/15 bg-white px-3 py-2 text-sm text-[#102015]" />

        <div className="grid gap-2 sm:grid-cols-2">
          <select name="availability" defaultValue={product.availability} className="rounded-xl border border-[#102015]/15 bg-white px-3 py-2 text-sm text-[#102015]">
            {productAvailabilityOptions.map((item) => <option key={item}>{item}</option>)}
          </select>

          <select name="status" defaultValue={product.status} className="rounded-xl border border-[#102015]/15 bg-white px-3 py-2 text-sm text-[#102015]">
            {productStatusOptions.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>

        <button type="submit" className="rounded-full bg-[#1f7a3f] px-4 py-2 text-xs font-black text-white">
          Save
        </button>
      </form>
    </details>
  );
}
