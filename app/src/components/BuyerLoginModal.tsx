"use client";

import Link from "next/link";
import {useState} from "react";
import {buyerLoginAction} from "@/actions/auth";

export default function BuyerLoginModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden rounded-full border border-[#101712]/10 bg-white/80 px-5 py-3 text-sm font-black text-[#101712] shadow-sm hover:bg-white md:inline-flex"
      >
        Buyer login
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-[#101712]/10 bg-white/90 px-5 py-3 text-sm font-black text-[#101712] shadow-sm hover:bg-white md:hidden"
      >
        Buyer login
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#101712]/55 px-4 pb-4 pt-20 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Buyer login"
        >
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
                  Buyer account access
                </p>
                <h2 className="mt-2 text-3xl font-black text-[#102015]">
                  Buyer login
                </h2>
                <p className="mt-2 text-sm leading-7 text-[#405348]">
                  Approved buyers can sign in using the access details shared by
                  the OneFarmTech team.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3f8ef] text-xl font-black text-[#102015]"
                aria-label="Close buyer login"
              >
                ×
              </button>
            </div>

            <form action={buyerLoginAction} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-black text-[#102015]">
                Email or phone
                <input
                  name="buyerIdentifier"
                  type="text"
                  autoComplete="username"
                  placeholder="buyer@example.com or phone number"
                  className="rounded-2xl border border-[#101712]/10 bg-[#fbfff8] px-4 py-3 text-sm font-semibold outline-none focus:border-[#1f7a3f]"
                />
              </label>

              <label className="grid gap-2 text-sm font-black text-[#102015]">
                Access code
                <input
                  name="buyerAccessCode"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your buyer access code"
                  className="rounded-2xl border border-[#101712]/10 bg-[#fbfff8] px-4 py-3 text-sm font-semibold outline-none focus:border-[#1f7a3f]"
                />
              </label>

              <button
                type="submit"
                className="rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
              >
                Sign in
              </button>
            </form>

            <div className="mt-5 grid gap-3 rounded-2xl bg-[#f7f5ec] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C95F3D]">
                Need help?
              </p>

              <Link
                href="#buyer-account-request-form"
                onClick={() => setOpen(false)}
                className="rounded-full bg-white px-5 py-3 text-center text-sm font-black text-[#102015]"
              >
                Request buyer account setup
              </Link>

              <Link
                href="/order"
                className="rounded-full bg-white px-5 py-3 text-center text-sm font-black text-[#102015]"
              >
                Place an order instead
              </Link>

              <Link
                href="/contact"
                className="rounded-full bg-white px-5 py-3 text-center text-sm font-black text-[#102015]"
              >
                Contact support
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
