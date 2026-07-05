import Link from "next/link";
import {BrandMark} from "@/components/BrandMark";
import PublicImageCollage from "@/components/PublicImageCollage";

const requestSteps = [
  {
    title: "Send your request",
    description:
      "Share your produce list, quantities, location, buyer type and preferred pickup or delivery option.",
  },
  {
    title: "Confirm terms",
    description:
      "OneFarmTech confirms availability, fulfilment route, payment terms and timing through WhatsApp.",
  },
  {
    title: "Receive updates and records",
    description:
      "Get payment instructions, order updates, receipt records and repeat-order support.",
  },
];

const portalCards = [
  {
    title: "Individual or household request",
    description: "For homes and high-volume household buying.",
  },
  {
    title: "Business buyer request",
    description: "For restaurants, hotels, caterers, food vendors and retailers.",
  },
  {
    title: "Group-buy request",
    description: "For city routes, pickup areas, friends, families, offices and communities.",
  },
  {
    title: "Approved buyer login",
    description: "For recurring business buyers with receipts, credit records and order history.",
  },
];

export default function BuyerRequestPage() {
  const whatsappText = encodeURIComponent(
    "Hello OneFarmTech, I want to place a produce request. Buyer type: ___ Location: ___ Items/quantities: ___ Preferred pickup/delivery: ___",
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fbfff8] text-[#101712]">
      <PublicImageCollage
        images={[
          {
            src: "/backgrounds/trolley.png",
            alt: "Fresh produce trolley for ordering",
            className:
              "left-[-150px] top-20 h-80 w-80 opacity-[0.4] md:h-[32rem] md:w-[32rem]",
          },
          {
            src: "/backgrounds/delivery.png",
            alt: "Fresh produce delivery and fulfilment",
            className:
              "right-[-150px] top-32 h-80 w-80 opacity-[0.38] md:h-[31rem] md:w-[31rem]",
          },
          {
            src: "/backgrounds/support.png",
            alt: "WhatsApp fresh produce ordering support",
            className:
              "bottom-[-120px] left-[28%] hidden h-[26rem] w-[26rem] opacity-[0.28] lg:block",
          },
          {
            src: "/backgrounds/produce.png",
            alt: "Fresh produce baskets",
            className:
              "bottom-[-150px] right-[18%] hidden h-[24rem] w-[24rem] opacity-[0.28] xl:block",
          },
        ]}
      />

      <div className="pointer-events-none absolute right-[-140px] top-20 h-[28rem] w-[28rem] rounded-full bg-[#1f7a3f]/10 blur-3xl" />
      <div className="pointer-events-none absolute left-[-160px] bottom-[-180px] h-[30rem] w-[30rem] rounded-full bg-[#F2B84B]/25 blur-3xl" />

      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
          <div className="mb-10 flex items-center justify-between">
            <Link href="/" aria-label="Go to OneFarmTech homepage">
              <BrandMark />
            </Link>

            <Link
              href="/"
              className="rounded-full border border-[#101712]/10 bg-white/80 px-4 py-2 text-sm font-bold text-[#101712] shadow-sm hover:bg-white"
            >
              Back home
            </Link>
          </div>

          <p className="inline-flex rounded-full bg-white/80 px-4 py-2 text-sm font-black text-[#C95F3D] shadow-sm backdrop-blur">
            Order
          </p>
          <h1 className="oft-fade-up mt-5 max-w-4xl text-5xl font-black tracking-tight md:text-6xl">
            Order fresh produce or start a group buy.
          </h1>
          <p className="oft-fade-up-delay-1 mt-5 max-w-3xl text-lg leading-8 text-[#1E2420]/75">
            Restaurants, caterers, hotels, food vendors, retailers, large households,
            families, friends and community buying groups can use OneFarmTech for
            coordinated fresh food supply.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/order-request"
              className="rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white shadow-sm"
            >
              Start order request
            </Link>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                "Hello OneFarmTech, I want to request a city or private group buy. Location: ___ Items: ___ Estimated buyers/quantity: ___",
              )}`}
              className="rounded-full border border-[#101712]/10 bg-white/80 px-6 py-3 text-sm font-black text-[#101712] shadow-sm hover:bg-white"
            >
              Request group buy
            </a>
            <Link
              href="/buyer-login"
              className="rounded-full border border-[#101712]/10 bg-white/80 px-6 py-3 text-sm font-black text-[#101712] shadow-sm hover:bg-white"
            >
              Approved buyer login
            </Link>
          </div>
        </div>
      </section>

      <section className="relative mx-auto grid max-w-6xl gap-5 px-6 py-12 md:grid-cols-2 lg:px-10">
        {portalCards.map((card) => (
          <div
            key={card.title}
            className="oft-card-lift rounded-[1.5rem] border border-[#101712]/10 bg-white/90 p-6 shadow-sm backdrop-blur"
          >
            <h2 className="text-xl font-black">{card.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[#1E2420]/70">
              {card.description}
            </p>
          </div>
        ))}
      </section>

      <section className="relative mx-auto grid max-w-6xl gap-6 px-6 pb-14 lg:grid-cols-3 lg:px-10">
        {requestSteps.map((step, index) => (
          <div
            key={step.title}
            className="oft-card-lift rounded-[1.5rem] border border-[#101712]/10 bg-white/90 p-6 shadow-sm backdrop-blur"
          >
            <p className="text-sm font-black text-[#C95F3D]">Step {index + 1}</p>
            <h2 className="mt-2 text-xl font-black">{step.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[#1E2420]/70">
              {step.description}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
