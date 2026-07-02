import Link from "next/link";
import { mockProducts, badgeClass } from "@/data/mockAdmin";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#102015] px-6 py-10 text-white">
      <section className="mx-auto max-w-7xl">
        <Link href="/admin" className="text-sm font-semibold text-[#9ee6ad]">
          ← Back to admin
        </Link>

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Products</h1>
            <p className="mt-3 max-w-3xl text-[#d8e8dc]">
              Manage produce categories, units, grades, availability, and whether an item is active for group-buy.
            </p>
          </div>

          <button className="rounded-full bg-[#9ee6ad] px-6 py-4 font-semibold text-[#102015]">
            Add new
          </button>
        </div>

        <section className="mt-10 rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Products table</h2>
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
                  <th className="px-4 py-2">Name</th>\n                  <th className="px-4 py-2">Category</th>\n                  <th className="px-4 py-2">Unit</th>\n                  <th className="px-4 py-2">Grade</th>\n                  <th className="px-4 py-2">Availability</th>\n                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>

              <tbody>
                {mockProducts.map((item) => (
                  <tr key={item.name} className="rounded-2xl bg-[#f7f5ec]">
                    <td className="rounded-l-2xl px-4 py-4 font-bold">{item.name}</td>\n                    <td className="px-4 py-4">{item.category}</td>\n                    <td className="px-4 py-4">{item.unit}</td>\n                    <td className="px-4 py-4">{item.grade}</td>\n                    <td className="px-4 py-4">{item.availability}</td>\n                    <td className="rounded-r-2xl px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(item.status)}`}>{item.status}</span></td>
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
