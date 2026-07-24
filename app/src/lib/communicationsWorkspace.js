export const COMMUNICATION_VIEWS = ["needs-reply", "whatsapp", "enquiries", "failed", "all", "email", "reconciliation", "operations"];

const supportViews = ["needs-reply", "whatsapp", "enquiries", "failed", "all"];

export function communicationViewsForRole(role) {
  if (role === "Finance") return [];
  if (role === "Support") return supportViews;
  if (role === "Super admin") return [...COMMUNICATION_VIEWS];
  if (["Admin", "Operations"].includes(role)) return supportViews;
  return [];
}

export function resolveCommunicationViewForRole(value, role) {
  const allowed = communicationViewsForRole(role);
  const requested = resolveCommunicationView(value);
  return allowed.includes(requested) ? requested : (allowed[0] || null);
}

export function resolveCommunicationView(value) {
  const view = String(value || "needs-reply").trim().toLowerCase();
  return COMMUNICATION_VIEWS.includes(view) ? view : "needs-reply";
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
