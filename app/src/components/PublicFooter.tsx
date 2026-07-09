import Link from "next/link";
import BrandMark from "@/components/BrandMark";

const footerGroups = [
  {
    title: "Buyers",
    links: [
      ["Order produce", "/order"],
      ["Request buyer account", "/buyer-account-request"],
      ["FAQ", "/faq"],
      ["Contact", "/contact"],
    ],
  },
  {
    title: "Partners",
    links: [
      ["Supplier partners", "/supplier-partners"],
      ["Delivery partner login", "/delivery-partner/login"],
      ["Careers", "/careers"],
      ["Join a group buy", "/order"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About OneFarmTech", "/#about"],
      ["Careers", "/careers"],
      ["Contact", "/contact"],
      ["FAQ", "/faq"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Privacy policy", "/privacy"],
      ["Data protection", "/data-protection"],
      ["Terms of use", "/terms"],
    ],
  },
];

export default function PublicFooter() {
  return (
    <footer className="border-t border-[#102015]/10 bg-[#102015] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.1fr_1.9fr] lg:px-10">
        <div>
          <Link href="/" aria-label="Go to OneFarmTech homepage" className="inline-flex rounded-2xl bg-white px-4 py-3">
            <BrandMark />
          </Link>

          <p className="mt-5 max-w-md text-sm leading-7 text-white/70">
            Fresh produce ordering, sourcing and fulfilment for buyers who need better prices, quality and reliability.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://wa.me/?text=Hello%20OneFarmTech%2C%20I%20want%20to%20place%20a%20fresh%20food%20order."
              className="rounded-full bg-[#F2B84B] px-5 py-3 text-sm font-black text-[#102015] hover:bg-[#e4a833]"
            >
              Order on WhatsApp
            </a>
            <Link
              href="/buyer-account-request"
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-black text-white hover:bg-white/10"
            >
              Buyer account
            </Link>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-[#F2B84B]">
                {group.title}
              </h2>
              <div className="mt-4 grid gap-3">
                {group.links.map(([label, href]) => (
                  <Link
                    key={`${group.title}-${label}`}
                    href={href}
                    className="text-sm font-semibold text-white/70 hover:text-white"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-xs font-semibold text-white/50 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p>© {new Date().getFullYear()} OneFarmTech. All rights reserved.</p>
          <p>Built for buyers, growers, suppliers and food operators.</p>
        </div>
      </div>
    </footer>
  );
}
