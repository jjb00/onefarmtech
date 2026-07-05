import StatusBadge from "@/components/admin/StatusBadge";
import { adminHealthCards } from "@/data/adminNavigation";

export default function AdminHealthGrid() {
  return (
    <section className="rounded-[2rem] bg-white p-6 text-[#102015]">
      <div>
        <h2 className="text-2xl font-bold">Readiness</h2>
        <p className="mt-2 text-sm leading-6 text-[#d8e8dc]">
          This helps keep the difference clear between what is launch-ready now
          and what still needs backend/integration work.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {adminHealthCards.map((card) => (
          <article key={card.title} className="rounded-2xl bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold">{card.title}</h3>
              <StatusBadge status={card.status} />
            </div>

            <p className="mt-3 text-sm leading-6 text-[#d8e8dc]">
              {card.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
