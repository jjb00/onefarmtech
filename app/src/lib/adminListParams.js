export const ADMIN_PAGE_SIZES = [25, 50, 100];

export function parseAdminPageSize(value) {
  const size = Number.parseInt(String(value || ""), 10);
  return ADMIN_PAGE_SIZES.includes(size) ? size : 25;
}

export function parseAdminPage(value) {
  const page = Number.parseInt(String(value || ""), 10);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function adminResultRange(page, pageSize, total) {
  if (total === 0) return {start: 0, end: 0};
  const start = (page - 1) * pageSize + 1;
  return {start, end: Math.min(start + pageSize - 1, total)};
}

export function adminListHref(pathname, params, overrides = {}) {
  const next = new URLSearchParams();
  for (const [key, rawValue] of Object.entries({...params, ...overrides})) {
    const value = String(rawValue ?? "").trim();
    if (value && !(key === "page" && value === "1")) next.set(key, value);
  }
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}
