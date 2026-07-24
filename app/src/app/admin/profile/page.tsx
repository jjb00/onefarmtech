import AdminShell from "@/components/admin/AdminShell";
import {requireStaff} from "@/lib/auth";

export default async function StaffProfilePage() {
  const staff = await requireStaff();
  return (
    <AdminShell title="My profile" description="Your signed-in staff identity and access role." compactHeader>
      <section className="max-w-2xl rounded-2xl border border-[#102015]/10 bg-white p-6 shadow-sm">
        <dl className="grid gap-5 sm:grid-cols-2">
          <div><dt className="text-xs font-black uppercase tracking-wider text-[#587063]">Name</dt><dd className="mt-1 font-black">{staff.name}</dd></div>
          <div><dt className="text-xs font-black uppercase tracking-wider text-[#587063]">Role</dt><dd className="mt-1 font-black">{staff.role}</dd></div>
          <div className="sm:col-span-2"><dt className="text-xs font-black uppercase tracking-wider text-[#587063]">Email</dt><dd className="mt-1 font-black">{staff.email}</dd></div>
        </dl>
      </section>
    </AdminShell>
  );
}
