import AdminShell from "@/components/admin/AdminShell";
import CreateOrderClient from "@/components/admin/CreateOrderClient";

export default function CreateOrderPage() {
  return (
    <AdminShell
      title="Create order"
      description="Manual order entry for WhatsApp, phone, business, group-buy, recurring, and pre-harvest orders."
    >
      <CreateOrderClient />
    </AdminShell>
  );
}
