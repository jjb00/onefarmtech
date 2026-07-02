"use client";

import AdminShell from "@/components/admin/AdminShell";
import AdminActionButton from "@/components/admin/AdminActionButton";
import {
  buyerTypes,
  deliveryMethods,
  fulfilmentStatuses,
  orderTypes,
  paymentStatuses,
  produceGrades,
  produceItems,
} from "@/constants/orderOptions";
import { createOrderCode, formatNaira } from "@/lib/format";

const initialForm = {
  buyerName: "",
  phone: "",
  buyerType: "Individual",
  orderType: "Direct",
  produceItem: "Tomatoes",
  produceGrade: "Grade A",
  quantity: "",
  unitPrice: "",
  paymentStatus: "Unpaid",
  fulfilmentStatus: "New order",
  deliveryMethod: "Platform delivery",
  deliveryNote: "",
};

export default function CreateOrderPage() {
  const [form, setForm] = useState(initialForm);

  const quantityNumber = Number(form.quantity) || 0;
  const unitPriceNumber = Number(form.unitPrice) || 0;
  const estimatedTotal = quantityNumber * unitPriceNumber;
  const orderCode = createOrderCode(5);

  const whatsappPreview = `Hi ${form.buyerName || "Customer"}, your OneFarmTech order ${orderCode} has been created.

Item: ${form.produceItem}
Grade: ${form.produceGrade}
Quantity: ${form.quantity || "Not set"}
Estimated total: ${estimatedTotal ? formatNaira(estimatedTotal) : "To be confirmed"}
Delivery: ${form.deliveryMethod}

We will confirm availability, payment instructions, and fulfilment next steps.`;

  const paymentInstruction = `Payment instruction for ${orderCode}

Buyer: ${form.buyerName || "Not set"}
Amount: ${estimatedTotal ? formatNaira(estimatedTotal) : "To be confirmed"}
Payment status: ${form.paymentStatus}

Admin note: generate Paystack/Flutterwave payment link later when gateway is connected.`;

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
  }

  return (
    <AdminShell
      title="Create order"
      description="Manual order entry for WhatsApp, phone, business, group-buy, recurring, and pre-harvest orders."
      action={<AdminActionButton>Save draft order</AdminActionButton>}
    >
      <section className="mt-10 grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <form className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
          <h2 className="text-2xl font-bold">Order details</h2>
          <p className="mt-2 text-sm text-[#405348]">
            Interactive frontend demo. Later this will submit to a database,
            trigger payment-link generation, and update the admin order queue.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Buyer name
              <input
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="e.g. Mama T Foods"
                value={form.buyerName}
                onChange={(event) => updateField("buyerName", event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Phone number
              <input
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="+234..."
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Buyer type
              <select
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                value={form.buyerType}
                onChange={(event) => updateField("buyerType", event.target.value)}
              >
                {buyerTypes.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Order type
              <select
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                value={form.orderType}
                onChange={(event) => updateField("orderType", event.target.value)}
              >
                {orderTypes.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Produce item
              <select
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                value={form.produceItem}
                onChange={(event) => updateField("produceItem", event.target.value)}
              >
                {produceItems.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Produce grade
              <select
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                value={form.produceGrade}
                onChange={(event) => updateField("produceGrade", event.target.value)}
              >
                {produceGrades.map((grade) => (
                  <option key={grade}>{grade}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Quantity
              <input
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="e.g. 10"
                value={form.quantity}
                onChange={(event) => updateField("quantity", event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Unit price
              <input
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="e.g. 2200"
                value={form.unitPrice}
                onChange={(event) => updateField("unitPrice", event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Payment status
              <select
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                value={form.paymentStatus}
                onChange={(event) =>
                  updateField("paymentStatus", event.target.value)
                }
              >
                {paymentStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Fulfilment status
              <select
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                value={form.fulfilmentStatus}
                onChange={(event) =>
                  updateField("fulfilmentStatus", event.target.value)
                }
              >
                {fulfilmentStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold md:col-span-2">
              Delivery method
              <select
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                value={form.deliveryMethod}
                onChange={(event) =>
                  updateField("deliveryMethod", event.target.value)
                }
              >
                {deliveryMethods.map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-4 grid gap-2 text-sm font-semibold">
            Delivery address / pickup note
            <textarea
              className="min-h-28 rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              placeholder="Add delivery address, pickup point, or special instructions"
              value={form.deliveryNote}
              onChange={(event) => updateField("deliveryNote", event.target.value)}
            />
          </label>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="rounded-full bg-[#1f7a3f] px-6 py-4 font-semibold text-white"
            >
              Save order draft
            </button>

            <button
              type="button"
              className="rounded-full border border-[#1f7a3f] px-6 py-4 font-semibold text-[#1f7a3f]"
            >
              Generate payment instruction
            </button>

            <button
              type="button"
              className="rounded-full border border-gray-300 px-6 py-4 font-semibold text-[#405348]"
              onClick={resetForm}
            >
              Reset
            </button>
          </div>
        </form>

        <aside className="grid gap-6">
          <div className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
            <p className="text-sm font-semibold text-[#1f7a3f]">Live preview</p>
            <h2 className="mt-2 text-2xl font-bold">{orderCode}</h2>

            <div className="mt-6 grid gap-3 text-sm">
              <div className="rounded-2xl bg-[#f7f5ec] p-4">
                <p className="text-[#405348]">Buyer</p>
                <p className="mt-1 font-bold">
                  {form.buyerName || "Not entered"} · {form.buyerType}
                </p>
              </div>

              <div className="rounded-2xl bg-[#f7f5ec] p-4">
                <p className="text-[#405348]">Item</p>
                <p className="mt-1 font-bold">
                  {form.produceItem} · {form.produceGrade}
                </p>
              </div>

              <div className="rounded-2xl bg-[#f7f5ec] p-4">
                <p className="text-[#405348]">Estimated total</p>
                <p className="mt-1 text-2xl font-bold">
                  {estimatedTotal ? formatNaira(estimatedTotal) : "₦0"}
                </p>
              </div>

              <div className="rounded-2xl bg-[#f7f5ec] p-4">
                <p className="text-[#405348]">Status</p>
                <p className="mt-1 font-bold">
                  {form.paymentStatus} · {form.fulfilmentStatus}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white/10 p-6 text-white">
            <h2 className="text-2xl font-bold">WhatsApp message preview</h2>
            <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-black/20 p-4 text-sm leading-6 text-[#d8e8dc]">
              {whatsappPreview}
            </pre>
          </div>

          <div className="rounded-[2rem] bg-white/10 p-6 text-white">
            <h2 className="text-2xl font-bold">Payment instruction preview</h2>
            <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-black/20 p-4 text-sm leading-6 text-[#d8e8dc]">
              {paymentInstruction}
            </pre>
          </div>
        </aside>
      </section>
    </AdminShell>
  );
}

import { useState } from "react";
