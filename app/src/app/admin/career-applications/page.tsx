import Link from "next/link";
import AdminPageShell from "@/components/AdminPageShell";
import {requireAnyCapability} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
const statuses = ["All", "New", "Reviewing", "Shortlisted", "Interview", "Rejected", "Hired", "Archived"];

export default async function CareerApplicationsPage({searchParams}: {searchParams?: Promise<{q?: string; status?: string}>}) {
  await requireAnyCapability("manage_staff", "manage_support");
  const params = await searchParams, q = String(params?.q || "").trim(), status = String(params?.status || "All");
  const applications = await prisma.careerApplication.findMany({where: {AND: [status !== "All" ? {status} : {}, q ? {OR: [{name: {contains: q, mode: "insensitive"}}, {email: {contains: q, mode: "insensitive"}}, {role: {contains: q, mode: "insensitive"}}]} : {}]}, orderBy: {createdAt: "desc"}, take: 100});
  return <AdminPageShell title="Career applications" description="Dedicated applicant review, separate from contact enquiries.">
    <form className="flex flex-wrap gap-3 rounded-2xl bg-white p-4"><input name="q" defaultValue={q} placeholder="Search applicant or role" className="min-w-0 flex-1 rounded-xl border px-4 py-2" /><select name="status" defaultValue={status} className="rounded-xl border px-4 py-2">{statuses.map((item) => <option key={item}>{item}</option>)}</select><button className="rounded-full bg-[#1f7a3f] px-5 py-2 font-black text-white">Filter</button></form>
    <div className="mt-5 grid gap-3">{applications.map((item) => <Link key={item.id} href={`/admin/career-applications/${item.id}`} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex justify-between gap-3"><div><h2 className="font-black">{item.name}</h2><p className="mt-1 text-sm text-[#405348]">{item.role} · {item.email} · {item.location}</p></div><span className="h-fit rounded-full bg-[#f3f8ef] px-3 py-1 text-xs font-black">{item.status}</span></div></Link>)}</div>
  </AdminPageShell>;
}
