"use client";

import {useCallback, useEffect, useRef} from "react";
import {useRouter} from "next/navigation";
import TurnstileWidget from "@/components/TurnstileWidget";
import {createCareerApplicationAction} from "@/actions/publicApplications";

type CareerApplicationModalProps = {
  role: string;
  errorMessage?: string | null;
  submitted?: boolean;
};

export default function CareerApplicationModal({
  role,
  errorMessage = null,
  submitted = false,
}: CareerApplicationModalProps) {
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);

  const closeModal = useCallback(() => {
    router.push("/careers");
  }, [router]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    nameRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeModal]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#101712]/60 px-4 pb-4 pt-16 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="career-application-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeModal();
        }
      }}
    >
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1f7a3f]">
              Career application
            </p>
            <h2
              id="career-application-title"
              className="mt-2 text-3xl font-black text-[#102015]"
            >
              Apply to OneFarmTech
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#405348]">
              Complete the form below for the selected role.
            </p>
          </div>

          <button
            type="button"
            onClick={closeModal}
            aria-label="Close career application"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3f8ef] text-xl font-black text-[#102015] transition hover:bg-[#e7f1e2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a3f]"
          >
            ×
          </button>
        </div>

        {submitted ? (
          <div
            role="status"
            className="mt-5 rounded-2xl border border-[#1f7a3f]/15 bg-[#eef8ef] p-4 text-sm font-bold leading-6 text-[#155c2f]"
          >
            Application received. We have sent an acknowledgement to your
            email.
          </div>
        ) : null}

        {errorMessage ? (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold leading-6 text-red-700"
          >
            {errorMessage}
          </div>
        ) : null}

        {!submitted ? (
          <form action={createCareerApplicationAction} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-[#102015]">
              Role applied for
              <input
                name="role"
                required
                readOnly
                value={role}
                className="rounded-xl border border-[#102015]/10 bg-[#f3f8ef] px-4 py-3 font-semibold text-[#102015]"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-[#102015]">
                Name
                <input
                  ref={nameRef}
                  name="name"
                  required
                  autoComplete="name"
                  className="rounded-xl border border-[#102015]/10 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#102015]">
                Location
                <input
                  name="location"
                  required
                  autoComplete="address-level2"
                  className="rounded-xl border border-[#102015]/10 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#102015]">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="rounded-xl border border-[#102015]/10 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#102015]">
                Phone
                <input
                  name="phone"
                  required
                  autoComplete="tel"
                  className="rounded-xl border border-[#102015]/10 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-bold text-[#102015]">
              Short experience statement
              <textarea
                name="experience"
                required
                rows={6}
                className="rounded-xl border border-[#102015]/10 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              />
            </label>

            <label className="flex items-start gap-3 rounded-xl bg-[#f3f8ef] p-4 text-sm font-semibold leading-6 text-[#102015]">
              <input
                name="consent"
                type="checkbox"
                required
                className="mt-1"
              />
              I consent to OneFarmTech using these details to assess and contact
              me about this application.
            </label>

            <div className="hidden" aria-hidden="true">
              <label>
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <TurnstileWidget
              action="career_application"
              idleLabel="Submit application"
              pendingLabel="Submitting…"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={closeModal}
            className="mt-6 rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white"
          >
            Return to careers
          </button>
        )}

        <label className="grid gap-2 text-sm font-semibold">
          CV
          <input
            name="cv"
            type="file"
            required
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="min-h-12 rounded-xl border bg-white px-4 py-3 font-normal file:mr-4 file:rounded-full file:border-0 file:bg-[#eaf4e7] file:px-4 file:py-2 file:font-bold file:text-[#1f7a3f]"
          />
          <span className="text-xs font-normal text-[#587063]">
            PDF, DOC or DOCX. Maximum 5MB.
          </span>
        </label>
      </div>
    </div>
  );
}
