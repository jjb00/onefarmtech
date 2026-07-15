import AdminPageShell from "@/components/AdminPageShell";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeText(value: unknown, fallback = "Not provided") {
  const text = String(value || "").trim();
  return text || fallback;
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Not recorded";

  try {
    return new Date(value).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "Not recorded";
  }
}

export default async function ContactEnquiriesPage() {
  const enquiries = await prisma.contactEnquiry.findMany({
    orderBy: {createdAt: "desc"},
    take: 100,
  });

  const newCount = enquiries.filter((enquiry) => safeText(enquiry.status, "") === "New").length;

  const whatsappCount = enquiries.filter((enquiry) =>
    safeText(enquiry.source, "").toLowerCase().includes("whatsapp") ||
    safeText(enquiry.enquiryType, "").toLowerCase().includes("whatsapp"),
  ).length;

  const partnerCount = enquiries.filter((enquiry) =>
    safeText(enquiry.enquiryType, "").toLowerCase().includes("partnership"),
  ).length;

  return (
    <AdminPageShell
      title="Contact enquiries"
      description="Review buyer support messages, WhatsApp inbound messages, partnership enquiries, media requests, and public contact form submissions."
    >
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Total enquiries" value={String(enquiries.length)} />
          <Metric label="New" value={String(newCount)} />
          <Metric label="WhatsApp inbound" value={String(whatsappCount)} />
          <Metric label="Partnership-related" value={String(partnerCount)} />
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-[#102015]/10 bg-white text-[#102015] shadow-sm">
          <div className="border-b border-[#102015]/10 bg-[#f8fbf5] px-5 py-4">
            <h2 className="text-base font-black text-[#102015]">Latest enquiries</h2>
            <p className="mt-1 text-sm text-[#587063]">
              Unmatched WhatsApp senders are stored here until staff links or converts them.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
              <thead className="bg-[#f3f8ef] text-[#405348]">
                <tr>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Organisation</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {enquiries.map((enquiry) => {
                  const enquiryType = safeText(enquiry.enquiryType, "General enquiry");
                  const source = safeText(enquiry.source, "Contact page");
                  return (
                    <tr key={enquiry.id} className="border-t border-[#102015]/10 align-top">
                      <td className="px-4 py-4 text-[#405348]">
                        {formatDate(enquiry.createdAt)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-black text-[#102015]">
                          {safeText(enquiry.name, "Unknown contact")}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-[#587063]">
                          {safeText(enquiry.email, "No email")}
                          {enquiry.phone ? ` · ${enquiry.phone}` : ""}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-[#405348]">
                        {safeText(enquiry.organisation)}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-[#3E7A4C]/10 px-3 py-1 text-xs font-bold text-[#3E7A4C]">
                          {enquiryType}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-[#e9f1ff] px-3 py-1 text-xs font-bold text-[#24518a]">
                          {source}
                        </span>
                      </td>

                      <td className="max-w-md px-4 py-4 leading-7 text-[#405348]">
                        {safeText(enquiry.message, "No message")}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-[#F2B84B]/20 px-3 py-1 text-xs font-black text-[#102015]">
                          {safeText(enquiry.status, "New")}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {!enquiries.length ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-[#587063]" colSpan={7}>
                      No contact enquiries yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}

function Metric({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-[2rem] border border-[#102015]/10 bg-white p-5 text-[#102015] shadow-sm">
      <p className="text-2xl font-black text-[#1f7a3f]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[#405348]">{label}</p>
    </div>
  );
}
