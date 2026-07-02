import Link from "next/link";

const adminCards = [
  "Orders",
  "Customers",
  "Products",
  "Farmers & suppliers",
  "Group-buys",
  "Payments",
  "Deliveries",
  "Complaints",
];

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#102015] px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-semibold text-[#9ee6ad]">
          ← Back to home
        </Link>

        <h1 className="mt-8 text-4xl font-bold">OneFarmTech Admin</h1>
        <p className="mt-3 max-w-3xl text-[#d8e8dc]">
          This dashboard will become the operations centre for managing orders,
          customers, sourcing, payments, group-buys, deliveries, and complaints.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {adminCards.map((card) => (
            <div key={card} className="rounded-2xl bg-white/10 p-6">
              <h2 className="text-xl font-bold">{card}</h2>
              <p className="mt-3 text-sm text-[#d8e8dc]">Coming soon.</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
