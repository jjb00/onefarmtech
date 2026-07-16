export const BUYER_VIEWS = ["all", "guests", "applications", "access", "updates"];

const broad = [...BUYER_VIEWS];
export function buyerViewsForRole(role) {
  if (["Super admin", "Admin", "Buyer account manager"].includes(role)) return broad;
  if (role === "Operations") return ["all", "guests", "applications"];
  if (role === "Support") return ["all", "applications", "updates"];
  return [];
}
export function resolveBuyerView(value) { const view = String(value || "all").toLowerCase(); return BUYER_VIEWS.includes(view) ? view : "all"; }
export function resolveBuyerViewForRole(value, role) { const allowed = buyerViewsForRole(role); const view = resolveBuyerView(value); return allowed.includes(view) ? view : (allowed[0] || null); }
export function buyerViewHref(view, params = {}) { const query = new URLSearchParams({view: resolveBuyerView(view)}); for (const key of ["q", "status", "type", "readiness", "pageSize"]) { const value = String(params[key] || "").trim(); if (value) query.set(key, value); } return `/admin/customers?${query}`; }
