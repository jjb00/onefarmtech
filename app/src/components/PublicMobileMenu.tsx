import Link from "next/link";
import {buildWhatsAppLink} from "@/lib/whatsapp";

const whatsappOrderHref = buildWhatsAppLink(encodeURIComponent("Hello OneFarmTech, I want to place a fresh food order. Buyer type: ___ Location: ___ Items: ___"));

const sections = [
  {
    title: "Start",
    links: [
      {label: "Order on WhatsApp", href: whatsappOrderHref, primary: true, external: true},
      {label: "Order form", href: "/order-request"},
      {label: "Request buyer account", href: "/buyer-account-request"},
      {label: "Buyer login", href: "/buyer-login"},
    ],
  },
  {
    title: "Help",
    links: [
      {label: "FAQ", href: "/faq"},
      {label: "Contact", href: "/contact"},
    ],
  },
  {
    title: "Company",
    links: [
      {label: "Careers", href: "/careers"},
    ],
  },
  {
    title: "Partners",
    links: [
      {label: "Partner login", href: "/partner-login"},
      {label: "Supplier partners", href: "/supplier-partners"},
    ],
  },
];

export default function PublicMobileMenu() {
  return (
    <details className="relative md:hidden">
      <summary
        aria-label="Open menu"
        className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-[#101712]/10 bg-white/95 text-2xl font-black text-[#101712] shadow-sm backdrop-blur"
      >
        ☰
      </summary>

      <div className="absolute right-0 top-14 z-50 max-h-[78vh] w-[min(21rem,calc(100vw-2rem))] overflow-auto rounded-[1.5rem] border border-[#101712]/10 bg-white/95 p-3 shadow-2xl backdrop-blur">
        <p className="px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">
          OneFarmTech
        </p>

        <div className="grid gap-3">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl bg-[#fbfff8] p-2">
              <p className="px-2 py-1 text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#587063]">
                {section.title}
              </p>

              <nav className="mt-1 grid gap-1">
                {section.links.map((item) =>
                  item.external ? (
                    <a
                      key={item.href}
                      href={item.href}
                      className={
                        item.primary
                          ? "oft-primary-button rounded-full bg-[#1f7a3f] px-4 py-3 text-center text-sm font-black text-white"
                          : "rounded-full px-4 py-2.5 text-sm font-black text-[#101712] hover:bg-[#f3f8ef]"
                      }
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={
                        item.primary
                          ? "oft-primary-button rounded-full bg-[#1f7a3f] px-4 py-3 text-center text-sm font-black text-white"
                          : "rounded-full px-4 py-2.5 text-sm font-black text-[#101712] hover:bg-[#f3f8ef]"
                      }
                    >
                      {item.label}
                    </Link>
                  )
                )}
              </nav>
            </section>
          ))}
        </div>
      </div>
    </details>
  );
}
