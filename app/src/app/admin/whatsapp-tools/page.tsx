import Link from "next/link";
import {AdminPage} from "@/components/portal/AdminPage";
import {
  sendWhatsAppProductListAction,
  sendWhatsAppStorefrontMenuAction,
} from "@/actions/createAdminRecords";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {
  buildWhatsAppProductListMessage,
  formatWhatsAppNaira,
  isProductAvailableForWhatsApp,
} from "@/lib/whatsapp/productCatalogue";
import {buildWhatsAppStorefrontMenuMessage} from "@/lib/whatsapp/storefrontMenu";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminWhatsAppToolsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff();

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const catalogueStatus =
    typeof resolvedSearchParams.catalogue === "string" ? resolvedSearchParams.catalogue : "";
  const menuStatus =
    typeof resolvedSearchParams.menu === "string" ? resolvedSearchParams.menu : "";
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : "";

  const products = await prisma.product.findMany({
    where: {
      status: "Active",
    },
    orderBy: [{category: "asc"}, {name: "asc"}],
    select: {
      id: true,
      name: true,
      category: true,
      unit: true,
      grade: true,
      basePrice: true,
      availability: true,
      status: true,
    },
  });

  const availableProducts = products.filter(isProductAvailableForWhatsApp);
  const productListMessage = buildWhatsAppProductListMessage(availableProducts);
  const storefrontMenuMessage = buildWhatsAppStorefrontMenuMessage();

  return (
    <AdminPage
      title="WhatsApp message tools"
      subtitle="Storefront messages generated from live OneFarmTech operating records."
    >
      {catalogueStatus === "sent" ? (
        <section className="rounded-[2rem] border border-[#1f7a3f]/20 bg-[#eef6ea] p-5 text-sm font-bold text-[#1f7a3f]">
          Product list sent by WhatsApp and logged where a buyer record was matched or created.
        </section>
      ) : null}

      {menuStatus === "sent" ? (
        <section className="rounded-[2rem] border border-[#1f7a3f]/20 bg-[#eef6ea] p-5 text-sm font-bold text-[#1f7a3f]">
          Storefront menu sent by WhatsApp and logged as buyer message evidence.
        </section>
      ) : null}

      {error ? (
        <section className="rounded-[2rem] border border-[#d9471f]/30 bg-[#fff4ef] p-5 text-sm font-bold text-[#9b2f12]">
          {error === "missing-phone"
            ? "Enter the buyer WhatsApp phone number."
            : error === "send-failed"
              ? "WhatsApp message could not be sent. Check the phone number, token and Meta test recipient setup."
              : "The WhatsApp message could not be sent."}
        </section>
      ) : null}

      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              WhatsApp storefront
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#102015]">
              Buyer-facing message tools
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
              Send a guided menu for new buyers or a live product list from the active catalogue.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/products"
              className="rounded-full border border-[#102015]/15 bg-white px-5 py-3 text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
            >
              Manage products
            </Link>
            <Link
              href="/admin/whatsapp-orders/new"
              className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
            >
              Create WhatsApp order
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <details open className="rounded-2xl border border-[#102015]/10 bg-[#eef6ea] p-5">
            <summary className="cursor-pointer">
              <span className="text-xl font-black text-[#102015]">
                WhatsApp storefront menu
              </span>
              <span className="ml-3 rounded-full bg-white px-3 py-1 text-sm font-black text-[#1f7a3f]">
                Front door
              </span>
            </summary>

            <pre className="mt-5 whitespace-pre-wrap rounded-2xl bg-white p-5 text-sm leading-7 text-[#102015]">
{storefrontMenuMessage}
            </pre>

            <form action={sendWhatsAppStorefrontMenuAction} className="mt-5 rounded-2xl bg-white p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <label className="grid gap-2 text-sm font-bold text-[#405348]">
                  Send menu to WhatsApp number
                  <input
                    name="recipientPhone"
                    required
                    className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
                    placeholder="+234..."
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white hover:bg-[#155c2f]"
                >
                  Send menu
                </button>
              </div>
              <p className="mt-3 text-xs font-bold leading-6 text-[#405348]">
                Use this as the first message for new buyers. It guides them into product discovery, ordering, payment, delivery, complaints or support.
              </p>
            </form>
          </details>

          <details open className="rounded-2xl border border-[#102015]/10 bg-[#f7f5ec] p-5">
            <summary className="cursor-pointer">
              <span className="text-xl font-black text-[#102015]">
                Copy-ready product list
              </span>
              <span className="ml-3 rounded-full bg-[#eef6ea] px-3 py-1 text-sm font-black text-[#1f7a3f]">
                {availableProducts.length} available
              </span>
            </summary>

            <pre className="mt-5 whitespace-pre-wrap rounded-2xl bg-white p-5 text-sm leading-7 text-[#102015]">
{productListMessage}
            </pre>

            <form action={sendWhatsAppProductListAction} className="mt-5 rounded-2xl bg-white p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <label className="grid gap-2 text-sm font-bold text-[#405348]">
                  Send to WhatsApp number
                  <input
                    name="recipientPhone"
                    required
                    className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
                    placeholder="+234..."
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white hover:bg-[#155c2f]"
                  disabled={availableProducts.length === 0}
                >
                  Send product list
                </button>
              </div>
              <p className="mt-3 text-xs font-bold leading-6 text-[#405348]">
                Sends through Meta WhatsApp Cloud API. Unknown numbers get a lightweight WhatsApp buyer record so outbound evidence is retained.
              </p>
            </form>
          </details>

          <details className="rounded-2xl border border-[#102015]/10 bg-white p-5">
            <summary className="cursor-pointer text-xl font-black text-[#102015]">
              Product snapshot
            </summary>

            <div className="mt-4 grid gap-3">
              {availableProducts.length === 0 ? (
                <p className="rounded-2xl bg-[#f7f5ec] p-4 text-sm leading-7 text-[#405348]">
                  No active available products. Update the product catalogue before sending product lists.
                </p>
              ) : (
                availableProducts.map((product) => (
                  <div key={product.id} className="rounded-2xl bg-[#f7f5ec] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-[#102015]">{product.name}</p>
                        <p className="text-sm text-[#405348]">
                          {product.category} · {product.grade} · {product.unit} · {product.availability}
                        </p>
                      </div>
                      <p className="font-black text-[#102015]">
                        {formatWhatsAppNaira(product.basePrice)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </details>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
          Where this fits
        </p>
        <h3 className="mt-2 text-xl font-black text-[#102015]">
          Use this page for buyer-facing WhatsApp storefront messages.
        </h3>
        <p className="mt-2 text-sm leading-7 text-[#405348]">
          For inbound review, open the WhatsApp inbox. For confirmed order creation, use WhatsApp order entry.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/admin/buyer-messages?view=whatsapp" className="rounded-full bg-[#102015] px-5 py-3 text-sm font-black text-white">Open unified Inbox</Link>
          <Link
            href="/admin/whatsapp-inbox"
            className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white hover:bg-[#155c2f]"
          >
            Open WhatsApp inbox
          </Link>
          <Link
            href="/admin/whatsapp"
            className="rounded-full border border-[#102015]/15 bg-white px-5 py-3 text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
          >
            WhatsApp ops
          </Link>
          <Link
            href="/admin/operations"
            className="rounded-full border border-[#102015]/15 bg-white px-5 py-3 text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
          >
            Operations hub
          </Link>
        </div>
      </section>
    </AdminPage>
  );
}
