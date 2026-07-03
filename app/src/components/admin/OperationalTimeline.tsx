import StatusBadge from "@/components/admin/StatusBadge";
import { adminOperationalTimeline } from "@/data/adminNavigation";

export default function OperationalTimeline() {
  return (
    <section className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
      <div>
        <h2 className="text-2xl font-bold">Operating workflow</h2>
        <p className="mt-2 text-sm leading-6 text-[#405348]">
          A simple view of how OneFarmTech orders should move from WhatsApp
          request to payment, allocation, quality check, and fulfilment.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        {adminOperationalTimeline.map((item, index) => (
          <article key={item.stage} className="rounded-2xl bg-[#f7f5ec] p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold text-[#1f7a3f]">
                  Step {index + 1}
                </p>
                <h3 className="mt-1 text-xl font-bold">{item.stage}</h3>
                <p className="mt-1 text-sm text-[#405348]">{item.owner}</p>
              </div>

              <StatusBadge status={item.status} />
            </div>

            <p className="mt-4 text-sm leading-6 text-[#405348]">{item.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
