import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {STAFF_SESSION_COOKIE} from "@/lib/currentStaff";
import {createStaffSessionToken, verifyStaffPassword} from "@/lib/staffAuthorization";
import {authenticateStaffLogin, STAFF_LOGIN_MAX_FAILURES, STAFF_LOGIN_WINDOW_MS, staffLoginFingerprint} from "@/lib/staffLogin.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function failure(request: NextRequest) {
  return NextResponse.redirect(new URL("/staff-login?error=1", request.url), {status: 303});
}

async function recordLogin(action: string, fingerprint: string, staff?: {id: string; name: string; email: string; role: string} | null) {
  await prisma.auditLog.create({data: {
    actorName: staff?.name || "Unauthenticated staff", actorEmail: staff?.email || null, actorRole: staff?.role || "System",
    action, entityType: "StaffSession", entityId: staff?.id || null, entityLabel: staff?.email || "Staff login",
    metadata: JSON.stringify({fingerprint}),
  }});
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return failure(request);
  const formData = await request.formData();
  const email = String(formData.get("staffEmail") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const fingerprint = staffLoginFingerprint(ipAddress, email, process.env.SESSION_SECRET);
  const recentFailures = await prisma.auditLog.count({where: {action: "Rejected staff login", createdAt: {gte: new Date(Date.now() - STAFF_LOGIN_WINDOW_MS)}, metadata: {contains: fingerprint}}});
  if (recentFailures >= STAFF_LOGIN_MAX_FAILURES) {
    await recordLogin("Rate limited staff login", fingerprint);
    return failure(request);
  }

  const staff = await authenticateStaffLogin({db: prisma, email, password, verifyPassword: verifyStaffPassword});
  if (!staff) {
    await recordLogin("Rejected staff login", fingerprint);
    return failure(request);
  }

  await recordLogin("Completed staff login", fingerprint, staff);
  const response = NextResponse.redirect(new URL("/admin", request.url), {status: 303});
  response.cookies.set(STAFF_SESSION_COOKIE, createStaffSessionToken({
    staffId: staff.id, role: staff.role, staffUpdatedAt: staff.updatedAt.toISOString(),
    expiresAt: Date.now() + 60 * 60 * 8 * 1000, version: 1,
  }), {httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 8});
  return response;
}
