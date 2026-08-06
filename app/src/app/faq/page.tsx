import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicImageCollage from "@/components/PublicImageCollage";
import PublicMobileMenu from "@/components/PublicMobileMenu";
import PublicFooter from "@/components/PublicFooter";
import {publicPageMetadata} from "@/lib/publicSeo";

const faqs = [
  {
    question: "Do I need an account to order?",
    answer:
      "No. You can start an order directly on WhatsApp. Buyer accounts are useful for repeat customers, businesses, restaurants, hotels, caterers, and buyers who want order history, invoices, and recurring supply.",
  },
  {
    question: "Can I order through WhatsApp?",
    answer:
      "Yes. WhatsApp is the main ordering channel. You can tell us what you need, confirm price and availability, receive payment details, and get delivery updates through WhatsApp.",
  },
  {
    question: "Do farmers sell directly on the platform?",
    answer:
      "OneFarmTech works with trusted farmers and rural supply partners while the team manages quality, fulfilment and buyer trust.",
  },
  {
    question: "Can I split a bulk order with others?",
    answer:
      "Yes, where group-buy offers are available. For example, if a full bag of potatoes is too much for one buyer, OneFarmTech may open a group-buy so multiple buyers can share the quantity.",
  },
  {
    question: "How do group-buys work?",
    answer:
      "OneFarmTech lists selected bulk produce deals with a target quantity, closing date, and pickup or delivery day. Once enough buyers join and pay, the order is sourced and fulfilled.",
  },
  {
    question: "When do I pay?",
    answer:
      "Most individual buyers pay before dispatch. Verified business buyers may qualify for deposit payment, purchase order processing, or short payment terms after approval.",
  },
];

export const metadata = publicPageMetadata("/faq");

export default function FAQPage() {
  return (
    <main className="oft-public-surface relative min-h-screen overflow-hidden text-[#101712]">
      <PublicImageCollage
        images={[
          {
            src: "/backgrounds/support.png",
            alt: "Fresh produce ordering support",
            className: "right-[-130px] top-16 h-80 w-80 opacity-[0.37] md:h-[30rem] md:w-[30rem]",
          },
          {
            src: "/backgrounds/produce.png",
            alt: "Fresh produce baskets",
            className: "left-[-150px] bottom-[-120px] h-80 w-80 opacity-[0.32] md:h-[28rem] md:w-[28rem]",
          },
        ]}
      />
      <div className="oft-public-topline absolute inset-x-0 top-0 h-2" />
      <div className="oft-orb-drift pointer-events-none absolute right-[-140px] top-20 h-[28rem] w-[28rem] rounded-full bg-[#1f7a3f]/14 blur-3xl" />
      <div className="oft-orb-drift-delay pointer-events-none absolute left-[-160px] bottom-[-180px] h-[30rem] w-[30rem] rounded-full bg-[#F2B84B]/30 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-12">
        <header className="flex items-center justify-between gap-6">
          <Link href="/" aria-label="Go to OneFarmTech homepage">
            <BrandMark />
          </Link>

          <nav className="hidden items-center gap-3 md:flex">
            <Link
              href="/contact"
              className="hidden rounded-full px-4 py-3 text-sm font-black text-[#101712] hover:bg-white md:inline-flex"
            >
              Contact
            </Link>
            <Link
              href="/buyer-account-request"
              className="hidden rounded-full border border-[#101712]/10 bg-white px-5 py-3 text-sm font-black text-[#101712] shadow-sm hover:bg-[#f3f8ef] md:inline-flex"
            >
              Create buyer account
            </Link>
            <Link
              href="/order-request"
              className="oft-primary-button rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white hover:bg-[#155c2f]"
            >
              Order
            </Link>
          </nav>
          <PublicMobileMenu />
        </header>

        <section className="mx-auto max-w-4xl py-14 lg:py-20">
          <p className="oft-fade-up oft-public-pill">FAQ</p>
          <h1 className="oft-fade-up-delay-1 mt-5 text-5xl font-black tracking-tight md:text-6xl">
            Frequently asked questions
          </h1>
          <p className="oft-fade-up-delay-2 mt-5 max-w-2xl text-lg leading-8 text-[#405348]">
            Simple answers about ordering, group-buys, business supply, payments,
            delivery, and how OneFarmTech works.
          </p>

          <div className="mt-10 grid gap-4">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="oft-card-lift oft-public-card rounded-[2rem] p-6"
              >
                <h2 className="text-xl font-bold text-[#101712]">{faq.question}</h2>
                <p className="mt-3 leading-7 text-[#405348]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <PublicFooter />
    </main>
  );
}
