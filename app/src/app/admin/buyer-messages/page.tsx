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
type Params = Record<string, string | string[] | undefined>;

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

export default async function AdminBuyerMessagesPage({
  searchParams,
}: {
  searchParams?: Promise<Params>;
}) {
  const staff = await requireStaff();
  const raw = (await searchParams) || {};
  const requestedView = value(raw.view);
  const view = requestedView === "unknown" ? "unknown" : "needs-reply";

  if (requestedView && !["needs-reply", "unknown"].includes(requestedView)) {
    redirect(`${PATH}?view=needs-reply`);
  }

  return (
    <AdminPageShell
      title="WhatsApp exceptions"
      description="Only conversations that need a person. Routine automation and message history stay out of the daily admin."
      compactHeader
    >
      <div className="grid gap-5">
        <nav
          aria-label="WhatsApp exception views"
          className="flex gap-2 overflow-x-auto pb-1"
        >
          <Link
            href={`${PATH}?view=needs-reply`}
            aria-current={view === "needs-reply" ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-black ${
              view === "needs-reply"
                ? "bg-[#102015] text-white"
                : "border bg-white text-[#102015]"
            }`}
          >
            Needs human attention
          </Link>
          <Link
            href={`${PATH}?view=unknown`}
            aria-current={view === "unknown" ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-black ${
              view === "unknown"
                ? "bg-[#102015] text-white"
                : "border bg-white text-[#102015]"
            }`}
          >
            Unknown contacts
          </Link>
        </nav>

        {view === "unknown" ? (
          <UnknownContactsView raw={raw} canDelete={staff.role === "Super admin"} />
        ) : (
          <NeedsReplyView raw={raw} canDelete={staff.role === "Super admin"} />
        )}
      </div>
    </AdminPageShell>
  );
}

