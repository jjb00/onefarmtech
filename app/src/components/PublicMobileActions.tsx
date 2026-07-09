import Link from "next/link";

type PublicMobileActionsProps = {
  showWhatsApp?: boolean;
};

const whatsappOrderHref =
  "https://wa.me/?text=Hello%20OneFarmTech%2C%20I%20want%20to%20place%20a%20fresh%20food%20order.%20Buyer%20type%3A%20___%20Location%3A%20___%20Items%3A%20___";

export default function PublicMobileActions({
  showWhatsApp = true,
}: PublicMobileActionsProps) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 md:hidden">
      {showWhatsApp ? (
        <a
          href={whatsappOrderHref}
          className="oft-primary-button rounded-full bg-[#1f7a3f] px-4 py-3 text-center text-sm font-black text-white"
        >
          WhatsApp order
        </a>
      ) : null}

      <Link
        href="/order-request"
        className="rounded-full border border-[#101712]/10 bg-white/90 px-4 py-3 text-center text-sm font-black text-[#101712] shadow-sm hover:bg-[#fbfff8]"
      >
        Order form
      </Link>

      <Link
        href="/buyer-account-request"
        className="rounded-full border border-[#101712]/10 bg-white/90 px-4 py-3 text-center text-sm font-black text-[#101712] shadow-sm hover:bg-[#fbfff8]"
      >
        Buyer account
      </Link>

      <Link
        href="/faq"
        className="rounded-full border border-[#101712]/10 bg-white/90 px-4 py-3 text-center text-sm font-black text-[#101712] shadow-sm hover:bg-[#fbfff8]"
      >
        FAQ
      </Link>

      <Link
        href="/contact"
        className="col-span-2 rounded-full border border-[#101712]/10 bg-white/90 px-4 py-3 text-center text-sm font-black text-[#101712] shadow-sm"
      >
        Contact
      </Link>
    </div>
  );
}
