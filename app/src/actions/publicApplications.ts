"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {protectPublicIntake, PublicIntakeError} from "@/lib/publicIntakeProtection";
import {getEmailBaseUrl, sendAdminTransactionalEmail, sendTransactionalEmail} from "@/lib/email/service";
import {emailTemplates} from "@/lib/email/templates";
import {requireAnyCapability} from "@/lib/auth";
import {createAuditLog} from "@/lib/auditLog";

const text = (data: FormData, key: string) => String(data.get(key) || "").trim();
const intakeError = (error: unknown) => error instanceof PublicIntakeError ? error.code : "bot-check";

export async function createCareerApplicationAction(formData: FormData) {
  const values = {
    name: text(formData, "name"), email: text(formData, "email"), phone: text(formData, "phone"),
    location: text(formData, "location"), role: text(formData, "role"), experience: text(formData, "experience"),
    consent: formData.get("consent") === "on",
  };
  if (!values.name || !values.email || !values.phone || !values.location || !values.role || !values.experience || !values.consent) {
    redirect(`/careers?apply=1&role=${encodeURIComponent(values.role)}&error=validation`);
  }
  try {
    await protectPublicIntake({formType: "career", action: "career_application", token: text(formData, "cf-turnstile-response"), honeypot: text(formData, "website"), values: Object.values(values)});
  } catch (error) {
    redirect(`/careers?apply=1&role=${encodeURIComponent(values.role)}&error=${intakeError(error)}`);
  }
  const application = await prisma.careerApplication.create({data: {...values, source: "Careers page"}});
  await sendTransactionalEmail({deduplicationKey: `career-ack:${application.id}`, template: "career-acknowledgement", to: application.email, content: emailTemplates.careerAcknowledgement(application.name, application.role), relatedType: "CareerApplication", relatedId: application.id});
  await sendAdminTransactionalEmail({deduplicationKeyPrefix: `career-admin:${application.id}`, template: "career-admin", content: emailTemplates.careerAdmin(application.name, application.role, application.location, getEmailBaseUrl()), relatedType: "CareerApplication", relatedId: application.id});
  revalidatePath("/admin/career-applications");
  redirect(`/careers?apply=1&role=${encodeURIComponent(values.role)}&submitted=1`);
}

export async function createSupplierEnquiryAction(formData: FormData) {
  const business = text(formData, "businessName"), name = text(formData, "contactName"), phone = text(formData, "phone"), email = text(formData, "email"), location = text(formData, "location"), products = text(formData, "products"), capacity = text(formData, "capacity"), relationship = text(formData, "relationshipType");
  if (!business || !name || !phone || !location || !products || !relationship) redirect("/supplier-partners?error=validation");
  try {
    await protectPublicIntake({formType: "supplier", action: "supplier_enquiry", token: text(formData, "cf-turnstile-response"), honeypot: text(formData, "website"), values: [business, name, phone, email, location, products, capacity, relationship]});
  } catch (error) { redirect(`/supplier-partners?error=${intakeError(error)}`); }
  const message = [`Location: ${location}`, `Products supplied: ${products}`, `Capacity / note: ${capacity || "Not provided"}`, `Relationship type: ${relationship}`].join("\n");
  const enquiry = await prisma.contactEnquiry.create({data: {name, organisation: business, email: email || null, phone, enquiryType: "Supplier / partner enquiry", message, source: "Supplier partners page"}});
  if (email) await sendTransactionalEmail({deduplicationKey: `supplier-ack:${enquiry.id}`, template: "supplier-acknowledgement", to: email, content: emailTemplates.supplierAcknowledgement(name), relatedType: "ContactEnquiry", relatedId: enquiry.id});
  await sendAdminTransactionalEmail({deduplicationKeyPrefix: `supplier-admin:${enquiry.id}`, template: "supplier-admin", content: emailTemplates.supplierAdmin(business, relationship, getEmailBaseUrl()), relatedType: "ContactEnquiry", relatedId: enquiry.id});
  revalidatePath("/admin/contact-enquiries");
  redirect("/supplier-partners?submitted=1");
}

export async function updateCareerApplicationAction(formData: FormData) {
  await requireAnyCapability("manage_staff", "manage_support");
  const id = text(formData, "id"), status = text(formData, "status"), adminNote = text(formData, "adminNote");
  const allowed = ["New", "Reviewing", "Shortlisted", "Interview", "Rejected", "Hired", "Archived"];
  if (!id || !allowed.includes(status)) redirect("/admin/career-applications?error=validation");
  const previous = await prisma.careerApplication.findUnique({where: {id}});
  if (!previous) redirect("/admin/career-applications?error=not-found");
  const updated = await prisma.careerApplication.update({where: {id}, data: {status, adminNote: adminNote || null}});
  await createAuditLog({action: "Updated career application", entityType: "CareerApplication", entityId: id, entityLabel: updated.email, previousValue: previous, newValue: updated});
  revalidatePath("/admin/career-applications"); revalidatePath(`/admin/career-applications/${id}`);
  redirect(`/admin/career-applications/${id}?success=updated`);
}
