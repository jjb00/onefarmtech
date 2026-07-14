import {getCurrentStaffActor} from "@/lib/currentStaff";
import {redirect} from "next/navigation";

export async function requireStaff() {
  const staff = await getCurrentStaffActor();
  if (!staff.isAuthenticated) redirect("/staff-login");
  return staff;
}
