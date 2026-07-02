import AdminShell from "@/components/admin/AdminShell";
import DraftOrdersPanel from "@/components/admin/DraftOrdersPanel";

export default function DraftOrdersPage() {
  return (
    <AdminShell
      title="Draft orders"
      description="Local browser draft orders created before database integration. Useful for testing the order capture workflow."
    >
      <section className="mt-10">
        <DraftOrdersPanel />
      </section>
    </AdminShell>
  );
}
