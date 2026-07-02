const featuredProduce = [
  "Tomatoes",
  "Pepper",
  "Onions",
  "Irish Potatoes",
  "Yam",
  "Rice",
  "Beans",
  "Garri",
];

const buyerTypes = [
  "Restaurants",
  "Hotels",
  "Caterers",
  "Food vendors",
  "Retailers",
  "Large households",
  "Buying groups",
  "Food processors",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f5ec] text-[#102015]">
      <section className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-10 md:py-16">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tight">OneFarmTech</div>

          <div className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a href="#how-it-works">How it works</a>
            <a href="#group-buy">Group-buy</a>
            <a href="#business">Business supply</a>
            <a href="/faq">FAQ</a>
          </div>

          <a
            href={buildWhatsAppLink()}
            className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-semibold text-white shadow-sm"
          >
            Order on WhatsApp
          </a>
        </nav>

        <section className="grid items-center gap-10 py-10 md:grid-cols-2">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-[#1f7a3f] shadow-sm">
              WhatsApp-first farm-to-city procurement
            </p>

            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Fresh farm produce in bulk, sourced from trusted rural suppliers.
            </h1>

            <p className="mt-6 text-lg leading-8 text-[#405348]">
              OneFarmTech helps restaurants, retailers, caterers, food vendors,
              and large households order quality produce through WhatsApp,
              group-buy deals, and recurring supply options.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={buildWhatsAppLink()}
                className="rounded-full bg-[#1f7a3f] px-6 py-4 text-center font-semibold text-white shadow-sm"
              >
                Order on WhatsApp
              </a>

              <a
                href="/login"
                className="rounded-full border border-[#1f7a3f] px-6 py-4 text-center font-semibold text-[#1f7a3f]"
              >
                Create Buyer Account
              </a>
            </div>
          </div>

          <div id="group-buy" className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="rounded-[1.5rem] bg-[#e7f3df] p-6">
              <p className="text-sm font-semibold text-[#1f7a3f]">
                This week&apos;s group-buy preview
              </p>

              <h2 className="mt-4 text-3xl font-bold">Irish Potatoes Split</h2>

              <p className="mt-3 text-[#405348]">
                Join other buyers to split a bulk bag of Irish potatoes. Pay for
                only the quantity you need and collect from a listed pickup
                point.
              </p>

              <div className="mt-6 grid gap-3 text-sm">
                <div className="rounded-xl bg-white p-4">Target quantity: 50kg</div>
                <div className="rounded-xl bg-white p-4">Minimum fulfilment: 40kg</div>
                <div className="rounded-xl bg-white p-4">Delivery/pickup: Saturday</div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="grid gap-4 md:grid-cols-5">
          {[
            "Tell us what you need",
            "We confirm price and availability",
            "You pay securely or reserve",
            "We source and quality check",
            "You receive delivery or pickup",
          ].map((step, index) => (
            <div key={step} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#1f7a3f] font-bold text-white">
                {index + 1}
              </div>
              <p className="font-semibold">{step}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-8 md:grid-cols-2">
          <div className="rounded-[2rem] bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-bold">Who we serve</h2>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {buyerTypes.map((type) => (
                <div key={type} className="rounded-xl bg-[#f7f5ec] p-4">
                  {type}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-bold">Featured produce</h2>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {featuredProduce.map((item) => (
                <div key={item} className="rounded-xl bg-[#f7f5ec] p-4">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="business"
          className="rounded-[2rem] bg-[#102015] p-8 text-white md:p-12"
        >
          <p className="text-sm font-semibold text-[#9ee6ad]">
            For restaurants, hotels, caterers and retailers
          </p>

          <h2 className="mt-4 text-3xl font-bold md:text-4xl">
            Set up recurring produce supply with clear payment and delivery terms.
          </h2>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-[#d8e8dc]">
            Business buyers can request scheduled supply, invoices, purchase
            order support, pickup options, and approved credit limits after
            verification.
          </p>
        </section>

        <section className="rounded-[2rem] bg-white p-8 text-center shadow-sm md:p-12">
          <h2 className="text-3xl font-bold">Ready to order?</h2>

          <p className="mx-auto mt-4 max-w-2xl text-[#405348]">
            Start on WhatsApp. Tell us what you need, your quantity, and your
            delivery area. OneFarmTech will confirm availability and next steps.
          </p>

          <a
            href={buildWhatsAppLink()}
            className="mt-8 inline-flex rounded-full bg-[#1f7a3f] px-8 py-4 font-semibold text-white"
          >
            Start WhatsApp Order
          </a>
        </section>
      </section>
    </main>
  );
}
