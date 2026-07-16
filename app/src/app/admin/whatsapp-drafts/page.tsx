// @ts-nocheck -- draft order review queue for inbound WhatsApp messages
import Link from "next/link";
import {AdminPage} from "@/components/portal/AdminPage";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function parseNote(note: string | null | undefined) {
  try {
    return JSON.parse(note || "{}");
  } catch {
    return {};
  }
}

export default async function AdminWhatsAppDraftsPage() {
  await requireStaff();

  const drafts = await prisma.orderRequest.findMany({
    where: {
      source: "WhatsApp inbound draft",
    },
    orderBy: {createdAt: "desc"},
    take: 100,
  });

  const activeDrafts = drafts.filter((draft) => draft.status !== "Converted to order");
  const convertedDrafts = drafts.filter((draft) => draft.status === "Converted to order");

  return (
    <AdminPage
      title="WhatsApp draft orders"
      subtitle="WhatsApp storefront order queue. Review parsed messages, clarify where needed, then convert them into confirmed orders."
    >
      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Draft order queue
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#102015]">
              WhatsApp order drafts
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
              These are not confirmed orders. Staff should review the message, clarify details on WhatsApp if needed, then create a proper WhatsApp-assisted order.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/admin/buyer-messages?view=whatsapp" className="rounded-full bg-[#102015] px-4 py-2 text-sm font-black text-white">Open unified Inbox</Link>
            <Link
              href="/admin/integration-readiness"
              className="rounded-full border border-[#102015]/15 bg-white px-4 py-2 text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
            >
              Integration readiness
            </Link>
            <Link
              href="/admin/whatsapp-orders/new"
              className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white hover:bg-[#155c2f]"
            >
              Create WhatsApp order
            </Link>
            <Link
              href="/admin/whatsapp-inbox"
              className="rounded-full border border-[#102015]/15 bg-white px-5 py-3 text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
            >
              WhatsApp inbox
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-[#fff6d6] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7a4a00]">
              Needs review
            </p>
            <p className="mt-2 text-3xl font-black text-[#102015]">{activeDrafts.length}</p>
          </div>
          <div className="rounded-2xl bg-[#eef6ea] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">
              Converted
            </p>
            <p className="mt-2 text-3xl font-black text-[#102015]">{convertedDrafts.length}</p>
          </div>
          <div className="rounded-2xl bg-[#f7f5ec] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#405348]">
              Total storefront drafts
            </p>
            <p className="mt-2 text-3xl font-black text-[#102015]">{drafts.length}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {drafts.length === 0 ? (
            <div className="rounded-2xl bg-[#f7f5ec] p-5 text-sm leading-7 text-[#405348]">
              No WhatsApp draft orders yet.
            </div>
          ) : (
            drafts.map((draft) => {
              const note = parseNote(draft.adminNote);
              const isConverted = draft.status === "Converted to order";
              const convertedOrderId = note.convertedOrderId;
              const convertedOrderCode = note.convertedOrderCode;

              return (
                <article
                  key={draft.id}
                  className={`rounded-[1.5rem] border p-5 ${
                    isConverted ? "border-[#1f7a3f]/20 bg-[#eef6ea]" : "border-[#102015]/10 bg-white"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#fff6d6] px-3 py-1 text-xs font-black text-[#7a4a00]">
                          {draft.status}
                        </span>
                        <span className="rounded-full bg-[#f3f8ef] px-3 py-1 text-xs font-black text-[#405348]">
                          Confidence: {note.confidence || "Unknown"}
                        </span>
                      </div>
                      <h3 className="mt-3 text-xl font-black text-[#102015]">
                        {draft.buyerName}
                      </h3>
                      <p className="mt-1 text-sm leading-7 text-[#405348]">
                        {draft.phone} · {draft.location || "Location not parsed"} · {formatDate(draft.createdAt)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-[#405348]">
                        {note.intent ? <span>Intent: {note.intent}</span> : null}
                        {note.messageId ? <span>Meta ID logged</span> : null}
                        {convertedOrderCode ? <span>Converted: {convertedOrderCode}</span> : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {isConverted && convertedOrderId ? (
                        <Link
                          href={`/admin/orders/${convertedOrderId}`}
                          className="rounded-full bg-[#1f7a3f] px-4 py-2 text-sm font-black text-white hover:bg-[#155c2f]"
                        >
                          Open {convertedOrderCode || "order"}
                        </Link>
                      ) : (
                        <Link
                          href={`/admin/whatsapp-orders/new?draftId=${draft.id}`}
                          className="rounded-full bg-[#1f7a3f] px-4 py-2 text-sm font-black text-white hover:bg-[#155c2f]"
                        >
                          Convert to order
                        </Link>
                      )}
                      <Link
                        href={`/admin/order-requests`}
                        className="rounded-full border border-[#102015]/15 bg-white px-4 py-2 text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
                      >
                        Order requests
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl bg-[#f7f5ec] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#405348]">
                        Parsed items
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#102015]">
                        {draft.items}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#f7f5ec] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#405348]">
                        Original message
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#102015]">
                        {draft.message || "No message body"}
                      </p>
                    </div>
                  </div>

                  <div className={`mt-4 rounded-2xl p-4 text-sm leading-7 ${
                    isConverted ? "bg-white text-[#1f7a3f]" : "bg-[#fff6d6] text-[#7a4a00]"
                  }`}>
                    {isConverted
                      ? `Converted into ${convertedOrderCode || "an order"}. Use the linked order record for payment, receipt and delivery.`
                      : "Staff action: confirm buyer, quantity, delivery address, delivery fee and payment method, then convert this WhatsApp storefront draft into an order."}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </AdminPage>
  );
}
