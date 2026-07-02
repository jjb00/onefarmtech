import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f7f5ec] px-6 py-10 text-[#102015]">
      <section className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm font-semibold text-[#1f7a3f]">
          ← Back to home
        </Link>

        <h1 className="mt-8 text-3xl font-bold">Buyer Login</h1>

        <p className="mt-3 text-[#405348]">
          Buyer accounts will help repeat customers manage orders, invoices,
          delivery details, group-buy participation, and recurring supply
          requests.
        </p>

        <form className="mt-8 grid gap-4">
          <input
            className="rounded-xl border border-gray-200 px-4 py-3"
            placeholder="Email or phone number"
          />
          <input
            className="rounded-xl border border-gray-200 px-4 py-3"
            placeholder="Password"
            type="password"
          />
          <button
            className="rounded-full bg-[#1f7a3f] px-6 py-4 font-semibold text-white"
            type="button"
          >
            Login coming soon
          </button>
        </form>

        <p className="mt-6 text-sm text-[#405348]">
          New buyers can still order directly through WhatsApp while account
          access is being prepared.
        </p>
      </section>
    </main>
  );
}
