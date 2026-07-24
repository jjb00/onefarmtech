"use client";

import Link from "next/link";
import {useEffect, useRef, useState} from "react";
import BrandMark from "@/components/BrandMark";
import AdminNavigationLink from "@/components/admin/AdminNavigationLink";
import type {AdminNavigationLink as NavigationLink} from "@/data/adminNavigation";
import type {CurrentStaffActor} from "@/lib/currentStaff";

const SIDEBAR_KEY = "oft-admin-sidebar-collapsed";

export default function AdminChrome({
  staff,
  links,
  children,
}: {
  staff: CurrentStaffActor;
  links: NavigationLink[];
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== "undefined" && window.localStorage.getItem(SIDEBAR_KEY) === "true",
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    window.localStorage.setItem(SIDEBAR_KEY, String(next));
  }

  const profileLinks = [
    {label: "My profile", href: "/admin/profile", show: true},
    {label: "Staff management", href: "/admin/staff", show: staff.role === "Super admin"},
    {label: "Audit log", href: "/admin/audit-log", show: ["Super admin", "Admin"].includes(staff.role)},
    {label: "System tools", href: "/admin/system-tools", show: staff.role === "Super admin"},
    {label: "Sign out", href: "/admin/logout", show: true},
  ].filter((item) => item.show);

  const navigation = (
    <nav aria-label="Primary admin navigation" className="mt-8 grid gap-2">
      {links.map((item) => (
        <AdminNavigationLink key={item.href} item={item} compact={collapsed} onNavigate={() => setMobileOpen(false)} />
      ))}
    </nav>
  );

  return (
    <main className="min-h-screen bg-[#f4f8ef] text-[#102015]">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close admin navigation"
          className="fixed inset-0 z-30 bg-black/35 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
      <aside id="admin-navigation" className={`fixed inset-y-0 left-0 z-40 bg-[#07120c] px-4 py-5 text-white transition-[width,transform] lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "w-20" : "w-72"}`}>
        <div className="flex items-center justify-between gap-3">
          {!collapsed ? <Link href="/admin"><BrandMark variant="light" /></Link> : <span className="mx-auto text-lg font-black text-[#9ee6ad]">OF</span>}
          <button type="button" onClick={toggleSidebar} className="hidden min-h-11 min-w-11 rounded-xl border border-white/15 text-white lg:inline-flex lg:items-center lg:justify-center" aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} aria-expanded={!collapsed}>
            {collapsed ? "›" : "‹"}
          </button>
        </div>
        {navigation}
      </aside>

      <div className={`min-h-screen transition-[padding] ${collapsed ? "lg:pl-20" : "lg:pl-72"}`}>
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-[#102015]/10 bg-[#f4f8ef]/95 px-5 backdrop-blur md:px-8 lg:px-12">
          <button type="button" onClick={() => setMobileOpen(true)} className="inline-flex min-h-11 items-center rounded-xl border border-[#102015]/15 bg-white px-4 text-sm font-black lg:hidden" aria-expanded={mobileOpen} aria-controls="admin-navigation">
            Menu
          </button>
          <div className="ml-auto relative" ref={profileRef}>
            <button type="button" onClick={() => setProfileOpen((open) => !open)} aria-haspopup="menu" aria-expanded={profileOpen} className="flex min-h-11 items-center gap-3 rounded-full border border-[#102015]/10 bg-white py-1.5 pl-2 pr-4 shadow-sm">
              <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full bg-[#1f7a3f] text-sm font-black text-white">{staff.name.slice(0, 1).toUpperCase()}</span>
              <span className="hidden text-left sm:block"><span className="block text-sm font-black">{staff.name}</span><span className="block text-xs text-[#587063]">{staff.role}</span></span>
            </button>
            {profileOpen ? (
              <div role="menu" className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#102015]/10 bg-white p-2 shadow-xl">
                {profileLinks.map((item) => <Link key={item.href} role="menuitem" href={item.href} onClick={() => setProfileOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#f3f8ef] focus:bg-[#f3f8ef]">{item.label}</Link>)}
              </div>
            ) : null}
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
