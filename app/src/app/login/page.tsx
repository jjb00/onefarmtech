import { loginAction } from "@/actions/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const hasError = params?.error === "1";
  const nextPath = params?.next || "/admin";

  return (
    <main className="min-h-screen bg-[#102015] px-6 py-10 text-white">
      <section className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl md:grid-cols-[0.9fr_1.1fr] md:p-8">
          <div className="rounded-[1.5rem] bg-[#9ee6ad] p-8 text-[#102015]">
            <p className="text-sm font-bold uppercase tracking-[0.3em]">
              OneFarmTech
            </p>
            <h1 className="mt-6 text-4xl font-black leading-tight">
              Admin access for managed farm-to-city procurement.
            </h1>
            <p className="mt-5 text-sm leading-6 text-[#405348]">
              Use this admin area to create orders, manage customers, track payments,
              log complaints, and coordinate pickup operations.
            </p>
          </div>

          <form
            action={loginAction}
            className="flex flex-col justify-center rounded-[1.5rem] bg-white p-6 text-[#102015]"
          >
            <input type="hidden" name="next" value={nextPath} />

            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#1f7a3f]">
              Admin login
            </p>
            <h2 className="mt-3 text-3xl font-black">Sign in</h2>
            <p className="mt-2 text-sm text-[#405348]">
              Enter the MVP admin password to access the operations dashboard.
            </p>

            {hasError && (
              <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                Incorrect password. Try again.
              </div>
            )}

            <label className="mt-6 grid gap-2 text-sm font-semibold">
              Password
              <input
                name="password"
                type="password"
                required
                autoFocus
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="Enter admin password"
              />
            </label>

            <button
              type="submit"
              className="mt-6 rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#155c2f]"
            >
              Enter admin
            </button>

            <p className="mt-5 rounded-2xl bg-[#f7f5ec] p-4 text-xs leading-5 text-[#405348]">
              MVP default password: <strong>onefarmtech-admin</strong>. Change it
              later with an ADMIN_PASSWORD environment variable before wider use.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
