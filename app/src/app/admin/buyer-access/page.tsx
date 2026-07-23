import Link from "next/link";
import AdminPageShell from "@/components/AdminPageShell";
import {AdminCompactMetric, AdminStatusPill, maskSecret} from "@/components/admin/AdminViewControls";
import {prisma} from "@/lib/prisma";
import {
  createBuyerAccountInviteAction,
  createBuyerContactAction,
  sendBuyerAccountInviteAction,
  updateBuyerAccountInviteStatusAction,
} from "@/actions/createAdminRecords";
import PendingSubmitButton from "@/components/admin/PendingSubmitButton";
import {buyerPhoneCountryOptions} from "@/lib/phoneNumbers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const buyerContactRoles = [
  "Owner / director",
  "Procurement lead",
  "Finance contact",
  "Kitchen manager",
  "Store manager",
  "Buyer user",
];

function buyerLoginState(customer: {
  status: string;
  accountLoginReady: boolean;
}) {
  if (customer.status !== "Active") return "Inactive for login";
  return customer.accountLoginReady ? "Approved for login" : "Pending login approval";
}

export default async function BuyerAccessPage({
  searchParams,
}: {
  searchParams?: Promise<{
    delivery?: string;
    detail?: string;
  }>;
}) {
  const params = await searchParams;
  const delivery = params?.delivery || "";
  const detail = params?.detail || "";

  const deliveryMessages: Record<string, {tone: "success" | "error"; text: string}> = {
    "email-accepted": {
      tone: "success",
      text: "The buyer access email was accepted for delivery.",
    },
    "email-duplicate": {
      tone: "success",
      text: "This buyer access email was already sent.",
    },
    "email-skipped": {
      tone: "success",
      text: "The buyer access email was recorded without external delivery.",
    },
    "whatsapp-accepted": {
      tone: "success",
      text: "Meta accepted the buyer access WhatsApp message.",
    },
    "missing-email": {
      tone: "error",
      text: "This access record has no email address.",
    },
    "missing-phone": {
      tone: "error",
      text: "This access record has no WhatsApp phone number.",
    },
    "email-failed": {
      tone: "error",
      text: detail || "The buyer access email could not be sent.",
    },
    "whatsapp-failed": {
      tone: "error",
      text: detail || "The buyer access WhatsApp message could not be sent.",
    },
    "whatsapp-recipient": {
      tone: "error",
      text: detail || "The WhatsApp phone number is invalid.",
    },
    cancelled: {
      tone: "error",
      text: "Cancelled access codes cannot be sent.",
    },
    "not-found": {
      tone: "error",
      text: "The buyer access record could not be found.",
    },
    invalid: {
      tone: "error",
      text: "Choose a valid access record and delivery channel.",
    },
  };

  const deliveryMessage = deliveryMessages[delivery];

  const [customers, contacts, invites, buyerEmailDeliveries] = await Promise.all([
    prisma.customer.findMany({
      orderBy: {createdAt: "desc"},
      select: {
        id: true,
        name: true,
        buyerType: true,
        phone: true,
        email: true,
        status: true,
        accountStatus: true,
        accountLoginReady: true,
      },
    }),
    prisma.buyerContact.findMany({
      orderBy: {createdAt: "desc"},
      include: {customer: true},
      take: 100,
    }),
    prisma.buyerAccountInvite.findMany({
      orderBy: {createdAt: "desc"},
      include: {customer: true},
      take: 100,
    }),
    prisma.emailDelivery.findMany({
      where: {
        template: {in: ["buyer-login-otp", "buyer-invite"]},
      },
      select: {recipient: true, status: true},
      orderBy: {updatedAt: "desc"},
      take: 300,
    }),
  ]);
  const latestEmailStatusByRecipient = new Map<string, string>();
  for (const delivery of buyerEmailDeliveries) {
    const recipient = delivery.recipient.toLowerCase();
    if (!latestEmailStatusByRecipient.has(recipient)) {
      latestEmailStatusByRecipient.set(recipient, delivery.status);
    }
  }
  const failedEmailByRecipient = new Map(
    [...latestEmailStatusByRecipient].filter(([, status]) =>
      ["Bounced", "Complained"].includes(status),
    ),
  );

  return (
    <AdminPageShell
      title="Buyer access"
      description="Approve the buyer, keep an active authorised contact with a correct email, and assign portal permissions. Email OTP is the recommended login."
      actionHref="/admin/customers?view=access"
      actionLabel="Open Buyers workspace"
    >
      <div className="grid gap-6">
      {deliveryMessage ? (
        <div
          role="status"
          className={`rounded-2xl border px-5 py-4 text-sm font-bold ${
            deliveryMessage.tone === "success"
              ? "border-[#1f7a3f]/20 bg-[#eef8f0] text-[#155c2f]"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {deliveryMessage.text}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <AdminCompactMetric label="Buyer contacts" value={String(contacts.length)} tone="blue" />
        <AdminCompactMetric label="Access codes" value={String(invites.length)} tone="amber" />
        <AdminCompactMetric
          label="Login-ready buyers"
          value={String(customers.filter((customer) => customer.accountLoginReady).length)}
          tone="green"
        />
        <AdminCompactMetric
          label="Approved accounts"
          value={String(customers.filter((customer) => customer.status === "Active" && customer.accountLoginReady).length)}
          tone="green"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <details className="rounded-2xl border border-[#102015]/10 bg-white p-4 shadow-sm">
          <summary className="cursor-pointer list-none">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black text-[#102015]">Add authorised contact</h2>
              <span className="rounded-full bg-[#f3f8ef] px-4 py-2 text-sm font-black text-[#1f7a3f]">Open</span>
            </div>
          </summary>
        <form action={createBuyerContactAction} className="mt-5">
          <h2 className="text-2xl font-black text-[#102015]">Add authorised buyer contact</h2>
          <p className="mt-2 text-sm leading-7 text-[#405348]">
            Use this for restaurant owners, procurement leads, finance contacts,
            store managers, or authorised staff who will eventually access the buyer portal.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold md:col-span-2">
              Buyer account
              <select
                name="customerId"
                required
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-[#102015] font-normal outline-none focus:border-[#1f7a3f]"
              >
                <option value="">Select buyer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} · {customer.buyerType} · {buyerLoginState(customer)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Contact name
              <input
                name="name"
                required
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-[#102015] font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="e.g. Procurement lead"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Role
              <select
                name="role"
                defaultValue="Buyer user"
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-[#102015] font-normal outline-none focus:border-[#1f7a3f]"
              >
                {buyerContactRoles.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Email
              <input
                name="email"
                type="email"
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-[#102015] font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="optional"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Phone country
              <select name="phoneCountryCode" defaultValue="234" className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 font-normal">
                {buyerPhoneCountryOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Phone number
              <input
                name="phone"
                inputMode="tel"
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-[#102015] font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="0801 234 5678"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Status
              <select
                name="status"
                defaultValue="Active"
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-[#102015] font-normal outline-none focus:border-[#1f7a3f]"
              >
                <option>Active</option>
                <option>Pending verification</option>
                <option>Paused</option>
              </select>
            </label>

            <div className="grid gap-3 rounded-2xl bg-[#f3f8ef] p-4 md:col-span-2">
              <label className="flex items-center gap-3 text-sm font-semibold">
                <input name="canPlaceOrders" type="checkbox" defaultChecked />
                Can place orders
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold">
                <input name="canViewReceipts" type="checkbox" defaultChecked />
                Can view receipts
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold">
                <input name="canViewCredit" type="checkbox" />
                Can view credit/balance
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white"
          >
            Save buyer contact
          </button>
        </form>
        </details>

        <details className="rounded-2xl border border-[#102015]/10 bg-white p-4 shadow-sm">
          <summary className="cursor-pointer list-none">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black text-[#102015]">Legacy access-code fallback</h2>
              <span className="rounded-full bg-[#f3f8ef] px-4 py-2 text-sm font-black text-[#1f7a3f]">Open</span>
            </div>
          </summary>
        <form action={createBuyerAccountInviteAction} className="mt-5">
          <h2 className="text-2xl font-black text-[#102015]">Generate legacy buyer access code</h2>
          <p className="mt-2 text-sm leading-7 text-[#405348]">
            Email OTP is the recommended login method. Generate a permanent code only as a temporary legacy fallback for an existing buyer.
          </p>
          <div className="mt-4 rounded-2xl bg-[#f7f5ec] p-4 text-sm leading-7 text-[#405348]">
            Email is attempted when the code is generated. You can also send or retry email and WhatsApp delivery from the access-code list below.
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold md:col-span-2">
              Buyer account
              <select
                name="customerId"
                required
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-[#102015] font-normal outline-none focus:border-[#1f7a3f]"
              >
                <option value="">Select buyer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} · {customer.buyerType} · {buyerLoginState(customer)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Buyer login email
              <input
                name="email"
                type="email"
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-[#102015] font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="optional"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Phone country
              <select name="phoneCountryCode" defaultValue="234" className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 font-normal">
                {buyerPhoneCountryOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Buyer login phone
              <input
                name="phone"
                inputMode="tel"
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-[#102015] font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="0801 234 5678"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Buyer login role
              <select
                name="role"
                defaultValue="Buyer user"
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-[#102015] font-normal outline-none focus:border-[#1f7a3f]"
              >
                {buyerContactRoles.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Access status
              <select
                name="status"
                defaultValue="Ready to send"
                className="rounded-xl border border-[#102015]/10 bg-white px-4 py-3 text-[#102015] font-normal outline-none focus:border-[#1f7a3f]"
              >
                <option>Draft</option>
                <option>Ready to send</option>
                <option>Sent manually</option>
                <option>Accepted later</option>
                <option>Cancelled</option>
              </select>
            </label>
          </div>

          <PendingSubmitButton
            label="Generate access code"
            pendingLabel="Generating…"
            className="mt-6 rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white"
          />
        </form>
        </details>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-[#102015]">Authorised contacts</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-[1000px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#102015]/10 text-xs uppercase tracking-[0.18em] text-[#587063]">
                <th className="py-3 pr-4">Contact</th>
                <th className="py-3 pr-4">Buyer</th>
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 pr-4">Access</th>
                <th className="py-3 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-b border-[#102015]/10">
                  <td className="py-4 pr-4">
                    <div className="font-black">{contact.name}</div>
                    <div className="text-xs text-[#587063]">
                      {contact.email || "No email"} · {contact.phone || "No phone"}
                    </div>
                    {contact.email && failedEmailByRecipient.has(contact.email.toLowerCase()) ? (
                      <div className="mt-1 text-xs font-black text-red-700">
                        Email {failedEmailByRecipient.get(contact.email.toLowerCase())?.toLowerCase()}: correct the address before retrying.
                      </div>
                    ) : null}
                  </td>
                  <td className="py-4 pr-4">
                    <Link
                      href={`/admin/customers/${contact.customerId}`}
                      className="font-bold text-[#1f7a3f] underline-offset-4 hover:underline"
                    >
                      {contact.customer.name}
                    </Link>
                  </td>
                  <td className="py-4 pr-4">{contact.role}</td>
                  <td className="py-4 pr-4">
                    <div className="flex flex-wrap gap-2">
                      {contact.canPlaceOrders ? <Pill label="Orders" /> : null}
                      {contact.canViewReceipts ? <Pill label="Receipts" /> : null}
                      {contact.canViewCredit ? <Pill label="Credit" /> : null}
                    </div>
                  </td>
                  <td className="py-4 pr-4">{contact.status}</td>
                </tr>
              ))}

              {!contacts.length ? (
                <tr>
                  <td className="py-8 text-center text-[#587063]" colSpan={5}>
                    No authorised buyer contacts yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-[#102015]">Legacy access codes</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-[#f7f5ec] text-xs uppercase tracking-[0.14em] text-[#405348]">
              <tr>
                <th className="px-4 py-3">Buyer</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Send to</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Delivery</th>
              </tr>
            </thead>
            <tbody>
          {invites.map((invite) => {
            const buyerName = invite.customer.name;
            const contactTarget = invite.email || invite.phone || "buyer";
            const shareMessage = `Hello ${buyerName}, your OneFarmTech buyer account has been approved. Use this access code to sign in: ${invite.inviteCode}. If you need help, contact the OneFarmTech team.`;

            const canReveal = ["Draft", "Ready to send"].includes(invite.status);

            return (
              <tr key={invite.id} className="border-b border-[#102015]/10 align-top">
                <td className="px-4 py-3 font-black text-[#102015]">{buyerName}</td>
                <td className="px-4 py-3 font-mono font-black text-[#102015]">
                  {canReveal ? invite.inviteCode : maskSecret(invite.inviteCode)}
                </td>
                <td className="px-4 py-3 text-[#405348]">{contactTarget}</td>
                <td className="px-4 py-3 text-[#405348]">{invite.role}</td>
                <td className="px-4 py-3">
                  <div className="grid gap-2">
                    <AdminStatusPill>{invite.status}</AdminStatusPill>
                    <form action={updateBuyerAccountInviteStatusAction} className="flex flex-wrap gap-2">
                      <input type="hidden" name="id" value={invite.id} />
                      <select
                        name="status"
                        defaultValue={invite.status}
                        className="rounded-xl border border-[#102015]/15 bg-white px-3 py-2 text-xs font-bold text-[#102015]"
                      >
                        <option>Draft</option>
                        <option>Ready to send</option>
                        <option>Sent manually</option>
                        <option>Accepted later</option>
                        <option>Cancelled</option>
                      </select>
                      <PendingSubmitButton
                        label="Save"
                        pendingLabel="Saving…"
                        className="rounded-full border border-[#102015]/15 bg-white px-3 py-2 text-xs font-black text-[#102015]"
                      />
                    </form>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="grid gap-2">
                    {invite.email ? (
                      <form action={sendBuyerAccountInviteAction}>
                        <input type="hidden" name="inviteId" value={invite.id} />
                        <input type="hidden" name="channel" value="email" />
                        <PendingSubmitButton
                          label="Send email"
                          pendingLabel="Sending email…"
                          disabled={invite.status === "Cancelled"}
                          className="w-full rounded-full border border-[#1f7a3f]/20 bg-white px-3 py-2 text-xs font-black text-[#1f7a3f] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </form>
                    ) : null}

                    {invite.phone ? (
                      <form action={sendBuyerAccountInviteAction}>
                        <input type="hidden" name="inviteId" value={invite.id} />
                        <input type="hidden" name="channel" value="whatsapp" />
                        <PendingSubmitButton
                          label="Send WhatsApp"
                          pendingLabel="Sending WhatsApp…"
                          disabled={invite.status === "Cancelled"}
                          className="w-full rounded-full bg-[#1f7a3f] px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </form>
                    ) : null}

                    {canReveal ? (
                      <details className="rounded-xl border border-[#102015]/10 bg-[#fbfff8] p-3">
                        <summary className="cursor-pointer text-xs font-black text-[#1f7a3f]">
                          Copy manually
                        </summary>
                        <p className="mt-2 text-sm leading-6 text-[#405348]">
                          {shareMessage}
                        </p>
                      </details>
                    ) : (
                      <span className="text-xs font-bold text-[#587063]">
                        Code hidden after issue. Regenerate if needed.
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}

              {!invites.length ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[#587063]" colSpan={6}>
                    No access codes generated yet.
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
    <div className="rounded-[1.5rem] bg-white p-5 text-[#102015] shadow-sm">
      <p className="text-2xl font-black text-[#1f7a3f]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[#405348]">{label}</p>
    </div>
  );
}

function Pill({label}: {label: string}) {
  return (
    <span className="rounded-full bg-[#3E7A4C]/10 px-3 py-1 text-xs font-bold text-[#3E7A4C]">
      {label}
    </span>
  );
}
