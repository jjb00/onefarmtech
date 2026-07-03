import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { adminNavigationGroups } from "@/data/adminNavigation";

type AdminLayoutFrameProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export default function AdminLayoutFrame({
  title,
  description,
  action,
  children,
}: AdminLayoutFrameProps) {
  return (
    <main className="min-h-screen bg-[#07120c] text-white">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-white/10 bg-[#07120c] px-6 py-6">
          <Link href="/admin" className="block">
            <BrandMark variant="light" />
          </Link>

          <div className="mt-10 grid gap-8">
            {adminNavigationGroups.map((group) => (
              <section key={group.title}>
                <p className="text-xs font-black uppercase tracking-[0.32em] text-[#9ee6ad]">
                  {group.title}
                </p>

                <div className="mt-4 grid gap-2">
                  {group.links.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-2xl px-4 py-3 transition hover:bg-white/[0.06]"
                    >
                      <p className="font-bold text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-white/50">
                        {item.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-bold text-[#9ee6ad]">Internal console</p>
            <p className="mt-2 text-xs leading-5 text-white/50">
              Admin-only workspace for orders, suppliers, payments, complaints,
              group buys, pickup points, and WhatsApp operations.
            </p>
            <Link
              href="/admin/logout"
              className="mt-4 inline-flex rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/70"
            >
              Sign out
            </Link>
          </div>
        </aside>

        <section className="min-w-0 px-5 py-6 md:px-8 lg:px-12">
          <header className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9ee6ad]">
                  Operations desk
                </p>
                <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                  {title}
                </h1>
                <p className="mt-4 max-w-4xl text-base leading-7 text-white/65 md:text-lg">
                  {description}
                </p>
              </div>

              {action && <div className="shrink-0">{action}</div>}
            </div>
          </header>

          {children}
        </section>
      </div>
    </main>
  );
}
