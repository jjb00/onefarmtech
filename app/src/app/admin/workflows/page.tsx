import AdminShell from "@/components/admin/AdminShell";
import AdminInfoCard from "@/components/admin/AdminInfoCard";
import {
  orderWorkflowSteps,
  paymentRules,
  paymentStatuses,
  fulfilmentStatuses,
} from "@/constants/orderOptions";

export default function AdminWorkflowsPage() {
  return (
    <AdminShell
      title="Admin workflows"
      description="Operational rules for order capture, payment control, sourcing, quality checks, delivery, and issue handling."
    >
      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="rounded-[2rem] bg-white/10 p-6 text-white">
          <h2 className="text-2xl font-bold">Order workflow</h2>
          <div className="mt-6 grid gap-4">
            {orderWorkflowSteps.map((step, index) => (
              <div key={step} className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-[#9ee6ad]">Step {index + 1}</p>
                <p className="mt-1 font-semibold">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
          <h2 className="text-2xl font-bold">Payment rules</h2>
          <div className="mt-6 grid gap-4">
            {paymentRules.map((rule) => (
              <div key={rule.title} className="rounded-2xl bg-[#f7f5ec] p-5">
                <p className="font-bold">{rule.title}</p>
                <p className="mt-2 text-sm leading-6 text-[#405348]">
                  {rule.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-[2rem] bg-white/10 p-6 text-white">
          <h2 className="text-2xl font-bold">Payment statuses</h2>
          <div className="mt-6 grid gap-3">
            {paymentStatuses.map((status) => (
              <AdminInfoCard
                key={status}
                title={status}
                description="Used by admin to determine whether an order can proceed to sourcing or needs follow-up."
              />
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] bg-white/10 p-6 text-white">
          <h2 className="text-2xl font-bold">Fulfilment statuses</h2>
          <div className="mt-6 grid gap-3">
            {fulfilmentStatuses.map((status) => (
              <AdminInfoCard
                key={status}
                title={status}
                description="Used to track the order from new request through sourcing, dispatch, delivery, and completion."
              />
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
