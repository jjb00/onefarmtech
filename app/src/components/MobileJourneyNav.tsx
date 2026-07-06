import Link from "next/link";

const items = [
  { href: "/order", label: "Order" },
  { href: "/group-buys", label: "Group buys" },
  { href: "/buyer-account-request", label: "Buyer account" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export default function MobileJourneyNav() {
  return (
    <nav
      aria-label="Mobile quick navigation"
      className="mx-auto mt-5 grid max-w-xl grid-cols-2 gap-3 rounded-[1.75rem] border border-[#101712]/10 bg-white/90 p-3 shadow-sm backdrop-blur md:hidden"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-full bg-[#f3f8ef] px-4 py-3 text-center text-sm font-black text-[#102015] shadow-sm"
        >
          {item.label}
        </Link>
      ))}

      <Link
        href="/order"
        className="col-span-2 rounded-full bg-[#1f7a3f] px-4 py-3 text-center text-sm font-black text-white shadow-sm"
      >
        Start order
      </Link>
    </nav>
  );
}
