"use client";

import {useTransition} from "react";
import {logPreparedBuyerWhatsAppAction} from "@/actions/createAdminRecords";
import {makeWhatsAppComposeUrl} from "@/lib/communications/whatsapp";

export default function BuyerWhatsAppComposeButton({
  customerId,
  phone,
  title,
  body,
  relatedType,
  relatedId,
  label = "Prepare WhatsApp",
}: {
  customerId: string;
  phone?: string | null;
  title: string;
  body: string;
  relatedType?: string;
  relatedId?: string;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const formData = new FormData();
    formData.set("customerId", customerId);
    formData.set("title", title);
    formData.set("body", body);

    if (relatedType) {
      formData.set("relatedType", relatedType);
    }

    if (relatedId) {
      formData.set("relatedId", relatedId);
    }

    startTransition(async () => {
      await logPreparedBuyerWhatsAppAction(formData);
      window.open(makeWhatsAppComposeUrl({phone, message: body}), "_blank", "noopener,noreferrer");
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#155c2f] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Preparing..." : label}
    </button>
  );
}
