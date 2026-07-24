export const BUYER_VIEWS = ["active", "applications", "guests", "access", "updates", "all"];

const broad = [...BUYER_VIEWS];
export function buyerViewsForRole(role) {
  if (["Super admin", "Admin", "Buyer account manager"].includes(role)) return broad;
  if (role === "Operations") return ["active", "all", "guests", "applications"];
  if (role === "Support") return ["active", "all", "applications", "updates"];
  return [];
}
export function resolveBuyerView(value) { const view = String(value || "active").toLowerCase(); return BUYER_VIEWS.includes(view) ? view : "active"; }
export function resolveBuyerViewForRole(value, role) {
  const allowed = buyerViewsForRole(role);
  const fallback = role === "Buyer account manager" && allowed.includes("applications") ? "applications" : "active";
  const view = value ? resolveBuyerView(value) : fallback;
  return allowed.includes(view) ? view : (allowed.includes(fallback) ? fallback : allowed[0] || null);
}
export function buyerViewHref(view, params = {}) { const query = new URLSearchParams({view: resolveBuyerView(view)}); for (const key of ["q", "status", "type", "readiness", "pageSize"]) { const value = String(params[key] || "").trim(); if (value) query.set(key, value); } return `/admin/customers?${query}`; }
