"use client";

import {useState} from "react";

type SupportChatLauncherProps = {
  label?: string;
  context?: string;
  defaultMessage?: string;
  variant?: "light" | "dark" | "green";
};

const supportTopics = [
  {
    label: "Order issue",
    message: "I need help with an order.",
  },
  {
    label: "Payment or receipt",
    message: "I need help with a payment or receipt.",
  },
  {
    label: "Credit/account terms",
    message: "I need help with my buyer account, credit limit, or payment terms.",
  },
  {
    label: "Delivery support",
    message: "I need help with delivery or fulfilment.",
  },
  {
    label: "General support",
    message: "I need support from the OneFarmTech team.",
  },
];

function makeWhatsAppUrl(message: string, context?: string) {
  const phone = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "";
  const fullMessage = context ? `${message}\n\nContext: ${context}` : message;
  const encoded = encodeURIComponent(fullMessage);

  if (!phone) {
    return `https://wa.me/?text=${encoded}`;
  }

  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encoded}`;
}

export default function SupportChatLauncher({
  label = "Contact support",
  context,
  defaultMessage,
  variant = "light",
}: SupportChatLauncherProps) {
  const [open, setOpen] = useState(false);

  const buttonClass =
    variant === "green"
      ? "bg-[#1f7a3f] text-white hover:bg-[#155c2f]"
      : variant === "dark"
        ? "border border-white/20 text-white hover:bg-white/10"
        : "border border-[#102015]/15 bg-white text-[#102015] hover:bg-[#f3f8ef]";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-full px-5 py-3 text-sm font-black shadow-sm transition ${buttonClass}`}
      >
        {label}
      </button>

      {open ? (
        <div
          className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:w-[26rem]"
          role="dialog"
          aria-modal="false"
          aria-label="OneFarmTech support chat"
        >
          <div className="max-h-[82vh] overflow-y-auto rounded-[2rem] border border-[#102015]/10 bg-white p-5 text-[#102015] shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
                  OneFarmTech support
                </p>
                <h2 className="mt-2 text-3xl font-black">How can we help?</h2>
                <p className="mt-2 text-sm leading-7 text-[#405348]">
                  Choose a support topic. For launch, this opens WhatsApp with a
                  prepared message. Later this can connect to the support chatbot.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3f8ef] text-xl font-black text-[#102015]"
                aria-label="Close support chat"
              >
                ×
              </button>
            </div>

            {defaultMessage ? (
              <a
                href={makeWhatsAppUrl(defaultMessage, context)}
                target="_blank"
                rel="noreferrer"
                className="mt-6 block rounded-2xl bg-[#1f7a3f] px-4 py-4 text-sm font-black text-white transition hover:bg-[#155c2f]"
              >
                Continue on WhatsApp
                <span className="mt-1 block text-xs font-semibold leading-6 text-white/80">
                  Opens WhatsApp with this request already prepared.
                </span>
              </a>
            ) : null}

            <div className="mt-6 grid gap-3">
              {supportTopics.map((topic) => (
                <a
                  key={topic.label}
                  href={makeWhatsAppUrl(topic.message, context)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-[#102015]/10 bg-[#fbfff8] px-4 py-4 text-sm font-black text-[#102015] transition hover:bg-[#f3f8ef]"
                >
                  {topic.label}
                  <span className="mt-1 block text-xs font-semibold leading-6 text-[#405348]">
                    Opens WhatsApp with a prepared support message.
                  </span>
                </a>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-[#f7f5ec] p-4 text-sm leading-7 text-[#405348]">
              WhatsApp chatbot integration can be connected here without changing
              the buyer account page again.
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
