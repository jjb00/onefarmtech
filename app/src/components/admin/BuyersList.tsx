import Link from "next/link";
import {redirect} from "next/navigation";
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
import {
  adminListHref,
  adminResultRange,
  parseAdminPage,
  parseAdminPageSize,
} from "@/lib/adminListParams.js";
import {prisma} from "@/lib/prisma";

type Params = Record<string, string | string[] | undefined>;

type UnifiedBuyerRow = {
  identityKey: string;
  recordId: string | null;
  relationship: "Account buyer" | "Guest buyer";
  name: string;
  phone: string;
  email: string | null;
  buyerType: string;
  status: string;
  accessState: string;
  orderCount: bigint | number;
  latestActivity: Date;
  latestOrderId: string | null;
  totalCount: bigint | number;
};

const text = (raw: string | string[] | undefined) =>
  String(Array.isArray(raw) ? raw[0] : raw || "").trim();

const date = (value: Date) =>
  new Intl.DateTimeFormat("en-GB", {timeZone: "Africa/Lagos", dateStyle: "medium"}).format(value);

const safeCount = (value: bigint | number | undefined) =>
  Number(value || 0);

export default async function BuyersList({raw}: {raw: Params}) {
  const q = text(raw.q);
  const relationship = text(raw.relationship);
  const type = text(raw.type);
  const readiness = text(raw.readiness);
  const pageSize = parseAdminPageSize(text(raw.pageSize));
  const page = parseAdminPage(text(raw.page));

  const offset = (page - 1) * pageSize;

  const rows = await prisma.$queryRawUnsafe<UnifiedBuyerRow[]>(
    `
      WITH account_buyers AS (
        SELECT
          CONCAT('account:', c.id) AS "identityKey",
          c.id AS "recordId",
          'Account buyer'::text AS relationship,
          c.name,
          c.phone,
          c.email,
          c."buyerType",
          c.status,
          CASE
            WHEN c."accountLoginReady" = true
              AND EXISTS (
                SELECT 1
                FROM "BuyerContact" bc
                WHERE bc."customerId" = c.id
                  AND bc.status = 'Active'
              )
            THEN 'Login active'
            ELSE 'Login not enabled'
          END AS "accessState",
          COUNT(o.id)::bigint AS "orderCount",
          GREATEST(
            c."updatedAt",
            COALESCE(MAX(o."updatedAt"), c."updatedAt")
          ) AS "latestActivity",
          NULL::text AS "latestOrderId"
        FROM "Customer" c
        LEFT JOIN "Order" o ON o."customerId" = c.id
        GROUP BY c.id
      ),
      guest_orders AS (
        SELECT
          o.*,
          COALESCE(NULLIF(o."sourcePhone", ''), NULLIF(o.phone, ''), 'Unknown phone') AS "guestPhone",
          ROW_NUMBER() OVER (
            PARTITION BY COALESCE(NULLIF(o."sourcePhone", ''), NULLIF(o.phone, ''), 'Unknown phone')
            ORDER BY o."createdAt" DESC, o.id DESC
          ) AS "guestRank"
        FROM "Order" o
        WHERE o."customerId" IS NULL
      ),
      guest_buyers AS (
        SELECT
          CONCAT('guest:', g."guestPhone") AS "identityKey",
          NULL::text AS "recordId",
          'Guest buyer'::text AS relationship,
          MAX(g."buyerName") FILTER (WHERE g."guestRank" = 1) AS name,
          g."guestPhone" AS phone,
          NULL::text AS email,
          MAX(g."buyerType") FILTER (WHERE g."guestRank" = 1) AS "buyerType",
          'Guest'::text AS status,
          'No account access'::text AS "accessState",
          COUNT(*)::bigint AS "orderCount",
          MAX(g."updatedAt") AS "latestActivity",
          MAX(g.id) FILTER (WHERE g."guestRank" = 1) AS "latestOrderId"
        FROM guest_orders g
        WHERE NOT EXISTS (
          SELECT 1
          FROM "Customer" c
          WHERE REPLACE(REPLACE(REPLACE(c.phone, ' ', ''), '-', ''), '+', '')
              = REPLACE(REPLACE(REPLACE(g."guestPhone", ' ', ''), '-', ''), '+', '')
        )
        GROUP BY g."guestPhone"
      ),
      unified AS (
        SELECT * FROM account_buyers
        UNION ALL
        SELECT * FROM guest_buyers
      ),
      filtered AS (
        SELECT *
        FROM unified
        WHERE
          (
            $1 = ''
            OR name ILIKE CONCAT('%', $1, '%')
            OR phone ILIKE CONCAT('%', $1, '%')
            OR COALESCE(email, '') ILIKE CONCAT('%', $1, '%')
            OR "buyerType" ILIKE CONCAT('%', $1, '%')
          )
          AND ($2 = '' OR relationship = $2)
          AND ($3 = '' OR "buyerType" = $3)
          AND (
            $4 = ''
            OR ($4 = 'active' AND "accessState" = 'Login active')
            OR ($4 = 'not-enabled' AND "accessState" = 'Login not enabled')
            OR ($4 = 'guest' AND relationship = 'Guest buyer')
          )
          -- A Customer row can exist purely because an automated WhatsApp
          -- reply was sent to a number, with no order and no real login.
          -- That's not a buyer yet -- don't list it alongside ones who are.
          AND NOT (
            relationship = 'Account buyer'
            AND "orderCount" = 0
            AND "accessState" != 'Login active'
          )
      )
      SELECT
        *,
        COUNT(*) OVER()::bigint AS "totalCount"
      FROM filtered
      ORDER BY "latestActivity" DESC, "identityKey" DESC
      LIMIT $5
      OFFSET $6
    `,
    q,
    relationship,
    type,
    readiness,
    pageSize,
    offset,
  );

  const total = safeCount(rows[0]?.totalCount);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const base = {
    view: "all",
    q,
    relationship,
    type,
    readiness,
    pageSize,
  };

  if (page > pages) {
    redirect(adminListHref("/admin/customers", base, {page: pages}));
  }

  const buyerTypes = await prisma.$queryRawUnsafe<Array<{buyerType: string}>>(
    `
      SELECT DISTINCT "buyerType"
      FROM (
        SELECT "buyerType" FROM "Customer"
        UNION
        SELECT "buyerType" FROM "Order" WHERE "customerId" IS NULL
      ) types
      WHERE "buyerType" IS NOT NULL
        AND "buyerType" <> ''
      ORDER BY "buyerType" ASC
    `,
  );

  const range = adminResultRange(page, pageSize, total);

  return (
    <div className="grid gap-4">
      <AdminListToolbar
        search={q}
        pageSize={pageSize}
        resetHref="/admin/customers?view=all"
        hiddenParams={{view: "all"}}
        searchLabel="Search buyers"
        searchPlaceholder="Name, phone, email or buyer type"
        filters={[
          {
            name: "relationship",
            label: "Buyer relationship",
            value: relationship,
            options: [
              {value: "Account buyer", label: "Account buyers"},
              {value: "Guest buyer", label: "Guest buyers"},
            ],
          },
          {
            name: "type",
            label: "Buyer type",
            value: type,
            options: buyerTypes.map((item) => ({
              value: item.buyerType,
              label: item.buyerType,
            })),
          },
          {
            name: "readiness",
            label: "Account access",
            value: readiness,
            options: [
              {value: "active", label: "Login active"},
              {value: "not-enabled", label: "Login not enabled"},
              {value: "guest", label: "Guest — no account"},
            ],
          },
        ]}
      />

      <AdminResultCount {...range} total={total} label="buyers" />

      {rows.length ? (
        <>
          <section className="hidden overflow-hidden rounded-2xl border bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f3f8ef] text-xs uppercase">
                <tr>
                  <th className="p-3">Buyer</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Relationship</th>
                  <th className="p-3">Orders</th>
                  <th className="p-3">Last activity</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((buyer) => {
                  const href = buyer.recordId
                    ? `/admin/customers/${buyer.recordId}`
                    : buyer.latestOrderId
                      ? `/admin/orders/${buyer.latestOrderId}`
                      : "/admin/orders";

                  return (
                    <tr
                      key={buyer.identityKey}
                      className="border-t transition hover:bg-[#f8fbf6]"
                    >
                      <td className="p-3">
                        <p className="font-black">
                          {buyer.name || "Guest buyer"}
                        </p>
                        <p className="text-xs text-[#587063]">
                          {buyer.buyerType || "Buyer"}
                        </p>
                      </td>

                      <td className="p-3">
                        {buyer.phone}
                        <p className="text-xs">
                          {buyer.email || buyer.accessState}
                        </p>
                      </td>

                      <td className="p-3">
                        <AdminStatusPill
                          tone={adminToneFromStatus(buyer.relationship)}
                        >
                          {buyer.relationship}
                        </AdminStatusPill>
                      </td>

                      <td className="p-3">
                        {safeCount(buyer.orderCount)}
                      </td>

                      <td className="p-3">
                        {date(new Date(buyer.latestActivity))}
                      </td>

                      <td className="p-3">
                        <Link
                          href={href}
                          className="inline-flex min-h-11 items-center rounded-full px-4 font-black text-[#1f7a3f] transition hover:bg-[#eaf4e7]"
                        >
                          {buyer.recordId
                            ? "Open buyer"
                            : "View latest order"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section className="grid gap-3 md:hidden">
            {rows.map((buyer) => {
              const href = buyer.recordId
                ? `/admin/customers/${buyer.recordId}`
                : buyer.latestOrderId
                  ? `/admin/orders/${buyer.latestOrderId}`
                  : "/admin/orders";

              return (
                <Link
                  key={buyer.identityKey}
                  href={href}
                  className="rounded-2xl border bg-white p-4 transition active:scale-[0.99]"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <h2 className="font-black">
                        {buyer.name || "Guest buyer"}
                      </h2>
                      <p className="text-xs">
                        {buyer.buyerType || "Buyer"} · {buyer.phone}
                      </p>
                    </div>

                    <AdminStatusPill
                      tone={adminToneFromStatus(buyer.relationship)}
                    >
                      {buyer.relationship}
                    </AdminStatusPill>
                  </div>

                  <p className="mt-3 text-sm">
                    {safeCount(buyer.orderCount)} order
                    {safeCount(buyer.orderCount) === 1 ? "" : "s"}
                  </p>
                </Link>
              );
            })}
          </section>
        </>
      ) : (
        <AdminEmptyState
          title="No matching buyers"
          description="Try another search or clear the filters."
          resetHref="/admin/customers?view=all"
        />
      )}

      <AdminPagination
        page={page}
        totalPages={pages}
        previousHref={
          page > 1
            ? adminListHref("/admin/customers", base, {page: page - 1})
            : undefined
        }
        nextHref={
          page < pages
            ? adminListHref("/admin/customers", base, {page: page + 1})
            : undefined
        }
      />
    </div>
  );
}
