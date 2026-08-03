"use server";

import crypto from "node:crypto";
import {redirect} from "next/navigation";
import {
  getOperationalEmailRecipients,
  sendTransactionalEmail,
  type EmailAttachment,
} from "@/lib/email/service";
import {emailTemplates} from "@/lib/email/templates";
import {protectPublicIntake, PublicIntakeError} from "@/lib/publicIntakeProtection";

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
  group: "careers" | "contact" | "supplier";
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
  const reopen = `/careers?apply=1&role=${encodeURIComponent(role)}`;

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

  if (!name || !email || !phone || !location || !role || !experience || !consent) {
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

  const applicantResult = await sendTransactionalEmail({
    deduplicationKey: `career-ack:${submissionId}:${email}`,
    template: "career-acknowledgement",
    to: email,
    content: emailTemplates.careerAcknowledgement(name, role),
  });

  if (!applicantResult.ok) {
    redirect(`${reopen}&error=email-failed`);
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

