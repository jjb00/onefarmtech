import BrandMark from "@/components/BrandMark";
import {loginAction} from "@/actions/auth";
import {staffRoles} from "@/lib/permissions";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({searchParams}: LoginPageProps) {
  const params = await searchParams;
  const hasError = params?.error === "1";
  const nextPath = params?.next || "/admin";

  return (
    <main className="min-h-screen bg-[#07120c] px-6 py-10 text-white">
      <section className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl md:grid-cols-[0.9fr_1.1fr] md:p-8">
          <div className="rounded-[1.5rem] bg-[#f8f1e7] p-8 text-[#102015]">
            <BrandMark />
            <h1 className="mt-8 text-4xl font-black leading-tight">
              Staff operations console.
            </h1>
            <p className="mt-5 text-sm leading-6 text-[#405348]">
              Manage OneFarmTech orders, customers, payments, receipts, complaints,
              group buys, buyer accounts, and manual WhatsApp operations from one
              controlled admin desk.
            </p>

            <div className="mt-6 rounded-2xl border border-[#c95f3d]/20 bg-[#c95f3d]/10 p-4">
              <p className="text-sm font-black text-[#7a321f]">
                Temporary staff gate
              </p>
              <p className="mt-2 text-xs leading-5 text-[#405348]">
                This is not production authentication. Use it only for local/internal
                testing until proper staff and buyer auth is connected.
              </p>
            </div>
          </div>

          <form
            action={loginAction}
            className="flex flex-col justify-center rounded-[1.5rem] bg-white p-6 text-[#102015]"
          >
            <input type="hidden" name="next" value={nextPath} />

            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#1f7a3f]">
              Staff access
            </p>
            <h2 className="mt-3 text-3xl font-black">Sign in</h2>
            <p className="mt-2 text-sm text-[#405348]">
              Enter the temporary admin password and identify your staff role
              so audit logs can attribute local actions more clearly.
            </p>

            {hasError && (
              <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                Incorrect password. Try again.
              </div>
            )}

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold">
                Staff name
                <input
                  name="staffName"
                  className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  placeholder="e.g. Joy / Ops desk"
                  defaultValue="Local staff user"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                Staff email
                <input
                  name="staffEmail"
                  type="email"
                  className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  placeholder="optional for local testing"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                Role for this session
                <select
                  name="staffRole"
                  defaultValue="Admin"
                  className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                >
                  {staffRoles.map((role) => (
                    <option key={role}>{role}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold">
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
            </div>

            <button
              type="submit"
              className="mt-6 rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#155c2f]"
            >
              Enter staff console
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
