import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import {adminNavigationGroups} from "@/data/adminNavigation";
import {getCurrentStaffActor} from "@/lib/currentStaff";
import {canAccessAdminPath, filterAdminLinksForRole, getRoleAccessSummary} from "@/lib/adminAccess";

type AdminLayoutFrameProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export default async function AdminLayoutFrame({
  title,
  description,
  action,
  children,
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
            {visibleNavigationGroups.map((group, index) => (
              <details
                key={group.title}
                open={index < 2}
                className="group rounded-3xl border border-white/10 bg-white/[0.03] p-3"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-2 py-2">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9ee6ad]">
                    {group.title}
                  </p>
                  <span
                    aria-hidden="true"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] text-lg font-black text-white/80 transition group-open:rotate-90"
                  >
                    ›
                  </span>
                </summary>

                <div className="mt-2 grid gap-2">
                  {group.links.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-2xl px-4 py-3 transition hover:bg-white/[0.08]"
                    >
                      <p className="font-bold text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-white/60">
                        {item.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </details>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-bold text-[#9ee6ad]">Internal console</p>
            <p className="mt-2 text-xs leading-5 text-white/60">
              Orders, suppliers, payments, receipts, complaints, group buys,
              pickup points and WhatsApp operations.
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
            <div className="rounded-[2rem] border border-[#102015]/10 bg-[#07120c] p-5 text-white shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <Link href="/admin" className="block">
                  <BrandMark variant="light" />
                </Link>
                <Link
                  href="/admin/logout"
                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/80"
                >
                  Sign out
                </Link>
              </div>

              <div className="mt-4 rounded-2xl border border-[#F2B84B]/20 bg-[#F2B84B]/10 p-4">
                <p className="text-sm font-black text-[#F2B84B]">Staff session</p>
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

              <details className="group mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-2 py-2">
                  <span className="text-xs font-black uppercase tracking-[0.24em] text-[#9ee6ad]">
                    Admin sections
                  </span>
                  <span
                    aria-hidden="true"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] text-lg font-black text-white/80 transition group-open:rotate-90"
                  >
                    ›
                  </span>
                </summary>

                <div className="mt-3 grid gap-3">
                  {visibleNavigationGroups.map((group) => (
                    <div key={group.title} className="rounded-2xl bg-white/[0.04] p-3">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9ee6ad]">
                        {group.title}
                      </p>
                      <div className="mt-2 grid gap-1">
                        {group.links.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="rounded-xl px-3 py-2 text-sm font-bold text-white/90 hover:bg-white/[0.08]"
                          >
                            {item.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </div>

          <header className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm md:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[#1f7a3f]">
                  Operations desk
                </p>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-[#102015] md:text-5xl">
                  {title}
                </h1>
                <p className="mt-4 max-w-4xl text-base leading-7 text-[#405348] md:text-lg">
                  {description}
                </p>
              </div>

              {action && <div className="shrink-0">{action}</div>}
            </div>
          </header>

          <section className="mt-8 text-[#102015]">{children}</section>
        </section>
      </div>
    </main>
  );
}
