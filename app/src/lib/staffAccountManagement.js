const ACTIVE = "Active";
const INACTIVE = "Inactive";
const SUPER_ADMIN = "Super admin";

export const staffManagementErrors = {
  invalid: "invalid",
  notFound: "not-found",
  selfDeactivate: "self-deactivate",
  lastSuperAdmin: "last-super-admin",
};

function managementError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

export async function updateStaffAccount({db, actor, targetId, name, email, role, status, validRoles}) {
  const normalizedName = String(name || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!targetId || !normalizedName || !normalizedEmail || !validRoles.includes(role) || ![ACTIVE, INACTIVE].includes(status)) {
    throw managementError(staffManagementErrors.invalid);
  }

  return db.$transaction(async (tx) => {
    const target = await tx.staffUser.findUnique({where: {id: targetId}});
    if (!target) throw managementError(staffManagementErrors.notFound);
    if (target.id === actor.id && target.status === ACTIVE && status === INACTIVE) {
      throw managementError(staffManagementErrors.selfDeactivate);
    }

    const removesActiveSuperAdmin = target.role === SUPER_ADMIN && target.status === ACTIVE &&
      (role !== SUPER_ADMIN || status !== ACTIVE);
    if (removesActiveSuperAdmin) {
      const activeSuperAdmins = await tx.staffUser.count({where: {role: SUPER_ADMIN, status: ACTIVE}});
      if (activeSuperAdmins <= 1) throw managementError(staffManagementErrors.lastSuperAdmin);
    }

    const updated = await tx.staffUser.update({
      where: {id: target.id},
      data: {name: normalizedName, email: normalizedEmail, role, status},
    });
    await tx.auditLog.create({data: {
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: target.status !== updated.status
        ? (updated.status === ACTIVE ? "Reactivated staff user" : "Deactivated staff user")
        : "Updated staff user",
      entityType: "StaffUser",
      entityId: target.id,
      entityLabel: updated.email,
      previousValue: JSON.stringify({name: target.name, email: target.email, role: target.role, status: target.status}),
      newValue: JSON.stringify({name: updated.name, email: updated.email, role: updated.role, status: updated.status}),
      metadata: JSON.stringify({authMode: actor.authMode, targetStaffId: target.id, sessionInvalidated: true}),
    }});
    return updated;
  }, {isolationLevel: "Serializable"});
}
