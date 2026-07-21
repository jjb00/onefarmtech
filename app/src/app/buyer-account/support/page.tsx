import BuyerPortalFrame from "@/components/BuyerPortalFrame";
import SupportChatLauncher from "@/components/SupportChatLauncher";
import {requireBuyer} from "@/lib/currentBuyer";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BuyerSupportPage() {
  const {buyer, customer} = await requireBuyer();
  const unreadMessageCount = await prisma.buyerMessage.count({
    where: {
      customerId: customer.id,
      OR: [{readAt: null}, {status: {in: ["Unread", "Prepared", "Sent"]}}],
    },
  });

  return (
    <BuyerPortalFrame
      customerName={customer.name}
      buyerType={customer.buyerType}
      unreadMessageCount={unreadMessageCount}
      canPlaceOrders={buyer.canPlaceOrders}
      canViewReceipts={buyer.canViewReceipts}
    >
      <section className="rounded-[2rem] border border-[#102015]/10 bg-white/95 p-6 shadow-sm backdrop-blur">
        <h2 className="text-3xl font-black">Support</h2>
        <p className="mt-2 text-sm leading-7 text-[#405348]">
          Get help with orders, receipts, payments, credit, contacts or account details.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <SupportTile label="Order support" message={`I need help with an order for ${customer.name}.`} context={`Buyer support: ${customer.name} · Orders`} />
          <SupportTile label="Payment support" message={`I need help with payment or receipts for ${customer.name}.`} context={`Buyer support: ${customer.name} · Payments`} />
          <SupportTile label="Credit support" message={`I need help with credit or payment terms for ${customer.name}.`} context={`Buyer support: ${customer.name} · Credit`} />
          <SupportTile label="Account support" message={`I need help with buyer account details for ${customer.name}.`} context={`Buyer support: ${customer.name} · Account`} />
        </div>
      </section>
    </BuyerPortalFrame>
  );
}

function SupportTile({
  label,
  message,
  context,
}: {
  label: string;
  message: string;
  context: string;
}) {
  return (
    <div className="rounded-2xl border border-[#102015]/10 bg-[#fbfff8] p-5 shadow-sm">
      <h3 className="text-lg font-black">{label}</h3>
      <div className="mt-4">
        <SupportChatLauncher label={label} defaultMessage={message} context={context} />
      </div>
    </div>
  );
}
