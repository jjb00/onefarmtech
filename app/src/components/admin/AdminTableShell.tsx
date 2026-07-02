type AdminTableShellProps = {
  title: string;
  description: string;
  label?: string;
  children: React.ReactNode;
};

export default function AdminTableShell({
  title,
  description,
  label = "Mock admin module",
  children,
}: AdminTableShellProps) {
  return (
    <section className="mt-10 rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="mt-2 text-sm text-[#405348]">{description}</p>
        </div>

        <div className="rounded-full bg-[#f7f5ec] px-4 py-2 text-sm font-semibold text-[#405348]">
          {label}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">{children}</div>
    </section>
  );
}
