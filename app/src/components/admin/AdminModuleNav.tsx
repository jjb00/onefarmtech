import Link from "next/link";
import { adminNavigationGroups } from "@/data/adminNavigation";

export const adminModuleLinks = adminNavigationGroups.flatMap((group) =>
  group.links.map((link) => ({
    ...link,
    group: group.title,
  }))
);

export default function AdminModuleNav() {
  const priorityModules = adminModuleLinks.filter(
    (module) => module.href !== "/admin" && module.priority,
  );
  const secondaryModules = adminModuleLinks.filter(
    (module) => module.href !== "/admin" && !module.priority,
  );

  return (
    <section className="mt-8 grid gap-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
          Start here
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {priorityModules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="rounded-2xl border border-[#102015]/10 bg-white px-4 py-4 text-[#102015] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f3f8ef]"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">
                {module.group}
              </p>
              <h2 className="mt-2 text-lg font-black text-[#102015]">{module.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#405348]">
                {module.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {secondaryModules.length ? (
        <details className="rounded-2xl border border-[#102015]/10 bg-white p-4 shadow-sm">
          <summary className="cursor-pointer list-none">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8a7d55]">
                  Secondary tools
                </p>
                <h2 className="mt-2 text-lg font-black text-[#102015]">
                  Secondary records and setup tools
                </h2>
              </div>
              <span className="rounded-full bg-[#f3f8ef] px-4 py-2 text-sm font-black text-[#1f7a3f]">
                {secondaryModules.length} tools
              </span>
            </div>
          </summary>

          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {secondaryModules.map((module) => (
              <Link
                key={module.href}
                href={module.href}
                className="rounded-xl border border-[#102015]/10 bg-[#fbfff8] px-3 py-3 transition hover:bg-[#f3f8ef]"
              >
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#587063]">
                  {module.group}
                </p>
                <h3 className="mt-2 font-black text-[#102015]">{module.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#405348]">
                  {module.description}
                </p>
              </Link>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}
