export type BuyerRelationshipInput = {
  status: string;
  accountStatus: string;
  accountLoginReady: boolean;
  hasActiveContact?: boolean;
};

const ACCOUNT_ONBOARDING_STATUSES = new Set([
  "Pending login approval",
  "Account login pending",
  "Account login ready",
  "Approved recurring buyer",
]);

export function hasBuyerAccountJourney(
  buyer: Pick<BuyerRelationshipInput, "accountStatus" | "accountLoginReady">,
) {
  return (
    buyer.accountLoginReady ||
    ACCOUNT_ONBOARDING_STATUSES.has(buyer.accountStatus)
  );
}

export function buyerRelationshipLabel(buyer: BuyerRelationshipInput) {
  if (!hasBuyerAccountJourney(buyer)) {
    return "No account requested";
  }

  if (buyer.status !== "Active") {
    return buyer.accountLoginReady ? "Login suspended" : "Account inactive";
  }

  if (!buyer.accountLoginReady) {
    return "Awaiting account review";
  }

  if (buyer.hasActiveContact === false) {
    return "Contact setup required";
  }

  return "Login active";
}

export function buyerRelationshipTone(label: string) {
  if (label === "Login active") return "success";
  if (label === "Login suspended" || label === "Account inactive") return "danger";
  if (
    label === "Awaiting account review" ||
    label === "Contact setup required"
  ) {
    return "warning";
  }
  return "neutral";
}
