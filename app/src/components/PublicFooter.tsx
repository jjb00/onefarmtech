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
      <div className="mx-auto max-w-7xl px-6 py-4 lg:px-10">
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          {footerLinks.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="text-xs font-semibold text-white/65 transition hover:text-[#9ee6ad]"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-3 border-t border-white/10 pt-3">
          <div className="grid gap-1 text-[0.66rem] font-normal leading-5 text-white/35 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p>
                ONEFARM-TECH LTD · RC - 1714625 · SUITE 7, Cherry Hill Plaza,
                FCT, Abuja 900108, Federal Capital Territory, Nigeria
              </p>
              <p>Built for buyers, growers, suppliers and food operators.</p>
            </div>
            <p>© {new Date().getFullYear()} OneFarmTech. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
