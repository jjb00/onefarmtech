"use client";

import Link from "next/link";
import {useEffect, useRef, useState} from "react";
import {buyerLoginAction} from "@/actions/auth";
import {
  requestBuyerOtpAction,
  resendBuyerOtpAction,
  verifyBuyerOtpAction,
} from "@/actions/buyerOtp";
import PendingSubmitButton from "@/components/admin/PendingSubmitButton";
import BuyerOtpResendButton from "@/components/BuyerOtpResendButton";

type BuyerLoginModalProps = {
  defaultOpen?: boolean;
  errorMessage?: string | null;
  showTrigger?: boolean;
  allowClose?: boolean;
  otpStep?: boolean;
  otpSent?: boolean;
};

export default function BuyerLoginModal({
  defaultOpen = false,
  errorMessage = null,
  showTrigger = true,
  allowClose = true,
  otpStep = false,
  otpSent = false,
}: BuyerLoginModalProps) {
  const [open, setOpen] = useState(defaultOpen);
  const identifierRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    identifierRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && allowClose) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, allowClose]);

  return (
    <>
      {showTrigger ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-[#101712]/10 bg-white/90 px-5 py-3 text-sm font-black text-[#101712] shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a3f] focus-visible:ring-offset-2"
        >
          Buyer login
        </button>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#101712]/55 px-4 pb-4 pt-20 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="buyer-login-title"
          onMouseDown={(event) => {
            if (allowClose && event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
                  Buyer account access
                </p>
                <h1
                  id="buyer-login-title"
                  className="mt-2 text-3xl font-black text-[#102015]"
                >
                  Buyer login
                </h1>
                <p className="mt-2 text-sm leading-7 text-[#405348]">
                  Approved buyer contacts can receive a secure one-time code by
                  email. The code expires after 10 minutes.
                </p>
              </div>

              {allowClose ? (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3f8ef] text-xl font-black text-[#102015] transition hover:bg-[#e7f1e2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a3f]"
                  aria-label="Close buyer login"
                >
                  ×
                </button>
              ) : null}
            </div>

            {errorMessage ? (
              <div
                role="alert"
                className="mt-4 rounded-2xl border border-[#C95F3D]/25 bg-[#fff4ed] p-4 text-sm font-bold leading-6 text-[#8b3f25]"
              >
                {errorMessage}
              </div>
            ) : null}

            {otpSent ? (
              <div role="status" className="mt-4 rounded-2xl bg-[#eef8f0] p-4 text-sm font-bold text-[#155c2f]">
                If that email is approved for buyer access, a login code has been sent.
              </div>
            ) : null}

            {otpStep ? (
              <div className="mt-6 grid gap-4">
                <form action={verifyBuyerOtpAction} className="grid gap-4">
                  <label className="grid gap-2 text-sm font-black text-[#102015]">
                    Six-digit code
                    <input
                      ref={identifierRef}
                      name="otp"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      autoComplete="one-time-code"
                      placeholder="000000"
                      className="rounded-2xl border border-[#101712]/10 bg-[#fbfff8] px-4 py-3 text-center text-xl font-black tracking-[0.35em] outline-none transition focus:border-[#1f7a3f] focus:ring-2 focus:ring-[#1f7a3f]/15"
                    />
                  </label>
                  <PendingSubmitButton
                    label="Verify and sign in"
                    pendingLabel="Verifying…"
                    className="rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </form>
                <form action={resendBuyerOtpAction}>
                  <BuyerOtpResendButton />
                </form>
                <Link href="/buyer-login" className="text-center text-sm font-bold text-[#405348] underline">
                  Use a different email
                </Link>
              </div>
            ) : (
              <form action={requestBuyerOtpAction} className="mt-6 grid gap-4">
                <label className="grid gap-2 text-sm font-black text-[#102015]">
                  Approved email address
                  <input
                    ref={identifierRef}
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="buyer@example.com"
                    className="rounded-2xl border border-[#101712]/10 bg-[#fbfff8] px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#1f7a3f] focus:ring-2 focus:ring-[#1f7a3f]/15"
                  />
                </label>
                <PendingSubmitButton
                  label="Email me a login code"
                  pendingLabel="Sending code…"
                  className="rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </form>
            )}

            <details className="mt-5 rounded-2xl border border-[#101712]/10 bg-[#fbfff8] p-4">
              <summary className="cursor-pointer text-sm font-black text-[#405348]">
                Legacy access-code login
              </summary>
              <p className="mt-2 text-xs leading-6 text-[#587063]">
                Use this only if OneFarmTech previously issued you a permanent access code.
              </p>
              <form action={buyerLoginAction} className="mt-4 grid gap-3">
                <input name="buyerIdentifier" required autoComplete="username" placeholder="Email or phone" className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 text-sm" />
                <input name="buyerAccessCode" type="password" required autoComplete="current-password" placeholder="Legacy access code" className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 text-sm" />
                <PendingSubmitButton label="Sign in with legacy code" pendingLabel="Signing in…" className="rounded-full border border-[#1f7a3f]/20 bg-white px-5 py-3 text-sm font-black text-[#1f7a3f] disabled:opacity-60" />
              </form>
            </details>

            <div className="mt-5 grid gap-3 rounded-2xl bg-[#f7f5ec] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C95F3D]">
                Need help?
              </p>

              <Link
                href="/buyer-account-request#buyer-account-request-form"
                onClick={() => allowClose && setOpen(false)}
                className="rounded-full bg-white px-5 py-3 text-center text-sm font-black text-[#102015] transition hover:bg-[#f3f8ef]"
              >
                Request buyer account setup
              </Link>

              <Link
                href="/order"
                className="rounded-full bg-white px-5 py-3 text-center text-sm font-black text-[#102015] transition hover:bg-[#f3f8ef]"
              >
                Place an order instead
              </Link>

              <Link
                href="/contact"
                className="rounded-full bg-white px-5 py-3 text-center text-sm font-black text-[#102015] transition hover:bg-[#f3f8ef]"
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
