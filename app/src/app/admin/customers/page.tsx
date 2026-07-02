import AdminPageShell from "@/components/AdminPageShell";
import { getDbCustomers } from "@/data/dbAdmin";

export default async function CustomersPage() {
  const customers = await getDbCustomers();

  return (
    <AdminPageShell
      title="Customers"
      description="View buyer accounts, order history, and customer readiness for WhatsApp-first procurement."
    >
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-[0.18em] text-white/45">
            <tr>
              <th className="px-5 py-4 font-semibold">Customer</th>
              <th className="px-5 py-4 font-semibold">Phone</th>
              <th className="px-5 py-4 font-semibold">Buyer type</th>
              <th className="px-5 py-4 font-semibold">Location</th>
              <th className="px-5 py-4 font-semibold">Payment terms</th>
              <th className="px-5 py-4 font-semibold">Orders</th>
              <th className="px-5 py-4 font-semibold">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {customers.map((customer) => (
              <tr key={customer.id} className="text-white/75">
                <td className="px-5 py-4">
                  <div className="font-semibold text-white">{customer.name}</div>
                  <div className="text-xs text-white/45">
                    {customer.email || "No email yet"}
                  </div>
                </td>
                <td className="px-5 py-4">{customer.phone}</td>
                <td className="px-5 py-4">{customer.buyerType}</td>
                <td className="px-5 py-4">{customer.location || "Not set"}</td>
                <td className="px-5 py-4">{customer.paymentTerms}</td>
                <td className="px-5 py-4">{customer.orders.length}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/70">
                    {customer.status}
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