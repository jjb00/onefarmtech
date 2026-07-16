export const COMMUNICATION_VIEWS = ["all", "whatsapp", "enquiries", "email", "reconciliation"];

export function resolveCommunicationView(value) {
  const view = String(value || "all").trim().toLowerCase();
  return COMMUNICATION_VIEWS.includes(view) ? view : "all";
}

export function communicationViewHref(view, params = {}) {
  const query = new URLSearchParams();
  query.set("view", resolveCommunicationView(view));
  for (const key of ["q", "status", "direction", "type", "source", "pageSize"]) {
    const value = String(params[key] || "").trim();
    if (value) query.set(key, value);
  }
  return `/admin/buyer-messages?${query.toString()}`;
}
