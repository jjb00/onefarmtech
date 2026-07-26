export default function AdminLoadingState() {
  return (
    <main
      className="min-h-screen bg-[#f7f4ea] px-4 py-5 sm:px-6"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading…</span>

      <div className="mx-auto grid w-full max-w-7xl gap-4">
        <header className="grid gap-2">
          <div className="h-5 w-36 animate-pulse rounded-md bg-[#dfe7dc] motion-reduce:animate-none" />
          <div className="h-3 w-64 max-w-full animate-pulse rounded-md bg-[#e7ece4] motion-reduce:animate-none" />
        </header>

        <section
          className="overflow-hidden rounded-2xl border border-[#dfe5dc] bg-white"
          aria-hidden="true"
        >
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="grid gap-2 border-b p-4 last:border-b-0"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="h-4 w-40 max-w-[60%] animate-pulse rounded bg-[#dfe7dc] motion-reduce:animate-none" />
                <div className="h-6 w-16 animate-pulse rounded-full bg-[#edf1eb] motion-reduce:animate-none" />
              </div>
              <div className="h-3 w-52 max-w-[75%] animate-pulse rounded bg-[#edf1eb] motion-reduce:animate-none" />
              <div className="h-3 w-full animate-pulse rounded bg-[#edf1eb] motion-reduce:animate-none" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-[#edf1eb] motion-reduce:animate-none" />
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
