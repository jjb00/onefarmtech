"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireCapability} from "@/lib/auth";
import {retryEmailDelivery} from "@/lib/email/service";
import {prisma} from "@/lib/prisma";
import {createAuditLog} from "@/lib/auditLog";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function retryFailedEmailAction(formData: FormData) {
  await requireCapability("manage_communications");
  const deliveryId = text(formData, "deliveryId");
  if (!deliveryId) redirect("/admin/buyer-messages?view=email&status=Failed&error=missing-email");
  const result = await retryEmailDelivery(deliveryId);
  revalidatePath("/admin/buyer-messages");
  redirect(`/admin/buyer-messages?view=email&status=Failed&retry=${encodeURIComponent(result.status.toLowerCase())}`);
}

export async function resolvePaymentIncidentAction(formData: FormData) {
  const staff = await requireCapability("manage_payments");
  const incidentId = text(formData, "incidentId");
  const status = text(formData, "status");
  const resolutionNote = text(formData, "resolutionNote");
  const allowed = ["Investigating", "Resolved as paid", "Resolved as unpaid", "Ignored as invalid/test"];
  if (!incidentId || !allowed.includes(status) || resolutionNote.length < 3) {
    redirect("/admin/buyer-messages?view=reconciliation&error=resolution-required");
  }
  const previous = await prisma.paymentReconciliationIncident.findUnique({where: {id: incidentId}});
  if (!previous) redirect("/admin/buyer-messages?view=reconciliation&error=incident-not-found");
  const resolved = await prisma.paymentReconciliationIncident.update({where: {id: incidentId}, data: {
    status,
    resolutionNote,
    resolvedByName: staff.name,
    resolvedByEmail: staff.email,
    resolvedAt: status === "Investigating" ? null : new Date(),
  }});
  await createAuditLog({action: "Updated payment reconciliation incident", entityType: "PaymentReconciliationIncident", entityId: resolved.id, entityLabel: resolved.internalReference || resolved.providerReference || resolved.id, previousValue: previous, newValue: resolved});
  revalidatePath("/admin/buyer-messages");
  revalidatePath("/admin/audit-log");
  redirect("/admin/buyer-messages?view=reconciliation&resolved=1");
}
