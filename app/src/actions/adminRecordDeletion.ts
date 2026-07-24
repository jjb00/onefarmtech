"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireCapability, requireStaffRole} from "@/lib/auth";
import {createAuditLog} from "@/lib/auditLog";
import {validatePermanentDeletionInput} from "@/lib/adminRecordDeletion.js";
import {prisma} from "@/lib/prisma";
import {verifyStaffPassword} from "@/lib/staffAuthorization";

const text = (formData: FormData, key: string) => String(formData.get(key) || "").trim();

export async function archiveAdminMessageAction(formData: FormData) {
  await requireCapability("manage_communications");
  const recordType = text(formData, "recordType");
  const recordId = text(formData, "recordId");
  if (!recordId || !["ContactEnquiry", "BuyerMessage"].includes(recordType)) redirect("/admin/buyer-messages?view=needs-reply&error=invalid-record");
  if (recordType === "ContactEnquiry") await prisma.contactEnquiry.update({where: {id: recordId}, data: {status: "Archived"}});
  else await prisma.buyerMessage.update({where: {id: recordId}, data: {status: "Archived"}});
  await createAuditLog({action: "Archived admin communication record", entityType: recordType, entityId: recordId, metadata: {recordType}});
  revalidatePath("/admin/buyer-messages");
  redirect("/admin/buyer-messages?view=needs-reply&archived=1");
}

export async function permanentlyDeleteAdminMessageAction(formData: FormData) {
  const staff = await requireStaffRole("Super admin");
  const recordType = text(formData, "recordType");
  const recordId = text(formData, "recordId");
  const reason = text(formData, "reason");
  const confirmation = text(formData, "confirmation");
  const password = text(formData, "password");
  const error = validatePermanentDeletionInput({recordType, recordId, reason, confirmation, password});
  if (error || !staff.email || !verifyStaffPassword(staff.email, password)) redirect(`/admin/buyer-messages?view=needs-reply&error=${error || "confirmation-failed"}`);

  await prisma.$transaction(async (tx) => {
    if (recordType === "ContactEnquiry") await tx.contactEnquiry.delete({where: {id: recordId}});
    else await tx.buyerMessage.delete({where: {id: recordId}});
    await tx.auditLog.create({data: {
      actorName: staff.name,
      actorEmail: staff.email,
      actorRole: staff.role,
      action: "Permanently deleted admin communication record",
      entityType: recordType,
      entityId: recordId,
      entityLabel: "Deleted communication record",
      metadata: JSON.stringify({actorId: staff.id, deletionReason: reason, deletedAt: new Date().toISOString()}),
    }});
  });
  revalidatePath("/admin/buyer-messages");
  revalidatePath("/admin/audit-log");
  redirect("/admin/buyer-messages?view=needs-reply&deleted=1");
}
