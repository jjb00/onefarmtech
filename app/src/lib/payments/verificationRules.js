export function validatePaystackVerification(input) {
  if (!input.verification.ok) return "provider-status-not-successful";
  if (input.verification.reference !== input.reference) return "reference-mismatch";
  if (input.verification.amountMinor !== input.amount * 100) return "amount-mismatch";
  if (input.verification.currency !== input.currency.toUpperCase()) return "currency-mismatch";
  return null;
}

export function validateFlutterwaveVerification(input) {
  if (!input.verification.ok) return "provider-status-not-successful";
  if (input.verification.reference !== input.reference) return "reference-mismatch";
  if (input.verification.amount !== input.amount) return "amount-mismatch";
  if (input.verification.currency !== input.currency.toUpperCase()) return "currency-mismatch";
  return null;
}
