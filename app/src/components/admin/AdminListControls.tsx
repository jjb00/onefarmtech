import Link from "next/link";

export function AdminListToolbar({search, filters, pageSize, resetHref}: {search: string; filters: Array<{name: string; label: string; value: string; options: Array<{value: string; label: string}>}>; pageSize: number; resetHref: string}) {
  return <section className="rounded-2xl border border-[#102015]/10 bg-white p-4 shadow-sm">
    <form method="get" className="grid gap-3 lg:grid-cols-[minmax(16rem,2fr)_repeat(4,minmax(9rem,1fr))_auto]">
      <label className="grid gap-1 text-xs font-black text-[#405348]">Search enquiries
        <input name="q" defaultValue={search} placeholder="Name, contact, organisation or message" className="rounded-xl border border-[#102015]/15 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#1f7a3f] focus:ring-2 focus:ring-[#1f7a3f]/20" />
      </label>
      {filters.map((filter) => <label key={filter.name} className="grid gap-1 text-xs font-black text-[#405348]">{filter.label}
        <select name={filter.name} defaultValue={filter.value} className="rounded-xl border border-[#102015]/15 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[#1f7a3f] focus:ring-2 focus:ring-[#1f7a3f]/20">
          <option value="">All</option>{filter.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>)}
      <label className="grid gap-1 text-xs font-black text-[#405348]">Per page
        <select name="pageSize" defaultValue={String(pageSize)} className="rounded-xl border border-[#102015]/15 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[#1f7a3f] focus:ring-2 focus:ring-[#1f7a3f]/20">
          {[25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
      <div className="flex items-end gap-2"><button type="submit" className="rounded-xl bg-[#102015] px-4 py-2.5 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-[#1f7a3f]">Apply</button><Link href={resetHref} className="rounded-xl border border-[#102015]/15 px-4 py-2.5 text-sm font-black text-[#405348] focus:outline-none focus:ring-2 focus:ring-[#1f7a3f]">Reset</Link></div>
    </form>
    {search ? <p className="mt-3 text-sm text-[#405348]">Searching for <strong className="text-[#102015]">“{search}”</strong></p> : null}
  </section>;
}

export function AdminResultCount({start, end, total, label}: {start: number; end: number; total: number; label: string}) {
  return <p className="text-sm font-semibold text-[#405348]" aria-live="polite">Showing {start.toLocaleString()}–{end.toLocaleString()} of {total.toLocaleString()} {label}.</p>;
}

export function AdminPagination({page, totalPages, previousHref, nextHref}: {page: number; totalPages: number; previousHref?: string; nextHref?: string}) {
  const classes = "rounded-xl border border-[#102015]/15 bg-white px-4 py-2 text-sm font-black text-[#102015] focus:outline-none focus:ring-2 focus:ring-[#1f7a3f]";
  return <nav aria-label="List pagination" className="flex flex-wrap items-center justify-between gap-3">
    <span className="text-sm font-semibold text-[#405348]">Page {page} of {Math.max(totalPages, 1)}</span>
    <div className="flex gap-2">{previousHref ? <Link href={previousHref} className={classes}>Previous</Link> : <span aria-disabled="true" className={`${classes} cursor-not-allowed opacity-40`}>Previous</span>}{nextHref ? <Link href={nextHref} className={classes}>Next</Link> : <span aria-disabled="true" className={`${classes} cursor-not-allowed opacity-40`}>Next</span>}</div>
  </nav>;
}

export function AdminEmptyState({title, description, resetHref}: {title: string; description: string; resetHref?: string}) {
  return <div className="rounded-2xl border border-dashed border-[#102015]/20 bg-white px-6 py-12 text-center"><h2 className="text-xl font-black text-[#102015]">{title}</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#587063]">{description}</p>{resetHref ? <Link href={resetHref} className="mt-5 inline-flex rounded-xl bg-[#1f7a3f] px-4 py-2.5 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-[#102015]">Clear search and filters</Link> : null}</div>;
}
