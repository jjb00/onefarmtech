import Link from "next/link";
import { adminNavigationGroups } from "@/data/adminNavigation";

type AdminLayoutFrameProps = {
  title: string;
  description?: string;
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
    <main className="min-h-screen bg-[#102015] text-white">
      <div className="mx-auto flex max-w-[1600px] flex-col lg:flex-row">
        <aside className="border-b border-white/10 bg-[#0b1710] px-6 py-6 lg:min-h-screen lg:w-80 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-4 lg:block">
            <div>
              <Link href="/" className="text-sm font-semibold text-[#9ee6ad]">
                OneFarmTech
              </Link>
              <h2 className="mt-2 text-2xl font-bold">Admin</h2>
            </div>

            <Link
              href="/admin/create-order"
              className="rounded-full bg-[#9ee6ad] px-4 py-2 text-xs font-bold text-[#102015] lg:hidden"
            >
              New order
            </Link>
          </div>

          <nav className="mt-8 grid gap-6">
            {adminNavigationGroups.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9ee6ad]">
                  {group.title}
                </p>

                <div className="mt-3 grid gap-2">
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-2xl px-4 py-3 text-sm transition hover:bg-white/10"
                    >
                      <span className="block font-semibold text-white">
                        {link.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#b8cabc]">
                        {link.description}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-bold text-white">MVP mode</p>
            <p className="mt-2 text-xs leading-5 text-[#b8cabc]">
              This admin is currently frontend-first with mock data and local
              browser drafts. Database, auth, payments, and WhatsApp automation
              come next.
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-5 py-6 sm:px-8 lg:px-10">
          <header className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#9ee6ad]">
                  <Link href="/">Public site</Link>
                  <span>/</span>
                  <Link href="/dashboard">Buyer portal</Link>
                  <span>/</span>
                  <Link href="/admin">Admin</Link>
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  {title}
                </h1>

                {description && (
                  <p className="mt-3 max-w-4xl text-sm leading-6 text-[#d8e8dc] sm:text-base">
                    {description}
                  </p>
                )}
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
