import Link from "next/link";
import {redirect} from "next/navigation";
import AdminPageShell from "@/components/AdminPageShell";
import {
  AdminEmptyState,
  AdminListToolbar,
  AdminPagination,
  AdminResultCount,
} from "@/components/admin/AdminListControls";
import {
  AdminStatusPill,
  adminToneFromStatus,
} from "@/components/admin/AdminViewControls";
import AdminRecordControls from "@/components/admin/AdminRecordControls";
import {resolveWhatsAppExceptionAction} from "@/actions/whatsappExceptions";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {
  adminListHref,
  adminResultRange,
  parseAdminPage,
  parseAdminPageSize,
} from "@/lib/adminListParams.js";
import {nonOperationalWhatsAppPhrases} from "@/lib/whatsappClassification.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PATH = "/admin/buyer-messages";
const CLOSED_BUYER_STATUSES = ["Replied", "Closed", "Resolved", "Archived"];

type Params = Record<string, string | string[] | undefined>;

type QueueItem = {
  id: string;
  recordType: "BuyerMessage" | "ContactEnquiry";
  buyerName: string;
  phone: string | null;
  title: string | null;
  body: string;
  status: string;
  unread: boolean;
  receivedAt: Date;
};

function value(raw: string | string[] | undefined) {
  return String(Array.isArray(raw) ? raw[0] : raw || "").trim();
}

function preview(raw: string, length = 150) {
  return raw.length > length
    ? `${raw.slice(0, length - 1).trimEnd()}…`
    : raw;
}

function formatDate(raw: Date | string | null) {
  return raw
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(raw))
    : "Not recorded";
}

function phoneHref(phone?: string | null) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

function queueOrder(a: QueueItem, b: QueueItem) {
  if (a.unread !== b.unread) return a.unread ? -1 : 1;

  const dateDifference = b.receivedAt.getTime() - a.receivedAt.getTime();
  if (dateDifference !== 0) return dateDifference;

  return b.id.localeCompare(a.id);
}

export default async function AdminBuyerMessagesPage({
  searchParams,
}: {
  searchParams?: Promise<Params>;
}) {
  const staff = await requireStaff();
  const raw = (await searchParams) || {};

  // The old separate unknown-contact queue has been retired.
  if (value(raw.view)) {
    redirect(PATH);
  }

  return (
    <AdminPageShell
      title="Messages needing a reply"
      description="Review unresolved WhatsApp messages from known and unknown buyers."
      compactHeader
    >
      <WhatsAppReplyQueue
        raw={raw}
        canDelete={staff.role === "Super admin"}
      />
    </AdminPageShell>
  );
}

