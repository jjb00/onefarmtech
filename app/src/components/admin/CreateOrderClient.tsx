"use client";

import { useState } from "react";
import DraftOrdersPanel from "@/components/admin/DraftOrdersPanel";
import AdminDisclosure from "@/components/admin/AdminDisclosure";
import StatusBadge from "@/components/admin/StatusBadge";
import {
  buyerTypes,
  deliveryMethods,
  fulfilmentStatuses,
  orderTypes,
  paymentStatuses,
  produceGrades,
  produceItems,
} from "@/constants/orderOptions";
import { saveDraftOrder } from "@/lib/draftOrders";
import { createOrderCode, formatNaira } from "@/lib/format";
import type { DraftOrder } from "@/types/draftOrder";

type CustomerOption = {
  id: string;
  name: string;
  phone: string;
  buyerType: string;
  location: string | null;
  paymentTerms: string;
};

type ProductOption = {
  id: string;
  name: string;
  category: string;
  unit: string;
  grade: string;
  basePrice: number;
  availability: string;
};

type CreateOrderClientProps = {
  createOrderAction: (formData: FormData) => void | Promise<void>;
  customerOptions: CustomerOption[];
  productOptions: ProductOption[];
};

const initialForm = {
  customerId: "",
  productId: "",
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
  adminNote: "",
};

