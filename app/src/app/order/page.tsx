import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicImageCollage from "@/components/PublicImageCollage";
import PublicMobileMenu from "@/components/PublicMobileMenu";
import PublicFooter from "@/components/PublicFooter";

const whatsappOrderHref =
  "https://wa.me/?text=Hello%20OneFarmTech%2C%20I%20want%20to%20place%20a%20fresh%20food%20order.%20Buyer%20type%3A%20___%20Location%3A%20___%20Items%3A%20___";

export default function OrderPage() {
  return (
    <main className="oft-public-surface relative min-h-screen overflow-hidden text-[#101712]">
      <PublicImageCollage
        images={[
          {
            src: "/backgrounds/trolley.png",
            alt: "",
            className:
              "right-[-160px] top-24 h-80 w-80 opacity-[0.34] md:h-[31rem] md:w-[31rem]",
          },
          {
            src: "/backgrounds/produce.png",
            alt: "",
            className:
              "left-[-170px] bottom-[-120px] h-80 w-80 opacity-[0.28] md:h-[30rem] md:w-[30rem]",
          },
        ]}
      />

      <div className="oft-public-topline absolute inset-x-0 top-0 h-2" />
      <div className="oft-orb-drift pointer-events-none absolute right-[-140px] top-20 h-[28rem] w-[28rem] rounded-full bg-[#1f7a3f]/14 blur-3xl" />
      <div className="oft-orb-drift-delay pointer-events-none absolute left-[-160px] bottom-[-180px] h-[30rem] w-[30rem] rounded-full bg-[#F2B84B]/30 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-12">
        <header className="flex items-center justify-between gap-6">
          <Link href="/" aria-label="Go to OneFarmTech homepage">
            <BrandMark />
          </Link>

          <nav className="hidden items-center gap-3 md:flex">
            <Link
              href="/faq"
              className="hidden rounded-full px-4 py-3 text-sm font-black text-[#101712] hover:bg-white md:inline-flex"
            >
              FAQ
            </Link>
            <Link
              href="/contact"
              className="hidden rounded-full border border-[#101712]/10 bg-white/80 px-5 py-3 text-sm font-black text-[#101712] shadow-sm hover:bg-white md:inline-flex"
            >
              Contact
            </Link>
          </nav>
          <PublicMobileMenu />
        </header>

        <section className="grid gap-8 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:py-20">
          <div>
            <p className="oft-fade-up oft-public-pill">
              Place an order
            </p>

            <h1 className="oft-fade-up-delay-1 mt-5 max-w-4xl text-5xl font-black tracking-tight md:text-6xl">
              Choose the easiest way to send your fresh produce order.
            </h1>

            <p className="oft-fade-up-delay-2 mt-6 max-w-2xl text-lg leading-8 text-[#405348]">
              Use WhatsApp for the fastest route, or use the order form when you want to send all your items, quantities, location and timing in one place.
            </p>

            <div className="oft-fade-up-delay-3 oft-public-card mt-8 rounded-[2rem] p-5 text-sm leading-7 text-[#405348]">
              <strong className="text-[#102015]">What happens next:</strong>{" "}
              The OneFarmTech team checks availability, confirms pricing and follows up before payment or fulfilment.
            </div>
          </div>

          <div className="grid gap-4">
            <a
              href={whatsappOrderHref}
              className="oft-primary-button relative overflow-hidden rounded-[2rem] bg-[#1f7a3f] p-6 text-white hover:bg-[#155c2f]"
            >
              <div className="absolute right-[-70px] top-[-80px] h-52 w-52 rounded-full bg-white/10 blur-3xl" />
              <p className="relative text-sm font-black uppercase tracking-[0.22em] text-[#9ee6ad]">
                Primary route
              </p>
              <h2 className="relative mt-3 text-3xl font-black">Order on WhatsApp</h2>
              <p className="relative mt-3 text-sm leading-7 text-white/75">
                Fastest for fresh produce orders, availability checks and follow-up with the OneFarmTech team.
              </p>
              <span className="relative mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-[#102015]">
                Open WhatsApp
              </span>
            </a>

            <div className="oft-public-card rounded-[2rem] p-5 text-[#102015]">
              <h2 className="text-xl font-black">Other order options</h2>
              <p className="mt-2 text-sm leading-7 text-[#405348]">
                Use the form for structured requests, or request a buyer account if you order regularly.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/order-request"
                  className="oft-yellow-button rounded-full bg-[#F2B84B] px-5 py-3 text-sm font-black text-[#102015]"
                >
                  Order form
                </Link>
                <Link
                  href="/buyer-account-request"
                  className="rounded-full border border-[#101712]/10 bg-white px-5 py-3 text-sm font-black text-[#102015] shadow-sm hover:bg-[#fbfff8]"
                >
                  Buyer account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
      <PublicFooter />
    </main>
  );
}
