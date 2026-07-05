type AdminDisclosureProps = {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export default function AdminDisclosure({
  title,
  description,
  defaultOpen = false,
  children,
}: AdminDisclosureProps) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3f8ef] text-lg font-black text-[#1f7a3f] transition group-open:rotate-90"
            >
              ›
            </span>
            <h2 className="text-2xl font-black">{title}</h2>
          </div>

          {description ? (
            <p className="mt-2 max-w-4xl text-sm leading-7 text-[#405348]">
              {description}
            </p>
          ) : null}
        </div>

        <span
          aria-hidden="true"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#102015]/10 bg-[#f3f8ef] text-lg font-black text-[#102015] transition group-open:rotate-180"
        >
          ˅
        </span>

        <span className="sr-only">Expand or collapse section</span>
      </summary>

      <div className="mt-6">{children}</div>
    </details>
  );
}
