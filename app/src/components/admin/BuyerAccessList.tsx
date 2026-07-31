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

const text = (raw: string | string[] | undefined) =>
  String(Array.isArray(raw) ? raw[0] : raw || "").trim();

const date = (value: Date | null) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {timeZone: "Africa/Lagos", dateStyle: "medium"}).format(value)
    : "Not recorded";

export default async function BuyerAccessList({raw}: {raw: Params}) {
  const q = text(raw.q);
  const status = text(raw.status);
  const pageSize = parseAdminPageSize(text(raw.pageSize));
  const page = parseAdminPage(text(raw.page));

  const where = {
    ...(status === "active"
      ? {accountLoginReady: true, status: "Active"}
      : status === "not-enabled"
        ? {accountLoginReady: false}
        : status === "paused"
          ? {status: "Paused"}
          : {}),
    ...(q
      ? {
          OR: [
            {name: {contains: q, mode: "insensitive" as const}},
            {email: {contains: q, mode: "insensitive" as const}},
            {phone: {contains: q}},
            {
              buyerContacts: {
                some: {
                  OR: [
                    {name: {contains: q, mode: "insensitive" as const}},
                    {email: {contains: q, mode: "insensitive" as const}},
                    {phone: {contains: q}},
                  ],
                },
              },
            },
            {
              buyerAccountInvites: {
                some: {
                  OR: [
                    {email: {contains: q, mode: "insensitive" as const}},
                    {phone: {contains: q}},
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };

  const total = await prisma.customer.count({where});
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const base = {view: "access", q, status, pageSize};

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
      email: true,
      phone: true,
      status: true,
      accountLoginReady: true,
      updatedAt: true,
    },
  });

  const buyerIds = buyers.map((buyer) => buyer.id);

  const [contacts, invites] = buyerIds.length
    ? await Promise.all([
        prisma.buyerContact.findMany({
          where: {customerId: {in: buyerIds}},
          orderBy: [{createdAt: "desc"}, {id: "desc"}],
          select: {
            id: true,
            customerId: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
          },
        }),
        prisma.buyerAccountInvite.findMany({
          where: {customerId: {in: buyerIds}},
          orderBy: [{createdAt: "desc"}, {id: "desc"}],
          select: {
            id: true,
            customerId: true,
            email: true,
            phone: true,
            status: true,
            sentAt: true,
            acceptedAt: true,
            expiresAt: true,
            createdAt: true,
          },
        }),
      ])
    : [[], []];

  const contactsByBuyer = new Map<
    string,
    typeof contacts
  >();

  for (const contact of contacts) {
    const existing = contactsByBuyer.get(contact.customerId) || [];
    existing.push(contact);
    contactsByBuyer.set(contact.customerId, existing);
  }

  const invitesByBuyer = new Map<
    string,
    typeof invites
  >();

  for (const invite of invites) {
    const existing = invitesByBuyer.get(invite.customerId) || [];
    existing.push(invite);
    invitesByBuyer.set(invite.customerId, existing);
  }

  const range = adminResultRange(page, pageSize, total);

  return (
    <div className="grid gap-4">
      <AdminListToolbar
        search={q}
        pageSize={pageSize}
        resetHref="/admin/customers?view=access"
        hiddenParams={{view: "access"}}
        searchLabel="Search account access"
        searchPlaceholder="Buyer, contact, email or phone"
        filters={[
          {
            name: "status",
            label: "Access status",
            value: status,
            options: [
              {value: "active", label: "Login active"},
              {value: "not-enabled", label: "Login not enabled"},
              {value: "paused", label: "Paused"},
            ],
          },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminResultCount {...range} total={total} label="buyer accounts" />
        <Link
          href="/admin/buyer-access"
          className="rounded-xl bg-[#1f7a3f] px-4 py-2 text-sm font-black text-white"
        >
          Add contact or invite
        </Link>
      </div>

      {buyers.length ? (
        <section className="grid gap-3">
          {buyers.map((buyer) => {
            const buyerContacts = contactsByBuyer.get(buyer.id) || [];
            const buyerInvites = invitesByBuyer.get(buyer.id) || [];

            const activeContacts = buyerContacts.filter(
              (contact) => contact.status === "Active",
            );

            const openInvites = buyerInvites.filter(
              (invite) =>
                !["Accepted", "Cancelled", "Expired"].includes(invite.status),
            );

            const latestInvite = buyerInvites[0];
            const accessStatus =
              buyer.status !== "Active"
                ? "Paused"
                : buyer.accountLoginReady && activeContacts.length
                  ? "Login active"
                  : "Login not enabled";

            return (
              <article
                key={buyer.id}
                className="rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/admin/customers/${buyer.id}?section=access`}
                      className="text-lg font-black text-[#1f7a3f]"
                    >
                      {buyer.name}
                    </Link>
                    <p className="mt-1 text-sm text-[#405348]">
                      {buyer.email || "No email"} · {buyer.phone || "No phone"}
                    </p>
                  </div>

                  <AdminStatusPill tone={adminToneFromStatus(accessStatus)}>
                    {accessStatus}
                  </AdminStatusPill>
                </div>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-xs font-bold uppercase text-[#587063]">
                      Active contacts
                    </dt>
                    <dd className="mt-1 font-black">
                      {activeContacts.length}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-bold uppercase text-[#587063]">
                      Outstanding invites
                    </dt>
                    <dd className="mt-1 font-black">{openInvites.length}</dd>
                  </div>

                  <div>
                    <dt className="text-xs font-bold uppercase text-[#587063]">
                      Latest invite
                    </dt>
                    <dd className="mt-1 font-black">
                      {latestInvite?.status || "None"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-bold uppercase text-[#587063]">
                      Last activity
                    </dt>
                    <dd className="mt-1 font-black">{date(buyer.updatedAt)}</dd>
                  </div>
                </dl>

                <details className="mt-4 rounded-xl bg-[#f7f5ec] p-3">
                  <summary className="cursor-pointer text-sm font-black">
                    Contacts and invitation history
                  </summary>

                  <div className="mt-3 grid gap-3">
                    {buyerContacts.length ? (
                      buyerContacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="rounded-xl bg-white p-3 text-sm"
                        >
                          <p className="font-black">{contact.name}</p>
                          <p className="text-[#405348]">
                            {contact.role} · {contact.status}
                          </p>
                          <p className="text-xs text-[#587063]">
                            {contact.email || "No email"} ·{" "}
                            {contact.phone || "No phone"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[#587063]">
                        No authorised contacts.
                      </p>
                    )}

                    {buyerInvites.length ? (
                      buyerInvites.map((invite) => (
                        <div
                          key={invite.id}
                          className="rounded-xl bg-white p-3 text-sm"
                        >
                          <p className="font-black">
                            {invite.email || invite.phone || "Access invite"}
                          </p>
                          <p className="text-[#405348]">{invite.status}</p>
                          <p className="text-xs text-[#587063]">
                            Created {date(invite.createdAt)}
                            {invite.expiresAt
                              ? ` · Expires ${date(invite.expiresAt)}`
                              : ""}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[#587063]">
                        No invitation history.
                      </p>
                    )}
                  </div>
                </details>

                <Link
                  href={`/admin/customers/${buyer.id}?section=access`}
                  className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#1f7a3f] px-4 text-sm font-black text-white"
                >
                  Manage access
                </Link>
              </article>
            );
          })}
        </section>
      ) : (
        <AdminEmptyState
          title="No matching buyer accounts"
          description="Try another search or clear the filters."
          resetHref="/admin/customers?view=access"
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
