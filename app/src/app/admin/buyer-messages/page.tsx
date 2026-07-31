import Link from "next/link";
import {redirect} from "next/navigation";
import AdminPageShell from "@/components/AdminPageShell";
import {
  AdminEmptyState,
  AdminListToolbar,
  AdminPagination,
  AdminResultCount,
} from "@/components/admin/AdminListControls";
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

type ConversationRow = {
  normalizedPhone: string;
  phone: string;
  buyerName: string;
  latestRecordType: "BuyerMessage" | "ContactEnquiry";
  latestRecordId: string;
  latestTitle: string | null;
  latestBody: string;
  latestActivity: Date;
  messageCount: bigint | number;
  unreadCount: bigint | number;
  totalCount: bigint | number;
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
        timeZone: "Africa/Lagos",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(raw))
    : "Not recorded";
}

function phoneHref(phone?: string | null) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

const safeCount = (value: bigint | number | undefined) => Number(value || 0);

export default async function AdminBuyerMessagesPage({
  searchParams,
}: {
  searchParams?: Promise<Params>;
}) {
  await requireStaff();
  const raw = (await searchParams) || {};

  // The old separate unknown-contact queue has been retired.
  if (value(raw.view)) {
    redirect(PATH);
  }

  return (
    <AdminPageShell
      title="Messages needing a reply"
      description="One row per buyer conversation, newest and unread first."
      compactHeader
    >
      <WhatsAppConversationQueue raw={raw} />
    </AdminPageShell>
  );
}

