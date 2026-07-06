import {getCurrentStaffActor} from "@/lib/currentStaff";

export async function requireStaff() {
  return getCurrentStaffActor();
}
