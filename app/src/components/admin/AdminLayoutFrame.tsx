import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import AdminNavigationLink from "@/components/admin/AdminNavigationLink";
import AdminProfileMenu from "@/components/admin/AdminProfileMenu";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {adminNavigationGroups} from "@/data/adminNavigation";
import {getCurrentStaffActor} from "@/lib/currentStaff";
import {filterAdminLinksForRole} from "@/lib/adminAccess";

type AdminLayoutFrameProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  compactHeader?: boolean;
  eyebrow?: string;
};

export default async function AdminLayoutFrame({
  title,
  description,
  action,
  children,
  compactHeader,
  eyebrow,
}: AdminLayoutFrameProps) {
  const staff = await getCurrentStaffActor();
  const links = adminNavigationGroups
    .flatMap((group) => filterAdminLinksForRole(staff.role, group.links));

  const profileLinks = [
    {label: "My profile", href: "/admin/profile"},
    ...(staff.role === "Super admin"
      ? [{label: "Staff management", href: "/admin/staff"}]
      : []),
    ...(["Super admin", "Admin"].includes(staff.role)
      ? [{label: "Audit log", href: "/admin/audit-log"}]
      : []),
    ...(staff.role === "Super admin"
      ? [{label: "System tools", href: "/admin/system-tools"}]
      : []),
    {label: "Sign out", href: "/admin/logout"},
  ];

  return (
    <main className="min-h-screen bg-[#f5f7f2] text-[#102015]">
      <div className="grid min-h-screen lg:grid-cols-[224px_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/10 bg-[#07120c] px-4 py-5 text-white lg:block">
          <Link href="/admin" className="block px-2">
            <BrandMark variant="light" />
          </Link>

          <nav aria-label="Admin navigation" className="mt-8 grid gap-1.5">
            {links.map((item) => (
              <AdminNavigationLink key={item.href} item={item} />
            ))}
          </nav>

          <div className="mt-8 border-t border-white/10 px-2 pt-5">
            <p className="truncate text-sm font-bold text-white">{staff.name}</p>
            <p className="mt-0.5 text-xs text-white/55">{staff.role}</p>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="sticky top-0 z-30 border-b border-[#102015]/10 bg-[#f5f7f2]/95 backdrop-blur">
            <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 md:px-6 lg:px-8">
              <div className="lg:hidden">
                <details className="relative">
                  <summary className="cursor-pointer list-none rounded-xl border border-[#102015]/15 bg-white px-4 py-2 text-sm font-black">
                    Menu
                  </summary>
                  <nav className="absolute left-0 top-12 z-50 grid w-64 gap-1 rounded-2xl border border-[#102015]/10 bg-[#07120c] p-2 shadow-2xl">
                    <Link href="/admin" className="mb-2 block px-3 py-2">
                      <BrandMark variant="light" />
                    </Link>
                    {links.map((item) => (
                      <AdminNavigationLink key={item.href} item={item} />
                    ))}
                  </nav>
                </details>
              </div>

              <div className="ml-auto">
                <AdminProfileMenu
                  name={staff.name}
                  role={staff.role}
                  links={profileLinks}
                />
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-[1440px] px-4 py-5 md:px-6 lg:px-8 lg:py-7">
            <AdminPageHeader
              title={title}
              description={description}
              action={action}
              compact={compactHeader}
              eyebrow={eyebrow}
            />
            <section className="mt-6">{children}</section>
          </div>
        </section>
      </div>
    </main>
  );
}
