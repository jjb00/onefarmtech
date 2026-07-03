import {cookies} from "next/headers";
import {isStaffRole, type StaffRole} from "@/lib/permissions";

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

  const isAuthenticated =
    cookieStore.get(STAFF_SESSION_COOKIE)?.value === "authenticated";

  const roleValue = cookieStore.get(STAFF_ROLE_COOKIE)?.value || "Admin";
  const role = isStaffRole(roleValue) ? roleValue : "Admin";

  return {
    isAuthenticated,
    name: cookieStore.get(STAFF_NAME_COOKIE)?.value || "Local staff user",
    email: cookieStore.get(STAFF_EMAIL_COOKIE)?.value || null,
    role,
    authMode: "temporary-password",
  };
}
