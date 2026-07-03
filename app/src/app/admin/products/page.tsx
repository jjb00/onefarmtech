import AdminPageShell from "@/components/AdminPageShell";
import { getDbProducts } from "@/data/dbAdmin";

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
    </AdminPageShell>
  );
}