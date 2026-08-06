import AdminPageShell from "@/components/AdminPageShell";
import {AdminStatusPill} from "@/components/admin/AdminViewControls";
import PendingSubmitButton from "@/components/admin/PendingSubmitButton";
import {submitWhatsAppTemplateAction} from "@/actions/whatsappTemplates";
import {listWhatsAppTemplates} from "@/lib/whatsapp/templateManagement";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PRESETS = [
  {
    name: "onefarmtech_buyer_approved",
    envVar: "WHATSAPP_BUYER_INVITE_TEMPLATE_NAME",
    usedFor: "Sent when a buyer account request is approved. Carries no code -- an earlier version did, and Meta rejected it as INCORRECT_CATEGORY because code delivery must be an Authentication template.",
    category: "UTILITY",
    bodyText: "Hello {{1}}, your OneFarmTech buyer account has been approved. Sign in at {{2}} to browse today's produce and place your first order. Reply to this message if you need any help getting started.",
    bodyExamples: "Amaka\nhttps://onefarmtech.com/buyer-login",
  },
  {
    name: "onefarmtech_login_code",
    envVar: "WHATSAPP_LOGIN_CODE_TEMPLATE_NAME",
    usedFor: "Delivers a sign-in code over WhatsApp. Meta writes the wording for Authentication templates, so there is nothing to edit -- it sends as \"<code> is your verification code\" with a copy button and a 10-minute expiry footer.",
    category: "AUTHENTICATION",
    bodyText: "",
    bodyExamples: "",
  },
  {
    name: "onefarmtech_payment_confirmed",
    envVar: "WHATSAPP_PAYMENT_TEMPLATE_NAME",
    usedFor: "Manual payment-link resend to a buyer outside an active chat window. A template name is already configured for this -- check its status below before resubmitting.",
    category: "UTILITY",
    bodyText: "Hello {{1}}, your OneFarmTech order {{2}} is confirmed and is now awaiting payment of {{3}}. Please quote payment reference {{4}} and complete your payment at this secure link: {{5}} — we will begin preparing your produce as soon as the payment is received.",
    bodyExamples: "Amaka\nOFT-00042\nNGN 45,000\nPAY-8821\nhttps://onefarmtech.com/pay/PAY-8821",
  },
];

export default async function WhatsAppTemplatesPage({
  searchParams,
}: {
  searchParams?: Promise<{submitted?: string; error?: string}>;
}) {
  const params = await searchParams;
  const submitted = params?.submitted === "1";
  const error = params?.error;

  let templates: Awaited<ReturnType<typeof listWhatsAppTemplates>> = [];
  let loadError: string | null = null;

  try {
    templates = await listWhatsAppTemplates();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load templates from Meta.";
  }

  return (
    <AdminPageShell
      title="WhatsApp message templates"
      description="Approved templates are the only way to send a business-initiated WhatsApp message to someone who hasn't messaged the bot in the last 24 hours -- this covers buyer-invite codes and manual payment reminders. Submitting a template does not send anything; it asks Meta to review and approve the wording, which usually takes minutes to a day."
    >
      {submitted ? (
        <div role="status" className="rounded-2xl bg-[#eef8f0] p-4 text-sm font-bold text-[#155c2f]">
          Template submitted to Meta for review. Refresh this page in a few minutes to see its status.
        </div>
      ) : null}

      {error ? (
        <div role="alert" className="rounded-2xl border border-[#C95F3D]/25 bg-[#fff4ed] p-4 text-sm font-bold leading-6 text-[#8b3f25]">
          {decodeURIComponent(error)}
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-[#102015]/10 bg-white/95 p-6 shadow-sm">
        <h2 className="text-xl font-black text-[#102015]">Existing templates</h2>
        {loadError ? (
          <p className="mt-3 text-sm font-bold text-[#9b2f12]">{loadError}</p>
        ) : templates.length === 0 ? (
          <p className="mt-3 text-sm text-[#405348]">No templates found on this WhatsApp Business Account yet.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {templates.map((template) => (
              <div key={template.id} className="rounded-2xl border border-[#102015]/10 bg-[#fbfff8] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-black text-[#102015]">{template.name}</p>
                  <AdminStatusPill tone={template.status === "APPROVED" ? "green" : template.status === "REJECTED" ? "red" : "amber"}>
                    {template.status}
                  </AdminStatusPill>
                </div>
                <p className="mt-2 text-xs text-[#587063]">{template.category} · {template.language}</p>
                {template.bodyText ? <p className="mt-2 text-sm text-[#405348]">{template.bodyText}</p> : null}
                {template.rejectedReason ? (
                  <p className="mt-2 text-sm font-bold text-[#9b2f12]">Rejected: {template.rejectedReason}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {PRESETS.map((preset) => (
        <section key={preset.name} className="rounded-[2rem] border border-[#102015]/10 bg-white/95 p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#102015]">{preset.name}</h2>
          <p className="mt-2 text-sm leading-6 text-[#587063]">{preset.usedFor}</p>
          <p className="mt-1 text-xs font-bold text-[#8a7d55]">Once approved, set env var {preset.envVar} to this template name.</p>

          <form action={submitWhatsAppTemplateAction} className="mt-4 grid gap-4">
            <input type="hidden" name="name" value={preset.name} />
            <input type="hidden" name="category" value={preset.category} />
            <input type="hidden" name="language" value="en_US" />

            {preset.category === "AUTHENTICATION" ? (
              <div className="rounded-2xl bg-[#f7f5ec] p-4 text-sm leading-6 text-[#405348]">
                <p className="font-black text-[#102015]">Meta controls the wording for Authentication templates.</p>
                <p className="mt-2">There is nothing to fill in. On approval this sends as:</p>
                <p className="mt-2 rounded-xl bg-white p-3 font-semibold text-[#102015]">
                  &ldquo;123456 is your verification code. For your security, do not share this code.&rdquo;
                  <br />
                  <span className="text-xs text-[#587063]">This code expires in 10 minutes. · [ Copy code ]</span>
                </p>
              </div>
            ) : (
              <>
                <label className="grid gap-2 text-sm font-black text-[#102015]">
                  Body text ({"{{1}}"}, {"{{2}}"}... are filled in per message)
                  <textarea
                    name="bodyText"
                    defaultValue={preset.bodyText}
                    rows={3}
                    className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-sm font-normal outline-none focus:border-[#1f7a3f]"
                  />
                </label>

                <label className="grid gap-2 text-sm font-black text-[#102015]">
                  Example value for each placeholder, one per line (required by Meta for review)
                  <textarea
                    name="bodyExamples"
                    defaultValue={preset.bodyExamples}
                    rows={Math.max(preset.bodyExamples.split("\n").length, 2)}
                    className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-sm font-normal outline-none focus:border-[#1f7a3f]"
                  />
                </label>
              </>
            )}

            <PendingSubmitButton
              label="Submit to Meta for review"
              pendingLabel="Submitting…"
              className="rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
            />
          </form>
        </section>
      ))}
    </AdminPageShell>
  );
}
