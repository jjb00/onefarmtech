import Link from "next/link";
import { adminQuickActions } from "@/data/adminNavigation";

export default function QuickActionsGrid() {
  return (
    <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {adminQuickActions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="rounded-[1.5rem] bg-[#9ee6ad] p-5 text-[#102015] transition hover:scale-[1.01]"
        >
          <p className="text-lg font-bold">{action.title}</p>
          <p className="mt-2 text-sm leading-6">{action.description}</p>
        </Link>
      ))}
    </section>
  );
}
