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
      title="WhatsApp tools"
      subtitle="Copy-ready WhatsApp messages generated from the live product catalogue."
    >
      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Product list
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#102015]">
              Available products message
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
              Use this message when a buyer asks what is available on WhatsApp. It is generated from active, available products.
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

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl bg-[#f7f5ec] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-black text-[#102015]">
                Copy-ready message
              </h3>
              <span className="rounded-full bg-[#eef6ea] px-4 py-2 text-sm font-black text-[#1f7a3f]">
                {availableProducts.length} available
              </span>
            </div>

            <pre className="mt-5 whitespace-pre-wrap rounded-2xl bg-white p-5 text-sm leading-7 text-[#102015]">
{productListMessage}
            </pre>
          </div>

          <div className="rounded-2xl border border-[#102015]/10 p-5">
            <h3 className="text-xl font-black text-[#102015]">
              Product snapshot
            </h3>

            <div className="mt-4 grid gap-3">
              {availableProducts.length === 0 ? (
                <p className="text-sm leading-7 text-[#405348]">
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
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link
          href="/admin/whatsapp-orders/new"
          className="rounded-[2rem] bg-white p-6 shadow-sm hover:shadow-md"
        >
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
            Next
          </p>
          <h3 className="mt-3 text-xl font-black text-[#102015]">
            Create WhatsApp order
          </h3>
          <p className="mt-2 text-sm leading-7 text-[#405348]">
            Turn a buyer reply into a real order with items, total, payment request and delivery record.
          </p>
        </Link>

        <Link
          href="/admin/payment-requests"
          className="rounded-[2rem] bg-white p-6 shadow-sm hover:shadow-md"
        >
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
            Payment
          </p>
          <h3 className="mt-3 text-xl font-black text-[#102015]">
            Payment requests
          </h3>
          <p className="mt-2 text-sm leading-7 text-[#405348]">
            Confirm payment references, update payment status and issue receipts.
          </p>
        </Link>

        <Link
          href="/admin/deliveries"
          className="rounded-[2rem] bg-white p-6 shadow-sm hover:shadow-md"
        >
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
            Fulfilment
          </p>
          <h3 className="mt-3 text-xl font-black text-[#102015]">
            Deliveries
          </h3>
          <p className="mt-2 text-sm leading-7 text-[#405348]">
            Assign delivery partners and track delivery progress.
          </p>
        </Link>
      </section>
    </AdminPage>
  );
}
