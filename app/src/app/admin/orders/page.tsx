import Link from "next/link";
import {redirect} from "next/navigation";
import {
  updateOrderRequestStatusAction,
} from "@/actions/createAdminRecords";
import {
  AdminEmptyState,
  AdminListToolbar,
  AdminPagination,
  AdminResultCount,
} from "@/components/admin/AdminListControls";
import AdminRecordControls from "@/components/admin/AdminRecordControls";
import {
  AdminStatusPill,
  adminToneFromStatus,
} from "@/components/admin/AdminViewControls";
import AdminShell from "@/components/admin/AdminShell";
import {formatOrderTotal, getOrderItemsSummary} from "@/data/dbOrders";
import {requireStaff} from "@/lib/auth";
import {
  adminListHref,
  adminResultRange,
  parseAdminPage,
  parseAdminPageSize,
} from "@/lib/adminListParams.js";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PATH = "/admin/orders";
const VIEWS = ["needs-action", "new-requests", "fulfilment", "completed"];

type Params = Record<string, string | string[] | undefined>;

const text = (value: string | string[] | undefined) =>
  String(Array.isArray(value) ? value[0] : value || "").trim();

function viewWhere(view: string) {
  if (view === "fulfilment") {
    return {
      paymentStatus: {in: ["Paid", "Approved"]},
      fulfilmentStatus: {
        notIn: ["Delivered", "Collected", "Completed", "Cancelled"],
      },
    };
  }

  if (view === "completed") {
    return {
      fulfilmentStatus: {in: ["Delivered", "Collected", "Completed"]},
    };
  }

  return {
    OR: [
      {paymentStatus: {in: ["Unpaid", "Pending", "Failed"]}},
      {
        fulfilmentStatus: {
          in: [
            "New order",
            "Pending",
            "Confirmed",
            "Preparing",
            "Ready for pickup",
          ],
        },
      },
      {paymentRequests: {some: {status: {in: ["Failed", "Expired"]}}}},
      {complaints: {some: {status: {notIn: ["Resolved", "Closed"]}}}},
    ],
  };
}

