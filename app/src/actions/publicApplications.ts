"use server";

import crypto from "node:crypto";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {
  getOperationalEmailRecipients,
  sendTransactionalEmail,
  type EmailAttachment,
} from "@/lib/email/service";
import {emailTemplates} from "@/lib/email/templates";
import {protectPublicIntake} from "@/lib/publicIntakeProtection";
import {requireAnyCapability} from "@/lib/auth";
import {createAuditLog} from "@/lib/auditLog";
import {prisma} from "@/lib/prisma";

const MAX_CV_BYTES = 5 * 1024 * 1024;
const ALLOWED_CV_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function safeFilename(value: string) {
  return value
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

async function readCv(formData: FormData): Promise<EmailAttachment> {
  const value = formData.get("cv");

  if (!(value instanceof File) || value.size === 0) {
    throw new Error("Please attach your CV.");
  }

  if (value.size > MAX_CV_BYTES) {
    throw new Error("Your CV must be 5MB or smaller.");
  }

  if (!ALLOWED_CV_TYPES.has(value.type)) {
    throw new Error("Upload your CV as a PDF, DOC or DOCX file.");
  }

  const buffer = Buffer.from(await value.arrayBuffer());

  return {
    filename: safeFilename(value.name || "candidate-cv.pdf"),
    content: buffer.toString("base64"),
    contentType: value.type,
  };
}

async function sendToGroup(input: {
  group: "careers" | "contact" | "supplier";
  deduplicationPrefix: string;
  template: string;
  content: ReturnType<typeof emailTemplates.careerAdmin>;
  attachments?: EmailAttachment[];
}) {
  const recipients = getOperationalEmailRecipients(input.group);

  if (!recipients.length) {
    throw new Error(`No ${input.group} email recipient is configured.`);
  }

  await Promise.all(
    recipients.map((recipient) =>
      sendTransactionalEmail({
        deduplicationKey: `${input.deduplicationPrefix}:${recipient}`,
        template: input.template,
        to: recipient,
        content: input.content,
        attachments: input.attachments,
      }),
    ),
  );
}

export async function submitCareerApplicationAction(formData: FormData) {
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const phone = text(formData, "phone");
  const location = text(formData, "location");
  const role = text(formData, "role");
  const experience = text(formData, "experience");
  const consent = formData.get("consent") === "on";

  await protectPublicIntake({
    formType: "career",
    action: "career_application",
    token: text(formData, "cf-turnstile-response"),
    honeypot: text(formData, "website"),
    values: [name, email, phone, location, role, experience],
  });

  if (!name || !email || !phone || !location || !role || !experience || !consent) {
    throw new Error("Complete all required application fields.");
  }

  const cv = await readCv(formData);
  const submissionId = crypto.randomUUID();

  const applicantResult = await sendTransactionalEmail({
    deduplicationKey: `career-ack:${submissionId}:${email}`,
    template: "career-acknowledgement",
    to: email,
    content: emailTemplates.careerAcknowledgement(name, role),
  });

  if (!applicantResult.ok) {
    throw new Error("We could not confirm your application. Please try again.");
  }

  await sendToGroup({
    group: "careers",
    deduplicationPrefix: `career-admin:${submissionId}`,
    template: "career-admin",
    content: emailTemplates.careerAdminEmail({
      name,
      email,
      phone,
      location,
      role,
      experience,
    }),
    attachments: [cv],
  });

  redirect("/careers?applied=1");
}

export async function submitSupplierEnquiryAction(formData: FormData) {
  const business =
    text(formData, "businessName") || text(formData, "business");
  const name =
    text(formData, "contactName") || text(formData, "name");
  const phone = text(formData, "phone");
  const email = text(formData, "email").toLowerCase();
  const location = text(formData, "location");
  const products = text(formData, "products");
  const capacity = text(formData, "capacity");
  const relationship =
    text(formData, "relationshipType") || text(formData, "relationship");

  await protectPublicIntake({
    formType: "supplier",
    action: "supplier_enquiry",
    token: text(formData, "cf-turnstile-response"),
    honeypot: text(formData, "website"),
    values: [
      business,
      name,
      phone,
      email,
      location,
      products,
      capacity,
      relationship,
    ],
  });

  if (!business || !name || !phone || !location || !products) {
    throw new Error("Complete the required supplier enquiry fields.");
  }

  const submissionId = crypto.randomUUID();

  if (email) {
    await sendTransactionalEmail({
      deduplicationKey: `supplier-ack:${submissionId}:${email}`,
      template: "supplier-acknowledgement",
      to: email,
      content: emailTemplates.supplierAcknowledgement(name),
    });
  }

  await sendToGroup({
    group: "supplier",
    deduplicationPrefix: `supplier-admin:${submissionId}`,
    template: "supplier-admin",
    content: emailTemplates.supplierAdminEmail({
      business,
      name,
      phone,
      email,
      location,
      products,
      capacity,
      relationship,
    }),
  });

  redirect("/supplier-partners?submitted=1");
}

/**
 * Compatibility exports retained while existing forms and dormant admin
 * routes are migrated away from database-backed public intake.
 */
export async function createCareerApplicationAction(formData: FormData) {
  return submitCareerApplicationAction(formData);
}

export async function createSupplierEnquiryAction(formData: FormData) {
  return submitSupplierEnquiryAction(formData);
}

export async function updateCareerApplicationAction(formData: FormData) {
  await requireAnyCapability("manage_staff", "manage_support");

  const id = text(formData, "id");
  const status = text(formData, "status");
  const adminNote = text(formData, "adminNote");

  const allowed = [
    "New",
    "Reviewing",
    "Shortlisted",
    "Interview",
    "Rejected",
    "Hired",
    "Archived",
  ];

  if (!id || !allowed.includes(status)) {
    redirect("/admin/career-applications?error=validation");
  }

  const previous = await prisma.careerApplication.findUnique({
    where: {id},
  });

  if (!previous) {
    redirect("/admin/career-applications?error=not-found");
  }

  const updated = await prisma.careerApplication.update({
    where: {id},
    data: {
      status,
      adminNote: adminNote || null,
    },
  });

  await createAuditLog({
    action: "Updated career application",
    entityType: "CareerApplication",
    entityId: id,
    entityLabel: updated.email,
    previousValue: previous,
    newValue: updated,
  });

  revalidatePath("/admin/career-applications");
  revalidatePath(`/admin/career-applications/${id}`);

  redirect(`/admin/career-applications/${id}?success=updated`);
}
