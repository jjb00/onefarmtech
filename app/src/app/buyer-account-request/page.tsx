import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicImageCollage from "@/components/PublicImageCollage";
import PublicMobileMenu from "@/components/PublicMobileMenu";
import BuyerLoginModal from "@/components/BuyerLoginModal";
import {createBuyerAccountRequestAction} from "@/actions/createAdminRecords";
import {buyerAccountTypeOptions, estimatedSpendOptions, orderFrequencyOptions} from "@/lib/formOptions";
import PublicFooter from "@/components/PublicFooter";
import {buyerPhoneCountryOptions} from "@/lib/phoneNumbers";

const buyerLoginMessages: Record<string, string> = {
  missing: "Please enter both your email/phone and buyer access code.",
  invalid: "Access code not recognised. Check the code shared by the OneFarmTech team.",
  identifier: "The email or phone entered does not match this buyer access code.",
  cancelled: "This buyer access code has been cancelled. Please contact support for a new code.",
  expired: "This buyer access code has expired. Please contact support for a new code.",
  "not-ready": "This buyer account is not login-ready yet. The OneFarmTech team may still be reviewing the account.",
  required: "Please sign in to view your buyer account.",
};

export default async function BuyerAccountRequestPage({
  searchParams,
}: {
  searchParams?: Promise<{submitted?: string; buyerLogin?: string}>;
}) {
  const params = await searchParams;
  const submitted = params?.submitted === "1";
  const buyerLoginMessage = params?.buyerLogin
    ? buyerLoginMessages[params.buyerLogin]
    : null;

  return (
    <main className="oft-public-surface relative min-h-screen overflow-hidden text-[#101712]">
      <PublicImageCollage
        images={[
          {
            src: "/backgrounds/buyers.png",
            alt: "",
            className:
              "right-[-160px] top-24 h-80 w-80 opacity-[0.34] md:h-[31rem] md:w-[31rem]",
          },
          {
            src: "/backgrounds/banking.png",
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
            <BuyerLoginModal />
            <Link
              href="/order"
              className="oft-primary-button rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white hover:bg-[#155c2f]"
            >
              Order
            </Link>
          </nav>
                  <PublicMobileMenu />
        </header>

        <section className="grid gap-10 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:py-20">
          <div>
            <p className="oft-fade-up oft-public-pill">
              Buyer account request
            </p>

            <h1 className="oft-fade-up-delay-1 mt-5 max-w-4xl text-5xl font-black tracking-tight md:text-6xl">
              Request a OneFarmTech buyer account.
            </h1>

            <p className="oft-fade-up-delay-2 mt-6 max-w-2xl text-lg leading-8 text-[#405348]">
              For recurring buyers who want order history, receipts, authorised
              contacts, repeat-order support, and structured payment records.
            </p>

            <div className="mt-8 grid gap-3">
              {[
                "Restaurants, hotels and caterers",
                "Food vendors and retailers",
                "Offices and corporate buying groups",
                "Families, communities and neighbourhood groups",
              ].map((item) => (
                <div
                  key={item}
                  className="oft-card-lift rounded-2xl border border-[#101712]/10 bg-white/90 px-4 py-3 text-sm font-black shadow-sm backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="oft-fade-up-delay-3 oft-public-card mt-8 rounded-[2rem] p-5">
              <h2 className="text-xl font-black">What a buyer account helps with</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  "Order history",
                  "Electronic receipts",
                  "Payment records",
                  "Authorised contacts",
                  "Credit and balance tracking",
                  "Repeat-order support",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-[#1f7a3f]/10 bg-[#f3f8ef] p-4 text-sm font-black"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-7 text-[#405348]">
                One-off buyers can still order without an account. This page is mainly for recurring buyers who want a more organised buying relationship.
              </p>
            </div>
          </div>

          <form
            id="buyer-account-request-form"
            action={createBuyerAccountRequestAction}
            className="oft-fade-up-delay-3 oft-public-card rounded-[2rem] p-6"
          >
            <h2 className="text-2xl font-black">Account setup details</h2>

            {buyerLoginMessage ? (
              <div className="mt-3 rounded-2xl border border-[#C95F3D]/25 bg-[#fff4ed] p-4 text-sm font-bold leading-7 text-[#8b3f25]">
                {buyerLoginMessage}
              </div>
            ) : null}

            {submitted ? (
              <p className="mt-3 rounded-2xl bg-[#3E7A4C]/10 p-4 text-sm font-bold leading-7 text-[#1f7a3f]">
Your account request has been received. We’ll review your details and get back to you within 2 working days by WhatsApp or email. If approved, your buyer profile will be set up for order history, receipts, authorised contacts and account features.
              </p>
            ) : (
              <p className="mt-2 text-sm leading-7 text-[#405348]">
                Tell us who you are buying for and how often you expect to order.
              </p>
            )}

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-bold text-[#102015]">
                Contact name
                <input
                  name="contactName"
                  required
                  className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  placeholder="Your name"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#102015]">
                Business / group name
                <input
                  name="organisationName"
                  className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  placeholder="Business, household, office or group name"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-[#102015]">
                  Buyer type
                  <select
                    name="buyerType"
                    defaultValue="Restaurant / hotel / caterer"
                    className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  >
                    {buyerAccountTypeOptions.map((type) => (
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
                  Phone country
                  <select
                    name="phoneCountryCode"
                    defaultValue="234"
                    className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  >
                    {buyerPhoneCountryOptions.map((option) => (
                      <option key={option.code} value={option.code}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-bold text-[#102015]">
                  Phone number
                  <input
                    name="phone"
                    required
                    inputMode="tel"
                    className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                    placeholder="0801 234 5678"
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
                Usual produce needs
                <textarea
                  name="usualProduceNeeds"
                  rows={3}
                  className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  placeholder="e.g. tomatoes, peppers, onions, plantain, leafy greens..."
                />
              </label>

              <div className="rounded-[1.5rem] bg-[#f3f8ef] p-4">
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#C95F3D]">
                  Business and payment profile
                </h3>
                <p className="mt-2 text-sm leading-7 text-[#405348]">
                  Optional details help us understand buying patterns, payment preferences and future partner-supported payment options without asking for business verification documents yet.
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold text-[#102015]">
                    Business registration / CAC / tax ID
                    <input
                      name="businessRegNumber"
                      className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                      placeholder="Optional, if available"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-bold text-[#102015]">
                    Preferred payment method
                    <select
                      name="preferredPaymentMethod"
                      defaultValue="Bank transfer"
                      className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                    >
                      <option>Bank transfer</option>
                      <option>Card payment</option>
                      <option>Mobile money / wallet</option>
                      <option>Cash on pickup/delivery</option>
                      <option>Invoice / account terms</option>
                      <option>Not sure yet</option>
                    </select>
                  </label>
                </div>

                <label className="mt-4 flex items-start gap-3 text-sm font-semibold leading-7 text-[#102015]">
                  <input name="needsReceipts" type="checkbox" defaultChecked className="mt-1" />
                  I need receipts, invoices or structured payment records.
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-[#102015]">
                  Order frequency
                  <select
                    name="orderFrequency"
                    defaultValue="Weekly"
                    className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  >
                    {orderFrequencyOptions.map((frequency) => (
                      <option key={frequency}>{frequency}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-bold text-[#102015]">
                  Estimated spend
                  <select
                    name="estimatedSpend"
                    defaultValue="Not sure yet"
                    className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  >
                    {estimatedSpendOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex items-start gap-3 rounded-2xl bg-[#f3f8ef] p-4 text-sm font-semibold leading-7 text-[#102015]">
                <input name="interestedInCredit" type="checkbox" className="mt-1" />
                I am interested in payment terms, credit-limit support, or working-capital options through regulated partners.
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#102015]">
                Message
                <textarea
                  name="message"
                  rows={4}
                  className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  placeholder="Anything else we should know?"
                />
              </label>

              <button
                type="submit"
                className="oft-primary-button rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white hover:bg-[#155c2f]"
              >
                Submit account request
              </button>
            </div>
          </form>
        </section>
      </div>
      <PublicFooter />
    </main>
  );
}
