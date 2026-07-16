import {redirect} from "next/navigation";
import AdminPageShell from "@/components/AdminPageShell";
import BuyersViewSwitcher from "@/components/admin/BuyersViewSwitcher";
import BuyersList from "@/components/admin/BuyersList";
import BuyerAccountRequestsPage from "@/app/admin/buyer-account-requests/page";
import BuyerAccessList from "@/components/admin/BuyerAccessList";
import BuyerUpdateRequestsList from "@/components/admin/BuyerUpdateRequestsList";
import GuestBuyersPage from "@/app/admin/guest-buyers/page";
import {createCustomerAction} from "@/actions/createAdminRecords";
import {buyerTypes} from "@/constants/orderOptions";
import {requireStaff} from "@/lib/auth";
import {resolveBuyerView, resolveBuyerViewForRole} from "@/lib/buyersWorkspace.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Params = Record<string, string | string[] | undefined>;
const text = (raw: string | string[] | undefined) => String(Array.isArray(raw) ? raw[0] : raw || "").trim();

export default async function CustomersPage({searchParams}: {searchParams?: Promise<Params>}) {
  const staff = await requireStaff(), raw = await searchParams, requested = text(raw?.view), normalized = resolveBuyerView(requested), view = resolveBuyerViewForRole(requested, staff.role);
  if (!view) redirect("/admin?access=denied&blocked=/admin/customers");
  if ((requested && requested !== normalized) || normalized !== view) redirect(`/admin/customers?view=${view}`);
  const params = {q: text(raw?.q), status: text(raw?.status), type: text(raw?.type), readiness: text(raw?.readiness), pageSize: text(raw?.pageSize)};
  return <AdminPageShell title="Buyers" description="Buyer master records, applications, access and account update workflows." compactHeader>
    <div className="grid gap-5"><BuyersViewSwitcher activeView={view} role={staff.role} params={params}/>
      {view === "all" ? <CreateBuyerForm /> : null}
      {view === "all" ? <BuyersList raw={raw || {}}/> : null}
      {view === "guests" ? <GuestBuyersPage searchParams={Promise.resolve(raw || {})} embedded/> : null}
      {view === "applications" ? <BuyerAccountRequestsPage searchParams={Promise.resolve(raw || {})} embedded/> : null}
      {view === "access" ? <BuyerAccessList raw={raw || {}}/> : null}
      {view === "updates" ? <BuyerUpdateRequestsList raw={raw || {}} pathname="/admin/customers" hiddenParams={{view: "updates"}}/> : null}
    </div>
  </AdminPageShell>;
}

function CreateBuyerForm() {
  return <details className="rounded-2xl border border-[#102015]/10 bg-white p-4 shadow-sm">
    <summary className="cursor-pointer list-none font-black">Create buyer</summary>
    <form action={createCustomerAction} className="mt-5 grid gap-4 md:grid-cols-2">
      <Field label="Buyer name"><input name="name" required className="rounded-xl border px-4 py-3 font-normal" /></Field>
      <Field label="Phone"><input name="phone" required className="rounded-xl border px-4 py-3 font-normal" placeholder="+234..." /></Field>
      <Field label="Email"><input name="email" type="email" className="rounded-xl border px-4 py-3 font-normal" /></Field>
      <Field label="Receipt email"><input name="receiptEmail" type="email" className="rounded-xl border px-4 py-3 font-normal" /></Field>
      <Field label="Buyer type"><select name="buyerType" defaultValue="Restaurant" className="rounded-xl border px-4 py-3 font-normal">{buyerTypes.map((type) => <option key={type}>{type}</option>)}</select></Field>
      <Field label="Location"><input name="location" className="rounded-xl border px-4 py-3 font-normal" /></Field>
      <Field label="Credit limit"><input name="creditLimit" type="number" min="0" defaultValue="0" className="rounded-xl border px-4 py-3 font-normal" /></Field>
      <Field label="Outstanding balance"><input name="outstandingBalance" type="number" min="0" defaultValue="0" className="rounded-xl border px-4 py-3 font-normal" /></Field>
      <Field label="Account status"><select name="accountStatus" defaultValue="Manual WhatsApp" className="rounded-xl border px-4 py-3 font-normal"><option>Manual WhatsApp</option><option>Approved recurring buyer</option><option>Credit review</option><option>Account login pending</option><option>Account login ready</option><option>Paused</option></select></Field>
      <Field label="Status"><select name="status" defaultValue="Active" className="rounded-xl border px-4 py-3 font-normal"><option>Active</option><option>Needs review</option><option>Paused</option></select></Field>
      <Field label="Payment terms" wide><input name="paymentTerms" defaultValue="Full payment before order allocation" className="rounded-xl border px-4 py-3 font-normal" /></Field>
      <label className="flex items-center gap-3 rounded-xl bg-[#f7f5ec] px-4 py-3 text-sm font-semibold md:col-span-2"><input name="accountLoginReady" type="checkbox" /> Mark buyer as login-ready</label>
      <button type="submit" className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white md:col-span-2 md:justify-self-start">Save buyer</button>
    </form>
  </details>;
}

function Field({label, wide, children}: {label: string; wide?: boolean; children: React.ReactNode}) {
  return <label className={`grid gap-2 text-sm font-semibold${wide ? " md:col-span-2" : ""}`}>{label}{children}</label>;
}
