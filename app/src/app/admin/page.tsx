import Link from "next/link";

const orders = [
  {
    code: "OFT-0001",
    buyer: "Mama T Foods",
    buyerType: "Restaurant",
    items: "Tomatoes, pepper, onions",
    orderType: "Recurring",
    paymentStatus: "Deposit paid",
    fulfilmentStatus: "Sourcing",
    total: "₦185,000",
    delivery: "Platform delivery",
  },
  {
    code: "OFT-0002",
    buyer: "Chika Household",
    buyerType: "Large household",
    items: "Irish potatoes - 10kg",
    orderType: "Group-buy",
    paymentStatus: "Fully paid",
    fulfilmentStatus: "Minimum met",
    total: "₦22,000",
    delivery: "Pickup point",
  },
  {
    code: "OFT-0003",
    buyer: "Green Bowl Caterers",
    buyerType: "Caterer",
    items: "Yam - 50 tubers",
    orderType: "Direct",
    paymentStatus: "Unpaid",
    fulfilmentStatus: "New order",
    total: "₦310,000",
    delivery: "Customer pickup",
  },
  {
    code: "OFT-0004",
    buyer: "Urban Mini Mart",
    buyerType: "Retailer",
    items: "Rice, beans, garri",
    orderType: "Direct",
    paymentStatus: "Credit approved",
    fulfilmentStatus: "Ready for dispatch",
    total: "₦460,000",
    delivery: "Scheduled delivery",
  },
];

const stats = [
  { label: "New orders", value: "12" },
  { label: "Paid / ready", value: "7" },
  { label: "In sourcing", value: "5" },
  { label: "Issues", value: "1" },
];

const adminModules = [
  "Orders",
  "Customers",
  "Products",
  "Farmers & suppliers",
  "Group-buys",
  "Payments",
  "Deliveries",
  "Complaints",
];

function statusClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("paid") || normalized.includes("approved")) {
    return "bg-[#e7f3df] text-[#1f7a3f]";
  }

  if (normalized.includes("unpaid") || normalized.includes("issue")) {
    return "bg-[#fff1d6] text-[#8a5a00]";
  }

  return "bg-white/10 text-white";
}

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#102015] px-6 py-10 text-white">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold text-[#9ee6ad]">
              ← Back to public site
            </Link>

            <h1 className="mt-6 text-4xl font-bold">OneFarmTech Admin</h1>

            <p className="mt-3 max-w-3xl text-[#d8e8dc]">
              Operations centre for managing orders, customers, sourcing,
              payments, group-buys, deliveries, and complaints.
            </p>
          </div>

          <button className="rounded-full bg-[#9ee6ad] px-6 py-4 font-semibold text-[#102015]">
            Create new order
          </button>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white/10 p-6">
              <p className="text-sm text-[#d8e8dc]">{stat.label}</p>
              <p className="mt-2 text-4xl font-bold">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {adminModules.map((module) => (
            <div key={module} className="rounded-2xl bg-white/10 p-5">
              <h2 className="font-bold">{module}</h2>
              <p className="mt-2 text-sm text-[#d8e8dc]">Coming soon</p>
            </div>
          ))}
        </section>

        <section className="mt-10 rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Recent orders</h2>
              <p className="mt-2 text-sm text-[#405348]">
                Mock order data for testing the first admin workflow.
              </p>
            </div>

            <div className="rounded-full bg-[#f7f5ec] px-4 py-2 text-sm font-semibold text-[#405348]">
              Manual order management MVP
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px] border-separate border-spacing-y-3 text-left text-sm">
              <thead>
                <tr className="text-[#405348]">
                  <th className="px-4 py-2">Order</th>
                  <th className="px-4 py-2">Buyer</th>
                  <th className="px-4 py-2">Items</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Payment</th>
                  <th className="px-4 py-2">Fulfilment</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Delivery</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.code} className="rounded-2xl bg-[#f7f5ec]">
                    <td className="rounded-l-2xl px-4 py-4 font-bold">
                      {order.code}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{order.buyer}</p>
                      <p className="text-xs text-[#405348]">{order.buyerType}</p>
                    </td>
                    <td className="px-4 py-4">{order.items}</td>
                    <td className="px-4 py-4">{order.orderType}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4">{order.fulfilmentStatus}</td>
                    <td className="px-4 py-4 font-semibold">{order.total}</td>
                    <td className="rounded-r-2xl px-4 py-4">{order.delivery}</td>
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
