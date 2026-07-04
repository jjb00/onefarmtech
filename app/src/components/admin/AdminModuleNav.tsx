import Link from "next/link";
import { adminNavigationGroups } from "@/data/adminNavigation";

export const adminModuleLinks = adminNavigationGroups.flatMap((group) =>
  group.links.map((link) => ({
    ...link,
    group: group.title,
  }))
);

export default function AdminModuleNav() {
  return (
    <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {adminModuleLinks
        .filter((module) => module.href !== "/admin")
        .map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="rounded-2xl bg-white p-6 transition hover:bg-white/15"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1f7a3f]">
              {module.group}
            </p>
            <h2 className="mt-3 text-xl font-bold text-[#102015]">{module.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[#d8e8dc]">
              {module.description}
            </p>
          </Link>
        ))}
    </section>
  );
}
