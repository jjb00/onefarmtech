import {redirect} from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = Record<string, string | string[] | undefined>;

export default async function PaymentRequestsPage({
  searchParams,
}: {
  searchParams?: Promise<Params>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, raw] of Object.entries(params || {})) {
    const value = Array.isArray(raw) ? raw[0] : raw;

    if (value) query.set(key === "status" ? "view" : key, value);
  }

  redirect(`/admin/payments${query.size ? `?${query.toString()}` : ""}`);
}
