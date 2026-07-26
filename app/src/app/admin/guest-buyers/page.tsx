import {redirect} from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function GuestBuyersPage() {
  redirect("/admin/customers?view=all&relationship=Guest+buyer");
}
