import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicFooter from "@/components/PublicFooter";
import {buyerLoginAction} from "@/actions/auth";

export const dynamic = "force-dynamic";
const messages: Record<string, string> = {
  missing: "Enter your email or phone and access code.", invalid: "That access code was not recognised.",
  identifier: "Those details do not match the access code.", cancelled: "This access code has been cancelled. Contact support for a replacement.",
  expired: "This access code has expired. Contact support for a replacement.", "not-ready": "This buyer account is inactive or not yet approved for login.",
  contact: "Your buyer contact is inactive or not configured for portal access. Contact OneFarmTech support.",
};
export default async function BuyerLoginPage({searchParams}: {searchParams?: Promise<{error?: string}>}) {
  const params = await searchParams;
  return <main className="min-h-screen bg-[#fbfff8] text-[#102015]"><section className="mx-auto max-w-xl px-6 py-12"><Link href="/"><BrandMark /></Link>
    <div className="mt-10 rounded-[2rem] border bg-white p-7 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#1f7a3f]">Approved buyers</p><h1 className="mt-3 text-4xl font-black">Buyer login</h1><p className="mt-3 text-sm leading-7 text-[#405348]">Use the access code provided after your buyer account was approved.</p>
      {params?.error ? <div role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{messages[params.error] || "Sign-in could not be completed."}</div> : null}
      <form action={buyerLoginAction} className="mt-6 grid gap-4"><label className="grid gap-2 text-sm font-bold">Email or phone<input name="buyerIdentifier" required autoComplete="username" className="rounded-xl border px-4 py-3 font-normal" /></label><label className="grid gap-2 text-sm font-bold">Access code<input name="buyerAccessCode" type="password" required autoComplete="current-password" className="rounded-xl border px-4 py-3 font-normal" /></label><button className="rounded-full bg-[#1f7a3f] px-6 py-3 font-black text-white">Sign in</button></form>
      <div className="mt-6 border-t pt-5 text-sm"><span>Not approved yet? </span><Link href="/buyer-account-request" className="font-black text-[#1f7a3f]">Request a buyer account</Link></div>
    </div></section><PublicFooter /></main>;
}
