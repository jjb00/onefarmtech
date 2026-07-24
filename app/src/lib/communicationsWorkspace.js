export const COMMUNICATION_VIEWS = ["all", "whatsapp", "enquiries", "email", "reconciliation", "operations"];

const broadViews = [...COMMUNICATION_VIEWS];
const supportViews = ["all", "whatsapp", "enquiries", "email", "operations"];

export function communicationViewsForRole(role) {
  if (role === "Finance") return ["reconciliation"];
  if (role === "Support") return supportViews;
  if (["Super admin", "Admin", "Operations"].includes(role)) return broadViews;
  return [];
}

export function resolveCommunicationViewForRole(value, role) {
  const allowed = communicationViewsForRole(role);
  const requested = resolveCommunicationView(value);
  return allowed.includes(requested) ? requested : (allowed[0] || null);
}

export function resolveCommunicationView(value) {
  const view = String(value || "all").trim().toLowerCase();
  return COMMUNICATION_VIEWS.includes(view) ? view : "all";
}

export function communicationViewHref(view, params = {}) {
  const query = new URLSearchParams();
  query.set("view", resolveCommunicationView(view));
  for (const key of ["q", "status", "direction", "type", "source", "category", "severity", "relatedType", "pageSize"]) {
    const value = String(params[key] || "").trim();
    if (value) query.set(key, value);
  }
  return `/admin/buyer-messages?${query.toString()}`;
}
