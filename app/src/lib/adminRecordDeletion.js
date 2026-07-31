export const DELETABLE_ADMIN_RECORD_TYPES = ["ContactEnquiry", "BuyerMessage", "OrderRequest", "BuyerAccountRequest", "Order", "Conversation"];

export function validatePermanentDeletionInput({recordType, recordId, reason, confirmation, password}) {
  if (!DELETABLE_ADMIN_RECORD_TYPES.includes(String(recordType || ""))) return "invalid-record-type";
  if (!String(recordId || "").trim()) return "missing-record";
  if (String(reason || "").trim().length < 10) return "deletion-reason-required";
  if (String(confirmation || "") !== "DELETE") return "delete-confirmation-required";
  if (!String(password || "")) return "password-confirmation-required";
  return null;
}
