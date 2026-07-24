import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import AdminSidebarGroup from "@/components/admin/AdminSidebarGroup";
import AdminNavigationLink from "@/components/admin/AdminNavigationLink";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {adminNavigationGroups} from "@/data/adminNavigation";
import {getCurrentStaffActor} from "@/lib/currentStaff";
import {canAccessAdminPath, filterAdminLinksForRole, getRoleAccessSummary} from "@/lib/adminAccess";

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
  const visibleNavigationGroups = adminNavigationGroups
    .map((group) => ({
      ...group,
      links: filterAdminLinksForRole(staff.role, group.links),
    }))
    .filter((group) => group.links.length > 0);
  const securityHref = canAccessAdminPath(staff.role, "/admin/security")
    ? "/admin/security"
    : "/admin/deployment-readiness";

  return (
    <main className="min-h-screen bg-[#f4f8ef] text-[#102015]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-[#102015]/10 bg-[#07120c] px-6 py-6 text-white lg:block">
          <Link href="/admin" className="block">
            <BrandMark variant="light" />
          </Link>

          <div className="mt-6 rounded-3xl border border-[#F2B84B]/20 bg-[#F2B84B]/10 p-4">
            <p className="text-sm font-black text-[#F2B84B]">Staff session</p>
            <p className="mt-2 text-xs leading-5 text-white/70">
              Signed in as <strong>{staff.name}</strong> · {staff.role}.
            </p>
            <p className="mt-2 text-xs leading-5 text-white/60">
              {getRoleAccessSummary(staff.role)}
            </p>
            <Link
              href={securityHref}
              className="mt-3 inline-flex rounded-full border border-[#F2B84B]/30 px-3 py-2 text-xs font-bold text-[#F2B84B]"
            >
              Access status
            </Link>
          </div>

          <div className="mt-10 grid gap-3">
            {visibleNavigationGroups.map((group) => (
              <AdminSidebarGroup
                key={group.title}
                title={group.title}
                links={group.links}
              />
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-bold text-[#9ee6ad]">Internal console</p>
            <p className="mt-2 text-xs leading-5 text-white/60">
              Start with Today’s work for daily WhatsApp orders, payment follow-up,
              delivery handoff and support routing. Secondary tools stay grouped below.
            </p>
            <Link
              href="/admin/logout"
              className="mt-4 inline-flex rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/80"
            >
              Sign out
            </Link>
          </div>
        </aside>

        <section className="min-w-0 bg-[#f4f8ef] px-5 py-6 text-[#102015] md:px-8 lg:px-12">
          <div className="mb-5 grid gap-4 lg:hidden">
            <div className="rounded-[1.5rem] border border-[#102015]/10 bg-[#07120c] p-4 text-white shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <Link href="/admin" className="block">
                  <BrandMark variant="light" />
                </Link>
                <Link
                  href="/admin/logout"
                  className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white"
                >
                  Sign out
                </Link>
              </div>

              <details className="group mt-4 rounded-2xl border border-[#9ee6ad]/30 bg-[#9ee6ad]/10 p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-2 py-2">
                  <span>
                    <span className="block text-sm font-black text-[#9ee6ad]">
                      Admin menu
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-white/65">
                      Daily work, WhatsApp storefront, commerce, buyers and settings
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-xl font-black text-white transition group-open:rotate-90"
                  >
                    ›
                  </span>
                </summary>

                <div className="mt-3 grid gap-3">
                  {visibleNavigationGroups.map((group) => (
                    <div key={group.title} className="rounded-2xl bg-[#07120c]/55 p-3">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9ee6ad]">
                        {group.title}
                      </p>
                      <div className="mt-2 grid gap-2">
                        {group.links.map((item) => (
                          <AdminNavigationLink key={item.href} item={item} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>

              <details className="group mt-3 rounded-2xl border border-[#F2B84B]/20 bg-[#F2B84B]/10 p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-2 py-2">
                  <span className="text-sm font-black text-[#F2B84B]">
                    Session details
                  </span>
                  <span
                    aria-hidden="true"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] text-lg font-black text-white/80 transition group-open:rotate-90"
                  >
                    ›
                  </span>
                </summary>
                <div className="px-2 pb-1">
                  <p className="mt-2 text-xs leading-5 text-white/70">
                    Signed in as <strong>{staff.name}</strong> · {staff.role}.
                  </p>
                  <Link
                    href={securityHref}
                    className="mt-3 inline-flex rounded-full border border-[#F2B84B]/30 px-3 py-2 text-xs font-bold text-[#F2B84B]"
                  >
                    Access status
                  </Link>
                </div>
              </details>
            </div>
          </div>

          <AdminPageHeader title={title} description={description} action={action} compact={compactHeader} eyebrow={eyebrow} />

          <section className="mt-8 text-[#102015]">{children}</section>
        </section>
      </div>
    </main>
  );
}
