import {redirect} from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function OrderRequestsPage() {
  redirect("/admin/orders?view=new-requests");
}
