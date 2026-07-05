import Link from "next/link";
import {notFound} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {formatNaira} from "@/lib/format";
import BrandMark from "@/components/BrandMark";

type ReceiptDetailPageProps = {
  params: Promise<{
    code: string;
  }>;
};

export default async function ReceiptDetailPage({params}: ReceiptDetailPageProps) {
  const {code} = await params;

  const receipt = await prisma.receipt.findUnique({
    where: {code},
    include: {
      order: {
        include: {
          items: true,
          payments: true,
          customer: true,
        },
      },
      payment: true,
      customer: true,
    },
  });

  if (!receipt) {
    notFound();
  }

  const buyer = receipt.customer || receipt.order.customer;
  const paymentReference = receipt.payment?.reference || receipt.order.payments[0]?.reference;
  const paymentProvider = receipt.payment?.provider || receipt.order.payments[0]?.provider;

  return (
    <main className="min-h-screen bg-[#F8F1E7] px-6 py-8 text-[#101712] print:bg-white print:px-0 print:py-0">
      <section className="mx-auto max-w-4xl rounded-[2rem] bg-white p-8 shadow-sm print:rounded-none print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-[#101712]/10 pb-6">
          <BrandMark />
          <div className="text-right">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#C95F3D]">
              Receipt
            </p>
            <h1 className="mt-2 text-3xl font-black">{receipt.code}</h1>
            <p className="mt-1 text-sm text-[#1E2420]/60">
              Issued {receipt.issuedAt.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <InfoBlock
            title="Buyer"
            rows={[
              ["Name", receipt.buyerName],
              ["Phone", receipt.order.phone],
              ["Email", receipt.buyerEmail || buyer?.email || "Not provided"],
              ["Buyer type", receipt.order.buyerType],
              ["Location", buyer?.location || "Not set"],
            ]}
          />

          <InfoBlock
            title="Order"
            rows={[
              ["Order code", receipt.order.code],
              ["Order type", receipt.order.orderType],
              ["Delivery method", receipt.order.deliveryMethod],
              ["Payment status", receipt.order.paymentStatus],
              ["Fulfilment status", receipt.order.fulfilmentStatus],
            ]}
          />
        </div>

        <section className="mt-8 rounded-[1.5rem] border border-[#101712]/10">
          <div className="grid grid-cols-[1.4fr_0.5fr_0.5fr_0.7fr] gap-3 border-b border-[#101712]/10 bg-white px-4 py-3 text-xs font-black uppercase tracking-wide text-[#102015]">
            <span>Item</span>
            <span>Qty</span>
            <span>Unit</span>
            <span className="text-right">Total</span>
          </div>

          {receipt.order.items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1.4fr_0.5fr_0.5fr_0.7fr] gap-3 border-b border-[#101712]/10 px-4 py-4 text-sm"
            >
              <div>
                <p className="font-black">{item.name}</p>
                <p className="mt-1 text-xs text-[#1E2420]/55">{item.grade}</p>
              </div>
              <span>{item.quantity}</span>
              <span>{item.unit}</span>
              <span className="text-right font-bold">{formatNaira(item.lineTotal)}</span>
            </div>
          ))}

          <div className="grid gap-2 px-4 py-5 text-right">
            <p className="text-sm text-[#1E2420]/60">
              Order total: <strong>{formatNaira(receipt.order.estimatedTotal)}</strong>
            </p>
            <p className="text-2xl font-black text-[#101712]">
              Receipt amount: {formatNaira(receipt.amount)}
            </p>
          </div>
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <InfoBlock
            title="Payment"
            rows={[
              ["Reference", paymentReference || "Manual / not linked"],
              ["Provider", paymentProvider || "Not specified"],
              ["Receipt status", receipt.status],
              ["Issued by", receipt.issuedBy],
            ]}
          />

          <div className="rounded-[1.5rem] bg-[#F8F1E7] p-5">
            <h2 className="text-lg font-black">Note</h2>
            <p className="mt-3 text-sm leading-7 text-[#1E2420]/70">
              This is a OneFarmTech electronic receipt record for a managed
              fresh food order. Automated PDF/email delivery will be connected
              after production authentication and payment infrastructure are ready.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 print:hidden">
          <div className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white">
            Press Cmd/Ctrl + P to print
          </div>
          <Link
            href="/admin/receipts"
            className="rounded-full border border-[#101712]/10 px-5 py-3 text-sm font-bold text-[#101712]"
          >
            Back to receipts
          </Link>
          <Link
            href={`/admin/orders/${receipt.order.code}`}
            className="rounded-full border border-[#101712]/10 px-5 py-3 text-sm font-bold text-[#101712]"
          >
            View order
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-[#1E2420]/45">
          OneFarmTech · Farm-to-city fresh food supply · WhatsApp-first operations
        </p>
      </section>
    </main>
  );
}

function InfoBlock({title, rows}: {title: string; rows: [string, string][]}) {
  return (
    <section className="rounded-[1.5rem] bg-[#F8F1E7] p-5">
      <h2 className="text-lg font-black">{title}</h2>
      <div className="mt-4 grid gap-3">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 border-b border-[#101712]/10 pb-2"
          >
            <span className="text-xs font-bold uppercase tracking-wide text-[#1E2420]/45">
              {label}
            </span>
            <span className="text-right text-sm font-bold">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
