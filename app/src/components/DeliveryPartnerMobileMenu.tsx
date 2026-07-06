import Link from "next/link";

export default function DeliveryPartnerMobileMenu({
  signedIn = false,
  logoutAction,
}: {
  signedIn?: boolean;
  logoutAction?: () => Promise<void>;
}) {
  return (
    <details className="relative">
      <summary
        aria-label="Open delivery partner menu"
        className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-[#102015]/10 bg-white text-2xl font-black text-[#102015] shadow-sm"
      >
        ☰
      </summary>

      <div className="absolute right-0 top-14 z-50 w-[min(20rem,calc(100vw-3rem))] rounded-[1.5rem] border border-[#102015]/10 bg-white p-3 shadow-2xl">
        <p className="px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">
          Delivery partner
        </p>

        <nav className="grid gap-2">
          <Link
            href="/delivery-partner"
            className="rounded-full bg-[#f3f8ef] px-4 py-3 text-center text-sm font-black text-[#102015]"
          >
            Portal home
          </Link>
          <Link
            href={signedIn ? "/delivery-partner/jobs" : "/delivery-partner/login"}
            className="rounded-full bg-[#1f7a3f] px-4 py-3 text-center text-sm font-black text-white"
          >
            {signedIn ? "Assigned jobs" : "Partner login"}
          </Link>
          <Link
            href="/"
            className="rounded-full bg-[#f3f8ef] px-4 py-3 text-center text-sm font-black text-[#102015]"
          >
            OneFarmTech home
          </Link>
        </nav>

        {signedIn && logoutAction ? (
          <form action={logoutAction} className="mt-3 border-t border-[#102015]/10 pt-3">
            <button
              type="submit"
              className="w-full rounded-full border border-[#102015]/15 bg-white px-4 py-3 text-sm font-black text-[#102015]"
            >
              Sign out
            </button>
          </form>
        ) : null}
      </div>
    </details>
  );
}
