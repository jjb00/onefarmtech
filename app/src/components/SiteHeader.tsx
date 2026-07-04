import Link from "next/link";
import BrandMark from "@/components/BrandMark";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/faq", label: "FAQ" },
];

export default function SiteHeader() {
  return (
    <header className="border-b border-[#102015]/10 bg-[#f8f1e7]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" aria-label="OneFarmTech home">
          <BrandMark />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-[#405348] md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-[#102015]">
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/order"
          className="rounded-full bg-[#102015] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1f2a20]"
        >
          Order
        </Link>
      </div>
    </header>
  );
}
