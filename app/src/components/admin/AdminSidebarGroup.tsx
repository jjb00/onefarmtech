"use client";

import Link from "next/link";
import {usePathname, useSearchParams} from "next/navigation";
import {AdminNavigationLink, isAdminNavigationLinkActive} from "@/data/adminNavigation";

export default function AdminSidebarGroup({title, links}: {title: string; links: AdminNavigationLink[]}) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const groupActive = links.some((link) => isAdminNavigationLinkActive(link, pathname, search));

  return (
    <details className={`group rounded-2xl border bg-white/[0.03] p-2 ${groupActive ? "border-[#9ee6ad]/50" : "border-white/10"}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-2 py-2">
        <p className={`text-xs font-black uppercase tracking-[0.22em] ${groupActive ? "text-white" : "text-[#9ee6ad]"}`}>{title}</p>
        <span aria-hidden="true" className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] text-lg font-black text-white/80 transition group-open:rotate-90">›</span>
      </summary>
      <div className="mt-2 grid gap-2">
        {links.map((item) => {
          const active = isAdminNavigationLinkActive(item, pathname, search);
          return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`rounded-xl px-3 py-2 transition ${active ? "bg-[#9ee6ad] text-[#07120c]" : "text-white hover:bg-white/[0.08]"}`}>
            <p className="font-bold">{item.title}</p>
            <p className={`mt-1 line-clamp-2 text-xs leading-5 ${active ? "text-[#173c24]" : "text-white/55"}`}>{item.description}</p>
          </Link>;
        })}
      </div>
    </details>
  );
}
