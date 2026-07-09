import Link from "next/link";

const footerLinks = [
  ["About", "/#about"],
  ["FAQ", "/faq"],
  ["Careers", "/careers"],
  ["Partner login", "/partner-login"],
  ["Privacy", "/privacy"],
  ["Data protection", "/data-protection"],
  ["Terms", "/terms"],
];

export default function PublicFooter() {
  return (
    <footer className="border-t border-[#102015]/10 bg-[#102015] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <Link
              href="/"
              aria-label="Go to OneFarmTech homepage"
              className="inline-flex items-center gap-3 text-[#9ee6ad]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#9ee6ad] text-lg font-black text-[#102015]">
                OF
              </span>
              <span className="text-xl font-black tracking-tight">OneFarmTech</span>
            </Link>

            <p className="mt-4 max-w-lg text-sm leading-7 text-white/65">
              Fresh produce ordering, sourcing and fulfilment for buyers, growers,
              suppliers and local agri communities.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-3 lg:justify-end">
            {footerLinks.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="text-sm font-black text-white/70 transition hover:text-[#9ee6ad]"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 border-t border-white/10 pt-5">
          <div className="flex flex-col gap-2 text-xs font-semibold leading-6 text-white/45 md:flex-row md:items-center md:justify-between">
            <p>
              © {new Date().getFullYear()} OneFarmTech. All rights reserved.
            </p>
            <p>
              OneFarmTech is a private fresh produce technology and fulfilment platform.
              Company details may be added here when finalised.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
