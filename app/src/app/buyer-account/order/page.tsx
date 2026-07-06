import Link from "next/link";
import {createBuyerPortalOrderAction} from "@/actions/createAdminRecords";
import SupportChatLauncher from "@/components/SupportChatLauncher";
import {requireBuyer} from "@/lib/currentBuyer";
import {deliveryPreferenceOptions, timingOptions} from "@/lib/formOptions";
import {formatNaira} from "@/lib/format";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BuyerPortalOrderPage() {
  const {customer} = await requireBuyer();

  return (
    <main className="min-h-screen bg-[#f7f5ec] px-4 py-6 text-[#102015] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-6">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
                Buyer portal order
              </p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                Request an order for {customer.name}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
                This order request is linked to your approved buyer account, so it
                will appear in your buyer history after submission. The OneFarmTech
                team will confirm availability, pricing, payment and fulfilment.
              </p>
            </div>

            <Link
              href="/buyer-account"
              className="rounded-full border border-[#102015]/15 bg-white px-5 py-3 text-sm font-black text-[#102015] shadow-sm hover:bg-[#f3f8ef]"
            >
              Back to account
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Metric label="Buyer type" value={customer.buyerType} />
            <Metric label="Payment terms" value={customer.paymentTerms} />
            <Metric label="Available credit" value={formatNaira(Math.max(customer.creditLimit - customer.outstandingBalance, 0))} />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
          <form
            action={createBuyerPortalOrderAction}
            className="rounded-[2rem] bg-white p-6 shadow-sm"
          >
            <h2 className="text-2xl font-black">Order details</h2>
            <p className="mt-2 text-sm leading-7 text-[#405348]">
              Add the produce, quantities and timing you need. Admin will convert
              this into confirmed pricing and fulfilment details.
            </p>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-bold text-[#102015]">
                Items and quantities
                <textarea
                  name="items"
                  required
                  rows={6}
                  className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  placeholder="e.g. 2 baskets tomatoes, 1 bag onions, 20kg plantain, leafy greens..."
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-[#102015]">
                  Delivery or pickup
                  <select
                    name="deliveryPreference"
                    defaultValue="Delivery"
                    className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
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
                    className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  >
                    {timingOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex items-start gap-3 rounded-2xl bg-[#f3f8ef] p-4 text-sm font-semibold leading-7 text-[#102015]">
                <input name="groupBuyInterest" type="checkbox" className="mt-1" />
                I am open to a group-buy if it can reduce cost or make fulfilment easier.
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#102015]">
                Message
                <textarea
                  name="message"
                  rows={4}
                  className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  placeholder="Delivery notes, quality preference, recurring needs, substitution rules, or payment notes."
                />
              </label>

              <button
                type="submit"
                className="rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
              >
                Submit buyer-linked order
              </button>
            </div>
          </form>

          <aside className="grid gap-4">
            <div className="rounded-[2rem] border border-[#F2B84B]/40 bg-[#fff8e6] p-6 shadow-sm">
              <h2 className="text-2xl font-black">Why use this form?</h2>
              <p className="mt-3 text-sm leading-7 text-[#405348]">
                Orders submitted here are attached to your approved buyer account,
                unlike the public order form. That helps with order history,
                repeat buying, receipts, payment records and partner-readiness.
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#102015] p-6 text-white shadow-sm">
              <h2 className="text-2xl font-black">Need help ordering?</h2>
              <p className="mt-3 text-sm leading-7 text-white/75">
                Use support if you want the team to help translate your needs into
                an order request.
              </p>
              <div className="mt-5">
                <SupportChatLauncher
                  label="Order support"
                  context={`Buyer account order: ${customer.name}`}
                  defaultMessage={`I need help placing a buyer account order for ${customer.name}.`}
                  variant="dark"
                />
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Metric({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-2xl border border-[#102015]/10 bg-[#fbfff8] p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#587063]">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-[#102015]">{value}</p>
    </div>
  );
}
