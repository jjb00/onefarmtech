import Link from "next/link";
import BuyerPortalFrame from "@/components/BuyerPortalFrame";
import SupportChatLauncher from "@/components/SupportChatLauncher";
import {requireBuyer} from "@/lib/currentBuyer";
import {formatNaira} from "@/lib/format";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BuyerOrdersPage() {
  const {customer} = await requireBuyer();

  return (
    <BuyerPortalFrame customerName={customer.name} buyerType={customer.buyerType}>
      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black">Orders</h2>
            <p className="mt-2 text-sm leading-7 text-[#405348]">
              Orders linked to this buyer account.
            </p>
          </div>
          <Link
            href="/buyer-account/order"
            className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white"
          >
            New buyer order
          </Link>
        </div>

        <div className="mt-6 grid gap-3">
          {customer.orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-[#102015]/10 bg-[#fbfff8] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-black"><Link href={`/buyer-account/orders/${order.id}`} className="text-[#1f7a3f] underline underline-offset-4">{order.code}</Link></p>
                  <p className="mt-1 text-sm text-[#405348]">
                    {order.deliveryMethod} · {order.fulfilmentStatus}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black">{formatNaira(order.estimatedTotal)}</p>
                  <p className="mt-1 text-xs font-bold text-[#405348]">{order.paymentStatus}</p>
                </div>
              </div>
            </div>
          ))}

          {!customer.orders.length ? (
            <p className="rounded-2xl bg-[#f7f5ec] p-4 text-sm text-[#405348]">
              No linked orders yet.
            </p>
          ) : null}
        </div>

        <div className="mt-6">
          <SupportChatLauncher
            label="Order support"
            context={`Buyer orders: ${customer.name}`}
            defaultMessage={`I need help with my OneFarmTech orders for ${customer.name}.`}
          />
        </div>
      </section>
    </BuyerPortalFrame>
  );
}