async function WhatsAppReplyQueue({
  raw,
  canDelete,
}: {
  raw: Params;
  canDelete: boolean;
}) {
  const q = value(raw.q);
  const page = parseAdminPage(value(raw.page));
  const pageSize = parseAdminPageSize(value(raw.pageSize));
  const requiredRows = page * pageSize;

  const buyerSearch = q
    ? {
        OR: [
          {title: {contains: q}},
          {body: {contains: q}},
          {recipient: {contains: q}},
          {
            customer: {
              name: {contains: q},
            },
          },
          {
            customer: {
              phone: {contains: q},
            },
          },
        ],
      }
    : {};

  const operationalUnknownFilter = {
    OR: [
      {
        adminNote: {
          contains: "classification: operational",
        },
      },
      {
        AND: nonOperationalWhatsAppPhrases.map((phrase) => ({
          message: {
            not: {
              contains: phrase,
            },
          },
        })),
      },
    ],
  };

  const unknownSearch = q
    ? {
        OR: [
          {name: {contains: q}},
          {phone: {contains: q}},
          {message: {contains: q}},
        ],
      }
    : null;

  const unknownBaseWhere = {
    enquiryType: "WhatsApp inbound",
    source: "WhatsApp webhook",
    AND: [
      operationalUnknownFilter,
      ...(unknownSearch ? [unknownSearch] : []),
    ],
  };

  const buyerBaseWhere = {
    channel: "WhatsApp",
    direction: "Inbound",
    ...buyerSearch,
  };

  const [
    unreadBuyerCount,
    otherBuyerCount,
    newUnknownCount,
    openUnknownCount,
  ] = await Promise.all([
    prisma.buyerMessage.count({
      where: {
        ...buyerBaseWhere,
        status: "Unread",
      },
    }),
    prisma.buyerMessage.count({
      where: {
        ...buyerBaseWhere,
        status: {
          notIn: ["Unread", ...CLOSED_BUYER_STATUSES],
        },
      },
    }),
    prisma.contactEnquiry.count({
      where: {
        ...unknownBaseWhere,
        status: "New",
      },
    }),
    prisma.contactEnquiry.count({
      where: {
        ...unknownBaseWhere,
        status: "Open",
      },
    }),
  ]);

  const total =
    unreadBuyerCount +
    otherBuyerCount +
    newUnknownCount +
    openUnknownCount;

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const base = {q, pageSize};

  if (page > pages) {
    redirect(adminListHref(PATH, base, {page: pages}));
  }

  /*
   * Each priority group is ordered authoritatively in the database.
   * We fetch only enough rows from each group to construct the requested
   * merged page, then apply the cross-table unread/newest ordering.
   */
  const [
    unreadBuyerMessages,
    otherBuyerMessages,
    newUnknownMessages,
    openUnknownMessages,
  ] = await Promise.all([
    prisma.buyerMessage.findMany({
      where: {
        ...buyerBaseWhere,
        status: "Unread",
      },
      orderBy: [{createdAt: "desc"}, {id: "desc"}],
      take: requiredRows,
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    }),
    prisma.buyerMessage.findMany({
      where: {
        ...buyerBaseWhere,
        status: {
          notIn: ["Unread", ...CLOSED_BUYER_STATUSES],
        },
      },
      orderBy: [{createdAt: "desc"}, {id: "desc"}],
      take: requiredRows,
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    }),
    prisma.contactEnquiry.findMany({
      where: {
        ...unknownBaseWhere,
        status: "New",
      },
      orderBy: [{createdAt: "desc"}, {id: "desc"}],
      take: requiredRows,
    }),
    prisma.contactEnquiry.findMany({
      where: {
        ...unknownBaseWhere,
        status: "Open",
      },
      orderBy: [{createdAt: "desc"}, {id: "desc"}],
      take: requiredRows,
    }),
  ]);

  const knownItems: QueueItem[] = [
    ...unreadBuyerMessages,
    ...otherBuyerMessages,
  ].map((message) => ({
    id: message.id,
    recordType: "BuyerMessage",
    buyerName: message.customer.name,
    phone: message.customer.phone || message.recipient,
    title: message.title,
    body: message.body,
    status: message.status,
    unread: message.status === "Unread",
    receivedAt: message.createdAt,
  }));

  const unknownItems: QueueItem[] = [
    ...newUnknownMessages,
    ...openUnknownMessages,
  ].map((message) => ({
    id: message.id,
    recordType: "ContactEnquiry",
    buyerName: "Unknown buyer",
    phone: message.phone,
    title: null,
    body: message.message,
    status: message.status,
    unread: message.status === "New",
    receivedAt: message.createdAt,
  }));

  const start = (page - 1) * pageSize;
  const messages = [...knownItems, ...unknownItems]
    .sort(queueOrder)
    .slice(start, start + pageSize);

  const range = adminResultRange(page, pageSize, total);

  return (
    <div className="grid gap-4">
      <h2 className="text-base font-black text-[#102015]">Needs reply</h2>

      <AdminListToolbar
        search={q}
        filters={[]}
        pageSize={pageSize}
        resetHref={PATH}
        hiddenParams={{}}
        searchLabel="Search messages"
        searchPlaceholder="Buyer, phone or message"
      />

      <AdminResultCount {...range} total={total} label="messages" />

      {messages.length ? (
        <section className="overflow-hidden rounded-2xl border bg-white">
          {messages.map((message) => {
            const href = phoneHref(message.phone);

            return (
              <article
                key={`${message.recordType}:${message.id}`}
                className="border-b p-4 last:border-b-0"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-[#102015]">
                        {message.buyerName}
                      </p>

                      {message.unread ? (
                        <span className="rounded-full bg-[#e7f5eb] px-2.5 py-1 text-xs font-black text-[#176533]">
                          Unread
                        </span>
                      ) : (
                        <AdminStatusPill
                          tone={adminToneFromStatus(message.status)}
                        >
                          {message.status}
                        </AdminStatusPill>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-[#587063]">
                      {message.phone || "No phone recorded"} ·{" "}
                      {formatDate(message.receivedAt)}
                    </p>

                    {message.title ? (
                      <p className="mt-3 text-sm font-bold text-[#102015]">
                        {message.title}
                      </p>
                    ) : null}

                    <p className="mt-2 text-sm leading-6 text-[#405348]">
                      {preview(message.body)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Link
                      href={`/admin/buyer-messages/${message.recordType}/${message.id}`}
                      className="inline-flex min-h-11 items-center rounded-full bg-[#102015] px-4 text-sm font-black text-white"
                    >
                      Open conversation
                    </Link>

                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center rounded-full border border-[#1f7a3f]/20 px-4 text-sm font-black text-[#1f7a3f]"
                      >
                        Open WhatsApp
                      </a>
                    ) : null}

                    <form action={resolveWhatsAppExceptionAction}>
                      <input
                        type="hidden"
                        name="recordType"
                        value={message.recordType}
                      />
                      <input
                        type="hidden"
                        name="recordId"
                        value={message.id}
                      />
                      <button
                        type="submit"
                        className="min-h-11 rounded-full bg-[#1f7a3f] px-4 text-sm font-black text-white"
                      >
                        Mark handled
                      </button>
                    </form>
                  </div>
                </div>

                <AdminRecordControls
                  recordType={message.recordType}
                  recordId={message.id}
                  canDelete={canDelete}
                  returnTo={PATH}
                />
              </article>
            );
          })}
        </section>
      ) : (
        <AdminEmptyState
          title="No messages need a reply."
          description="New WhatsApp messages will appear here, including messages from unknown buyers."
          resetHref={PATH}
        />
      )}

      <AdminPagination
        page={page}
        totalPages={pages}
        previousHref={
          page > 1
            ? adminListHref(PATH, base, {page: page - 1})
            : undefined
        }
        nextHref={
          page < pages
            ? adminListHref(PATH, base, {page: page + 1})
            : undefined
        }
      />
    </div>
  );
}
