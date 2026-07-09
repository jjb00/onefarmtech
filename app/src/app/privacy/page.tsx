import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicFooter from "@/components/PublicFooter";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#fbfff8] text-[#102015]">
      <section className="mx-auto max-w-4xl px-6 py-10 lg:px-10">
        <Link href="/" aria-label="Go to OneFarmTech homepage"><BrandMark /></Link>
        <h1 className="mt-10 text-4xl font-black">Privacy policy</h1>
        <div className="mt-6 grid gap-5 text-sm leading-7 text-[#405348]">
          <p>OneFarmTech collects information needed to process produce orders, buyer accounts, supplier relationships, payments, delivery support and customer communication.</p>
          <p>Information may include names, phone numbers, email addresses, company details, delivery information, order history, payment references and support messages.</p>
          <p>We use this information to operate the service, support buyers and partners, maintain records, improve reliability and meet legal or operational obligations.</p>
          <p>We do not sell personal data. Access is limited to authorised team members and service providers needed to operate the platform.</p>
          <p>For privacy questions or correction requests, contact OneFarmTech through the contact page.</p>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
