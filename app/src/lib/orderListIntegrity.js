export function uniqueOrdersById(orders) {
  const unique = new Map();

  for (const order of orders || []) {
    if (order?.id && !unique.has(order.id)) unique.set(order.id, order);
  }

  return [...unique.values()];
}