async function WhatsAppConversationQueue({raw}: {raw: Params}) {
  const q = value(raw.q);
  const page = parseAdminPage(value(raw.page));
  const pageSize = parseAdminPageSize(value(raw.pageSize));
  const offset = (page - 1) * pageSize;

  // Non-operational phrases (recruitment/supplier) are excluded from this
  // queue the same way the underlying tables filter them elsewhere --
  // those stay email-first, not a WhatsApp staff-attention item.
  const nonOperationalClause = nonOperationalWhatsAppPhrases
    .map((phrase) => `ce.message NOT ILIKE '%${phrase.replace(/'/g, "''")}%'`)
    .join(" AND ");

  const rows = await prisma.$queryRawUnsafe<ConversationRow[]>(
    `
      WITH known AS (
        SELECT
          bm.id AS "recordId",
          'BuyerMessage'::text AS "recordType",
          COALESCE(NULLIF(c.phone, ''), bm.recipient) AS phone,
          c.name AS "buyerName",
          bm.title,
          bm.body,
          bm."createdAt",
          (bm.status = 'Unread') AS unread
        FROM "BuyerMessage" bm
        JOIN "Customer" c ON c.id = bm."customerId"
        WHERE bm.channel = 'WhatsApp'
          AND bm.direction = 'Inbound'
          AND bm.status NOT IN ('Replied', 'Closed', 'Resolved', 'Archived')
          AND (
            $1 = ''
            OR bm.title ILIKE CONCAT('%', $1, '%')
            OR bm.body ILIKE CONCAT('%', $1, '%')
            OR bm.recipient ILIKE CONCAT('%', $1, '%')
            OR c.name ILIKE CONCAT('%', $1, '%')
            OR c.phone ILIKE CONCAT('%', $1, '%')
          )
      ),
      unknown AS (
        SELECT
          ce.id AS "recordId",
          'ContactEnquiry'::text AS "recordType",
          ce.phone AS phone,
          'Unknown buyer'::text AS "buyerName",
          NULL::text AS title,
          ce.message AS body,
          ce."createdAt",
          (ce.status = 'New') AS unread
        FROM "ContactEnquiry" ce
        WHERE ce."enquiryType" = 'WhatsApp inbound'
          AND ce.source = 'WhatsApp webhook'
          AND ce.status IN ('New', 'Open')
          AND (
            ce."adminNote" ILIKE '%classification: operational%'
            OR (${nonOperationalClause})
          )
          AND (
            $1 = ''
            OR ce.name ILIKE CONCAT('%', $1, '%')
            OR ce.phone ILIKE CONCAT('%', $1, '%')
            OR ce.message ILIKE CONCAT('%', $1, '%')
          )
      ),
      combined AS (
        SELECT * FROM known
        UNION ALL
        SELECT * FROM unknown
      ),
      normalized AS (
        SELECT *,
          CASE
            WHEN regexp_replace(phone, '\\D', '', 'g') LIKE '234%' THEN regexp_replace(phone, '\\D', '', 'g')
            WHEN regexp_replace(phone, '\\D', '', 'g') LIKE '0%' AND length(regexp_replace(phone, '\\D', '', 'g')) >= 10
              THEN '234' || substring(regexp_replace(phone, '\\D', '', 'g') FROM 2)
            ELSE regexp_replace(phone, '\\D', '', 'g')
          END AS "normalizedPhone"
        FROM combined
      ),
      latest AS (
        SELECT DISTINCT ON ("normalizedPhone")
          "normalizedPhone", phone, "recordType", "recordId", title, body, "createdAt" AS "latestActivity"
        FROM normalized
        ORDER BY "normalizedPhone", "createdAt" DESC
      ),
      buyer_names AS (
        SELECT "normalizedPhone", MAX("buyerName") FILTER (WHERE "buyerName" <> 'Unknown buyer') AS "knownName"
        FROM normalized
        GROUP BY "normalizedPhone"
      ),
      counts AS (
        SELECT "normalizedPhone", COUNT(*)::bigint AS "messageCount", COUNT(*) FILTER (WHERE unread)::bigint AS "unreadCount"
        FROM normalized
        GROUP BY "normalizedPhone"
      ),
      grouped AS (
        SELECT
          latest."normalizedPhone",
          latest.phone,
          COALESCE(buyer_names."knownName", 'Unknown buyer') AS "buyerName",
          latest."recordType" AS "latestRecordType",
          latest."recordId" AS "latestRecordId",
          latest.title AS "latestTitle",
          latest.body AS "latestBody",
          latest."latestActivity",
          counts."messageCount",
          counts."unreadCount"
        FROM latest
        JOIN buyer_names ON buyer_names."normalizedPhone" = latest."normalizedPhone"
        JOIN counts ON counts."normalizedPhone" = latest."normalizedPhone"
      )
      SELECT *, COUNT(*) OVER()::bigint AS "totalCount"
      FROM grouped
      ORDER BY ("unreadCount" > 0) DESC, "latestActivity" DESC, "normalizedPhone" DESC
      LIMIT $2
      OFFSET $3
    `,
    q,
    pageSize,
    offset,
  );

  const total = safeCount(rows[0]?.totalCount);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const base = {q, pageSize};

  if (page > pages) {
    redirect(adminListHref(PATH, base, {page: pages}));
  }

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
        searchLabel="Search conversations"
        searchPlaceholder="Buyer, phone or message"
      />

      <AdminResultCount {...range} total={total} label="conversations" />

      {rows.length ? (
        <section className="overflow-hidden rounded-2xl border bg-white">
          {rows.map((row) => {
            const href = phoneHref(row.phone);
            const unread = safeCount(row.unreadCount);
            const messageCount = safeCount(row.messageCount);

            return (
              <article
                key={row.normalizedPhone}
                className="border-b p-4 last:border-b-0"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-[#102015]">
                        {row.buyerName}
                      </p>

                      {unread ? (
                        <span className="rounded-full bg-[#e7f5eb] px-2.5 py-1 text-xs font-black text-[#176533]">
                          {unread} unread
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#f3f8ef] px-2.5 py-1 text-xs font-black text-[#587063]">
                          In progress
                        </span>
                      )}

                      <span className="text-xs font-bold text-[#96a89c]">
                        {messageCount} message{messageCount === 1 ? "" : "s"}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-[#587063]">
                      {row.phone || "No phone recorded"} ·{" "}
                      {formatDate(row.latestActivity)}
                    </p>

                    {row.latestTitle ? (
                      <p className="mt-3 text-sm font-bold text-[#102015]">
                        {row.latestTitle}
                      </p>
                    ) : null}

                    <p className="mt-2 text-sm leading-6 text-[#405348]">
                      {preview(row.latestBody)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Link
                      href={`/admin/buyer-messages/${row.latestRecordType}/${row.latestRecordId}`}
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
                      <input type="hidden" name="recordType" value="Conversation" />
                      <input type="hidden" name="recordId" value={row.phone} />
                      <button
                        type="submit"
                        className="min-h-11 rounded-full bg-[#1f7a3f] px-4 text-sm font-black text-white"
                      >
                        Mark handled
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <AdminEmptyState
          title="No conversations need a reply."
          description="New WhatsApp messages will appear here, grouped by buyer, including messages from unknown buyers."
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
