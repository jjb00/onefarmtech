import PublicPageShell from "@/components/PublicPageShell";

export default function LoginPage() {
  return (
    <PublicPageShell>
      <section className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-[#1f7a3f]">Buyer access</p>

          <h1 className="mt-3 text-3xl font-bold">Buyer Login</h1>

          <p className="mt-3 text-[#405348]">
            Buyer accounts will help repeat customers manage orders, invoices,
            delivery details, group-buy participation, and recurring supply
            requests.
          </p>

          <form className="mt-8 grid gap-4">
            <input
              className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#1f7a3f]"
              placeholder="Email or phone number"
            />
            <input
              className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#1f7a3f]"
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

          <p className="mt-6 text-sm leading-6 text-[#405348]">
            New buyers can still order directly through WhatsApp while account
            access is being prepared.
          </p>
        </div>
      </section>
    </PublicPageShell>
  );
}
