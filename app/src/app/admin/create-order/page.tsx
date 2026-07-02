import AdminPageShell from "@/components/AdminPageShell";
import { orderFormOptions } from "@/data/mockOperations";

const produceItems = ["Tomatoes", "Pepper", "Onions", "Irish Potatoes", "Yam", "Rice", "Beans", "Garri"];

export default function CreateOrderPage() {
  return (
    <AdminPageShell
      title="Create order"
      description="Manual order entry for WhatsApp, phone, business, group-buy, recurring, and pre-harvest orders."
      actionLabel="Save draft order"
    >
      <section className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <form className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
          <h2 className="text-2xl font-bold">Order details</h2>
          <p className="mt-2 text-sm text-[#405348]">
            Static MVP form. Later this will submit to a database and generate a payment link.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Buyer name
              <input className="rounded-xl border border-gray-200 px-4 py-3 font-normal" placeholder="e.g. Mama T Foods" />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Phone number
              <input className="rounded-xl border border-gray-200 px-4 py-3 font-normal" placeholder="+234..." />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Buyer type
              <select className="rounded-xl border border-gray-200 px-4 py-3 font-normal">
                {orderFormOptions.buyerTypes.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Order type
              <select className="rounded-xl border border-gray-200 px-4 py-3 font-normal">
                {orderFormOptions.orderTypes.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Produce item
              <select className="rounded-xl border border-gray-200 px-4 py-3 font-normal">
                {produceItems.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Quantity
              <input className="rounded-xl border border-gray-200 px-4 py-3 font-normal" placeholder="e.g. 10kg / 2 baskets / 1 bag" />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Payment status
              <select className="rounded-xl border border-gray-200 px-4 py-3 font-normal">
                {orderFormOptions.paymentStatuses.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Fulfilment status
              <select className="rounded-xl border border-gray-200 px-4 py-3 font-normal">
                {orderFormOptions.fulfilmentStatuses.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Delivery method
              <select className="rounded-xl border border-gray-200 px-4 py-3 font-normal">
                {orderFormOptions.deliveryMethods.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Total amount
              <input className="rounded-xl border border-gray-200 px-4 py-3 font-normal" placeholder="₦0" />
            </label>
          </div>

          <label className="mt-4 grid gap-2 text-sm font-semibold">
            Delivery address / pickup note
            <textarea className="min-h-28 rounded-xl border border-gray-200 px-4 py-3 font-normal" placeholder="Add delivery address, pickup point, or special instructions" />
          </label>

          <button
            type="button"
            className="mt-6 rounded-full bg-[#1f7a3f] px-6 py-4 font-semibold text-white"
          >
            Save order draft
          </button>
        </form>

        <aside className="rounded-[2rem] bg-white/10 p-6 text-white">
          <h2 className="text-2xl font-bold">Order workflow reminder</h2>
          <div className="mt-6 grid gap-4">
            {[
              "Confirm buyer and delivery area",
              "Confirm produce availability and grade",
              "Set payment requirement",
              "Send payment instruction or link",
              "Approve for sourcing after payment",
              "Quality check before dispatch",
              "Update delivery or pickup status",
            ].map((step, index) => (
              <div key={step} className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-[#9ee6ad]">Step {index + 1}</p>
                <p className="mt-1 font-semibold">{step}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </AdminPageShell>
  );
}
