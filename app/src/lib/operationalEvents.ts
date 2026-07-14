import {prisma} from "@/lib/prisma";

function sanitizedMetadata(metadata: unknown) {
  try {
    return JSON.stringify(metadata, (key, value) => /secret|token|authorization|cookie|accesscode|body|message/i.test(key) ? "[redacted]" : value).slice(0, 3000);
  } catch {
    return null;
  }
}

export async function recordOperationalEvent(input: {category: string; summary: string; severity?: string; route?: string; relatedType?: string; relatedId?: string; metadata?: unknown}) {
  try {
    return await prisma.operationalEvent.create({data: {
      category: input.category,
      summary: input.summary.slice(0, 500),
      severity: input.severity || "Error",
      route: input.route,
      relatedType: input.relatedType,
      relatedId: input.relatedId,
      metadata: sanitizedMetadata(input.metadata),
    }});
  } catch (error) {
    console.error("Operational event persistence failed", {category: input.category, summary: input.summary, error: error instanceof Error ? error.message : "unknown"});
    return null;
  }
}
