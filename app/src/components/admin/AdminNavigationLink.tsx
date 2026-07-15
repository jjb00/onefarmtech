"use client";

import Link from "next/link";
import {usePathname, useSearchParams} from "next/navigation";
import {AdminNavigationLink as NavigationLink, isAdminNavigationLinkActive} from "@/data/adminNavigation";

export default function AdminNavigationLink({item}: {item: NavigationLink}) {
  const active = isAdminNavigationLinkActive(item, usePathname(), useSearchParams().toString());
  return <Link href={item.href} aria-current={active ? "page" : undefined} className={`block rounded-xl border px-4 py-3 text-sm font-bold ${active ? "border-[#9ee6ad] bg-[#9ee6ad] text-[#07120c]" : "border-white/10 bg-white/[0.05] text-white hover:bg-white/[0.1]"}`}>{item.title}</Link>;
}
