import type {Metadata} from "next";
import BrandMark from "@/components/BrandMark";

export const metadata: Metadata = {title: "Emergency admin recovery | OneFarmTech", robots: {index: false, follow: false}};
export const dynamic = "force-dynamic";

export default async function AdminRecoveryPage({searchParams}: {searchParams?: Promise<{error?: string}>}) {
  const failed = Boolean((await searchParams)?.error);
  return (
    <main className="min-h-screen bg-[#07120c] px-4 py-10 text-white">
      <section className="mx-auto max-w-md rounded-[2rem] border border-white/10 bg-white p-7 text-[#102015] shadow-2xl">
        <BrandMark />
        <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-[#9b2f12]">Temporary protected access</p>
        <h1 className="mt-3 text-3xl font-black">Emergency admin recovery</h1>
        <p className="mt-3 text-sm leading-6 text-[#405348]">Use only during the authorised recovery window. This route should be removed immediately after staff access is restored.</p>
        {failed ? <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">Recovery could not be completed. Check the recovery credential and try again later.</div> : null}
        <form action="/api/admin-recovery" method="post" className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-bold">Recovery token
            <input name="token" type="password" required autoComplete="off" className="rounded-xl border border-[#102015]/15 px-4 py-3 font-normal" />
          </label>
          <button type="submit" className="rounded-full bg-[#102015] px-5 py-3 text-sm font-black text-white">Recover admin access</button>
        </form>
      </section>
    </main>
  );
}
