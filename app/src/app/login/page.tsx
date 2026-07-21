import BrandMark from "@/components/BrandMark";
import {loginAction} from "@/actions/auth";

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
    <main className="min-h-screen bg-[#07120c] px-4 py-6 text-white sm:px-6 sm:py-10">
      <section className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <div className="w-full rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-3 shadow-2xl sm:rounded-[2rem] sm:p-6 md:grid md:grid-cols-[0.9fr_1.1fr] md:gap-8 md:p-8">
          <div className="hidden rounded-[1.5rem] bg-[#f8f1e7] p-8 text-[#102015] md:block">
            <BrandMark />
            <h1 className="mt-8 text-4xl font-black leading-tight">
              Staff operations console.
            </h1>
            <p className="mt-5 text-sm leading-6 text-[#405348]">
              Manage OneFarmTech orders, buyers, payments, receipts, complaints,
              group buys and WhatsApp-first operations from one controlled admin desk.
            </p>

            <div className="mt-6 rounded-2xl border border-[#c95f3d]/20 bg-[#c95f3d]/10 p-4">
              <p className="text-sm font-black text-[#7a321f]">
                Controlled staff access
              </p>
              <p className="mt-2 text-xs leading-5 text-[#405348]">
                Your access is assigned to your staff account and cannot be selected at sign-in.
              </p>
            </div>
          </div>

          <form
            action={loginAction}
            className="flex flex-col justify-center rounded-[1.25rem] bg-white p-5 text-[#102015] sm:rounded-[1.5rem] sm:p-6"
          >
            <input type="hidden" name="next" value={nextPath} />

            <div className="md:hidden">
              <BrandMark />
            </div>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f] md:mt-0">
              Staff access
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl md:text-3xl">
              Enter staff console
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#405348]">
              Sign in to manage orders, buyers, payments and launch operations.
            </p>

            <details className="mt-4 rounded-2xl border border-[#101712]/10 bg-[#f8f1e7] p-4 text-sm md:hidden">
              <summary className="cursor-pointer font-black text-[#102015]">
                What is this login for?
              </summary>
              <p className="mt-3 leading-6 text-[#405348]">
                This is the staff-only admin area. Your assigned role controls which pages are visible after sign in.
              </p>
            </details>

            {hasError && (
              <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                Incorrect password. Try again.
              </div>
            )}

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold">
                Staff email
                <input
                  name="staffEmail"
                  type="email"
                  className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  required
                  autoFocus
                  placeholder="name@example.com"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                Password
                <input
                  name="password"
                  type="password"
                  required
                  className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  placeholder="Enter staff access password"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-6 w-full rounded-full bg-[#1f7a3f] px-5 py-4 text-sm font-black text-white shadow-sm transition hover:bg-[#155c2f]"
            >
              Enter staff console
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
