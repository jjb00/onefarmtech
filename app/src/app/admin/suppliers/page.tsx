import AdminPageShell from "@/components/AdminPageShell";
import { getDbSuppliers } from "@/data/dbAdmin";

export default async function SuppliersPage() {
  const suppliers = await getDbSuppliers();

  return (
    <AdminPageShell
      title="Suppliers"
      description="Track farms, aggregators, produce focus, reliability, and payment methods."
    >
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-[0.18em] text-white/45">
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

          <tbody className="divide-y divide-white/10">
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="text-white/75">
                <td className="px-5 py-4 font-semibold text-white">
                  {supplier.name}
                </td>
                <td className="px-5 py-4">{supplier.type}</td>
                <td className="px-5 py-4">{supplier.phone || "No phone yet"}</td>
                <td className="px-5 py-4">{supplier.location}</td>
                <td className="px-5 py-4">{supplier.produceFocus}</td>
                <td className="px-5 py-4">{supplier.reliability}</td>
                <td className="px-5 py-4">{supplier.paymentMethod}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/70">
                    {supplier.status}
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