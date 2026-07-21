import {cookies} from "next/headers";
import {isStaffRole, type StaffRole} from "@/lib/permissions";
import {prisma} from "@/lib/prisma";
import {verifyStaffSessionToken} from "@/lib/staffAuthorization";

export const STAFF_SESSION_COOKIE = "oft_admin_session";

export type CurrentStaffActor = {
  isAuthenticated: boolean;
  name: string;
  email: string | null;
  role: StaffRole;
  id: string | null;
  authMode: "authoritative-staff";
};

export async function getCurrentStaffActor(): Promise<CurrentStaffActor> {
  const cookieStore = await cookies();

  const claims = verifyStaffSessionToken(cookieStore.get(STAFF_SESSION_COOKIE)?.value);
  const staff = claims ? await prisma.staffUser.findUnique({where: {id: claims.staffId}}) : null;
  const valid = Boolean(
    staff && staff.status === "Active" && isStaffRole(staff.role) &&
    staff.role === claims?.role && staff.updatedAt.toISOString() === claims?.staffUpdatedAt,
  );

  return {
    isAuthenticated: valid,
    id: valid ? staff!.id : null,
    name: valid ? staff!.name : "Unauthenticated staff",
    email: valid ? staff!.email : null,
    role: valid ? (staff!.role as StaffRole) : "Support",
    authMode: "authoritative-staff",
  };
}
