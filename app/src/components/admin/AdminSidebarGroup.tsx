"use client";

import Link from "next/link";
import {useEffect, useState} from "react";

type AdminSidebarLink = {
  title: string;
  href: string;
  description: string;
};

type AdminSidebarGroupProps = {
  title: string;
  links: AdminSidebarLink[];
};

function storageKey(title: string) {
  return `onefarmtech-admin-sidebar-${title}`;
}

export default function AdminSidebarGroup({title, links}: AdminSidebarGroupProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey(title));
    setOpen(stored === "open");
  }, [title]);

  function handleToggle(nextOpen: boolean) {
    setOpen(nextOpen);
    window.localStorage.setItem(storageKey(title), nextOpen ? "open" : "closed");
  }

  return (
    <details
      open={open}
      onToggle={(event) => handleToggle(event.currentTarget.open)}
      className="group rounded-3xl border border-white/10 bg-white/[0.03] p-3"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-2 py-2">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9ee6ad]">
          {title}
        </p>
        <span
          aria-hidden="true"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] text-lg font-black text-white/80 transition group-open:rotate-90"
        >
          ›
        </span>
      </summary>

      <div className="mt-2 grid gap-2">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl px-4 py-3 transition hover:bg-white/[0.08]"
          >
            <p className="font-bold text-white">{item.title}</p>
            <p className="mt-1 text-sm text-white/60">{item.description}</p>
          </Link>
        ))}
      </div>
    </details>
  );
}
