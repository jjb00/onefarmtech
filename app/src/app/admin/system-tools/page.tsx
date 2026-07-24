import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import {requireStaffRole} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export default async function SystemToolsPage() {
  await requireStaffRole("Super admin");
  const [events, failedEmails] = await Promise.all([
    prisma.operationalEvent.count({where: {status: "Open"}}),
    prisma.emailDelivery.count({where: {status: {in: ["Failed", "Bounced", "Complained"]}, relatedType: {in: ["Order", "PaymentRequest", "Delivery", "Receipt"]}}}),
  ]);
  return <AdminShell title="System tools" description="Restricted technical diagnostics for Super Admin." compactHeader>
    <div className="grid gap-4 md:grid-cols-2">
      <Link href="/admin/buyer-messages?view=operations" className="rounded-2xl border bg-white p-5 shadow-sm"><p className="font-black">Operational events</p><p className="mt-2 text-sm text-[#405348]">{events} open technical incident{events === 1 ? "" : "s"}</p></Link>
      <Link href="/admin/buyer-messages?view=email&status=Failed" className="rounded-2xl border bg-white p-5 shadow-sm"><p className="font-black">Failed operational notifications</p><p className="mt-2 text-sm text-[#405348]">{failedEmails} delivery failure{failedEmails === 1 ? "" : "s"}</p></Link>
    </div>
  </AdminShell>;
}