export default function CreateOrderClient({
  createOrderAction,
  customerOptions,
  productOptions,
}: CreateOrderClientProps) {
  const [form, setForm] = useState(initialForm);
  const [saveMessage, setSaveMessage] = useState("");

  const selectedCustomer = customerOptions.find(
    (customer) => customer.id === form.customerId
  );

  const selectedProduct = productOptions.find(
    (product) => product.id === form.productId
  );

  const produceItemOptions = Array.from(
    new Set([
      ...productOptions.map((product) => product.name).filter(Boolean),
      ...produceItems,
    ])
  ).sort((a, b) => a.localeCompare(b));

  const produceGradeOptions = Array.from(
    new Set([
      ...productOptions.map((product) => product.grade).filter(Boolean),
      ...produceGrades,
    ])
  );

  const quantityNumber = Number(form.quantity) || 0;
  const unitPriceNumber = Number(form.unitPrice) || selectedProduct?.basePrice || 0;
  const estimatedTotal = quantityNumber * unitPriceNumber;

  const [orderCode, setOrderCode] = useState(() =>
    createOrderCode(Math.floor(Date.now() / 1000) % 10000)
  );

  const whatsappPreview = `Hi ${form.buyerName || selectedCustomer?.name || "Customer"}, your OneFarmTech order will be created once admin saves it.

Item: ${selectedProduct?.name || form.produceItem}
Grade: ${selectedProduct?.grade || form.produceGrade}
Quantity: ${form.quantity || "Not set"} ${selectedProduct?.unit || ""}
Estimated total: ${estimatedTotal ? formatNaira(estimatedTotal) : "To be confirmed"}
Delivery: ${form.deliveryMethod}

We will confirm availability, payment instructions, and fulfilment next steps.`;

  const paymentInstruction = `Payment instruction preview

Buyer: ${form.buyerName || selectedCustomer?.name || "Not set"}
Amount: ${estimatedTotal ? formatNaira(estimatedTotal) : "To be confirmed"}
Payment status: ${form.paymentStatus}

Admin note: generate Paystack payment link later when gateway is connected.`;

  function updateField(field: keyof typeof form, value: string) {
    setSaveMessage("");
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function selectCustomer(customerId: string) {
    const customer = customerOptions.find((item) => item.id === customerId);

    setSaveMessage("");
    setForm((current) => ({
      ...current,
      customerId,
      buyerName: customer?.name || current.buyerName,
      phone: customer?.phone || current.phone,
      buyerType: customer?.buyerType || current.buyerType,
      deliveryNote:
        customer?.location && !current.deliveryNote
          ? `Customer location: ${customer.location}`
          : current.deliveryNote,
    }));
  }

  function selectProduct(productId: string) {
    const product = productOptions.find((item) => item.id === productId);

    setSaveMessage("");
    setForm((current) => ({
      ...current,
      productId,
      produceItem: product?.name || current.produceItem,
      produceGrade: product?.grade || current.produceGrade,
      unitPrice:
        product && product.basePrice > 0
          ? String(product.basePrice)
          : current.unitPrice,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setOrderCode(createOrderCode(Math.floor(Date.now() / 1000) % 10000));
    setSaveMessage("");
  }

  function saveDraft() {
    const draft: DraftOrder = {
      id: `${orderCode}-${Date.now()}`,
      code: orderCode,
      buyerName: form.buyerName,
      phone: form.phone,
      buyerType: form.buyerType,
      orderType: form.orderType,
      produceItem: selectedProduct?.name || form.produceItem,
      produceGrade: selectedProduct?.grade || form.produceGrade,
      quantity: form.quantity,
      unitPrice: String(unitPriceNumber || ""),
      estimatedTotal,
      paymentStatus: form.paymentStatus,
      fulfilmentStatus: form.fulfilmentStatus,
      deliveryMethod: form.deliveryMethod,
      deliveryNote: form.deliveryNote,
      whatsappPreview,
      paymentInstruction,
      createdAt: new Date().toISOString(),
    };

    saveDraftOrder(draft);
    setSaveMessage(`${orderCode} saved as a local browser draft.`);
  }

  return (
    <section className="mt-10 grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
      <form
        action={createOrderAction}
        className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm"
      >
        <h2 className="text-2xl font-bold">Order details</h2>
        <p className="mt-2 text-sm text-[#405348]">
          Create a real database order and optionally link it to an existing customer and product.
        </p>

        {saveMessage && (
          <div className="mt-4 rounded-2xl bg-[#e7f3df] p-4 text-sm font-semibold text-[#1f7a3f]">
            {saveMessage}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">
            Existing customer
            <select
              name="customerId"
              className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              value={form.customerId}
              onChange={(event) => selectCustomer(event.target.value)}
            >
              <option value="">Manual buyer / no customer link</option>
              {customerOptions.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} · {customer.buyerType} · {customer.phone}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Buyer name
            <input
              name="buyerName"
              required
              className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              placeholder="e.g. Mama T Foods"
              value={form.buyerName}
              onChange={(event) => updateField("buyerName", event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Phone number
            <input
              name="phone"
              required
              className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              placeholder="+234..."
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Buyer type
            <select
              name="buyerType"
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
              name="orderType"
              className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              value={form.orderType}
              onChange={(event) => updateField("orderType", event.target.value)}
            >
              {orderTypes.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold md:col-span-2">
            Existing product
            <select
              name="productId"
              className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              value={form.productId}
              onChange={(event) => selectProduct(event.target.value)}
            >
              <option value="">Manual produce item / no product link</option>
              {productOptions.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} · {product.grade} · {product.unit} · {formatNaira(product.basePrice)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Produce item
            <select
              name="produceItem"
              className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              value={form.produceItem}
              onChange={(event) => updateField("produceItem", event.target.value)}
            >
              {produceItemOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Produce grade
            <select
              name="produceGrade"
              className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              value={form.produceGrade}
              onChange={(event) => updateField("produceGrade", event.target.value)}
            >
              {produceGradeOptions.map((grade) => (
                <option key={grade}>{grade}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Quantity
            <input
              name="quantity"
              required
              type="number"
              min="1"
              className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              placeholder="e.g. 10"
              value={form.quantity}
              onChange={(event) => updateField("quantity", event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Unit price
            <input
              name="unitPrice"
              required
              type="number"
              min="1"
              className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              placeholder="e.g. 2200"
              value={form.unitPrice}
              onChange={(event) => updateField("unitPrice", event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Payment status
            <select
              name="paymentStatus"
              className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              value={form.paymentStatus}
              onChange={(event) => updateField("paymentStatus", event.target.value)}
            >
              {paymentStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Fulfilment status
            <select
              name="fulfilmentStatus"
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
              name="deliveryMethod"
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
            name="deliveryNote"
            className="min-h-28 rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
            placeholder="Add delivery address, pickup point, or special instructions"
            value={form.deliveryNote}
            onChange={(event) => updateField("deliveryNote", event.target.value)}
          />
        </label>

        <label className="mt-4 grid gap-2 text-sm font-semibold">
          Internal admin note
          <textarea
            name="adminNote"
            className="min-h-24 rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
            placeholder="Supplier preference, payment condition, quality note, or follow-up task"
            value={form.adminNote}
            onChange={(event) => updateField("adminNote", event.target.value)}
          />
        </label>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#155c2f]"
          >
            Save real database order
          </button>

          <button
            type="button"
            onClick={saveDraft}
            className="rounded-full border border-[#1f7a3f]/25 px-5 py-3 text-sm font-bold text-[#1f7a3f] transition hover:bg-[#f2f8ed]"
          >
            Save local draft
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="rounded-full border border-gray-200 px-5 py-3 text-sm font-bold text-[#405348] transition hover:bg-gray-50"
          >
            Reset form
          </button>
        </div>
      </form>

      <aside className="grid gap-5">
        <div className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#587063]">
                Live preview
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                {form.buyerName || selectedCustomer?.name || "New order"}
              </h2>
            </div>
            <StatusBadge status={form.paymentStatus} />
          </div>

          <div className="mt-6 grid gap-3 text-sm text-[#405348]">
            <div className="flex justify-between gap-4">
              <span>Customer link</span>
              <strong className="text-right text-[#102015]">
                {selectedCustomer ? selectedCustomer.name : "Manual buyer"}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Product link</span>
              <strong className="text-right text-[#102015]">
                {selectedProduct ? selectedProduct.name : "Manual item"}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Item</span>
              <strong className="text-right text-[#102015]">
                {selectedProduct?.name || form.produceItem} · {selectedProduct?.grade || form.produceGrade}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Quantity</span>
              <strong className="text-right text-[#102015]">
                {form.quantity || "Not set"} {selectedProduct?.unit || ""}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Estimated total</span>
              <strong className="text-right text-[#102015]">
                {estimatedTotal ? formatNaira(estimatedTotal) : "To be confirmed"}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Fulfilment</span>
              <strong className="text-right text-[#102015]">
                {form.fulfilmentStatus}
              </strong>
            </div>
          </div>
        </div>

        <AdminDisclosure
          title="WhatsApp preview"
          description="Copy this message into WhatsApp after confirming availability and pricing."
        >
          <pre className="whitespace-pre-wrap rounded-2xl bg-[#f3f8ef] p-4 text-sm leading-6 text-[#405348]">
            {whatsappPreview}
          </pre>
        </AdminDisclosure>

        <AdminDisclosure
          title="Payment instruction preview"
          description="Internal payment guidance before automated payment links are connected."
        >
          <pre className="whitespace-pre-wrap rounded-2xl bg-[#f3f8ef] p-4 text-sm leading-6 text-[#405348]">
            {paymentInstruction}
          </pre>
        </AdminDisclosure>

        <AdminDisclosure
          title="Local draft orders"
          description="Browser-saved drafts for orders that are not ready to submit to the database."
        >
          <DraftOrdersPanel />
        </AdminDisclosure>
      </aside>
    </section>
  );
}
