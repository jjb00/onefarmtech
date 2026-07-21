import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {createStaffSessionToken} from "@/lib/staffAuthorization";
import {STAFF_SESSION_COOKIE} from "@/lib/currentStaff";
import {
  ADMIN_RECOVERY_EMAIL,
  ADMIN_RECOVERY_MAX_ATTEMPTS,
  ADMIN_RECOVERY_ROLE,
  ADMIN_RECOVERY_WINDOW_MS,
  recoveryAttemptFingerprint,
  recoveryTokenMatches,
} from "@/lib/adminRecovery.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function failure(request: NextRequest) {
  return NextResponse.redirect(new URL("/admin-recovery?error=1", request.url), {status: 303});
}

async function recordAttempt(action: string, fingerprint: string) {
  await prisma.auditLog.create({data: {
    actorName: "Emergency recovery", actorRole: "System", action,
    entityType: "AdminRecovery", entityLabel: "Protected recovery route",
    metadata: JSON.stringify({fingerprint}),
  }});
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return failure(request);

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const fingerprint = recoveryAttemptFingerprint(forwarded, process.env.SESSION_SECRET);
  const since = new Date(Date.now() - ADMIN_RECOVERY_WINDOW_MS);
  const recentFailures = await prisma.auditLog.count({where: {action: "Rejected emergency admin recovery", createdAt: {gte: since}, metadata: {contains: fingerprint}}});
  if (recentFailures >= ADMIN_RECOVERY_MAX_ATTEMPTS) {
    await recordAttempt("Rate limited emergency admin recovery", fingerprint);
    return failure(request);
  }

  const formData = await request.formData();
  const submitted = formData.get("token");
  const configured = process.env.EMERGENCY_ADMIN_RECOVERY_TOKEN;
  const tokenValid = typeof submitted === "string" && recoveryTokenMatches(submitted, configured);
  const staff = tokenValid ? await prisma.staffUser.findUnique({where: {email: ADMIN_RECOVERY_EMAIL}}) : null;
  if (!tokenValid || !staff || staff.status !== "Active" || staff.role !== ADMIN_RECOVERY_ROLE) {
    await recordAttempt("Rejected emergency admin recovery", fingerprint);
    return failure(request);
  }

  await recordAttempt("Completed emergency admin recovery", fingerprint);
  const response = NextResponse.redirect(new URL("/admin", request.url), {status: 303});
  response.cookies.set(STAFF_SESSION_COOKIE, createStaffSessionToken({
    staffId: staff.id, role: "Super admin", staffUpdatedAt: staff.updatedAt.toISOString(),
    expiresAt: Date.now() + 60 * 60 * 1000, version: 1,
  }), {httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60});
  return response;
}
