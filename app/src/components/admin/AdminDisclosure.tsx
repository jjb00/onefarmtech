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
        <div>
          <h2 className="text-2xl font-black">{title}</h2>
          {description ? (
            <p className="mt-2 max-w-4xl text-sm leading-7 text-[#405348]">
              {description}
            </p>
          ) : null}
        </div>

        <span className="rounded-full border border-[#102015]/10 bg-[#f3f8ef] px-3 py-1 text-xs font-black text-[#102015]">
          <span className="group-open:hidden">Open</span>
          <span className="hidden group-open:inline">Close</span>
        </span>
      </summary>

      <div className="mt-6">{children}</div>
    </details>
  );
}
