import AdminPageShell from "@/components/AdminPageShell";
import ContactEnquiriesList from "@/components/admin/ContactEnquiriesList";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Params = Record<string, string | string[] | undefined>;

export default async function ContactEnquiriesPage({searchParams}: {searchParams?: Promise<Params>}) {
  const raw = await searchParams;
  return <AdminPageShell title="Contact enquiries" description="Review public enquiries and unmatched WhatsApp contacts." actionHref="/admin/buyer-messages?view=enquiries" actionLabel="Open unified Inbox" compactHeader>
    <ContactEnquiriesList raw={raw || {}} pathname="/admin/contact-enquiries" showOverallTotal/>
  </AdminPageShell>;
}
