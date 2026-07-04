export default function SiteFooter() {
  return (
    <footer className="bg-[#102015] px-6 py-10 text-white">
      <section className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold">OneFarmTech</h2>
          <p className="mt-2 text-sm text-[#d8e8dc]">
            Fresh food supply for Nigerian bulk buyers.
          </p>
        </div>

        <p className="text-sm text-[#d8e8dc]">
          Built for managed supply coordination, group-buys, business supply, and delivery coordination.
        </p>
      </section>
    </footer>
  );
}
