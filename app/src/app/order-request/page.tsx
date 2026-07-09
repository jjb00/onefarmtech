import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicImageCollage from "@/components/PublicImageCollage";
import PublicMobileMenu from "@/components/PublicMobileMenu";
import {createOrderRequestAction} from "@/actions/createAdminRecords";
import {deliveryPreferenceOptions, orderBuyerTypeOptions, timingOptions} from "@/lib/formOptions";
import PublicFooter from "@/components/PublicFooter";

export default async function OrderRequestPage({
  searchParams,
}: {
  searchParams?: Promise<{submitted?: string}>;
}) {
  const params = await searchParams;
  const submitted = params?.submitted === "1";

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
            src: "/backgrounds/delivery.png",
            alt: "",
            className:
              "left-[-170px] bottom-[-120px] h-80 w-80 opacity-[0.28] md:h-[30rem] md:w-[30rem]",
          },
          {
            src: "/backgrounds/produce.png",
            alt: "",
            className:
              "bottom-[-140px] right-[25%] hidden h-[24rem] w-[24rem] opacity-[0.22] lg:block",
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
              href="/buyer-login"
              className="hidden rounded-full border border-[#101712]/10 bg-white/80 px-5 py-3 text-sm font-black text-[#101712] shadow-sm hover:bg-white md:inline-flex"
            >
              Buyer account
            </Link>
            <Link
              href="/contact"
              className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
            >
              Contact
            </Link>
          </nav>
                  <PublicMobileMenu />
        </header>

        <section className="grid gap-10 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:py-20">
          <div>
            <p className="oft-fade-up oft-public-pill">
              Order request
            </p>

            <h1 className="oft-fade-up-delay-1 mt-5 max-w-4xl text-5xl font-black tracking-tight md:text-6xl">
              Tell us what fresh produce you need.
            </h1>

            <p className="oft-fade-up-delay-2 mt-6 max-w-2xl text-lg leading-8 text-[#405348]">
              Share your items, quantity, location and timing. We will confirm availability, price and fulfilment details before payment or delivery.
            </p>

            <div className="oft-fade-up-delay-3 oft-public-card mt-8 rounded-[2rem] p-5 text-sm leading-7 text-[#405348]">
              <strong className="text-[#102015]">What happens next:</strong>{" "}
              Your request goes to the OneFarmTech team. We check the order, confirm what is available, then follow up by WhatsApp or phone.
            </div>
          </div>

          <form
            action={createOrderRequestAction}
            className="oft-fade-up-delay-3 oft-public-card rounded-[2rem] p-6"
          >
            <h2 className="text-2xl font-black">Order details</h2>

            {submitted ? (
              <p className="mt-3 rounded-2xl bg-[#3E7A4C]/10 p-4 text-sm font-bold leading-7 text-[#1f7a3f]">
                Your order request has been received. We will check availability and follow up with the next step.
              </p>
            ) : (
              <p className="mt-2 text-sm leading-7 text-[#405348]">
                Add what you want to buy, how much you need, and where it should go.
              </p>
            )}

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-bold text-[#102015]">
                Buyer name
                <input
                  name="buyerName"
                  required
                  className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  placeholder="Your name"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-[#102015]">
                  Buyer type
                  <select
                    name="buyerType"
                    defaultValue="Household / individual"
                    className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  >
                    {orderBuyerTypeOptions.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-bold text-[#102015]">
                  Location
                  <input
                    name="location"
                    className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                    placeholder="City / area"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-[#102015]">
                  Phone
                  <input
                    name="phone"
                    required
                    className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                    placeholder="+234..."
                  />
                </label>

                <label className="grid gap-2 text-sm font-bold text-[#102015]">
                  Email
                  <input
                    name="email"
                    type="email"
                    className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                    placeholder="name@example.com"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-bold text-[#102015]">
                Items and quantities
                <textarea
                  name="items"
                  required
                  rows={5}
                  className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  placeholder="e.g. 2 baskets tomatoes, 1 bag onions, 20kg plantain, leafy greens..."
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-[#102015]">
                  Delivery or pickup
                  <select
                    name="deliveryPreference"
                    defaultValue="Delivery"
                    className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  >
                    {deliveryPreferenceOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-bold text-[#102015]">
                  Timing
                  <select
                    name="timing"
                    defaultValue="This week"
                    className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  >
                    {timingOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex items-start gap-3 rounded-2xl bg-[#f3f8ef] p-4 text-sm font-semibold leading-7 text-[#102015]">
                <input name="groupBuyInterest" type="checkbox" className="mt-1" />
                I am open to a group-buy if it can reduce cost or make the order easier to fulfil.
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#102015]">
                Message
                <textarea
                  name="message"
                  rows={4}
                  className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  placeholder="Delivery notes, preferred timing, quality preference, recurring needs, or anything else we should know."
                />
              </label>

              <button
                type="submit"
                className="oft-primary-button rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white hover:bg-[#155c2f]"
              >
                Send order request
              </button>
            </div>
          </form>
        </section>
      </div>
      <PublicFooter />
    </main>
  );
}
