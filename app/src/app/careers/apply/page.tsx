import {redirect} from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CareerApplyPage({
  searchParams,
}: {
  searchParams?: Promise<{
    role?: string;
    submitted?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  query.set("apply", "1");

  if (params?.role) query.set("role", params.role);
  if (params?.submitted) query.set("submitted", params.submitted);
  if (params?.error) query.set("error", params.error);

  redirect(`/careers?${query.toString()}`);
}
