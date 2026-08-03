import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicImageCollage from "@/components/PublicImageCollage";
import PublicMobileMenu from "@/components/PublicMobileMenu";
import PublicFooter from "@/components/PublicFooter";
import TurnstileWidget from "@/components/TurnstileWidget";
import {createGroupBuyProposalAction} from "@/actions/groupBuys";
import {publicIntakeErrorMessage} from "@/lib/publicIntakeProtection";
import {publicPageMetadata} from "@/lib/publicSeo";

export const metadata = publicPageMetadata("/group-buy-request");

export default async function GroupBuyRequestPage({
  searchParams,
}: {
  searchParams?: Promise<{submitted?: string; intakeError?: string}>;
}) {
  const params = await searchParams;
  const submitted = params?.submitted === "1";
  const intakeError = params?.intakeError === "validation"
    ? "Your name, phone, item, and target quantity are required."
    : params?.intakeError
      ? publicIntakeErrorMessage(params.intakeError)
      : null;

  return (
    <main className="oft-public-surface relative min-h-screen overflow-hidden text-[#101712]">
      <PublicImageCollage
        images={[
          {
            src: "/backgrounds/produce.png",
            alt: "",
            className:
              "right-[-160px] top-24 h-80 w-80 opacity-[0.34] md:h-[31rem] md:w-[31rem]",
          },
          {
            src: "/backgrounds/trolley.png",
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
            <p className="oft-fade-up oft-public-pill">Group buying</p>

            <h1 className="oft-fade-up-delay-1 mt-5 max-w-4xl text-5xl font-black tracking-tight md:text-6xl">
              Start a group buy.
            </h1>

            <p className="oft-fade-up-delay-2 mt-6 max-w-2xl text-lg leading-8 text-[#405348]">
              Combine demand with your street, office, family or business for
              better bulk pricing. Tell us what you want to buy and roughly
              how much — our team reviews it, sets pricing, and opens the
              window for others to join.
            </p>

            <div className="oft-fade-up-delay-3 oft-public-card mt-8 rounded-[2rem] p-5 text-sm leading-7 text-[#405348]">
              <strong className="text-[#102015]">What happens next:</strong>{" "}
              We review your proposal, confirm pricing and quantity, then open
              the group buy for other buyers to join. We'll reach out on
              WhatsApp to confirm details.
            </div>
          </div>

          <form
            action={createGroupBuyProposalAction}
            className="oft-fade-up-delay-3 oft-public-card rounded-[2rem] p-6"
          >
            <h2 className="text-2xl font-black">Group-buy proposal</h2>

            {submitted ? (
              <p className="mt-3 rounded-2xl bg-[#3E7A4C]/10 p-4 text-sm font-bold leading-7 text-[#1f7a3f]">
                Thanks — your group-buy proposal has been received. We'll review it and follow up on WhatsApp.
              </p>
            ) : (
              <p className="mt-2 text-sm leading-7 text-[#405348]">
                Add what you want to buy, roughly how much, and who else might join.
              </p>
            )}
            {intakeError ? <p role="alert" className="mt-3 rounded-2xl bg-[#fff4ef] p-4 text-sm font-bold text-[#9b2f12]">{intakeError}</p> : null}

            <div className="mt-6 grid gap-4">
              <label className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>

              <label className="grid gap-2 text-sm font-bold text-[#102015]">
                Your name
                <input
                  name="buyerName"
                  required
                  className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  placeholder="Your name"
                />
              </label>

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
                What do you want to buy?
                <input
                  name="productName"
                  required
                  className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  placeholder="e.g. Tomatoes, plantain, rice..."
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-[#102015]">
                  Target quantity
                  <input
                    name="targetQuantity"
                    type="number"
                    min="1"
                    required
                    className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                    placeholder="e.g. 50"
                  />
                </label>

                <label className="grid gap-2 text-sm font-bold text-[#102015]">
                  Unit
                  <input
                    name="unit"
                    defaultValue="basket"
                    className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                    placeholder="e.g. basket, bag, kg"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-[#102015]">
                  Preferred pickup or delivery area
                  <input
                    name="pickupWindow"
                    className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                    placeholder="e.g. Utako, Saturday 10am-2pm"
                  />
                </label>

                <label className="grid gap-2 text-sm font-bold text-[#102015]">
                  Suggested closing date
                  <span className="flex w-full min-w-0 rounded-xl border border-[#101712]/10 bg-white px-4 py-3">
                    <input
                      name="closingDate"
                      type="date"
                      className="block w-full min-w-0 border-0 bg-transparent p-0 font-normal outline-none"
                    />
                  </span>
                </label>
              </div>

              <label className="grid gap-2 text-sm font-bold text-[#102015]">
                Anything else we should know?
                <textarea
                  name="message"
                  rows={4}
                  className="rounded-xl border border-[#101712]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  placeholder="Who else might join, why this group buy makes sense, or any other detail."
                />
              </label>

              <TurnstileWidget key={intakeError || "ready"} action="group_buy_request" idleLabel="Send group-buy proposal" pendingLabel="Submitting…" />
            </div>
          </form>
        </section>
      </div>
      <PublicFooter />
    </main>
  );
}
