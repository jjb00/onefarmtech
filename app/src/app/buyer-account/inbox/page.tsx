import BuyerPortalFrame from "@/components/BuyerPortalFrame";
import SupportChatLauncher from "@/components/SupportChatLauncher";
import {requireBuyer} from "@/lib/currentBuyer";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BuyerInboxPage() {
  const {customer} = await requireBuyer();

  const messages = await prisma.buyerMessage.findMany({
    where: {customerId: customer.id},
    orderBy: {createdAt: "desc"},
    take: 100,
  });

  const unreadCount = messages.filter((message) => !message.readAt).length;

  return (
    <BuyerPortalFrame customerName={customer.name} buyerType={customer.buyerType}>
      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Notifications
            </p>
            <h2 className="mt-2 text-3xl font-black">Inbox</h2>
            <p className="mt-2 text-sm leading-7 text-[#405348]">
              Messages, notices and communication records linked to this buyer account.
            </p>
          </div>

          <div className="rounded-2xl bg-[#f3f8ef] px-5 py-4 text-center">
            <p className="text-2xl font-black text-[#1f7a3f]">{unreadCount}</p>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#587063]">
              Unread
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          {messages.map((message) => (
            <article
              key={message.id}
              className="rounded-2xl border border-[#102015]/10 bg-[#fbfff8] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-[#102015]">{message.title}</p>
                    {!message.readAt ? (
                      <span className="rounded-full bg-[#1f7a3f]/10 px-3 py-1 text-xs font-black text-[#1f7a3f]">
                        New
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#405348]">
                    {message.body}
                  </p>
                </div>

                <div className="text-right text-xs font-bold text-[#587063]">
                  <p>{message.channel}</p>
                  <p className="mt-1">{message.status}</p>
                  <p className="mt-1">{message.createdAt.toLocaleString()}</p>
                </div>
              </div>

              {message.relatedType || message.recipient ? (
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-[#587063]">
                  {message.relatedType ? (
                    <span className="rounded-full bg-white px-3 py-1">
                      {message.relatedType}
                    </span>
                  ) : null}
                  {message.recipient ? (
                    <span className="rounded-full bg-white px-3 py-1">
                      {message.recipient}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}

          {!messages.length ? (
            <div className="rounded-2xl bg-[#f7f5ec] p-6 text-sm leading-7 text-[#405348]">
              No account messages yet. Order confirmations, payment notices, support
              updates and WhatsApp/email records will appear here.
            </div>
          ) : null}
        </div>

        <div className="mt-6">
          <SupportChatLauncher
            label="Message support"
            context={`Buyer inbox: ${customer.name}`}
            defaultMessage={`I need help with a message or notification on my OneFarmTech buyer account for ${customer.name}.`}
          />
        </div>
      </section>
    </BuyerPortalFrame>
  );
}
