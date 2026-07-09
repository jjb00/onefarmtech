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
      <p className="mt-1 text-[0.68rem] font-black uppercase tracking-[0.14em] opacity-75">
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

  return <div className={`rounded-2xl border px-4 py-3 shadow-sm ${toneClass}`}>{content}</div>;
}

export function AdminViewBar({
  title = "Controls",
  description,
  viewOptions = [],
  filterOptions = [],
  dateOptions = [],
  sortOptions = [],
  children,
}: {
  title?: string;
  description?: string;
  viewOptions?: Option[];
  filterOptions?: Option[];
  dateOptions?: Option[];
  sortOptions?: Option[];
  children?: ReactNode;
}) {
  const activeLabels = [
    activeLabel(viewOptions),
    activeLabel(filterOptions),
    activeLabel(dateOptions),
    activeLabel(sortOptions),
  ].filter(Boolean);

  return (
    <section className="rounded-2xl border border-[#102015]/10 bg-white p-3 text-[#102015] shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">
              {title}
            </p>
            {activeLabels.length ? (
              <span className="rounded-full bg-[#f3f8ef] px-3 py-1 text-xs font-black text-[#405348]">
                {activeLabels.join(" · ")}
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[#405348]">
              {description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {viewOptions.length ? <ControlDropdown label="View" options={viewOptions} /> : null}
          {filterOptions.length ? <ControlDropdown label="Filter" options={filterOptions} /> : null}
          {dateOptions.length ? <ControlDropdown label="Date" options={dateOptions} /> : null}
          {sortOptions.length ? <ControlDropdown label="Sort" options={sortOptions} /> : null}
        </div>
      </div>

      {children ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}

function activeLabel(options: Option[]) {
  return options.find((option) => option.active)?.label;
}

function ControlDropdown({label, options}: {label: string; options: Option[]}) {
  const active = options.find((option) => option.active);

  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-[#102015]/10 bg-[#fbfff8] px-4 py-2 text-xs font-black text-[#102015] shadow-sm transition hover:bg-[#f3f8ef]">
        <span>{label}</span>
        {active ? <span className="text-[#1f7a3f]">· {active.label}</span> : null}
        <span aria-hidden="true">⌄</span>
      </summary>

      <div className="absolute right-0 z-40 mt-2 grid min-w-48 gap-1 rounded-2xl border border-[#102015]/10 bg-white p-2 shadow-2xl">
        {options.map((option) => (
          <Link
            key={`${label}-${option.label}-${option.href}`}
            href={option.href}
            className={`rounded-xl px-3 py-2 text-sm font-black transition ${
              option.active
                ? "bg-[#1f7a3f] text-white"
                : "text-[#102015] hover:bg-[#f3f8ef]"
            }`}
          >
            {option.label}
          </Link>
        ))}
      </div>
    </details>
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

  if (key.includes("paid") || key.includes("approved") || key.includes("delivered") || key.includes("ready") || key.includes("complete") || key.includes("active")) {
    return "green" as const;
  }

  if (key.includes("pending") || key.includes("unpaid") || key.includes("awaiting") || key.includes("review") || key.includes("draft")) {
    return "amber" as const;
  }

  if (key.includes("failed") || key.includes("cancelled") || key.includes("issue") || key.includes("complaint") || key.includes("rejected") || key.includes("paused") || key.includes("closed")) {
    return "red" as const;
  }

  if (key.includes("transit") || key.includes("assigned") || key.includes("picked") || key.includes("open")) {
    return "blue" as const;
  }

  return "neutral" as const;
}

export function maskSecret(value: string | null | undefined) {
  if (!value) return "No code";
  const trimmed = value.trim();
  if (trimmed.length <= 4) return "••••";
  return `•••• ${trimmed.slice(-4)}`;
}
