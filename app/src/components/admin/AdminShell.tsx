import Link from "next/link";

type AdminShellProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export default function AdminShell({
  title,
  description,
  action,
  children,
}: AdminShellProps) {
  return (
    <main className="min-h-screen bg-[#102015] px-6 py-10 text-white">
      <section className="mx-auto max-w-7xl">
        <Link href="/admin" className="text-sm font-semibold text-[#9ee6ad]">
          ← Back to admin
        </Link>

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">{title}</h1>
            <p className="mt-3 max-w-3xl text-[#d8e8dc]">{description}</p>
          </div>

          {action}
        </div>

        {children}
      </section>
    </main>
  );
}