async function NeedsReplyView({
  raw,
  canDelete,
}: {
  raw: Params;
  canDelete: boolean;
}) {
  const q = value(raw.q);
  const page = parseAdminPage(value(raw.page));
  const pageSize = parseAdminPageSize(value(raw.pageSize));

  const where = {
    channel: "WhatsApp",
    direction: "Inbound",
    status: {
      notIn: ["Replied", "Closed", "Resolved", "Archived"],
    },
    ...(q
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
          ],
        }
      : {}),
  };

  const total = await prisma.buyerMessage.count({where});
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const base = {view: "needs-reply", q, pageSize};

  if (page > pages) {
    redirect(adminListHref(PATH, base, {page: pages}));
  }

  const messages = await prisma.buyerMessage.findMany({
    where,
    orderBy: [{createdAt: "asc"}, {id: "asc"}],
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      customer: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
  });

  const range = adminResultRange(page, pageSize, total);

  return (
    <div className="grid gap-4">
      <AdminListToolbar
        search={q}
        filters={[]}
        pageSize={pageSize}
        resetHref={`${PATH}?view=needs-reply`}
        hiddenParams={{view: "needs-reply"}}
        searchLabel="Search exceptions"
        searchPlaceholder="Buyer, phone or message"
      />

      <AdminResultCount {...range} total={total} label="exceptions" />

      {messages.length ? (
        <section className="overflow-hidden rounded-2xl border bg-white">
          {messages.map((message) => {
            const phone = message.customer.phone || message.recipient;
            const href = phoneHref(phone);

            return (
              <article
                key={message.id}
                className="border-b p-4 last:border-b-0"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-[#102015]">
                        {message.customer.name}
                      </p>
                      <AdminStatusPill tone={adminToneFromStatus(message.status)}>
                        {message.status}
                      </AdminStatusPill>
                    </div>
                    <p className="mt-1 text-xs text-[#587063]">
                      {phone || "No phone recorded"} · {formatDate(message.createdAt)}
                    </p>
                    <p className="mt-3 text-sm font-bold text-[#102015]">
                      {message.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#405348]">
                      {preview(message.body)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
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
                      <input type="hidden" name="recordType" value="BuyerMessage" />
                      <input type="hidden" name="recordId" value={message.id} />
                      <button
                        type="submit"
                        className="min-h-11 rounded-full bg-[#1f7a3f] px-4 text-sm font-black text-white"
                      >
                        Mark handled
                      </button>
                    </form>
                  </div>
                </div>

                {canDelete ? (
                  <AdminRecordControls
                    recordType="BuyerMessage"
                    recordId={message.id}
                    canDelete
                  />
                ) : null}
              </article>
            );
          })}
        </section>
      ) : (
        <AdminEmptyState
          title="No WhatsApp exceptions."
          description="Routine automated conversations do not appear here."
          resetHref={`${PATH}?view=needs-reply`}
        />
      )}

      <AdminPagination
        page={page}
        totalPages={pages}
        previousHref={
          page > 1 ? adminListHref(PATH, base, {page: page - 1}) : undefined
        }
        nextHref={
          page < pages ? adminListHref(PATH, base, {page: page + 1}) : undefined
        }
      />
    </div>
  );
}

async function UnknownContactsView({
  raw,
  canDelete,
}: {
  raw: Params;
  canDelete: boolean;
}) {
  const q = value(raw.q);
  const page = parseAdminPage(value(raw.page));
  const pageSize = parseAdminPageSize(value(raw.pageSize));

  const where = {
    enquiryType: "WhatsApp inbound",
    status: {in: ["New", "Open"]},
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
    ...(q
      ? {
          AND: [
            {
              OR: [
                {name: {contains: q}},
                {phone: {contains: q}},
                {message: {contains: q}},
              ],
            },
          ],
        }
      : {}),
  };

  const total = await prisma.contactEnquiry.count({where});
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const base = {view: "unknown", q, pageSize};

  if (page > pages) {
    redirect(adminListHref(PATH, base, {page: pages}));
  }

  const contacts = await prisma.contactEnquiry.findMany({
    where,
    orderBy: [{updatedAt: "asc"}, {id: "asc"}],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const range = adminResultRange(page, pageSize, total);

  return (
    <div className="grid gap-4">
      <AdminListToolbar
        search={q}
        filters={[]}
        pageSize={pageSize}
        resetHref={`${PATH}?view=unknown`}
        hiddenParams={{view: "unknown"}}
        searchLabel="Search unknown contacts"
        searchPlaceholder="Name, phone or message"
      />

      <AdminResultCount {...range} total={total} label="unknown contacts" />

      {contacts.length ? (
        <section className="overflow-hidden rounded-2xl border bg-white">
          {contacts.map((contact) => {
            const href = phoneHref(contact.phone);

            return (
              <article key={contact.id} className="border-b p-4 last:border-b-0">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-[#102015]">
                        {contact.name || contact.phone || "Unknown contact"}
                      </p>
                      <AdminStatusPill tone={adminToneFromStatus(contact.status)}>
                        {contact.status}
                      </AdminStatusPill>
                    </div>
                    <p className="mt-1 text-xs text-[#587063]">
                      {contact.phone || "No phone recorded"} · {formatDate(contact.updatedAt)}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[#405348]">
                      {preview(contact.message)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
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
                        value="ContactEnquiry"
                      />
                      <input type="hidden" name="recordId" value={contact.id} />
                      <button
                        type="submit"
                        className="min-h-11 rounded-full bg-[#1f7a3f] px-4 text-sm font-black text-white"
                      >
                        Mark handled
                      </button>
                    </form>
                  </div>
                </div>

                {canDelete ? (
                  <AdminRecordControls
                    recordType="ContactEnquiry"
                    recordId={contact.id}
                    canDelete
                  />
                ) : null}
              </article>
            );
          })}
        </section>
      ) : (
        <AdminEmptyState
          title="No unknown WhatsApp contacts."
          description="Recruitment, supplier and general messages stay outside this operational queue."
          resetHref={`${PATH}?view=unknown`}
        />
      )}

      <AdminPagination
        page={page}
        totalPages={pages}
        previousHref={
          page > 1 ? adminListHref(PATH, base, {page: page - 1}) : undefined
        }
        nextHref={
          page < pages ? adminListHref(PATH, base, {page: page + 1}) : undefined
        }
      />
    </div>
  );
}
