import Link from "next/link";
import { mockOrders, paymentStatusClass } from "@/data/mockOrders";

export default function AdminOrdersPage() {
  return (
    <main className="min-h-screen bg-[#102015] px-6 py-10 text-white">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/admin" className="text-sm font-semibold text-[#9ee6ad]">
              ← Back to admin
            </Link>

            <h1 className="mt-6 text-4xl font-bold">Orders</h1>

            <p className="mt-3 max-w-3xl text-[#d8e8dc]">
              Track WhatsApp orders, group-buy orders, direct orders, payment
              status, fulfilment stage, and delivery method.
            </p>
          </div>

          <button className="rounded-full bg-[#9ee6ad] px-6 py-4 font-semibold text-[#102015]">
            Create new order
          </button>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white/10 p-6">
            <p className="text-sm text-[#d8e8dc]">Total orders</p>
            <p className="mt-2 text-4xl font-bold">24</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-6">
            <p className="text-sm text-[#d8e8dc]">Awaiting payment</p>
            <p className="mt-2 text-4xl font-bold">6</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-6">
            <p className="text-sm text-[#d8e8dc]">Ready to source</p>
            <p className="mt-2 text-4xl font-bold">9</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-6">
            <p className="text-sm text-[#d8e8dc]">Out for delivery</p>
            <p className="mt-2 text-4xl font-bold">3</p>
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Order queue</h2>
              <p className="mt-2 text-sm text-[#405348]">
                MVP mock table. Later this will connect to database records.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-[#f7f5ec] px-4 py-2 font-semibold text-[#405348]">
                All
              </span>
              <span className="rounded-full bg-[#f7f5ec] px-4 py-2 font-semibold text-[#405348]">
                Unpaid
              </span>
              <span className="rounded-full bg-[#f7f5ec] px-4 py-2 font-semibold text-[#405348]">
                Paid
              </span>
              <span className="rounded-full bg-[#f7f5ec] px-4 py-2 font-semibold text-[#405348]">
                Delivery
              </span>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[1000px] border-separate border-spacing-y-3 text-left text-sm">
              <thead>
                <tr className="text-[#405348]">
                  <th className="px-4 py-2">Order</th>
                  <th className="px-4 py-2">Buyer</th>
                  <th className="px-4 py-2">Contact</th>
                  <th className="px-4 py-2">Items</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Payment</th>
                  <th className="px-4 py-2">Fulfilment</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Delivery</th>
                  <th className="px-4 py-2">Date</th>
                </tr>
              </thead>

              <tbody>
                {mockOrders.map((order) => (
                  <tr key={order.code} className="rounded-2xl bg-[#f7f5ec]">
                    <td className="rounded-l-2xl px-4 py-4 font-bold">
                      {order.code}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{order.buyer}</p>
                      <p className="text-xs text-[#405348]">{order.buyerType}</p>
                    </td>
                    <td className="px-4 py-4">{order.phone}</td>
                    <td className="px-4 py-4">{order.items}</td>
                    <td className="px-4 py-4">{order.orderType}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentStatusClass(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4">{order.fulfilmentStatus}</td>
                    <td className="px-4 py-4 font-semibold">{order.total}</td>
                    <td className="px-4 py-4">{order.delivery}</td>
                    <td className="rounded-r-2xl px-4 py-4">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
