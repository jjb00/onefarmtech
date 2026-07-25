"use client";

import Link from "next/link";
import {useEffect, useRef, useState} from "react";

type ProfileLink = {
  label: string;
  href: string;
};

export default function AdminProfileMenu({
  name,
  role,
  links,
}: {
  name: string;
  role: string;
  links: ProfileLink[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }

    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);

    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex min-h-11 items-center gap-3 rounded-full border border-[#102015]/10 bg-white py-1.5 pl-2 pr-4 shadow-sm"
      >
        <span
          aria-hidden="true"
          className="grid h-8 w-8 place-items-center rounded-full bg-[#1f7a3f] text-sm font-black text-white"
        >
          {name.slice(0, 1).toUpperCase()}
        </span>

        <span className="hidden text-left sm:block">
          <span className="block text-sm font-black text-[#102015]">{name}</span>
          <span className="block text-xs text-[#587063]">{role}</span>
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-56 rounded-2xl border border-[#102015]/10 bg-white p-2 shadow-xl"
        >
          {links.map((item) => (
            <Link
              key={item.href}
              role="menuitem"
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-bold text-[#102015] hover:bg-[#f3f8ef] focus:bg-[#f3f8ef]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
