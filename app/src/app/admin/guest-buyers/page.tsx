import {redirect} from "next/navigation";

export const dynamic = "force-dynamic";

export default function RetiredPage() {
  redirect("/admin/customers?view=all&relationship=Guest+buyer");
}
