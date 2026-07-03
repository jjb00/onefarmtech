"use server";

import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {
  STAFF_EMAIL_COOKIE,
  STAFF_NAME_COOKIE,
  STAFF_ROLE_COOKIE,
  STAFF_SESSION_COOKIE,
} from "@/lib/currentStaff";
import {isStaffRole} from "@/lib/permissions";

function readText(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export async function loginAction(formData: FormData) {
  const password = readText(formData, "password");
  const nextPath = readText(formData, "next", "/admin");
  const staffName = readText(formData, "staffName", "Local staff user");
  const staffEmail = readText(formData, "staffEmail");
  const roleInput = readText(formData, "staffRole", "Admin");
  const staffRole = isStaffRole(roleInput) ? roleInput : "Admin";
  const expectedPassword = process.env.ADMIN_PASSWORD || "onefarmtech-admin";

  if (password !== expectedPassword) {
    redirect(`/staff-login?error=1&next=${encodeURIComponent(nextPath)}`);
  }

  const cookieStore = await cookies();

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 8,
  };

  cookieStore.set(STAFF_SESSION_COOKIE, "authenticated", cookieOptions);
  cookieStore.set(STAFF_NAME_COOKIE, staffName, cookieOptions);
  cookieStore.set(STAFF_ROLE_COOKIE, staffRole, cookieOptions);

  if (staffEmail) {
    cookieStore.set(STAFF_EMAIL_COOKIE, staffEmail, cookieOptions);
  } else {
    cookieStore.set(STAFF_EMAIL_COOKIE, "", {
      ...cookieOptions,
      maxAge: 0,
    });
  }

  redirect(nextPath.startsWith("/admin") ? nextPath : "/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();

  for (const cookieName of [
    STAFF_SESSION_COOKIE,
    STAFF_NAME_COOKIE,
    STAFF_EMAIL_COOKIE,
    STAFF_ROLE_COOKIE,
  ]) {
    cookieStore.set(cookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }

  redirect("/staff-login");
}
