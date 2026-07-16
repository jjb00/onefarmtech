import {NextRequest, NextResponse} from "next/server";
import {canAccessAdminPath} from "@/lib/adminAccess";
import {isStaffRole} from "@/lib/permissions";

const STAFF_SESSION_COOKIE = "oft_admin_session";

export function proxy(request: NextRequest) {
  const {pathname, search} = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/login" || pathname === "/staff-login";
  const isAuthenticated = Boolean(
    request.cookies.get(STAFF_SESSION_COOKIE)?.value,
  );
  const roleCookie = request.cookies.get("oft_staff_role")?.value || "Admin";
  const staffRole = isStaffRole(roleCookie) ? roleCookie : "Admin";

  if (isAdminRoute && !isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/staff-login";
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && isAuthenticated && !canAccessAdminPath(staffRole, `${pathname}${search}`)) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    adminUrl.searchParams.set("access", "denied");
    adminUrl.searchParams.set("blocked", pathname);
    return NextResponse.redirect(adminUrl);
  }

  if (isLoginRoute && isAuthenticated) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    adminUrl.search = "";
    return NextResponse.redirect(adminUrl);
  }

  if (pathname === "/login") {
    const staffLoginUrl = request.nextUrl.clone();
    staffLoginUrl.pathname = "/staff-login";
    return NextResponse.redirect(staffLoginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/staff-login"],
};
