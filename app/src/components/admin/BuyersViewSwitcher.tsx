import Link from "next/link";

const views = [
  ["active", "Active buyers"],
  ["applications", "Account requests"],
  ["access", "Login access"],
  ["guests", "Guest buyers"],
  ["updates", "Profile changes"],
  ["all", "All buyers"],
] as const;

export default function BuyersViewSwitcher({
  activeView,
  role,
  params,
}: {
  activeView: string;
  role: string;
  params: Record<string, string>;
}) {
  const permitted = role === "Finance" ? ["active", "access", "all"] : views.map(([value]) => value);

  return (
    <nav
      aria-label="Buyer workspace"
      className="flex gap-2 overflow-x-auto pb-1"
    >
      {views.filter(([value]) => permitted.includes(value)).map(([value, label]) => {
        const query = new URLSearchParams({
          ...Object.fromEntries(
            Object.entries(params).filter(([, item]) => Boolean(item)),
          ),
          view: value,
        });

        return (
          <Link
            key={value}
            href={`/admin/customers?${query.toString()}`}
            className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-black transition ${
              activeView === value
                ? "bg-[#1f7a3f] text-white"
                : "border bg-white text-[#294b37] hover:bg-[#f1f7ee]"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
