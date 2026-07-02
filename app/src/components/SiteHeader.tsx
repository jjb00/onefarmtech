import Link from "next/link";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const navLinks = [
  { href: "/faq", label: "FAQ" },
  { href: "/login", label: "Login" },
  { href: "/dashboard", label: "Buyer Dashboard" },
  { href: "/admin", label: "Admin" },
];

export default function SiteHeader() {
  return (
    <header className="bg-[#f7f5ec] px-6 py-5 text-[#102015]">
      <section className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            OneFarmTech
          </Link>

          <a
            href={buildWhatsAppLink()}
            className="rounded-full bg-[#1f7a3f] px-4 py-3 text-sm font-semibold text-white shadow-sm"
          >
            WhatsApp
          </a>
        </div>

        <nav className="flex flex-wrap gap-3 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full bg-white px-4 py-2 shadow-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </section>
    </header>
  );
}
