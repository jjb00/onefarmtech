import { logoutAction } from "@/actions/auth";

export default function LogoutPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-10 text-[#102015]">
      <section className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
        <form
          action={logoutAction}
          className="w-full rounded-[2rem] bg-white p-8 text-center text-[#102015] shadow-sm"
        >
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#1f7a3f]">
            OneFarmTech
          </p>
          <h1 className="mt-4 text-3xl font-black">Sign out?</h1>
          <p className="mt-3 text-sm leading-6 text-[#405348]">
            This will end your admin session on this browser.
          </p>

          <button
            type="submit"
            className="mt-6 rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#155c2f]"
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
