import Link from "next/link";
import type {ReactNode} from "react";

type Option = {
  label: string;
  href: string;
  active?: boolean;
};

export function AdminCompactMetric({
  label,
  value,
  tone = "neutral",
  href,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "green" | "amber" | "red" | "blue";
  href?: string;
}) {
  const toneClass =
    tone === "green"
      ? "border-[#1f7a3f]/25 bg-[#eef6ea] text-[#1f7a3f]"
      : tone === "amber"
        ? "border-[#b7791f]/25 bg-[#fff6d6] text-[#7a4a00]"
        : tone === "red"
          ? "border-[#c2410c]/25 bg-[#fff4ef] text-[#9b2f12]"
          : tone === "blue"
            ? "border-[#2563eb]/20 bg-[#eff6ff] text-[#1d4ed8]"
            : "border-[#102015]/10 bg-white text-[#102015]";

  const content = (
    <>
      <p className="text-2xl font-black leading-none">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] opacity-75">
        {label}
      </p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`rounded-2xl border px-4 py-3 shadow-sm transition hover:-translate-y-0.5 ${toneClass}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-sm ${toneClass}`}>
      {content}
    </div>
  );
}

export function AdminViewBar({
  title = "View controls",
  description,
  viewOptions = [],
  filterOptions = [],
  sortOptions = [],
  children,
}: {
  title?: string;
  description?: string;
  viewOptions?: Option[];
  filterOptions?: Option[];
  sortOptions?: Option[];
  children?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#102015]/10 bg-white p-4 text-[#102015] shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">
            {title}
          </p>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[#405348]">
              {description}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2 lg:min-w-[34rem]">
          {viewOptions.length ? <OptionRow label="View" options={viewOptions} /> : null}
          {filterOptions.length ? <OptionRow label="Filter" options={filterOptions} /> : null}
          {sortOptions.length ? <OptionRow label="Sort" options={sortOptions} /> : null}
        </div>
      </div>

      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

function OptionRow({label, options}: {label: string; options: Option[]}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="min-w-12 text-xs font-black uppercase tracking-[0.14em] text-[#587063]">
        {label}
      </span>
      {options.map((option) => (
        <Link
          key={`${label}-${option.label}-${option.href}`}
          href={option.href}
          className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
            option.active
              ? "bg-[#1f7a3f] text-white"
              : "border border-[#102015]/10 bg-[#f7f5ec] text-[#102015] hover:bg-[#eef6ea]"
          }`}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}

export function AdminStatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "red" | "blue";
}) {
  const toneClass =
    tone === "green"
      ? "bg-[#eef6ea] text-[#1f7a3f]"
      : tone === "amber"
        ? "bg-[#fff6d6] text-[#7a4a00]"
        : tone === "red"
          ? "bg-[#fff4ef] text-[#9b2f12]"
          : tone === "blue"
            ? "bg-[#eff6ff] text-[#1d4ed8]"
            : "bg-[#f3f8ef] text-[#405348]";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${toneClass}`}>
      {children}
    </span>
  );
}

export function adminToneFromStatus(status: string | null | undefined) {
  const key = String(status || "").toLowerCase();

  if (key.includes("paid") || key.includes("approved") || key.includes("delivered") || key.includes("ready") || key.includes("complete")) {
    return "green" as const;
  }

  if (key.includes("pending") || key.includes("unpaid") || key.includes("awaiting") || key.includes("review")) {
    return "amber" as const;
  }

  if (key.includes("failed") || key.includes("cancelled") || key.includes("issue") || key.includes("complaint") || key.includes("rejected")) {
    return "red" as const;
  }

  if (key.includes("transit") || key.includes("assigned") || key.includes("picked")) {
    return "blue" as const;
  }

  return "neutral" as const;
}
