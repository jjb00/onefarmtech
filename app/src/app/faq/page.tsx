import Link from "next/link";

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
    question: "When do I pay?",
    answer:
      "Most individual buyers pay before dispatch. Verified business buyers may qualify for deposit payment, purchase order processing, or short payment terms after approval.",
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-[#f7f5ec] px-6 py-10 text-[#102015]">
      <section className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-semibold text-[#1f7a3f]">
          ← Back to home
        </Link>

        <h1 className="mt-8 text-4xl font-bold">Frequently Asked Questions</h1>

        <div className="mt-8 grid gap-4">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">{faq.question}</h2>
              <p className="mt-3 leading-7 text-[#405348]">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
