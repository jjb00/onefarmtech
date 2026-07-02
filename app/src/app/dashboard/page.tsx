import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#f7f5ec] px-6 py-10 text-[#102015]">
      <section className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-semibold text-[#1f7a3f]">
          ← Back to home
        </Link>

        <h1 className="mt-8 text-4xl font-bold">Buyer Dashboard</h1>
        <p className="mt-3 text-[#405348]">
          This area will show order history, payment links, invoices, delivery
          status, group-buy participation, and recurring supply requests.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {["Recent orders", "Open group-buys", "Invoices"].map((item) => (
            <div key={item} className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">{item}</h2>
              <p className="mt-3 text-[#405348]">Coming soon.</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
