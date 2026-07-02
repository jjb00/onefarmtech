import AdminShell from "@/components/admin/AdminShell";
import AdminActionButton from "@/components/admin/AdminActionButton";
import FormField from "@/components/forms/FormField";
import SelectField from "@/components/forms/SelectField";
import TextAreaField from "@/components/forms/TextAreaField";
import {
  buyerTypes,
  deliveryMethods,
  fulfilmentStatuses,
  orderTypes,
  orderWorkflowSteps,
  paymentStatuses,
  produceGrades,
  produceItems,
} from "@/constants/orderOptions";

export default function CreateOrderPage() {
  return (
    <AdminShell
      title="Create order"
      description="Manual order entry for WhatsApp, phone, business, group-buy, recurring, and pre-harvest orders."
      action={<AdminActionButton>Save draft order</AdminActionButton>}
    >
      <section className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <form className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
          <h2 className="text-2xl font-bold">Order details</h2>
          <p className="mt-2 text-sm text-[#405348]">
            Static MVP form. Later this will submit to a database and generate a
            payment link.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <FormField label="Buyer name" placeholder="e.g. Mama T Foods" />
            <FormField label="Phone number" placeholder="+234..." />
            <SelectField label="Buyer type" options={buyerTypes} />
            <SelectField label="Order type" options={orderTypes} />
            <SelectField label="Produce item" options={produceItems} />
            <SelectField label="Produce grade" options={produceGrades} />
            <FormField label="Quantity" placeholder="e.g. 10kg / 2 baskets / 1 bag" />
            <FormField label="Unit price" placeholder="₦0" />
            <FormField label="Total amount" placeholder="₦0" />
            <SelectField label="Payment status" options={paymentStatuses} />
            <SelectField label="Fulfilment status" options={fulfilmentStatuses} />
            <SelectField label="Delivery method" options={deliveryMethods} />
          </div>

          <div className="mt-4">
            <TextAreaField
              label="Delivery address / pickup note"
              placeholder="Add delivery address, pickup point, or special instructions"
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <AdminActionButton>Save order draft</AdminActionButton>
            <button
              type="button"
              className="rounded-full border border-[#1f7a3f] px-6 py-4 font-semibold text-[#1f7a3f]"
            >
              Generate payment instruction
            </button>
          </div>
        </form>

        <aside className="rounded-[2rem] bg-white/10 p-6 text-white">
          <h2 className="text-2xl font-bold">Order workflow reminder</h2>
          <div className="mt-6 grid gap-4">
            {orderWorkflowSteps.map((step, index) => (
              <div key={step} className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-[#9ee6ad]">Step {index + 1}</p>
                <p className="mt-1 font-semibold">{step}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </AdminShell>
  );
}
