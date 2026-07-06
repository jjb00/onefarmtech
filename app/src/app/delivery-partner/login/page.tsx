import Link from "next/link";
import DeliveryPartnerMobileMenu from "@/components/DeliveryPartnerMobileMenu";
import {deliveryPartnerLoginAction} from "@/actions/createAdminRecords";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DeliveryPartnerLoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <main className="min-h-screen bg-[#f7f5ec] px-4 py-10 text-[#102015] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-xl rounded-[2rem] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link href="/delivery-partner" className="text-sm font-black text-[#1f7a3f] hover:underline">
            Partner portal
          </Link>
          <DeliveryPartnerMobileMenu />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
          Delivery partner
        </p>
        <h1 className="mt-3 text-3xl font-black">Partner login</h1>
        <p className="mt-3 text-sm leading-7 text-[#405348]">
          Enter the access code issued by OneFarmTech operations.
        </p>

        {error ? (
          <div className="mt-5 rounded-2xl border border-[#d9471f]/30 bg-[#fff4ef] p-4 text-sm font-bold text-[#9b2f12]">
            {error === "missing-code"
              ? "Enter your access code."
              : "Invalid or inactive access code."}
          </div>
        ) : null}

        <form action={deliveryPartnerLoginAction} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-[#405348]">
            Access code
            <input
              name="accessCode"
              required
              className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
              placeholder="DP-XXXXXX"
            />
          </label>

          <button
            type="submit"
            className="rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
          >
            Sign in
          </button>
        </form>

        <Link
          href="/delivery-partner"
          className="mt-6 inline-flex text-sm font-black text-[#1f7a3f] underline underline-offset-4"
        >
          Back
        </Link>
      </section>
    </main>
  );
}
