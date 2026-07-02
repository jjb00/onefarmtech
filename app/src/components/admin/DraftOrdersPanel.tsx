"use client";

import { useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import {
  clearDraftOrders,
  deleteDraftOrder,
  getDraftOrders,
} from "@/lib/draftOrders";
import { formatNaira } from "@/lib/format";
import type { DraftOrder } from "@/types/draftOrder";

type DraftOrdersPanelProps = {
  compact?: boolean;
};

export default function DraftOrdersPanel({ compact = false }: DraftOrdersPanelProps) {
  const [drafts, setDrafts] = useState<DraftOrder[]>(() => getDraftOrders());

  function handleDelete(id: string) {
    setDrafts(deleteDraftOrder(id));
  }

  function handleClear() {
    setDrafts(clearDraftOrders());
  }

  if (drafts.length === 0) {
    return (
      <div className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
        <h2 className="text-2xl font-bold">Draft orders</h2>
        <p className="mt-3 text-sm leading-6 text-[#405348]">
          No draft orders saved in this browser yet. Use the create-order page to
          save a local draft before connecting a real database.
        </p>
        <Link
          href="/admin/create-order"
          className="mt-6 inline-flex rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-semibold text-white"
        >
          Create draft order
        </Link>
      </div>
    );
  }

  return (
    <section className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Draft orders</h2>
          <p className="mt-2 text-sm text-[#405348]">
            Browser-only saved drafts. These are not yet in a database.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/create-order"
            className="rounded-full bg-[#1f7a3f] px-4 py-2 text-sm font-semibold text-white"
          >
            New draft
          </Link>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-[#405348]"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className={compact ? "mt-6 grid gap-4" : "mt-6 grid gap-4 lg:grid-cols-2"}>
        {drafts.map((draft) => (
          <article key={draft.id} className="rounded-2xl bg-[#f7f5ec] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1f7a3f]">
                  {draft.code}
                </p>
                <h3 className="mt-1 text-xl font-bold">
                  {draft.buyerName || "Unnamed buyer"}
                </h3>
                <p className="mt-2 text-sm text-[#405348]">
                  {draft.produceItem} · {draft.quantity || "No quantity"} ·{" "}
                  {draft.deliveryMethod}
                </p>
              </div>

              <div className="text-left md:text-right">
                <p className="font-bold">
                  {draft.estimatedTotal
                    ? formatNaira(draft.estimatedTotal)
                    : "₦0"}
                </p>
                <div className="mt-2">
                  <StatusBadge status={draft.paymentStatus} />
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-xl bg-white p-3">
                <p className="text-[#405348]">Order type</p>
                <p className="font-semibold">{draft.orderType}</p>
              </div>
              <div className="rounded-xl bg-white p-3">
                <p className="text-[#405348]">Fulfilment</p>
                <p className="font-semibold">{draft.fulfilmentStatus}</p>
              </div>
            </div>

            {!compact && (
              <details className="mt-4 rounded-xl bg-white p-4">
                <summary className="cursor-pointer text-sm font-semibold">
                  View WhatsApp/payment notes
                </summary>
                <pre className="mt-3 whitespace-pre-wrap text-xs leading-5 text-[#405348]">
                  {draft.whatsappPreview}
                </pre>
                <pre className="mt-3 whitespace-pre-wrap border-t border-gray-100 pt-3 text-xs leading-5 text-[#405348]">
                  {draft.paymentInstruction}
                </pre>
              </details>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(draft.whatsappPreview)}
                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#405348]"
              >
                Copy WhatsApp
              </button>
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard.writeText(draft.paymentInstruction)
                }
                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#405348]"
              >
                Copy payment note
              </button>
              <button
                type="button"
                onClick={() => handleDelete(draft.id)}
                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#9f1d1d]"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
