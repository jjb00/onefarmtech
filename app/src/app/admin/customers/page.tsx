import Link from "next/link";
import AdminPageShell from "@/components/AdminPageShell";
import {prisma} from "@/lib/prisma";
import {createCustomerAction} from "@/actions/createAdminRecords";
import {buyerTypes} from "@/constants/orderOptions";

function money(value: number) {
  return `₦${value.toLocaleString()}`;
}

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: {createdAt: "desc"},
    include: {
      orders: {
        select: {
          id: true,
          estimatedTotal: true,
          paymentStatus: true,
        },
      },
      receipts: {
        select: {
          id: true,
          amount: true,
        },
      },
    },
  });

  return (
    <AdminPageShell
      title="Customers"
      description="View buyer accounts, payment terms, credit limits, receipt readiness, and customer readiness for WhatsApp-first fresh food supply."
    >
      <div className="grid gap-8">
        <form
          action={createCustomerAction}
          className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm"
        >
          <h2 className="text-2xl font-bold">Create customer</h2>
          <p className="mt-2 text-sm text-[#405348]">
            Add a buyer record for restaurants, hotels, caterers, retailers,
            households, or buying groups. Recurring buyers can later be upgraded
            into approved account-login users.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Customer name
              <input
                name="name"
                required
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="e.g. Lagos restaurant buyer"
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
              Receipt email
              <input
                name="receiptEmail"
                type="email"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="optional receipt address"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Buyer type
              <select
                name="buyerType"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                defaultValue="Restaurant"
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

            <label className="grid gap-2 text-sm font-semibold">
              Outstanding balance
              <input
                name="outstandingBalance"
                type="number"
                min="0"
                defaultValue="0"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Account status
              <select
                name="accountStatus"
                defaultValue="Manual WhatsApp"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              >
                <option>Manual WhatsApp</option>
                <option>Approved recurring buyer</option>
                <option>Credit review</option>
                <option>Account login pending</option>
                <option>Account login ready</option>
                <option>Paused</option>
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

            <label className="grid gap-2 text-sm font-semibold md:col-span-2">
              Payment terms
              <input
                name="paymentTerms"
                defaultValue="Full payment before order allocation"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl bg-[#f7f5ec] px-4 py-3 text-sm font-semibold md:col-span-2">
              <input name="accountLoginReady" type="checkbox" className="h-4 w-4" />
              Mark buyer as login-ready when proper auth is connected
            </label>
          </div>

          <button
            type="submit"
            className="mt-6 rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#155c2f]"
          >
            Save customer
          </button>
        </form>

        <div className="overflow-x-auto rounded-3xl border border-[#102015]/10 bg-white">
          <table className="min-w-[1100px] divide-y divide-[#102015]/10 text-sm">
            <thead className="bg-[#f3f8ef] text-left text-xs uppercase tracking-[0.18em] text-[#405348]">
              <tr>
                <th className="px-5 py-4 font-semibold">Customer</th>
                <th className="px-5 py-4 font-semibold">Buyer type</th>
                <th className="px-5 py-4 font-semibold">Location</th>
                <th className="px-5 py-4 font-semibold">Account</th>
                <th className="px-5 py-4 font-semibold">Credit</th>
                <th className="px-5 py-4 font-semibold">Balance</th>
                <th className="px-5 py-4 font-semibold">Receipts</th>
                <th className="px-5 py-4 font-semibold">Orders</th>
                <th className="px-5 py-4 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#102015]/10">
              {customers.map((customer) => {
                const receiptTotal = customer.receipts.reduce(
                  (sum, receipt) => sum + receipt.amount,
                  0,
                );

                return (
                  <tr key={customer.id} className="text-[#405348]">
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="font-semibold text-[#102015] underline-offset-4 hover:underline"
                      >
                        {customer.name}
                      </Link>
                      <div className="text-xs text-[#587063]">{customer.phone}</div>
                      <div className="text-xs text-[#587063]">
                        {customer.receiptEmail || customer.email || "No receipt email"}
                      </div>
                    </td>
                    <td className="px-5 py-4">{customer.buyerType}</td>
                    <td className="px-5 py-4">{customer.location || "Not set"}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold">{customer.accountStatus}</div>
                      <div className="text-xs text-[#587063]">
                        {customer.accountLoginReady ? "Login ready" : "Manual account"}
                      </div>
                    </td>
                    <td className="px-5 py-4">{money(customer.creditLimit)}</td>
                    <td className="px-5 py-4">{money(customer.outstandingBalance)}</td>
                    <td className="px-5 py-4">{money(receiptTotal)}</td>
                    <td className="px-5 py-4">{customer.orders.length}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full border border-[#102015]/10 bg-white px-3 py-1 text-xs font-semibold text-[#405348]">
                        {customer.status}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {!customers.length ? (
                <tr>
                  <td className="px-5 py-8 text-center text-[#587063]" colSpan={9}>
                    No customers yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageShell>
  );
}
