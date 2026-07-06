import Link from "next/link";

const whatsappOrderHref =
  "https://wa.me/?text=Hello%20OneFarmTech%2C%20I%20want%20to%20place%20a%20fresh%20food%20order.%20Buyer%20type%3A%20___%20Location%3A%20___%20Items%3A%20___";

const navItems = [
  {label: "Order on WhatsApp", href: whatsappOrderHref, primary: true, external: true},
  {label: "Order form", href: "/order-request"},
  {label: "Request buyer account", href: "/buyer-account-request"},
  {label: "Buyer login", href: "/buyer-login"},
  {label: "FAQ", href: "/faq"},
  {label: "Contact", href: "/contact"},
];

export default function PublicMobileMenu() {
  return (
    <details className="relative md:hidden">
      <summary
        aria-label="Open menu"
        className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-[#101712]/10 bg-white text-2xl font-black text-[#101712] shadow-sm"
      >
        ☰
      </summary>

      <div className="absolute right-0 top-14 z-50 w-[min(20rem,calc(100vw-3rem))] rounded-[1.5rem] border border-[#101712]/10 bg-white p-3 shadow-2xl">
        <p className="px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">
          OneFarmTech
        </p>

        <nav className="grid gap-2">
          {navItems.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                className={
                  item.primary
                    ? "rounded-full bg-[#1f7a3f] px-4 py-3 text-center text-sm font-black text-white"
                    : "rounded-full bg-[#f3f8ef] px-4 py-3 text-center text-sm font-black text-[#101712]"
                }
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full bg-[#f3f8ef] px-4 py-3 text-center text-sm font-black text-[#101712]"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>
      </div>
    </details>
  );
}
