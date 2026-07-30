// Most produce is sourced fresh after the order is placed and needs the
// usual 1-2 day farm sourcing lead time. A small set of staples (potato,
// onion, and similar) are kept in stock and can fulfil same/next-day.
// This keeps auto-confirmed orders honest about which case applies instead
// of promising a timeline the team can't actually verify without checking
// with farmers first.

export function fulfilmentEstimateForStockTypes(stockTypes: string[]): {
  leadTimeDays: number;
  label: string;
} {
  const needsFreshSourcing = stockTypes.some((type) => type !== "Stocked");

  if (needsFreshSourcing) {
    return {leadTimeDays: 2, label: "1-2 days (fresh sourcing)"};
  }

  return {leadTimeDays: 0, label: "Same/next-day (stocked)"};
}

export function estimatedFulfilmentDate(stockTypes: string[], from: Date = new Date()): Date {
  const {leadTimeDays} = fulfilmentEstimateForStockTypes(stockTypes);
  const date = new Date(from);
  date.setDate(date.getDate() + leadTimeDays);
  return date;
}
