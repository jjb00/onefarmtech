import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";
import {archiveAdminMessageAction, permanentlyDeleteAdminMessageAction} from "@/actions/adminRecordDeletion";

export default function AdminRecordControls({recordType, recordId, canDelete}: {recordType: "ContactEnquiry" | "BuyerMessage"; recordId: string; canDelete: boolean}) {
  return <div className="mt-3 grid gap-2">
    <form action={archiveAdminMessageAction}>
      <input type="hidden" name="recordType" value={recordType}/><input type="hidden" name="recordId" value={recordId}/>
      <ConfirmSubmitButton label="Archive" pendingLabel="Archiving…" confirmMessage="Archive this record?" className="rounded-lg border px-3 py-2 text-xs font-black"/>
    </form>
    {canDelete ? <details className="rounded-xl border border-[#9b2f12]/20 bg-[#fff4ef] p-3"><summary className="cursor-pointer text-xs font-black text-[#9b2f12]">Delete permanently</summary>
      <form action={permanentlyDeleteAdminMessageAction} className="mt-3 grid gap-2">
        <input type="hidden" name="recordType" value={recordType}/><input type="hidden" name="recordId" value={recordId}/>
        <label className="grid gap-1 text-xs font-bold">Deletion reason<input name="reason" required minLength={10} className="rounded-lg border px-3 py-2" /></label>
        <label className="grid gap-1 text-xs font-bold">Type DELETE<input name="confirmation" required pattern="DELETE" autoComplete="off" className="rounded-lg border px-3 py-2" /></label>
        <label className="grid gap-1 text-xs font-bold">Confirm your password<input name="password" type="password" required autoComplete="current-password" className="rounded-lg border px-3 py-2" /></label>
        <ConfirmSubmitButton label="Delete permanently" pendingLabel="Deleting…" confirmMessage="Final confirmation: permanently delete this record? This cannot be undone." className="rounded-lg bg-[#9b2f12] px-3 py-2 text-xs font-black text-white"/>
      </form>
    </details> : null}
  </div>;
}
