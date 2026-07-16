import AdminPageShell from "@/components/AdminPageShell";
import BuyerUpdateRequestsList from "@/components/admin/BuyerUpdateRequestsList";
export const dynamic = "force-dynamic"; export const runtime = "nodejs";
type Params = Record<string, string | string[] | undefined>;
export default async function BuyerProfileRequestsAdminPage({searchParams}: {searchParams?: Promise<Params>}) { const raw = await searchParams; return <AdminPageShell title="Buyer profile update requests" description="Review buyer-submitted account changes before updating approved records." actionHref="/admin/customers?view=updates" actionLabel="Open Buyers workspace" compactHeader><BuyerUpdateRequestsList raw={raw || {}}/></AdminPageShell>; }
