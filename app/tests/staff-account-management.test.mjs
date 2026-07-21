import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {updateStaffAccount} from "../src/lib/staffAccountManagement.js";

const roles = ["Super admin", "Admin", "Operations", "Finance", "Support", "Buyer account manager"];
const superAdmin = {id: "grace", name: "Grace", email: "grace@onefarmtech.com", role: "Super admin", status: "Active", authMode: "authoritative-staff"};
const ops = {id: "ops-test", name: "Ops Test", email: "ops-test@onefarmtech.local", role: "Operations", status: "Active"};

function database(target, activeSuperAdmins = 1) {
  const audits = [];
  let updated;
  const tx = {
    staffUser: {
      findUnique: async () => target,
      count: async () => activeSuperAdmins,
      update: async ({data}) => (updated = {...target, ...data, updatedAt: new Date()}),
    },
    auditLog: {create: async ({data}) => audits.push(data)},
  };
  return {db: {$transaction: (callback) => callback(tx)}, audits, get updated() { return updated; }};
}

test("Super Admin can deactivate Ops Test and an authoritative audit identifies actor and target", async () => {
  const fixture = database(ops);
  await updateStaffAccount({db: fixture.db, actor: superAdmin, targetId: ops.id, name: ops.name, email: ops.email, role: ops.role, status: "Inactive", validRoles: roles});
  assert.equal(fixture.updated.status, "Inactive");
  assert.equal(fixture.audits[0].actorEmail, superAdmin.email);
  assert.equal(fixture.audits[0].entityId, ops.id);
  assert.match(fixture.audits[0].metadata, /"sessionInvalidated":true/);
});

test("staff-management actions require Super Admin on the server", () => {
  const source = fs.readFileSync(new URL("../src/actions/manageStaff.ts", import.meta.url), "utf8");
  assert.equal((source.match(/requireStaffRole\("Super admin"\)/g) || []).length, 2);
});

test("current user cannot deactivate themselves", async () => {
  const fixture = database(superAdmin, 2);
  await assert.rejects(updateStaffAccount({db: fixture.db, actor: superAdmin, targetId: superAdmin.id, name: superAdmin.name, email: superAdmin.email, role: superAdmin.role, status: "Inactive", validRoles: roles}), /self-deactivate/);
});

test("last active Super Admin cannot be deactivated or demoted", async () => {
  const other = {...superAdmin, id: "other-admin", email: "other@onefarmtech.com"};
  for (const change of [{role: "Super admin", status: "Inactive"}, {role: "Operations", status: "Active"}]) {
    const fixture = database(other, 1);
    await assert.rejects(updateStaffAccount({db: fixture.db, actor: superAdmin, targetId: other.id, name: other.name, email: other.email, ...change, validRoles: roles}), /last-super-admin/);
  }
});

test("role and status edits update the session-bound staff revision", () => {
  const currentStaff = fs.readFileSync(new URL("../src/lib/currentStaff.ts", import.meta.url), "utf8");
  const schema = fs.readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
  assert.match(currentStaff, /staff\.updatedAt\.toISOString\(\) === claims\?\.staffUpdatedAt/);
  assert.match(schema, /model StaffUser[\s\S]*updatedAt DateTime @updatedAt/);
});

test("last-Super-Admin protection is checked in a serializable transaction", () => {
  const source = fs.readFileSync(new URL("../src/lib/staffAccountManagement.js", import.meta.url), "utf8");
  assert.match(source, /isolationLevel: "Serializable"/);
});
