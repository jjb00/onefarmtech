import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicImageCollage from "@/components/PublicImageCollage";
import PublicMobileMenu from "@/components/PublicMobileMenu";
import {createContactEnquiryAction} from "@/actions/createAdminRecords";
import {enquiryTypeOptions} from "@/lib/formOptions";
import PublicFooter from "@/components/PublicFooter";
import TurnstileWidget from "@/components/TurnstileWidget";
import {publicIntakeErrorMessage} from "@/lib/publicIntakeProtection";

const partnerTypes = [
  {
    title: "Banks, fintechs and payment partners",
    body:
      "Support payment collection, reconciliation, buyer verification, transaction history, and regulated working-capital or credit-limit pathways for approved recurring buyers.",
  },
  {
    title: "Logistics and fulfilment partners",
    body:
      "Support scheduled delivery, pickup points, city routes, cold-chain options, dispatch, warehousing, and reliable fulfilment for bulk and repeat orders.",
  },
  {
    title: "NGOs and development organisations",
    body:
      "Collaborate on food security, women-led trade, small business resilience, nutrition access, farmer-to-market links, and community buying programmes.",
  },
  {
    title: "Development finance and impact partners",
    body:
      "Use demand patterns, repeat purchase behaviour, buyer categories, and supply-chain insights to support inclusive commerce and SME growth interventions.",
  },
  {
    title: "Insurance and risk partners",
    body:
      "Explore practical risk products around stock loss, delivery disruption, price volatility, business continuity, and cash-flow protection.",
  },
  {
    title: "Technology and API partners",
    body:
      "Connect tools for payments, verification, messaging, route planning, inventory, buyer accounts, analytics, and operational workflows.",
  },
  {
    title: "Corporate and institutional partners",
    body:
      "Support structured fresh food access for staff, communities, estates, cooperatives, or local business networks through organised buying models.",
  },
  {
    title: "Media, ecosystem and research partners",
    body:
      "Collaborate on food supply, informal commerce, digital trade, market access, African SME infrastructure, and food-system research.",
  },
];

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<{submitted?: string; intakeError?: string}>;
}) {
  const params = await searchParams;
  const submitted = params?.submitted === "1";
  const intakeError = params?.intakeError;
  return (
    <main className="oft-public-surface relative min-h-screen overflow-hidden text-[#101712]">
      <PublicImageCollage
        images={[
          {
            src: "/backgrounds/banking.png",
            alt: "Banking and fintech partner services",
            className: "right-[-160px] top-20 h-80 w-80 opacity-[0.38] md:h-[31rem] md:w-[31rem]",
          },
          {
            src: "/backgrounds/delivery.png",
            alt: "Logistics and fulfilment partner",
            className: "left-[-170px] top-[34rem] h-80 w-80 opacity-[0.32] md:h-[30rem] md:w-[30rem]",
          },
          {
            src: "/backgrounds/support.png",
            alt: "Ordering and ecosystem support",
            className: "bottom-[-140px] right-[20%] hidden h-[26rem] w-[26rem] opacity-[0.36] lg:block",
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
              href="/faq"
              className="hidden rounded-full px-4 py-3 text-sm font-black text-[#101712] hover:bg-white md:inline-flex"
            >
              FAQ
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

        <section className="grid gap-10 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:py-20">
          <div>
            <p className="oft-fade-up oft-public-pill">
              Contact
            </p>

            <h1 className="oft-fade-up-delay-1 mt-5 max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
              Contact OneFarmTech.
            </h1>

            <p className="oft-fade-up-delay-2 mt-6 max-w-2xl text-lg leading-8 text-[#405348]">
              For buyer support, partnerships, media, ecosystem enquiries, and
              organisations interested in adding value around recurring fresh food
              supply.
            </p>

            <div className="oft-fade-up-delay-3 oft-public-card mt-8 rounded-[2rem] p-6">
              <h2 className="text-2xl font-black">Partner with OneFarmTech</h2>
              <p className="mt-3 leading-8 text-[#405348]">
                OneFarmTech works with organisations that can help improve how
                fresh food buyers order, pay, receive, finance, and manage
                recurring produce supply.
              </p>
              <p className="mt-3 leading-8 text-[#405348]">
                Our core users include households, food vendors, restaurants,
                retailers, offices, and community buying groups. Our partner
                network is different: it is made up of organisations that add
                value around those users and strengthen the wider food supply
                ecosystem.
              </p>
            </div>
          </div>

          <form action={createContactEnquiryAction} className="oft-fade-up-delay-3 oft-public-card rounded-[2rem] p-6">
            <h2 className="text-2xl font-black">Send an enquiry</h2>
            <p className="mt-2 text-sm leading-7 text-[#405348]">
              Tell us what you are interested in and the team will review it.
            </p>

            {submitted ? (
              <p className="mt-3 rounded-2xl bg-[#3E7A4C]/10 p-4 text-sm font-bold leading-7 text-[#1f7a3f]">
                Your enquiry has been received. The OneFarmTech team will review it and follow up using the contact details provided.
              </p>
            ) : null}
            {intakeError ? <p role="alert" className="mt-3 rounded-2xl bg-[#fff4ef] p-4 text-sm font-bold text-[#9b2f12]">{publicIntakeErrorMessage(intakeError)}</p> : null}

            <div className="mt-6 grid gap-4">
              <label className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
              <label className="grid gap-2 text-sm font-bold text-[#102015]">
                Name
                <input
                  name="name"
                  className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  placeholder="Your name"
                  required
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#102015]">
                Organisation
                <input
                  name="organisation"
                  className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  placeholder="Company, organisation or programme"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-[#102015]">
                  Email
                  <input
                    name="email"
                    type="email"
                    className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                    placeholder="name@example.com"
                  />
                </label>

                <label className="grid gap-2 text-sm font-bold text-[#102015]">
                  Phone
                  <input
                    name="phone"
                    className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                    placeholder="+234..."
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-bold text-[#102015]">
                Enquiry type
                <select
                  name="enquiryType"
                  defaultValue="General enquiry"
                  className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                >
                  {enquiryTypeOptions.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#102015]">
                Message
                <textarea
                  name="message"
                  rows={6}
                  className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  placeholder="Briefly tell us how you would like to work with OneFarmTech."
                  required
                />
              </label>

              <TurnstileWidget key={intakeError || "ready"} action="contact" idleLabel="Submit enquiry" pendingLabel="Sending…" />

              <p className="text-xs leading-6 text-[#587063]">
                Enquiries are reviewed manually. For urgent buyer support, use the
                WhatsApp order route.
              </p>
            </div>
          </form>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          {partnerTypes.map((partner) => (
            <article
              key={partner.title}
              className="oft-card-lift oft-public-card rounded-[2rem] p-6"
            >
              <h2 className="text-xl font-black">{partner.title}</h2>
              <p className="mt-3 leading-7 text-[#405348]">{partner.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-2">
          <div className="oft-public-card rounded-[2rem] p-6">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Our partners
            </p>
            <h2 className="mt-3 text-2xl font-black">Partner network</h2>
            <p className="mt-3 leading-7 text-[#405348]">
              We are building a practical partner network around payments,
              logistics, buyer finance, risk, market access, and ecosystem
              support. Partner logos and programme details will be added as
              collaborations are confirmed.
            </p>
          </div>

          <div className="oft-public-card rounded-[2rem] p-6">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Featured in
            </p>
            <h2 className="mt-3 text-2xl font-black">Media and ecosystem features</h2>
            <p className="mt-3 leading-7 text-[#405348]">
              Media, ecosystem, and programme features will be added here as
              OneFarmTech launches publicly.
            </p>
          </div>
        </section>
      </div>
      <PublicFooter />
    </main>
  );
}
