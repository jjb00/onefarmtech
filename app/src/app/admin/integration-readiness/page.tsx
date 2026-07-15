import Link from "next/link";
import {AdminPage} from "@/components/portal/AdminPage";
import {requireStaff} from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function hasEnv(key: string) {
  return Boolean(process.env[key] && String(process.env[key]).trim());
}

function StatusPill({ready}: {ready: boolean}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${
        ready ? "bg-[#eef6ea] text-[#1f7a3f]" : "bg-[#fff6d6] text-[#7a4a00]"
      }`}
    >
      {ready ? "Configured" : "Missing"}
    </span>
  );
}

const groups = [
  {
    title: "Paystack",
    description: "Payment link and webhook confirmation.",
    webhook: "/api/payments/webhook",
    keys: ["PAYSTACK_SECRET_KEY", "PAYSTACK_PUBLIC_KEY", "PAYSTACK_WEBHOOK_SECRET", "PAYSTACK_FALLBACK_EMAIL"],
  },
  {
    title: "Flutterwave",
    description: "Alternate payment link and webhook confirmation.",
    webhook: "/api/payments/flutterwave/webhook",
    keys: ["FLUTTERWAVE_SECRET_KEY", "FLUTTERWAVE_PUBLIC_KEY", "FLUTTERWAVE_WEBHOOK_SECRET_HASH", "FLUTTERWAVE_FALLBACK_EMAIL"],
  },
  {
    title: "Meta WhatsApp Cloud API",
    description: "Outbound WhatsApp messages and inbound webhook.",
    webhook: "/api/whatsapp/webhook",
    keys: ["WHATSAPP_CLOUD_ACCESS_TOKEN", "WHATSAPP_CLOUD_PHONE_NUMBER_ID", "WHATSAPP_CLOUD_BUSINESS_ACCOUNT_ID", "WHATSAPP_WEBHOOK_VERIFY_TOKEN", "WHATSAPP_APP_SECRET"],
  },
  {
    title: "App URLs",
    description: "Base URLs used by payment callback links and provider dashboard setup.",
    webhook: null,
    keys: ["APP_BASE_URL", "NEXT_PUBLIC_APP_URL"],
  },
];

export default async function IntegrationReadinessPage() {
  await requireStaff();

  return (
    <AdminPage
      title="Integration readiness"
      subtitle="Check payment and WhatsApp provider configuration without exposing secret values."
    >
      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Launch integrations
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#102015]">
              Provider setup status
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
              This page checks whether required environment variables are present. It does not show secret values.
            </p>
          </div>

          <Link
            href="/admin/launch-smoke-test"
            className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white hover:bg-[#155c2f]"
          >
            Open smoke test
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {groups.map((group) => {
            const readyCount = group.keys.filter(hasEnv).length;
            const allReady = readyCount === group.keys.length;

            return (
              <article key={group.title} className="rounded-[1.5rem] border border-[#102015]/10 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black text-[#102015]">{group.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#405348]">{group.description}</p>
                  </div>
                  <StatusPill ready={allReady} />
                </div>

                {group.webhook ? (
                  <div className="mt-4 rounded-2xl bg-[#f7f5ec] p-4 text-sm text-[#405348]">
                    <span className="font-black text-[#102015]">Webhook path:</span>{" "}
                    {group.webhook}
                  </div>
                ) : null}

                <div className="mt-4 grid gap-2">
                  {group.keys.map((key) => (
                    <div key={key} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f7f5ec] px-4 py-3 text-sm">
                      <span className="font-bold text-[#102015]">{key}</span>
                      <StatusPill ready={hasEnv(key)} />
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </AdminPage>
  );
}
