export const BUYER_VIEWS = ["all", "applications", "access", "updates"];

const broad = [...BUYER_VIEWS];

export function buyerViewsForRole(role) {
  if (["Super admin", "Admin", "Buyer account manager"].includes(role)) {
    return broad;
  }

  if (role === "Operations") {
    return ["all", "applications"];
  }

  if (role === "Support") {
    return ["all", "applications", "updates"];
  }

  return [];
}

export function resolveBuyerView(value) {
  const requested = String(value || "all").toLowerCase();

  // Preserve old bookmarks by resolving the retired guests view to Buyers.
  if (requested === "guests") return "all";

  return BUYER_VIEWS.includes(requested) ? requested : "all";
}

export function resolveBuyerViewForRole(value, role) {
  const allowed = buyerViewsForRole(role);
  const view = resolveBuyerView(value);

  return allowed.includes(view) ? view : (allowed[0] || null);
}

export function buyerViewHref(view, params = {}) {
  const query = new URLSearchParams({view: resolveBuyerView(view)});

  for (const key of [
    "q",
    "status",
    "type",
    "readiness",
    "queue",
    "pageSize",
  ]) {
    const value = String(params[key] || "").trim();
    if (value) query.set(key, value);
  }

  return `/admin/customers?${query}`;
}
