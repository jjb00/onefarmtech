import {getCurrentStaffActor} from "@/lib/currentStaff";
import {redirect} from "next/navigation";
import {roleHasCapability, type StaffCapability, type StaffRole} from "@/lib/permissions";

export async function requireStaff() {
  const staff = await getCurrentStaffActor();
  if (!staff.isAuthenticated) redirect("/staff-login");
  return staff;
}

export async function requireStaffRole(...roles: StaffRole[]) {
  const staff = await requireStaff();
  if (!roles.includes(staff.role)) throw new Error("Forbidden: staff role is not permitted.");
  return staff;
}

export async function requireCapability(capability: StaffCapability) {
  const staff = await requireStaff();
  if (!roleHasCapability(staff.role, capability)) throw new Error("Forbidden: staff capability is required.");
  return staff;
}

export async function requireAnyCapability(...capabilities: StaffCapability[]) {
  const staff = await requireStaff();
  if (!capabilities.some((capability) => roleHasCapability(staff.role, capability))) {
    throw new Error("Forbidden: one of the required staff capabilities is required.");
  }
  return staff;
}
