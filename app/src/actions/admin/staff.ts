/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- carried over from createAdminRecords.ts during the module split; see git
// history for context. Removing this needs a dedicated type-safety pass.
"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {createAuditLog} from "@/lib/auditLog";
import {requireCapability} from "@/lib/auth";
import {isStaffRole} from "@/lib/permissions";
import {readText} from "./shared";

export async function createStaffUserAction(formData: FormData) {
  await requireCapability("manage_staff");
  const name = readText(formData, "name");
  const email = readText(formData, "email");
  const role = readText(formData, "role", "Operations");
  const status = readText(formData, "status", "Active");

  if (!name || !email || !isStaffRole(role)) {
    throw new Error("Staff name, email, and valid role are required.");
  }

  const staffUser = await prisma.staffUser.create({
    data: {
      name,
      email,
      role,
      status,
    },
  });

  await createAuditLog({
    action: "Created staff user",
    entityType: "StaffUser",
    entityId: staffUser.id,
    entityLabel: staffUser.email,
    newValue: staffUser,
    actorRole: "Super admin",
  });

  revalidatePath("/admin/staff");
  revalidatePath("/admin/audit-log");
  redirect("/admin/staff");
}
