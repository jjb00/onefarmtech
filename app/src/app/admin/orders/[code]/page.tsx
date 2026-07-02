import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import StatusBadge from "@/components/admin/StatusBadge";
import { getMockOrderByCode, mockOrders } from "@/data/mockOrders";

type OrderDetailPageProps = {
  params: Promise<{
    code: string;
  }>;
};

export function generateStaticParams() {
  return mockOrders.map((order) => ({
    code: order.code,
  }));
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { code } = await params;
  const order = getMockOrderByCode(code);

  if (!order) {
    notFound();
  }

  return (
    <AdminShell
      title={order.code}
      description="Order detail view for admin review, payment tracking, sourcing, delivery, and issue handling."
      action={
        <Link
          href="/admin/orders"
          className="rounded-full bg-[#9ee6ad] px-6 py-4 text-center font-semibold text-[#102015]"
        >
          Back to orders
        </Link>
      }
    >
      <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
          <h2 className="text-2xl font-bold">Order summary</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-[#f7f5ec] p-5">
              <p className="text-sm text-[#405348]">Buyer</p>
              <p className="mt-1 text-xl font-bold">{order.buyer}</p>
              <p className="mt-1 text-sm text-[#405348]">{order.buyerType}</p>
            </div>

            <div className="rounded-2xl bg-[#f7f5ec] p-5">
              <p className="text-sm text-[#405348]">Contact</p>
              <p className="mt-1 text-xl font-bold">{order.phone}</p>
            </div>

            <div className="rounded-2xl bg-[#f7f5ec] p-5">
              <p className="text-sm text-[#405348]">Items</p>
              <p className="mt-1 text-xl font-bold">{order.items}</p>
            </div>

            <div className="rounded-2xl bg-[#f7f5ec] p-5">
              <p className="text-sm text-[#405348]">Total</p>
              <p className="mt-1 text-xl font-bold">{order.total}</p>
            </div>

            <div className="rounded-2xl bg-[#f7f5ec] p-5">
              <p className="text-sm text-[#405348]">Payment</p>
              <div className="mt-2">
                <StatusBadge status={order.paymentStatus} />
              </div>
            </div>

            <div className="rounded-2xl bg-[#f7f5ec] p-5">
              <p className="text-sm text-[#405348]">Fulfilment</p>
              <p className="mt-1 text-xl font-bold">{order.fulfilmentStatus}</p>
            </div>

            <div className="rounded-2xl bg-[#f7f5ec] p-5">
              <p className="text-sm text-[#405348]">Delivery</p>
              <p className="mt-1 text-xl font-bold">{order.delivery}</p>
            </div>

            <div className="rounded-2xl bg-[#f7f5ec] p-5">
              <p className="text-sm text-[#405348]">Order type</p>
              <p className="mt-1 text-xl font-bold">{order.orderType}</p>
            </div>
          </div>
        </div>

        <aside className="rounded-[2rem] bg-white/10 p-6 text-white">
          <h2 className="text-2xl font-bold">Admin checklist</h2>
          <div className="mt-6 grid gap-4">
            {[
              "Confirm payment reference",
              "Confirm produce grade and quantity",
              "Assign supplier or sourcing route",
              "Record quality check before dispatch",
              "Confirm delivery method and fee",
              "Send buyer update on WhatsApp",
              "Mark order completed or issue reported",
            ].map((step, index) => (
              <div key={step} className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-[#9ee6ad]">Step {index + 1}</p>
                <p className="mt-1 font-semibold">{step}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </AdminShell>
  );
}
