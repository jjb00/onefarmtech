"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireStaffRole} from "@/lib/auth";
import {staffRoles} from "@/lib/permissions";
import {prisma} from "@/lib/prisma";
import {staffManagementErrors, updateStaffAccount} from "@/lib/staffAccountManagement.js";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function errorCode(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "failed";
  return Object.values(staffManagementErrors).includes(code) ? code : "failed";
}

export async function updateStaffAccountAction(formData: FormData) {
  const actor = await requireStaffRole("Super admin");
  try {
    await updateStaffAccount({
      db: prisma,
      actor,
      targetId: text(formData, "staffId"),
      name: text(formData, "name"),
      email: text(formData, "email"),
      role: text(formData, "role"),
      status: text(formData, "status"),
      validRoles: staffRoles,
    });
  } catch (error) {
    redirect(`/admin/staff?error=${errorCode(error)}`);
  }
  revalidatePath("/admin/staff");
  revalidatePath("/admin/audit-log");
  redirect("/admin/staff?success=updated");
}

export async function setStaffStatusAction(formData: FormData) {
  const actor = await requireStaffRole("Super admin");
  const staffId = text(formData, "staffId");
  const status = text(formData, "status");
  try {
    const target = await prisma.staffUser.findUnique({where: {id: staffId}});
    if (!target) throw Object.assign(new Error("not-found"), {code: "not-found"});
    await updateStaffAccount({
      db: prisma, actor, targetId: staffId, name: target.name, email: target.email,
      role: target.role, status, validRoles: staffRoles,
    });
  } catch (error) {
    redirect(`/admin/staff?error=${errorCode(error)}`);
  }
  revalidatePath("/admin/staff");
  revalidatePath("/admin/audit-log");
  redirect(`/admin/staff?success=${status === "Active" ? "reactivated" : "deactivated"}`);
}
