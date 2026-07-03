import AdminPageShell from "@/components/AdminPageShell";
import { getDbCustomers } from "@/data/dbAdmin";
import { createCustomerAction } from "@/actions/createAdminRecords";
import { buyerTypes } from "@/constants/orderOptions";

export default async function CustomersPage() {
  const customers = await getDbCustomers();

  return (
    <AdminPageShell
      title="Customers"
      description="View buyer accounts, order history, and customer readiness for WhatsApp-first procurement."
    >
      <div className="grid gap-8">
        <form
          action={createCustomerAction}
          className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm"
        >
          <h2 className="text-2xl font-bold">Create customer</h2>
          <p className="mt-2 text-sm text-[#405348]">
            Add a buyer account for restaurants, hotels, caterers, retailers, households, or buying groups.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Customer name
              <input
                name="name"
                required
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="e.g. Mama T Foods"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Phone
              <input
                name="phone"
                required
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="+234..."
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Email
              <input
                name="email"
                type="email"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="optional"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Buyer type
              <select
                name="buyerType"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                defaultValue="Individual"
              >
                {buyerTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Location
              <input
                name="location"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="e.g. Yaba, Lagos"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Credit limit
              <input
                name="creditLimit"
                type="number"
                min="0"
                defaultValue="0"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold md:col-span-2">
              Payment terms
              <input
                name="paymentTerms"
                defaultValue="Full payment before sourcing"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
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
                <option>Needs review</option>
                <option>Paused</option>
              </select>
            </label>
          </div>

          <button
            type="submit"
            className="mt-6 rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#155c2f]"
          >
            Save customer
          </button>
        </form>

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
      </div>
    </AdminPageShell>
  );
}
