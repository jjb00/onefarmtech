import Link from "next/link";
import {communicationViewHref, communicationViewsForRole} from "@/lib/communicationsWorkspace.js";

const views = [
  ["all", "All activity"],
  ["whatsapp", "WhatsApp"],
  ["enquiries", "Unknown WhatsApp"],
  ["email", "Email delivery"],
  ["reconciliation", "Reconciliation"],
  ["operations", "Operational events"],
] as const;

export default function CommunicationsViewSwitcher({activeView, params, role}: {activeView: string; params: Record<string, unknown>; role: string}) {
  const allowed = communicationViewsForRole(role);
  return <nav aria-label="Inbox views" className="flex gap-2 overflow-x-auto border-b border-[#102015]/10 pb-3">
    {views.filter(([view]) => allowed.includes(view)).map(([view, label]) => <Link key={view} href={communicationViewHref(view, params)} aria-current={activeView === view ? "page" : undefined} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-black focus:outline-none focus:ring-2 focus:ring-[#1f7a3f] ${activeView === view ? "bg-[#102015] text-white" : "bg-white text-[#405348] hover:bg-[#f3f8ef]"}`}>{label}</Link>)}
  </nav>;
}
