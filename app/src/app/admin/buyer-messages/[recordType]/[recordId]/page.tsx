import Link from "next/link";
import {notFound} from "next/navigation";
import AdminPageShell from "@/components/AdminPageShell";
import {
  createWhatsAppConversationBuyerAction,
  linkWhatsAppConversationBuyerAction,
  sendWhatsAppConversationReplyAction,
  startWhatsAppOrderFromConversationAction,
} from "@/actions/whatsappConversation";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {phoneMatchCandidates} from "@/lib/whatsapp/phone";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RecordType = "BuyerMessage" | "ContactEnquiry";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en-GB", {timeZone: "Africa/Lagos", 
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function WhatsAppConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{recordType: string; recordId: string}>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff();

  const {recordType: rawRecordType, recordId} = await params;
  const query = (await searchParams) || {};
  const recordType = rawRecordType as RecordType;

  if (!["BuyerMessage", "ContactEnquiry"].includes(recordType)) {
    notFound();
  }

  const buyerMessage =
    recordType === "BuyerMessage"
      ? await prisma.buyerMessage.findUnique({
          where: {id: recordId},
          include: {customer: true},
        })
      : null;

  const contactEnquiry =
    recordType === "ContactEnquiry"
      ? await prisma.contactEnquiry.findUnique({
          where: {id: recordId},
        })
      : null;

  if (!buyerMessage && !contactEnquiry) notFound();

  const sourcePhone =
    buyerMessage?.recipient ||
    buyerMessage?.customer.phone ||
    contactEnquiry?.phone ||
    "";

  const candidates = phoneMatchCandidates(sourcePhone);

  const matchedContact = candidates.length
    ? await prisma.buyerContact.findFirst({
        where: {phone: {in: candidates}},
        include: {customer: true},
      })
    : null;

  const matchedCustomer =
    buyerMessage?.customer ||
    matchedContact?.customer ||
    (candidates.length
      ? await prisma.customer.findFirst({
          where: {phone: {in: candidates}},
        })
      : null);

  const [buyerMessages, enquiries, customers] = await Promise.all([
    prisma.buyerMessage.findMany({
      where: {
        OR: [
          ...(candidates.length ? [{recipient: {in: candidates}}] : []),
          ...(matchedCustomer ? [{customerId: matchedCustomer.id}] : []),
        ],
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {createdAt: "asc"},
      take: 200,
    }),
    candidates.length
      ? prisma.contactEnquiry.findMany({
          where: {
            enquiryType: "WhatsApp inbound",
            phone: {in: candidates},
          },
          orderBy: {createdAt: "asc"},
          take: 200,
        })
      : [],
    prisma.customer.findMany({
      where: {status: "Active"},
      select: {
        id: true,
        name: true,
        phone: true,
        buyerType: true,
      },
      orderBy: {name: "asc"},
      take: 500,
    }),
  ]);

  const messages = [
    ...buyerMessages.map((message) => ({
      key: `buyer:${message.id}`,
      direction: message.direction,
      body: message.body,
      title: message.title,
      status: message.status,
      createdAt: message.createdAt,
      sender:
        message.direction === "Inbound"
          ? message.customer.name
          : "OneFarmTech",
    })),
    ...enquiries.map((message) => ({
      key: `enquiry:${message.id}`,
      direction: "Inbound",
      body: message.message,
      title: "Inbound WhatsApp",
      status: message.status,
      createdAt: message.createdAt,
      sender: message.name || "Unknown buyer",
    })),
  ].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const sourceName =
    buyerMessage?.customer.name ||
    contactEnquiry?.name ||
    "Unknown buyer";

  const error = firstValue(query.error);

  return (
    <AdminPageShell
      title={matchedCustomer?.name || sourceName || "WhatsApp conversation"}
      description={`${sourcePhone || "No phone recorded"} · WhatsApp conversation`}
      compactHeader
    >
      <div className="grid gap-5">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/buyer-messages"
            className="rounded-full border border-[#102015]/15 bg-white px-4 py-2 text-sm font-black text-[#102015]"
          >
            Back to messages
          </Link>

          {matchedCustomer ? (
            <Link
              href={`/admin/customers/${matchedCustomer.id}`}
              className="rounded-full border border-[#1f7a3f]/20 bg-white px-4 py-2 text-sm font-black text-[#1f7a3f]"
            >
              Open buyer
            </Link>
          ) : null}

          <form action={startWhatsAppOrderFromConversationAction}>
            <input type="hidden" name="recordType" value={recordType} />
            <input type="hidden" name="recordId" value={recordId} />
            <button className="rounded-full bg-[#102015] px-4 py-2 text-sm font-black text-white">
              Start order
            </button>
          </form>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[#d9471f]/25 bg-[#fff4ef] p-4 text-sm font-bold text-[#9b2f12]">
            {decodeURIComponent(error)}
          </div>
        ) : null}

        <section className="rounded-2xl border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-black text-[#102015]">
                {matchedCustomer
                  ? `Linked to ${matchedCustomer.name}`
                  : "Unknown buyer"}
              </p>
              <p className="mt-1 text-sm text-[#587063]">
                {sourcePhone || "No phone recorded"}
              </p>
            </div>

            <span className="rounded-full bg-[#eef6ea] px-3 py-1 text-xs font-black text-[#1f7a3f]">
              {messages.length} messages
            </span>
          </div>
        </section>

        {!matchedCustomer ? (
          <section className="grid gap-4 lg:grid-cols-2">
            <form
              action={linkWhatsAppConversationBuyerAction}
              className="rounded-2xl border bg-white p-5"
            >
              <input type="hidden" name="recordType" value={recordType} />
              <input type="hidden" name="recordId" value={recordId} />

              <h2 className="font-black text-[#102015]">
                Link existing buyer
              </h2>

              <select
                name="customerId"
                required
                className="mt-4 w-full rounded-xl border border-[#102015]/15 bg-white px-4 py-3 text-sm"
              >
                <option value="">Choose buyer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} · {customer.phone} · {customer.buyerType}
                  </option>
                ))}
              </select>

              <button className="mt-4 w-full rounded-full bg-[#1f7a3f] px-4 py-3 text-sm font-black text-white">
                Link buyer
              </button>
            </form>

            <form
              action={createWhatsAppConversationBuyerAction}
              className="rounded-2xl border bg-white p-5"
            >
              <input type="hidden" name="recordType" value={recordType} />
              <input type="hidden" name="recordId" value={recordId} />

              <h2 className="font-black text-[#102015]">
                Create new buyer
              </h2>

              <div className="mt-4 grid gap-3">
                <input
                  name="name"
                  required
                  defaultValue={sourceName}
                  placeholder="Buyer name"
                  className="rounded-xl border border-[#102015]/15 px-4 py-3 text-sm"
                />

                <input
                  name="email"
                  type="email"
                  placeholder="Email, optional"
                  className="rounded-xl border border-[#102015]/15 px-4 py-3 text-sm"
                />

                <select
                  name="buyerType"
                  defaultValue="WhatsApp buyer"
                  className="rounded-xl border border-[#102015]/15 bg-white px-4 py-3 text-sm"
                >
                  <option>WhatsApp buyer</option>
                  <option>Household buyer</option>
                  <option>Restaurant</option>
                  <option>Retailer</option>
                  <option>Market trader</option>
                  <option>Food processor</option>
                  <option>Institutional buyer</option>
                </select>
              </div>

              <button className="mt-4 w-full rounded-full bg-[#102015] px-4 py-3 text-sm font-black text-white">
                Create buyer
              </button>
            </form>
          </section>
        ) : null}

        <section className="rounded-2xl border bg-[#f7f5ec] p-4">
          <div className="grid max-h-[34rem] gap-3 overflow-y-auto pr-1">
            {messages.map((message) => (
              <article
                key={message.key}
                className={`max-w-[88%] rounded-2xl p-4 ${
                  message.direction === "Outbound"
                    ? "ml-auto bg-[#1f7a3f] text-white"
                    : "mr-auto border bg-white text-[#102015]"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold opacity-75">
                  <span>{message.sender}</span>
                  <span>·</span>
                  <span>{formatDate(message.createdAt)}</span>
                  <span>·</span>
                  <span>{message.status}</span>
                </div>

                {message.title ? (
                  <p className="mt-2 text-sm font-black">{message.title}</p>
                ) : null}

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                  {message.body}
                </p>
              </article>
            ))}

            {!messages.length ? (
              <p className="rounded-xl bg-white p-4 text-sm text-[#587063]">
                No messages were found for this phone number.
              </p>
            ) : null}
          </div>
        </section>

        <form
          action={sendWhatsAppConversationReplyAction}
          className="rounded-2xl border bg-white p-5"
        >
          <input type="hidden" name="recordType" value={recordType} />
          <input type="hidden" name="recordId" value={recordId} />

          <label className="grid gap-2 text-sm font-black text-[#102015]">
            Reply on WhatsApp
            <textarea
              name="body"
              required
              rows={5}
              placeholder="Type the buyer reply..."
              className="rounded-xl border border-[#102015]/15 px-4 py-3 text-sm font-normal"
            />
          </label>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-2xl text-xs leading-5 text-[#587063]">
              Replies are sent through Meta WhatsApp Cloud API and retained in
              the conversation record.
            </p>

            <button className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white">
              Send reply
            </button>
          </div>
        </form>
      </div>
    </AdminPageShell>
  );
}
