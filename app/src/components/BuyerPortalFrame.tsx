import Link from "next/link";
import type {ReactNode} from "react";
import {buyerLogoutAction} from "@/actions/auth";

const navItems = [
  ["Overview", "/buyer-account"],
  ["Profile", "/buyer-account/profile"],
  ["Orders", "/buyer-account/orders"],
  ["Payments", "/buyer-account/payments"],
  ["Credit", "/buyer-account/credit"],
  ["Support", "/buyer-account/support"],
];

export default function BuyerPortalFrame({
  customerName,
  buyerType,
  children,
}: {
  customerName: string;
  buyerType: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f7f5ec] px-4 py-6 text-[#102015] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[17rem_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Buyer portal
            </p>
            <h1 className="mt-2 text-2xl font-black">{customerName}</h1>
            <p className="mt-2 text-sm leading-7 text-[#405348]">{buyerType}</p>

            <nav className="mt-5 grid gap-2">
              {navItems.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-2xl bg-[#f3f8ef] px-4 py-3 text-sm font-black text-[#102015] hover:bg-[#e8f2e2]"
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mt-5 grid gap-3">
              <Link
                href="/buyer-account/order"
                className="rounded-full bg-[#1f7a3f] px-5 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
              >
                New buyer order
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
          </div>
        </aside>

        <div className="grid gap-6">{children}</div>
      </div>
    </main>
  );
}
