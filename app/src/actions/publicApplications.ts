"use server";

import crypto from "node:crypto";
import {redirect} from "next/navigation";
import {
  getOperationalEmailRecipients,
  sendTransactionalEmail,
  type EmailAttachment,
  type OperationalEmailGroup,
} from "@/lib/email/service";
import {emailTemplates} from "@/lib/email/templates";
import {careerPath, careerRoleByTitle} from "@/lib/careers";
import {protectPublicIntake, PublicIntakeError} from "@/lib/publicIntakeProtection";
import {prisma} from "@/lib/prisma";
import {requireCapability} from "@/lib/auth";
import * as Sentry from "@sentry/nextjs";

class CvError extends Error {
  constructor(public code: "missing-cv" | "cv-too-large" | "cv-invalid-type") {
    super(code);
  }
}

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
    throw new CvError("missing-cv");
  }

  if (value.size > MAX_CV_BYTES) {
    throw new CvError("cv-too-large");
  }

  if (!ALLOWED_CV_TYPES.has(value.type)) {
    throw new CvError("cv-invalid-type");
  }

  const buffer = Buffer.from(await value.arrayBuffer());

  return {
    filename: safeFilename(value.name || "candidate-cv.pdf"),
    content: buffer.toString("base64"),
    contentType: value.type,
  };
}

async function sendToGroup(input: {
  group: OperationalEmailGroup;
  deduplicationPrefix: string;
  template: string;
  content: ReturnType<typeof emailTemplates.careerAdminEmail>;
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
  const publishedRole = careerRoleByTitle(role);
  const reopen = publishedRole
    ? `${careerPath(publishedRole)}?apply=1`
    : `/careers?apply=1&role=${encodeURIComponent(role)}`;

  try {
    await protectPublicIntake({
      formType: "career",
      action: "career_application",
      token: text(formData, "cf-turnstile-response"),
      honeypot: text(formData, "website"),
      values: [name, email, phone, location, role, experience],
    });
  } catch (err) {
    const code = err instanceof PublicIntakeError ? err.code : "bot-check";
    redirect(`${reopen}&error=${encodeURIComponent(code)}`);
  }

  if (!name || !email || !phone || !location || !publishedRole || !experience || !consent) {
    redirect(`${reopen}&error=validation`);
  }

  let cv: EmailAttachment;
  try {
    cv = await readCv(formData);
  } catch (err) {
    const code = err instanceof CvError ? err.code : "missing-cv";
    redirect(`${reopen}&error=${encodeURIComponent(code)}`);
  }

  const submissionId = crypto.randomUUID();

  // Persisting is what actually protects an inbound application -- the
  // acknowledgement and internal-notification emails below are best-effort
  // on top of it, not the source of truth. An email provider hiccup used to
  // mean the whole application vanished with no record anywhere; now the
  // applicant's details are safe in the database regardless of what happens
  // to either email.
  await prisma.careerApplication.create({
    data: {name, email, phone, location, role, experience, consent},
  });

  try {
    const applicantResult = await sendTransactionalEmail({
      deduplicationKey: `career-ack:${submissionId}:${email}`,
      template: "career-acknowledgement",
      to: email,
      content: emailTemplates.careerAcknowledgement(name, role),
    });
    if (!applicantResult.ok) {
      Sentry.captureMessage("career-application-acknowledgement-email-failed", {extra: {email, role}});
    }
  } catch (error) {
    Sentry.captureException(error, {tags: {component: "career-application-acknowledgement-email"}, extra: {email, role}});
  }

  try {
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
  } catch (error) {
    Sentry.captureException(error, {tags: {component: "career-application-admin-notification"}, extra: {email, role}});
  }

  redirect(`${reopen}&submitted=1`);
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

  try {
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
  } catch (err) {
    const code = err instanceof PublicIntakeError ? err.code : "bot-check";
    redirect(`/supplier-partners?error=${encodeURIComponent(code)}`);
  }

  if (!business || !name || !phone || !location || !products) {
    redirect("/supplier-partners?error=validation");
  }

  const submissionId = crypto.randomUUID();

  // Same as the career application fix: persist first, treat both emails as
  // best-effort. There was no database record for a supplier enquiry at
  // all before this -- an email hiccup meant the enquiry was just gone.
  await prisma.contactEnquiry.create({
    data: {
      name,
      organisation: business,
      email: email || null,
      phone,
      enquiryType: "Supplier partnership",
      message: [
        `Products: ${products}`,
        capacity ? `Capacity: ${capacity}` : null,
        relationship ? `Preferred relationship: ${relationship}` : null,
      ].filter(Boolean).join("\n"),
      source: "Supplier partners page",
    },
  });

  if (email) {
    try {
      await sendTransactionalEmail({
        deduplicationKey: `supplier-ack:${submissionId}:${email}`,
        template: "supplier-acknowledgement",
        to: email,
        content: emailTemplates.supplierAcknowledgement(name),
      });
    } catch (error) {
      Sentry.captureException(error, {tags: {component: "supplier-enquiry-acknowledgement-email"}, extra: {email}});
    }
  }

  try {
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
  } catch (error) {
    Sentry.captureException(error, {tags: {component: "supplier-enquiry-admin-notification"}, extra: {business, email}});
  }

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

export async function updateCareerApplicationStatusAction(formData: FormData) {
  await requireCapability("manage_communications");
  const {revalidatePath} = await import("next/cache");

  const id = text(formData, "id");
  const status = text(formData, "status");
  const adminNote = text(formData, "adminNote");

  if (!id || !status) {
    throw new Error("Application ID and status are required.");
  }

  await prisma.careerApplication.update({
    where: {id},
    data: {status, adminNote: adminNote || null},
  });

  revalidatePath("/admin/career-applications");
}