function requestSource(source: string) {
  const value = source.toLowerCase();

  if (value.includes("whatsapp")) return "WhatsApp";
  if (value.includes("admin") || value.includes("manual")) return "Manual";

  return "Online";
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {timeZone: "Africa/Lagos", 
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function requestErrorMessage(code: string) {
  if (code === "request-not-found") return "This request no longer exists.";
  if (code === "conversion-not-allowed") {
    return "Rejected or closed requests cannot be converted.";
  }
  if (code === "converted-order-missing") {
    return "The request points to an order that no longer exists.";
  }
  if (code === "database-conflict") {
    return "The request changed while it was being accepted. Try again.";
  }
  if (code) return "The request could not be accepted. Try again.";

  return "";
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?: Promise<Params>;
}) {
  const staff = await requireStaff();
  const raw = await searchParams;

  const requested = text(raw?.view) || "needs-action";
  const view = VIEWS.includes(requested) ? requested : "needs-action";
  const q = text(raw?.q);
  const page = parseAdminPage(text(raw?.page));
  const pageSize = parseAdminPageSize(text(raw?.pageSize));

  if (view === "new-requests") {
    return (
      <NewRequestsView
        q={q}
        page={page}
        pageSize={pageSize}
        canDelete={staff.role === "Super admin"}
        conversionError={text(raw?.conversionError)}
      />
    );
  }

  const where = {
    AND: [
      viewWhere(view),
      ...(q
        ? [
            {
              OR: [
                {code: {contains: q, mode: "insensitive" as const}},
                {buyerName: {contains: q, mode: "insensitive" as const}},
                {phone: {contains: q}},
                {
                  items: {
                    some: {
                      name: {contains: q, mode: "insensitive" as const},
                    },
                  },
                },
              ],
            },
          ]
        : []),
    ],
  };

  // count and findMany don't depend on each other's result, so run them
  // concurrently rather than paying two sequential round trips.
  const [total, orders] = await Promise.all([
    prisma.order.count({where}),
    prisma.order.findMany({
      where,
      orderBy: [{updatedAt: "asc"}, {id: "asc"}],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        code: true,
        buyerName: true,
        buyerType: true,
        phone: true,
        paymentStatus: true,
        fulfilmentStatus: true,
        estimatedTotal: true,
        deliveryMethod: true,
        updatedAt: true,
        items: {
          select: {name: true, quantity: true, unit: true},
          take: 4,
        },
        paymentRequests: {
          where: {status: {in: ["Failed", "Expired"]}},
          select: {status: true},
          take: 1,
        },
        _count: {select: {complaints: true}},
      },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const base = {view, q, pageSize};

  if (page > pages) {
    redirect(adminListHref(PATH, base, {page: pages}));
  }

  const labels = [
    ["needs-action", "Needs action"],
    ["new-requests", "New requests"],
    ["fulfilment", "In fulfilment"],
    ["completed", "Completed"],
  ];

  const nextAction = (order: (typeof orders)[number]) => {
    if (
      ["Delivered", "Collected", "Completed", "Cancelled"].includes(
        order.fulfilmentStatus,
      )
    ) {
      return "Open order";
    }

    if (order.paymentRequests.length) return "Review failed payment";

    if (
      [
        "Pending confirmation",
        "Payment pending",
        "Unpaid",
        "Part-paid",
        "Payment failed",
        "Payment cancelled",
        "Pending",
        "Failed",
      ].includes(order.paymentStatus)
    ) {
      return "Request payment";
    }

    const pickup = order.deliveryMethod.toLowerCase().includes("pickup");

    if (pickup) {
      if (order.fulfilmentStatus === "Preparing") {
        return "Mark ready for collection";
      }

      if (order.fulfilmentStatus === "Ready for pickup") {
        return "Mark collected";
      }

      return "Update pickup";
    }

    if (order.fulfilmentStatus === "Preparing") {
      return "Assign delivery";
    }

    return "Update fulfilment";
  };

  const range = adminResultRange(page, pageSize, total);

  return (
    <AdminShell
      title="Orders"
      description="Review requests, payments and fulfilment."
      compactHeader
      action={
        <Link
          href="/admin/create-order"
          className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white"
        >
          New order
        </Link>
      }
    >
      <div className="grid gap-5">
        <nav
          aria-label="Order views"
          className="flex gap-2 overflow-x-auto pb-2"
        >
          {labels.map(([value, label]) => (
            <Link
              key={value}
              href={adminListHref(PATH, {view: value, q})}
              aria-current={view === value ? "page" : undefined}
              className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-black ${
                view === value
                  ? "bg-[#102015] text-white"
                  : "border bg-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <AdminListToolbar
          search={q}
          filters={[]}
          pageSize={pageSize}
          resetHref={`${PATH}?view=${view}`}
          hiddenParams={{view}}
          searchLabel="Search orders"
          searchPlaceholder="Order code, buyer, phone or item"
        />

        <AdminResultCount {...range} total={total} label="orders" />

        {orders.length ? (
          <>
            <section className="grid gap-3 md:hidden">
              {orders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-2xl border bg-white p-4 shadow-sm"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <Link
                        href={`/admin/orders/${order.id}`} prefetch={false}
                        className="font-black text-[#1f7a3f]"
                      >
                        {order.code}
                      </Link>
                      <p className="font-bold">{order.buyerName}</p>
                    </div>

                    <p className="font-black">
                      {formatOrderTotal(order.estimatedTotal)}
                    </p>
                  </div>

                  <p className="mt-2 text-sm text-[#405348]">
                    {getOrderItemsSummary(order.items)}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <AdminStatusPill
                      tone={adminToneFromStatus(order.paymentStatus)}
                    >
                      {order.paymentStatus}
                    </AdminStatusPill>

                    <AdminStatusPill
                      tone={adminToneFromStatus(order.fulfilmentStatus)}
                    >
                      {order.fulfilmentStatus}
                    </AdminStatusPill>
                  </div>

                  <Link
                    href={`/admin/orders/${order.id}`} prefetch={false}
                    className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#1f7a3f] px-4 text-sm font-black text-white"
                  >
                    {nextAction(order)}
                  </Link>
                </article>
              ))}
            </section>

            <section className="hidden overflow-x-auto rounded-2xl border bg-white md:block">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-[#f3f8ef] text-xs uppercase">
                  <tr>
                    <th className="p-4">Order</th>
                    <th className="p-4">Buyer</th>
                    <th className="p-4">Items</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Fulfilment</th>
                    <th className="p-4">Last activity</th>
                    <th className="p-4">Next action</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t align-middle">
                      <td className="p-4">
                        <Link
                          href={`/admin/orders/${order.id}`} prefetch={false}
                          className="font-black text-[#1f7a3f]"
                        >
                          {order.code}
                        </Link>
                      </td>

                      <td className="p-4">
                        <p className="font-bold">{order.buyerName}</p>
                        <p className="text-xs text-[#587063]">{order.phone}</p>
                      </td>

                      <td className="max-w-56 truncate p-4">
                        {getOrderItemsSummary(order.items)}
                      </td>

                      <td className="p-4 font-black">
                        {formatOrderTotal(order.estimatedTotal)}
                      </td>

                      <td className="p-4">
                        <AdminStatusPill
                          tone={adminToneFromStatus(order.paymentStatus)}
                        >
                          {order.paymentStatus}
                        </AdminStatusPill>
                      </td>

                      <td className="p-4">
                        <AdminStatusPill
                          tone={adminToneFromStatus(order.fulfilmentStatus)}
                        >
                          {order.fulfilmentStatus}
                        </AdminStatusPill>
                      </td>

                      <td className="p-4">
                        {order.updatedAt.toLocaleDateString("en-GB", {timeZone: "Africa/Lagos"})}
                      </td>

                      <td className="p-4">
                        <Link
                          href={`/admin/orders/${order.id}`} prefetch={false}
                          className="inline-flex min-h-11 items-center rounded-full px-3 font-black text-[#1f7a3f]"
                        >
                          {nextAction(order)}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        ) : (
          <AdminEmptyState
            title="No orders match this view."
            description="Try a different search or view."
            resetHref={`${PATH}?view=${view}`}
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
    </AdminShell>
  );
}

async function NewRequestsView({
  q,
  page,
  pageSize,
  canDelete,
  conversionError,
}: {
  q: string;
  page: number;
  pageSize: number;
  canDelete: boolean;
  conversionError: string;
}) {
  const where = {
    status: {in: ["New", "Reviewing"]},
    ...(q
      ? {
          OR: [
            {buyerName: {contains: q, mode: "insensitive" as const}},
            {phone: {contains: q}},
            {email: {contains: q, mode: "insensitive" as const}},
            {location: {contains: q, mode: "insensitive" as const}},
            {items: {contains: q, mode: "insensitive" as const}},
            {message: {contains: q, mode: "insensitive" as const}},
          ],
        }
      : {}),
  };

  const total = await prisma.orderRequest.count({where});
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const base = {view: "new-requests", q, pageSize};

  if (page > pages) {
    redirect(adminListHref(PATH, base, {page: pages}));
  }

  const requests = await prisma.orderRequest.findMany({
    where,
    orderBy: [{updatedAt: "asc"}, {id: "asc"}],
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      buyerName: true,
      buyerType: true,
      phone: true,
      email: true,
      location: true,
      deliveryPreference: true,
      timing: true,
      items: true,
      message: true,
      source: true,
      status: true,
      groupBuyInterest: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const range = adminResultRange(page, pageSize, total);
  const errorMessage = requestErrorMessage(conversionError);
  const returnTo = adminListHref(PATH, base, {page});

  return (
    <AdminShell
      title="Orders"
      description="Review and accept new order requests."
      compactHeader
      action={
        <Link
          href="/admin/create-order"
          className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white"
        >
          New order
        </Link>
      }
    >
      <div className="grid gap-5">
        <nav
          aria-label="Order views"
          className="flex gap-2 overflow-x-auto pb-2"
        >
          {[
            ["needs-action", "Needs action"],
            ["new-requests", "New requests"],
            ["fulfilment", "In fulfilment"],
            ["completed", "Completed"],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={adminListHref(PATH, {view: value, pageSize})}
              aria-current={
                value === "new-requests" ? "page" : undefined
              }
              className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-black ${
                value === "new-requests"
                  ? "bg-[#102015] text-white"
                  : "border bg-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {errorMessage ? (
          <div
            role="alert"
            className="rounded-2xl border border-[#9b1c1c]/20 bg-[#ffe8e5] p-4 text-sm font-bold text-[#9b1c1c]"
          >
            {errorMessage}
          </div>
        ) : null}

        <AdminListToolbar
          search={q}
          filters={[]}
          pageSize={pageSize}
          resetHref={`${PATH}?view=new-requests`}
          hiddenParams={{view: "new-requests"}}
          searchLabel="Search requests"
          searchPlaceholder="Buyer, phone, location or requested items"
        />

        <AdminResultCount {...range} total={total} label="new requests" />

        {requests.length ? (
          <div className="grid gap-4">
            {requests.map((request) => (
              <article
                key={request.id}
                className="rounded-2xl border bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-[#102015]">
                      {request.buyerName || "Unnamed buyer"}
                    </p>

                    <p className="mt-1 text-sm text-[#587063]">
                      {request.phone}
                      {request.email ? ` · ${request.email}` : ""}
                    </p>

                    <p className="mt-1 text-xs font-bold text-[#587063]">
                      {requestSource(request.source)} ·{" "}
                      {formatDate(request.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {request.groupBuyInterest ? (
                      <AdminStatusPill tone="amber">Group buy interest</AdminStatusPill>
                    ) : null}
                    <AdminStatusPill
                      tone={adminToneFromStatus(request.status)}
                    >
                      {request.status}
                    </AdminStatusPill>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 rounded-2xl bg-[#f7f5ec] p-4 text-sm md:grid-cols-2">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-[#587063]">
                      Requested items
                    </p>
                    <p className="mt-2 whitespace-pre-wrap leading-6 text-[#102015]">
                      {request.items || "No items provided"}
                    </p>
                  </div>

                  <div className="grid content-start gap-2 text-[#405348]">
                    <p>
                      <span className="font-black text-[#102015]">
                        Buyer type:
                      </span>{" "}
                      {request.buyerType}
                    </p>
                    <p>
                      <span className="font-black text-[#102015]">
                        Delivery:
                      </span>{" "}
                      {request.deliveryPreference}
                    </p>
                    <p>
                      <span className="font-black text-[#102015]">
                        Location:
                      </span>{" "}
                      {request.location || "Not provided"}
                    </p>
                    <p>
                      <span className="font-black text-[#102015]">
                        Timing:
                      </span>{" "}
                      {request.timing || "Not provided"}
                    </p>
                  </div>
                </div>

                {request.message ? (
                  <details className="mt-3 rounded-xl border bg-white p-3">
                    <summary className="cursor-pointer text-sm font-black">
                      Buyer message
                    </summary>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#405348]">
                      {request.message}
                    </p>
                  </details>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3">
                  <form action={updateOrderRequestStatusAction}>
                    <input
                      type="hidden"
                      name="requestId"
                      value={request.id}
                    />
                    <input
                      type="hidden"
                      name="status"
                      value="Converted to order"
                    />
                    <button
                      type="submit"
                      className="min-h-11 rounded-full bg-[#1f7a3f] px-5 text-sm font-black text-white hover:bg-[#155c2f]"
                    >
                      Accept and create order
                    </button>
                  </form>

                  {request.status !== "Reviewing" ? (
                    <form action={updateOrderRequestStatusAction}>
                      <input
                        type="hidden"
                        name="requestId"
                        value={request.id}
                      />
                      <input
                        type="hidden"
                        name="status"
                        value="Reviewing"
                      />
                      <button
                        type="submit"
                        className="min-h-11 rounded-full border bg-white px-5 text-sm font-black text-[#102015]"
                      >
                        Mark under review
                      </button>
                    </form>
                  ) : null}

                  <form action={updateOrderRequestStatusAction}>
                    <input
                      type="hidden"
                      name="requestId"
                      value={request.id}
                    />
                    <input
                      type="hidden"
                      name="status"
                      value="Rejected"
                    />
                    <button
                      type="submit"
                      className="min-h-11 rounded-full border border-[#9b1c1c]/20 bg-white px-5 text-sm font-black text-[#9b1c1c]"
                    >
                      Reject
                    </button>
                  </form>

                  {canDelete ? (
                    <AdminRecordControls
                      recordType="OrderRequest"
                      recordId={request.id}
                      canDelete
                      returnTo={returnTo}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <AdminEmptyState
            title="No new requests"
            description="There are no order requests waiting for review."
            resetHref={`${PATH}?view=new-requests`}
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
    </AdminShell>
  );
}
