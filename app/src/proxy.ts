import {NextRequest, NextResponse} from "next/server";
import {STAFF_SESSION_COOKIE} from "@/lib/currentStaff";

export function proxy(request: NextRequest) {
  const {pathname, search} = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isStaffLoginRoute = pathname === "/staff-login" || pathname === "/login";
  const isAuthenticated =
    request.cookies.get(STAFF_SESSION_COOKIE)?.value === "authenticated";

  if (isAdminRoute && !isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/staff-login";
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isStaffLoginRoute && isAuthenticated) {
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
