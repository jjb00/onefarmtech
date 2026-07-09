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
      <div className="mx-auto max-w-7xl px-6 py-5 lg:px-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#9ee6ad]">
              ONEFARM-TECH LTD · RC - 1714625 · SUITE 7, Cherry Hill Plaza, FCT, Abuja 900108, Federal Capital Territory, Nigeria
            </p>
            <p className="mt-2 text-xs font-semibold leading-5 text-white/45">
              Built for buyers, growers, suppliers and food operators.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-4 gap-y-2 md:justify-end">
            {footerLinks.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="text-xs font-black text-white/60 transition hover:text-[#9ee6ad]"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-4 border-t border-white/10 pt-3 text-xs font-semibold text-white/35">
          © {new Date().getFullYear()} OneFarmTech. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
