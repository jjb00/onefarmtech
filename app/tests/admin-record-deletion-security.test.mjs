import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {validatePermanentDeletionInput} from "../src/lib/adminRecordDeletion.js";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("permanent deletion requires record allowlist, reason, DELETE and password", () => {
  assert.equal(validatePermanentDeletionInput({recordType: "UnsupportedRecord", recordId: "1", reason: "valid reason here", confirmation: "DELETE", password: "secret"}), "invalid-record-type");
  assert.equal(validatePermanentDeletionInput({recordType: "BuyerMessage", recordId: "1", reason: "short", confirmation: "DELETE", password: "secret"}), "deletion-reason-required");
  assert.equal(validatePermanentDeletionInput({recordType: "BuyerMessage", recordId: "1", reason: "valid reason here", confirmation: "delete", password: "secret"}), "delete-confirmation-required");
  assert.equal(validatePermanentDeletionInput({recordType: "ContactEnquiry", recordId: "1", reason: "valid reason here", confirmation: "DELETE", password: ""}), "password-confirmation-required");
  assert.equal(validatePermanentDeletionInput({recordType: "ContactEnquiry", recordId: "1", reason: "valid reason here", confirmation: "DELETE", password: "secret"}), null);
});

test("server action is Super Admin only and rechecks the authoritative password", () => {
  const action = read("src/actions/adminRecordDeletion.ts");
  assert.match(action, /requireStaffRole\("Super admin"\)/);
  assert.match(action, /verifyStaffPassword\(staff\.email, password\)/);
  assert.match(action, /prisma\.\$transaction/);
  assert.match(action, /actorId: staff\.id/);
  assert.match(action, /deletionReason: reason/);
  assert.doesNotMatch(action, /message\.body|contact\.message|previousValue/);
});

test("deletion UI prevents duplicate submit and requires final confirmation", () => {
  const controls = read("src/components/admin/AdminRecordControls.tsx");
  const button = read("src/components/admin/ConfirmSubmitButton.tsx");
  assert.match(controls, /name="confirmation"/);
  assert.match(controls, /pattern="DELETE"/);
  assert.match(controls, /autoComplete="current-password"/);
  assert.match(controls, /Final confirmation/);
  assert.match(button, /disabled=\{disabled \|\| pending\}/);
});
