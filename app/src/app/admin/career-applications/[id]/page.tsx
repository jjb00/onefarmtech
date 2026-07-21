import AdminPageShell from "@/components/AdminPageShell";
import {updateCareerApplicationAction} from "@/actions/publicApplications";
import {requireAnyCapability} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {notFound} from "next/navigation";

const statuses = ["New", "Reviewing", "Shortlisted", "Interview", "Rejected", "Hired", "Archived"];
export default async function CareerApplicationDetail({params, searchParams}: {params: Promise<{id: string}>; searchParams?: Promise<{success?: string}>}) {
  await requireAnyCapability("manage_staff", "manage_support"); const {id} = await params; const query = await searchParams;
  const item = await prisma.careerApplication.findUnique({where: {id}}); if (!item) notFound();
  return <AdminPageShell title={item.name} description={`${item.role} · ${item.location}`} actionHref="/admin/career-applications" actionLabel="Back to applications">
    {query?.success ? <div role="status" className="mb-4 rounded-xl bg-[#eef8ef] p-4 font-bold text-[#155c2f]">Application updated.</div> : null}
    <section className="rounded-2xl bg-white p-6"><p className="text-sm"><strong>Email:</strong> {item.email}<br/><strong>Phone:</strong> {item.phone}<br/><strong>Source:</strong> {item.source}</p><h2 className="mt-5 font-black">Experience</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-7">{item.experience}</p>
      <form action={updateCareerApplicationAction} className="mt-6 grid gap-4"><input type="hidden" name="id" value={item.id}/><label className="grid gap-2 font-bold">Status<select name="status" defaultValue={item.status} className="rounded-xl border p-3 font-normal">{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><label className="grid gap-2 font-bold">Internal notes<textarea name="adminNote" defaultValue={item.adminNote || ""} rows={5} className="rounded-xl border p-3 font-normal" /></label><button className="rounded-full bg-[#1f7a3f] px-5 py-3 font-black text-white">Save review</button></form>
    </section>
  </AdminPageShell>;
}
