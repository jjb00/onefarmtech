"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireCapability} from "@/lib/auth";
import {createWhatsAppTemplate} from "@/lib/whatsapp/templateManagement";
import {WhatsAppProviderError} from "@/lib/whatsapp/provider";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitWhatsAppTemplateAction(formData: FormData) {
  await requireCapability("manage_communications");

  const name = readText(formData, "name").toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const category = readText(formData, "category") || "UTILITY";
  const language = readText(formData, "language") || "en_US";
  const bodyText = readText(formData, "bodyText");
  const bodyExamples = readText(formData, "bodyExamples")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!name || !bodyText) {
    redirect("/admin/whatsapp-templates?error=missing-fields");
  }

  try {
    await createWhatsAppTemplate({
      name,
      category: category as "UTILITY" | "MARKETING" | "AUTHENTICATION",
      language,
      bodyText,
      bodyExamples,
    });
  } catch (error) {
    const message = error instanceof WhatsAppProviderError || error instanceof Error ? error.message : "Template submission failed.";
    redirect(`/admin/whatsapp-templates?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/whatsapp-templates");
  redirect("/admin/whatsapp-templates?submitted=1");
}
