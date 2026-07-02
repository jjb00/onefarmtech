import PublicPageShell from "@/components/PublicPageShell";

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
      "Not at this stage. OneFarmTech works with trusted farmers and rural suppliers, but sourcing is managed by the team to protect quality, fulfilment, and buyer trust.",
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
      <section className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm font-semibold text-[#1f7a3f]">FAQ</p>
        <h1 className="mt-3 text-4xl font-bold md:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[#405348]">
          Simple answers about ordering, group-buys, business supply, payments,
          delivery, and how OneFarmTech works.
        </p>

        <div className="mt-10 grid gap-4">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">{faq.question}</h2>
              <p className="mt-3 leading-7 text-[#405348]">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicPageShell>
  );
}
