import AdminPageShell from "@/components/AdminPageShell";
import {
  AdminCompactMetric,
  AdminStatusPill,
  AdminViewBar,
  adminToneFromStatus,
} from "@/components/admin/AdminViewControls";
import { getDbSuppliers } from "@/data/dbAdmin";
import { createSupplierAction } from "@/actions/createAdminRecords";

type SuppliersPageProps = {
  searchParams?: Promise<{
    status?: string;
    sort?: string;
  }>;
};

function hrefFor(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `/admin/suppliers?${query}` : "/admin/suppliers";
}

export default async function SuppliersPage({searchParams}: SuppliersPageProps) {
  const params = await searchParams;
  const status = params?.status || "all";
  const sort = params?.sort || "name";
  const suppliers = await getDbSuppliers();

  const filtered = suppliers.filter((supplier) => {
    if (status === "all") return true;
    return `${supplier.status} ${supplier.reliability} ${supplier.type}`.toLowerCase().includes(status);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "reliability") return String(a.reliability).localeCompare(String(b.reliability));
    if (sort === "status") return String(a.status).localeCompare(String(b.status));
    return String(a.name).localeCompare(String(b.name));
  });

  const activeCount = suppliers.filter((supplier) => supplier.status === "Active").length;
  const reviewCount = suppliers.filter((supplier) => `${supplier.status} ${supplier.reliability}`.toLowerCase().includes("review")).length;
  const base = {status, sort};

  return (
    <AdminPageShell
      title="Suppliers"
      description="Track farms, aggregators, produce focus, reliability, and payment methods."
    >
      <div className="grid gap-5">
        <section className="grid gap-3 md:grid-cols-3">
          <AdminCompactMetric label="Suppliers" value={String(suppliers.length)} tone="blue" />
          <AdminCompactMetric label="Active" value={String(activeCount)} tone="green" />
          <AdminCompactMetric label="Needs review" value={String(reviewCount)} tone="amber" />
        </section>

        <AdminViewBar
          title="Supplier controls"
          description={`${sorted.length} supplier${sorted.length === 1 ? "" : "s"} shown.`}
          filterOptions={[
            {label: "All", href: hrefFor({...base, status: "all"}), active: status === "all"},
            {label: "Active", href: hrefFor({...base, status: "active"}), active: status === "active"},
            {label: "Review", href: hrefFor({...base, status: "review"}), active: status === "review"},
            {label: "Paused", href: hrefFor({...base, status: "paused"}), active: status === "paused"},
            {label: "Farm", href: hrefFor({...base, status: "farm"}), active: status === "farm"},
          ]}
          sortOptions={[
            {label: "Name", href: hrefFor({...base, sort: "name"}), active: sort === "name"},
            {label: "Reliability", href: hrefFor({...base, sort: "reliability"}), active: sort === "reliability"},
            {label: "Status", href: hrefFor({...base, sort: "status"}), active: sort === "status"},
          ]}
        />

        <details className="rounded-2xl border border-[#102015]/10 bg-white p-4 text-[#102015] shadow-sm">
          <summary className="cursor-pointer list-none">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black">Create supplier</h2>
              <span className="rounded-full bg-[#f3f8ef] px-4 py-2 text-sm font-black text-[#1f7a3f]">Open</span>
            </div>
          </summary>

        <form
          action={createSupplierAction}
          className="mt-5"
        >

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
        </details>

        <div className="overflow-hidden rounded-2xl border border-[#102015]/10 bg-white shadow-sm">
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
              {sorted.map((supplier) => (
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
                    <AdminStatusPill tone={adminToneFromStatus(supplier.status)}>
                      {supplier.status}
                    </AdminStatusPill>
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
