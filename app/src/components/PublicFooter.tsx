import Link from "next/link";

const footerLinks = [
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
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/"
              aria-label="Go to OneFarmTech homepage"
              className="text-lg font-black tracking-tight text-[#9ee6ad] hover:text-white"
            >
              OneFarmTech
            </Link>
            <p className="mt-2 text-xs font-semibold leading-6 text-white/50">
              ONEFARM-TECH LTD · RC - 1714625
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-2 lg:justify-end">
            {footerLinks.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="text-sm font-black text-white/65 transition hover:text-[#9ee6ad]"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="flex flex-col gap-2 text-xs font-semibold leading-6 text-white/40 md:flex-row md:items-center md:justify-between">
            <p>© {new Date().getFullYear()} OneFarmTech. All rights reserved.</p>
            <p>Built for buyers, growers, suppliers and food operators.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
