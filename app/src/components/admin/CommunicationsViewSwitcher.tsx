import Link from "next/link";
import {communicationViewHref} from "@/lib/communicationsWorkspace.js";

const views = [
  ["all", "All activity"],
  ["whatsapp", "WhatsApp"],
  ["enquiries", "Enquiries"],
  ["email", "Email delivery"],
  ["reconciliation", "Reconciliation"],
] as const;

export default function CommunicationsViewSwitcher({activeView, params}: {activeView: string; params: Record<string, unknown>}) {
  return <nav aria-label="Inbox views" className="flex gap-2 overflow-x-auto border-b border-[#102015]/10 pb-3">
    {views.map(([view, label]) => <Link key={view} href={communicationViewHref(view, params)} aria-current={activeView === view ? "page" : undefined} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-black focus:outline-none focus:ring-2 focus:ring-[#1f7a3f] ${activeView === view ? "bg-[#102015] text-white" : "bg-white text-[#405348] hover:bg-[#f3f8ef]"}`}>{label}</Link>)}
  </nav>;
}
