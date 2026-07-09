import PublicImageCollage from "@/components/PublicImageCollage";
import PublicPageShell from "@/components/PublicPageShell";
import PublicFooter from "@/components/PublicFooter";

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

export default function FAQPage() {
  return (
    <PublicPageShell>
      <section className="relative overflow-hidden">
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

        <div className="relative mx-auto max-w-4xl px-6 py-16">
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
        </div>
      </section>
    </PublicPageShell>
  );
}
