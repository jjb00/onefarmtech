import {prisma} from "@/lib/prisma";

type AuditLogInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  previousValue?: unknown;
  newValue?: unknown;
  metadata?: unknown;
  actorName?: string;
  actorEmail?: string | null;
  actorRole?: string;
};

function safeJson(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export async function createAuditLog(input: AuditLogInput) {
  try {
    await prisma.auditLog.create({
      data: {
        actorName: input.actorName || "Local admin",
        actorEmail: input.actorEmail || null,
        actorRole: input.actorRole || "Admin",
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId || null,
        entityLabel: input.entityLabel || null,
        previousValue: safeJson(input.previousValue),
        newValue: safeJson(input.newValue),
        metadata: safeJson(input.metadata),
      },
    });
  } catch (error) {
    console.error("Audit log failed", error);
  }
}
