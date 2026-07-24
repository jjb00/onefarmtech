import AdminChrome from "@/components/admin/AdminChrome";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {adminNavigationGroups} from "@/data/adminNavigation";
import {getCurrentStaffActor} from "@/lib/currentStaff";
import {filterAdminLinksForRole} from "@/lib/adminAccess";

type Props = {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  compactHeader?: boolean;
  eyebrow?: string;
};

export default async function AdminLayoutFrame({title, description, action, children, compactHeader, eyebrow}: Props) {
  const staff = await getCurrentStaffActor();
  const links = filterAdminLinksForRole(staff.role, adminNavigationGroups.flatMap((group) => group.links));
  return (
    <AdminChrome staff={staff} links={links}>
      <section className="min-w-0 px-5 py-6 md:px-8 lg:px-12">
        <AdminPageHeader title={title} description={description} action={action} compact={compactHeader} eyebrow={eyebrow} />
        <section className="mt-6 text-[#102015]">{children}</section>
      </section>
    </AdminChrome>
  );
}
