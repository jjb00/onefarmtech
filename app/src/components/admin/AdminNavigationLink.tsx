"use client";

import Link from "next/link";
import {usePathname, useSearchParams} from "next/navigation";
import {
  AdminNavigationLink as NavigationLink,
  isAdminNavigationLinkActive,
} from "@/data/adminNavigation";

export default function AdminNavigationLink({item}: {item: NavigationLink}) {
  const active = isAdminNavigationLinkActive(
    item,
    usePathname(),
    useSearchParams().toString(),
  );

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`block rounded-xl px-3 py-2.5 text-sm font-bold transition ${
        active
          ? "bg-[#9ee6ad] text-[#07120c]"
          : "text-white/78 hover:bg-white/[0.08] hover:text-white"
      }`}
    >
      {item.title}
    </Link>
  );
}
