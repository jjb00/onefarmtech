import {cookies} from "next/headers";
import {isStaffRole, type StaffRole} from "@/lib/permissions";
import {verifySessionToken} from "@/lib/sessionToken";

export const STAFF_SESSION_COOKIE = "oft_admin_session";
export const STAFF_NAME_COOKIE = "oft_staff_name";
export const STAFF_EMAIL_COOKIE = "oft_staff_email";
export const STAFF_ROLE_COOKIE = "oft_staff_role";

export type CurrentStaffActor = {
  isAuthenticated: boolean;
  name: string;
  email: string | null;
  role: StaffRole;
  authMode: "temporary-password" | "proper-auth";
};

export async function getCurrentStaffActor(): Promise<CurrentStaffActor> {
  const cookieStore = await cookies();

  const email = cookieStore.get(STAFF_EMAIL_COOKIE)?.value || "staff";
  const isAuthenticated = verifySessionToken(
    cookieStore.get(STAFF_SESSION_COOKIE)?.value,
    "staff",
    "staff",
  );

  const roleValue = cookieStore.get(STAFF_ROLE_COOKIE)?.value || "Admin";
  const role = isStaffRole(roleValue) ? roleValue : "Admin";

  return {
    isAuthenticated,
    name: cookieStore.get(STAFF_NAME_COOKIE)?.value || "Local staff user",
    email: email === "staff" ? null : email,
    role,
    authMode: "temporary-password",
  };
}
