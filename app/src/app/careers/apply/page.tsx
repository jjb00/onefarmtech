import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicFooter from "@/components/PublicFooter";
import TurnstileWidget from "@/components/TurnstileWidget";
import {createCareerApplicationAction} from "@/actions/publicApplications";
import {publicIntakeErrorMessage} from "@/lib/publicIntakeProtection";

export const dynamic = "force-dynamic";

export default async function CareerApplyPage({searchParams}: {searchParams?: Promise<{role?: string; submitted?: string; error?: string}>}) {
  const params = await searchParams;
  const role = String(params?.role || "").trim();
  return <main className="min-h-screen bg-[#fbfff8] text-[#102015]">
    <section className="mx-auto max-w-3xl px-6 py-10">
      <header className="flex items-center justify-between gap-4"><Link href="/"><BrandMark /></Link><Link href="/careers" className="text-sm font-black text-[#1f7a3f]">Back to careers</Link></header>
      <div className="mt-10 rounded-[2rem] border border-[#102015]/10 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1f7a3f]">Career application</p>
        <h1 className="mt-3 text-4xl font-black">Apply to OneFarmTech</h1>
        {params?.submitted === "1" ? <div role="status" className="mt-5 rounded-2xl bg-[#eef8ef] p-4 font-bold text-[#155c2f]">Application received. We have sent an acknowledgement to your email.</div> : null}
        {params?.error ? <div role="alert" className="mt-5 rounded-2xl bg-red-50 p-4 font-bold text-red-700">{params.error === "validation" ? "Complete every required field and confirm your consent." : publicIntakeErrorMessage(params.error)}</div> : null}
        <form action={createCareerApplicationAction} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-bold">Role applied for<input name="role" required readOnly={Boolean(role)} defaultValue={role} className="rounded-xl border px-4 py-3 font-normal" placeholder="Role title" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">Name<input name="name" required className="rounded-xl border px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold">Location<input name="location" required className="rounded-xl border px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold">Email<input name="email" type="email" required className="rounded-xl border px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold">Phone<input name="phone" required className="rounded-xl border px-4 py-3 font-normal" /></label>
          </div>
          <label className="grid gap-2 text-sm font-bold">Short experience statement<textarea name="experience" required rows={6} className="rounded-xl border px-4 py-3 font-normal" /></label>
          <label className="flex gap-3 rounded-xl bg-[#f3f8ef] p-4 text-sm font-semibold"><input name="consent" type="checkbox" required className="mt-1" />I consent to OneFarmTech using these details to assess and contact me about this application.</label>
          <div className="hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
          <TurnstileWidget action="career_application" idleLabel="Submit application" pendingLabel="Submitting…" />
        </form>
        <p className="mt-4 text-xs text-[#587063]">CV upload is not offered yet because the platform has no approved private file-storage workflow.</p>
      </div>
    </section><PublicFooter />
  </main>;
}
