import AdminShell from "@/components/admin/AdminShell";
import CreateOrderClient from "@/components/admin/CreateOrderClient";
import { createOrderAction } from "@/actions/createOrder";
import { getDbCustomers, getDbProducts } from "@/data/dbAdmin";

export default async function CreateOrderPage() {
  const [customers, products] = await Promise.all([
    getDbCustomers(),
    getDbProducts(),
  ]);

  const customerOptions = customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    buyerType: customer.buyerType,
    location: customer.location,
    paymentTerms: customer.paymentTerms,
  }));

  const productOptions = products.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    unit: product.unit,
    grade: product.grade,
    basePrice: product.basePrice,
    availability: product.availability,
  }));

  return (
    <AdminShell
      title="Create order"
      description="Manual order entry for WhatsApp, phone, business, group-buy, recurring, and pre-harvest orders."
    >
      <CreateOrderClient
        createOrderAction={createOrderAction}
        customerOptions={customerOptions}
        productOptions={productOptions}
      />
    </AdminShell>
  );
}
