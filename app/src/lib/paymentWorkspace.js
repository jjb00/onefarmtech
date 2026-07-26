const FINAL_STATUSES = new Set(["Paid", "Cancelled"]);
const ACTIONABLE_STATUSES = new Set([
  "Pending",
  "Initialising",
  "Failed",
  "Expired",
]);

export function groupPaymentRequestsByOrder(requests) {
  const groups = new Map();

  for (const request of requests) {
    const existing = groups.get(request.orderId);

    if (existing) {
      existing.attempts.push(request);
    } else {
      groups.set(request.orderId, {
        orderId: request.orderId,
        order: request.order,
        customer: request.customer,
        attempts: [request],
      });
    }
  }

  return [...groups.values()].map((group) => {
    const attempts = [...group.attempts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const paid = attempts.find(
      (attempt) => attempt.status === "Paid" || attempt.paidAt,
    );

    const actionable = attempts.find((attempt) =>
      ACTIONABLE_STATUSES.has(attempt.status),
    );

    const current = paid || actionable || attempts[0];

    return {
      ...group,
      attempts,
      current,
      status: paid ? "Paid" : current?.status || "Pending",
      provider: current?.provider || "Manual",
      amount: current?.amount || 0,
      updatedAt: current?.updatedAt || current?.createdAt,
      isFinal: paid ? true : FINAL_STATUSES.has(current?.status),
    };
  });
}

export function paymentWorkspaceStatus(group) {
  if (group.status === "Paid") return "paid";
  if (["Failed", "Expired"].includes(group.status)) return "needs-action";
  if (group.status === "Cancelled") return "cancelled";
  return "pending";
}

export function filterPaymentGroups(groups, {view, provider, query}) {
  const normalizedProvider = String(provider || "all").toLowerCase();
  const normalizedQuery = String(query || "").trim().toLowerCase();

  return groups.filter((group) => {
    const status = paymentWorkspaceStatus(group);

    const viewMatch =
      view === "all" ||
      view === status ||
      (view === "needs-action" &&
        ["Failed", "Expired"].includes(group.status));

    const providerMatch =
      normalizedProvider === "all" ||
      group.provider.toLowerCase() === normalizedProvider;

    const haystack = [
      group.order?.code,
      group.order?.buyerName,
      group.order?.phone,
      group.customer?.name,
      group.current?.reference,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const queryMatch = !normalizedQuery || haystack.includes(normalizedQuery);

    return viewMatch && providerMatch && queryMatch;
  });
}
