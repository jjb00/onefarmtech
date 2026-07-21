import crypto from "node:crypto";

export const STAFF_LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const STAFF_LOGIN_MAX_FAILURES = 5;
const SUPPORTED_ROLES = new Set(["Super admin", "Admin", "Operations", "Finance", "Support", "Buyer account manager"]);

export function staffLoginFingerprint(ipAddress, email, sessionSecret) {
  return crypto.createHmac("sha256", String(sessionSecret || "missing-session-secret"))
    .update(`${String(ipAddress || "unknown")}:${String(email || "").trim().toLowerCase()}`)
    .digest("hex").slice(0, 24);
}

export async function authenticateStaffLogin({db, email, password, verifyPassword}) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail || !password) return null;
  const staff = await db.staffUser.findFirst({where: {email: {equals: normalizedEmail, mode: "insensitive"}}});
  if (!staff || staff.status !== "Active" || !SUPPORTED_ROLES.has(staff.role)) return null;
  return verifyPassword(staff.email, password) ? staff : null;
}
