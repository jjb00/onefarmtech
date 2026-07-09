import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import type {ReactNode} from "react";
import {buyerLogoutAction} from "@/actions/auth";

const navItems = [
  ["Overview", "/buyer-account"],
  ["Orders", "/buyer-account/orders"],
  ["Payments", "/buyer-account/payments"],
  ["Inbox", "/buyer-account/inbox"],
  ["Support", "/buyer-account/support"],
];

function BuyerNavLinks({unreadMessageCount = 0}: {unreadMessageCount?: number}) {
  return (
    <nav className="grid gap-2">
      {navItems.map(([label, href]) => (
        <Link
          key={href}
          href={href}
          className="flex items-center justify-between rounded-2xl border border-[#102015]/10 bg-[#f3f8ef] px-4 py-3 text-sm font-black text-[#102015] transition hover:-translate-y-0.5 hover:bg-[#e8f2e2]"
        >
          <span>{label}</span>
          {label === "Inbox" ? (
            unreadMessageCount > 0 ? (
              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[#d9471f] px-2 py-1 text-xs font-black leading-none text-white">
                {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
              </span>
            ) : (
              <span aria-hidden="true" className="text-base leading-none">🔔</span>
            )
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

function BuyerAccountActions() {
  return (
    <div className="grid gap-2">
      <Link
        href="/buyer-account/order"
        className="rounded-full bg-[#1f7a3f] px-5 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
      >
        Place order
      </Link>

      <form action={buyerLogoutAction}>
        <button
          type="submit"
          className="w-full rounded-full border border-[#102015]/15 bg-white px-5 py-3 text-sm font-black text-[#102015] shadow-sm hover:bg-[#f3f8ef]"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

export default function BuyerPortalFrame({
  customerName,
  buyerType,
  unreadMessageCount = 0,
  children,
}: {
  customerName: string;
  buyerType: string;
  unreadMessageCount?: number;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_10%,rgba(242,184,75,0.16),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(31,122,63,0.12),transparent_32%),linear-gradient(180deg,#fbfff8_0%,#f7f5ec_58%,#fbfff8_100%)] px-4 py-6 text-[#102015] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[17rem_1fr]">
        <section className="rounded-[2rem] border border-[#102015]/10 bg-white/95 p-5 shadow-sm backdrop-blur lg:hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link href="/buyer-account" className="mb-4 inline-flex" aria-label="Go to buyer dashboard">
                <BrandMark />
              </Link>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
                Buyer portal
              </p>
              <h1 className="mt-2 text-2xl font-black">{customerName}</h1>
              <p className="mt-1 text-sm leading-6 text-[#405348]">{buyerType}</p>
            </div>

            <details className="relative">
              <summary
                aria-label="Open buyer menu"
                className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-[#102015]/10 bg-[#f3f8ef] text-2xl font-black"
              >
                ☰
              </summary>

              <div className="absolute right-0 top-14 z-50 w-[min(21rem,calc(100vw-3rem))] rounded-[1.5rem] border border-[#102015]/10 bg-white/95 p-3 shadow-2xl backdrop-blur">
                <p className="px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">
                  Buyer menu
                </p>
                <BuyerNavLinks unreadMessageCount={unreadMessageCount} />
                <div className="mt-3 border-t border-[#102015]/10 pt-3">
                  <BuyerAccountActions />
                </div>
              </div>
            </details>
          </div>
        </section>

        <aside className="hidden lg:sticky lg:top-6 lg:block lg:self-start">
          <div className="rounded-[2rem] border border-[#102015]/10 bg-white/95 p-5 shadow-sm backdrop-blur">
            <Link href="/buyer-account" className="mb-5 inline-flex" aria-label="Go to buyer dashboard">
              <BrandMark />
            </Link>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Buyer portal
            </p>
            <h1 className="mt-2 text-2xl font-black">{customerName}</h1>
            <p className="mt-2 text-sm leading-7 text-[#405348]">{buyerType}</p>

            <div className="mt-5">
              <BuyerNavLinks unreadMessageCount={unreadMessageCount} />
            </div>

            <details className="mt-5 rounded-2xl border border-[#102015]/10 bg-[#fbfff8] p-3">
              <summary className="cursor-pointer text-sm font-black text-[#102015]">
                Account actions
              </summary>
              <div className="mt-3">
                <BuyerAccountActions />
              </div>
            </details>
          </div>
        </aside>

        <div className="grid gap-4">
          <header className="hidden items-center justify-end gap-3 rounded-2xl border border-[#102015]/10 bg-white/90 px-4 py-3 shadow-sm backdrop-blur lg:flex">
            <Link
              href="/buyer-account/inbox"
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#102015]/10 bg-[#f3f8ef] text-lg font-black text-[#102015] hover:bg-[#e8f2e2]"
              aria-label="Open inbox"
            >
              🔔
              {unreadMessageCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[#d9471f] px-1.5 py-0.5 text-[0.65rem] font-black leading-none text-white">
                  {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                </span>
              ) : null}
            </Link>
            <Link
              href="/buyer-account/profile"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#102015] text-sm font-black text-white hover:bg-[#1f7a3f]"
              aria-label="Open profile"
              title={customerName}
            >
              {customerName.slice(0, 1).toUpperCase()}
            </Link>
          </header>

          {children}
        </div>
      </div>
    </main>
  );
}
