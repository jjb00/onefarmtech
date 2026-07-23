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
import {buyerRelationshipLabel} from "@/lib/buyerRelationship";
import {prisma} from "@/lib/prisma";

type Params = Record<string, string | string[] | undefined>;

const text = (raw: string | string[] | undefined) =>
  String(Array.isArray(raw) ? raw[0] : raw || "").trim();

const date = (value: Date) =>
  new Intl.DateTimeFormat("en-GB", {dateStyle: "medium"}).format(value);

export default async function BuyersList({raw}: {raw: Params}) {
  const q = text(raw.q);
  const status = text(raw.status);
  const type = text(raw.type);
  const readiness = text(raw.readiness);
  const pageSize = parseAdminPageSize(text(raw.pageSize));
  const page = parseAdminPage(text(raw.page));

  const where = {
    ...(q
      ? {
          OR: [
            {name: {contains: q, mode: "insensitive" as const}},
            {phone: {contains: q}},
            {email: {contains: q, mode: "insensitive" as const}},
            {location: {contains: q, mode: "insensitive" as const}},
          ],
        }
      : {}),
    ...(status ? {status} : {}),
    ...(type ? {buyerType: type} : {}),
    ...(readiness === "active"
      ? {accountLoginReady: true, status: "Active"}
      : readiness === "account"
        ? {
            OR: [
              {accountLoginReady: true},
              {
                accountStatus: {
                  in: [
                    "Pending login approval",
                    "Account login pending",
                    "Account login ready",
                    "Approved recurring buyer",
                  ],
                },
              },
            ],
          }
        : readiness === "none"
          ? {
              accountLoginReady: false,
              accountStatus: {notIn: [
                "Pending login approval",
                "Account login pending",
                "Account login ready",
                "Approved recurring buyer",
              ]},
            }
          : {}),
  };

  const [total, types] = await Promise.all([
    prisma.customer.count({where}),
    prisma.customer.findMany({
      distinct: ["buyerType"],
      select: {buyerType: true},
      orderBy: {buyerType: "asc"},
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const base = {view: "all", q, status, type, readiness, pageSize};

  if (page > pages) {
    redirect(adminListHref("/admin/customers", base, {page: pages}));
  }

  const buyers = await prisma.customer.findMany({
    where,
    orderBy: [{updatedAt: "desc"}, {id: "desc"}],
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      name: true,
      buyerType: true,
      phone: true,
      email: true,
      status: true,
      accountStatus: true,
      accountLoginReady: true,
      updatedAt: true,
      buyerContacts: {
        where: {status: "Active"},
        select: {id: true},
        take: 1,
      },
      _count: {select: {orders: true}},
    },
  });

  const range = adminResultRange(page, pageSize, total);

  const labelledBuyers = buyers.map((buyer) => ({
    ...buyer,
    relationship: buyerRelationshipLabel({
      ...buyer,
      hasActiveContact: buyer.buyerContacts.length > 0,
    }),
  }));

  return (
    <div className="grid gap-4">
      <AdminListToolbar
        search={q}
        pageSize={pageSize}
        resetHref="/admin/customers?view=all"
        hiddenParams={{view: "all"}}
        searchLabel="Search customers"
        searchPlaceholder="Name, phone, email or location"
        filters={[
          {
            name: "status",
            label: "Customer status",
            value: status,
            options: [
              {value: "Active", label: "Active"},
              {value: "Needs review", label: "Needs review"},
              {value: "Paused", label: "Paused"},
            ],
          },
          {
            name: "type",
            label: "Buyer type",
            value: type,
            options: types.map((item) => ({
              value: item.buyerType,
              label: item.buyerType,
            })),
          },
          {
            name: "readiness",
            label: "Portal access",
            value: readiness,
            options: [
              {value: "active", label: "Login active"},
              {value: "account", label: "Account journey"},
              {value: "none", label: "No account requested"},
            ],
          },
        ]}
      />

      <AdminResultCount {...range} total={total} label="customers" />

      {labelledBuyers.length ? (
        <>
          <section className="hidden overflow-hidden rounded-2xl border bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f3f8ef] text-xs uppercase">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Relationship</th>
                  <th className="p-3">Orders</th>
                  <th className="p-3">Last activity</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {labelledBuyers.map((buyer) => (
                  <tr
                    key={buyer.id}
                    className="border-t transition hover:bg-[#f8fbf6]"
                  >
                    <td className="p-3">
                      <p className="font-black">{buyer.name}</p>
                      <p className="text-xs text-[#587063]">{buyer.buyerType}</p>
                    </td>
                    <td className="p-3">
                      {buyer.phone}
                      <p className="text-xs">{buyer.email || "No email"}</p>
                    </td>
                    <td className="p-3">
                      <AdminStatusPill
                        tone={adminToneFromStatus(buyer.relationship)}
                      >
                        {buyer.relationship}
                      </AdminStatusPill>
                    </td>
                    <td className="p-3">{buyer._count.orders}</td>
                    <td className="p-3">{date(buyer.updatedAt)}</td>
                    <td className="p-3">
                      <Link
                        href={`/admin/customers/${buyer.id}`}
                        className="inline-flex min-h-11 items-center rounded-full px-4 font-black text-[#1f7a3f] transition hover:bg-[#eaf4e7]"
                      >
                        Open customer
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="grid gap-3 md:hidden">
            {labelledBuyers.map((buyer) => (
              <Link
                key={buyer.id}
                href={`/admin/customers/${buyer.id}`}
                className="rounded-2xl border bg-white p-4 transition active:scale-[0.99]"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <h2 className="font-black">{buyer.name}</h2>
                    <p className="text-xs">
                      {buyer.buyerType} · {buyer.phone}
                    </p>
                  </div>
                  <AdminStatusPill
                    tone={adminToneFromStatus(buyer.relationship)}
                  >
                    {buyer.relationship}
                  </AdminStatusPill>
                </div>
                <p className="mt-3 text-sm">{buyer._count.orders} orders</p>
              </Link>
            ))}
          </section>
        </>
      ) : (
        <AdminEmptyState
          title="No matching customers"
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
