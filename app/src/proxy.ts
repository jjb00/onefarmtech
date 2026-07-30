import {NextRequest, NextResponse} from "next/server";
import {canAccessAdminPath} from "@/lib/adminAccess";
import {verifyStaffSessionToken} from "@/lib/staffAuthorization";

const STAFF_SESSION_COOKIE = "oft_admin_session";

function buildCsp(nonce: string) {
  const devEval = process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com https://cloud.umami.is${devEval}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://cloud.umami.is https://challenges.cloudflare.com https://*.sentry.io https://*.ingest.sentry.io",
    "frame-src https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function withSecurityHeaders(response: NextResponse, csp: string) {
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-Frame-Options", "DENY");
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  return response;
}

export function proxy(request: NextRequest) {
  const {pathname, search} = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/login" || pathname === "/staff-login";
  const claims = verifyStaffSessionToken(request.cookies.get(STAFF_SESSION_COOKIE)?.value);
  const isAuthenticated = Boolean(claims);

  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildCsp(nonce);

  if (isAdminRoute && !isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/staff-login";
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return withSecurityHeaders(NextResponse.redirect(loginUrl), csp);
  }

  if (isAdminRoute && claims && !canAccessAdminPath(claims.role, `${pathname}${search}`)) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    adminUrl.searchParams.set("access", "denied");
    adminUrl.searchParams.set("blocked", pathname);
    return withSecurityHeaders(NextResponse.redirect(adminUrl), csp);
  }

  if (isLoginRoute && isAuthenticated) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    adminUrl.search = "";
    return withSecurityHeaders(NextResponse.redirect(adminUrl), csp);
  }

  if (pathname === "/login") {
    const staffLoginUrl = request.nextUrl.clone();
    staffLoginUrl.pathname = "/staff-login";
    return withSecurityHeaders(NextResponse.redirect(staffLoginUrl), csp);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  return withSecurityHeaders(
    NextResponse.next({request: {headers: requestHeaders}}),
    csp,
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)"],
};
