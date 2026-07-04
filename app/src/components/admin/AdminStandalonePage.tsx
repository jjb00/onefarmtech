type AdminStandalonePageProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
};

export default function AdminStandalonePage({
  eyebrow,
  title,
  description,
  children,
}: AdminStandalonePageProps) {
  return (
    <main className="min-h-screen bg-[#f4f8ef] px-5 py-6 text-[#102015] md:px-8 lg:px-12">
      <section className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm md:p-8">
        {eyebrow ? (
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#1f7a3f]">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="mt-3 text-4xl font-black tracking-tight text-[#102015] md:text-5xl">
          {title}
        </h1>

        {description ? (
          <p className="mt-4 max-w-4xl text-base leading-7 text-[#405348] md:text-lg">
            {description}
          </p>
        ) : null}
      </section>

      <section className="mt-8 text-[#102015]">{children}</section>
    </main>
  );
}
