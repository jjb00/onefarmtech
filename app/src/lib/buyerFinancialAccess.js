export async function loadAuthorizedRecentReceipts({
  db,
  customerId,
  canViewReceipts,
  take = 3,
}) {
  if (!canViewReceipts) return [];

  return db.receipt.findMany({
    where: {customerId},
    orderBy: {issuedAt: "desc"},
    take,
  });
}

export function buyerOrderFinancialRelations(canViewReceipts) {
  if (!canViewReceipts) return {};

  return {
    paymentRequests: {
      orderBy: {createdAt: "desc"},
      take: 3,
    },
    payments: {
      orderBy: {createdAt: "desc"},
      take: 3,
    },
    receipts: {
      orderBy: {createdAt: "desc"},
      take: 3,
    },
  };
}

export function visibleBuyerPaymentStatus(canViewReceipts, paymentStatus) {
  return canViewReceipts ? paymentStatus : null;
}
