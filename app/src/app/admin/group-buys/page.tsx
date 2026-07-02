import Link from "next/link";
import { mockGroupBuys, badgeClass } from "@/data/mockAdmin";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#102015] px-6 py-10 text-white">
      <section className="mx-auto max-w-7xl">
        <Link href="/admin" className="text-sm font-semibold text-[#9ee6ad]">
          ← Back to admin
        </Link>

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Group-buys</h1>
            <p className="mt-3 max-w-3xl text-[#d8e8dc]">
              Create and monitor admin-controlled split bulk-buy offers, targets, commitments, closing times, and fulfilment status.
            </p>
          </div>

          <button className="rounded-full bg-[#9ee6ad] px-6 py-4 font-semibold text-[#102015]">
            Add new
          </button>
        </div>

        <section className="mt-10 rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Group-buys table</h2>
              <p className="mt-2 text-sm text-[#405348]">
                MVP mock data. Later this will connect to database records.
              </p>
            </div>

            <div className="rounded-full bg-[#f7f5ec] px-4 py-2 text-sm font-semibold text-[#405348]">
              Mock admin module
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px] border-separate border-spacing-y-3 text-left text-sm">
              <thead>
                <tr className="text-[#405348]">
                  <th className="px-4 py-2">Title</th>\n                  <th className="px-4 py-2">Product</th>\n                  <th className="px-4 py-2">Target</th>\n                  <th className="px-4 py-2">Committed</th>\n                  <th className="px-4 py-2">Minimum</th>\n                  <th className="px-4 py-2">Closes</th>\n                  <th className="px-4 py-2">Fulfilment</th>\n                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>

              <tbody>
                {mockGroupBuys.map((item) => (
                  <tr key={item.title} className="rounded-2xl bg-[#f7f5ec]">
                    <td className="rounded-l-2xl px-4 py-4 font-bold">{item.title}</td>\n                    <td className="px-4 py-4">{item.product}</td>\n                    <td className="px-4 py-4">{item.target}</td>\n                    <td className="px-4 py-4">{item.committed}</td>\n                    <td className="px-4 py-4">{item.minimum}</td>\n                    <td className="px-4 py-4">{item.closes}</td>\n                    <td className="px-4 py-4">{item.fulfilment}</td>\n                    <td className="rounded-r-2xl px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(item.status)}`}>{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
