import Link from "next/link";
import {AdminPage} from "@/components/portal/AdminPage";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatNaira(amount: number | null | undefined) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function buildProductListMessage(products: Array<{
  name: string;
  category: string;
  unit: string;
  grade: string;
  basePrice: number;
  availability: string;
}>) {
  if (products.length === 0) {
    return "Hello, thank you for contacting OneFarmTech. Our available product list is being updated. Please check back shortly.";
  }

  const lines = products.map((product, index) => {
    return `${index + 1}. ${product.name} (${product.grade}) — ${formatNaira(product.basePrice)} / ${product.unit}`;
  });

  return [
    "Hello, thank you for contacting OneFarmTech.",
    "",
    "Available produce today:",
    ...lines,
    "",
    "Please reply with the item number and quantity.",
    "Example: 1 x 2, 3 x 1",
    "",
    "Prices are subject to confirmation based on availability, delivery location and order timing.",
  ].join("\\n");
}

export default async function AdminWhatsAppToolsPage() {
  await requireStaff();

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
    },
  });

  const availableProducts = products.filter((product) =>
    ["available", "in stock", "active"].includes(product.availability.toLowerCase())
  );

  const productListMessage = buildProductListMessage(availableProducts);

  return (
    <AdminPage
      title="WhatsApp message tools"
      subtitle="Copy-ready WhatsApp utilities generated from live operating records."
    >
      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Message utility
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#102015]">
              Product availability message
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
              Use this page when a buyer asks what is available. It pulls from the live product catalogue and keeps the operational workflow compact.
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
                          {product.category} · {product.grade} · {product.unit}
                        </p>
                      </div>
                      <p className="font-black text-[#102015]">
                        {formatNaira(product.basePrice)}
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
          Use this page only for copy-ready message utilities.
        </h3>
        <p className="mt-2 text-sm leading-7 text-[#405348]">
          For active order confirmations, reminders and delivery updates, use WhatsApp ops. For the wider operating map, use Operations hub.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
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
  );
}
