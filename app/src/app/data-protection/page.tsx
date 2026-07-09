import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicFooter from "@/components/PublicFooter";

export default function DataProtectionPage() {
  return (
    <main className="min-h-screen bg-[#fbfff8] text-[#102015]">
      <section className="mx-auto max-w-4xl px-6 py-10 lg:px-10">
        <Link href="/" aria-label="Go to OneFarmTech homepage"><BrandMark /></Link>
        <h1 className="mt-10 text-4xl font-black">Data protection</h1>
        <div className="mt-6 grid gap-5 text-sm leading-7 text-[#405348]">
          <p>OneFarmTech keeps operational records for orders, payments, receipts, buyer support, supplier coordination and delivery evidence.</p>
          <p>Access to internal records should be role-based and limited to the team members who need the information to serve buyers, suppliers and partners.</p>
          <p>Sensitive access codes, buyer account details and partner access details should not be shared publicly or stored in unsecured channels.</p>
          <p>Where third-party tools are used for payments, communication, hosting or analytics, those tools should be reviewed for security and operational fit.</p>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
