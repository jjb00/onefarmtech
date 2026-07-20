import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/format";
import {uniqueOrdersById} from "@/lib/orderListIntegrity.js";

type OrderCodeRow = {
  code: string;
};

type OrderItemSummaryRow = {
  name: string;
  quantity: number;
  unit: string;
};

export async function getDbOrders() {
  const orders = await prisma.order.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: true,
      payments: true,
      complaints: true,
      customer: true,
    },
  });

  return uniqueOrdersById(orders);
}

export async function getDbOrderByCode(code: string) {
  return prisma.order.findUnique({
    where: {
      code,
    },
    include: {
      items: true,
      payments: true,
      complaints: true,
      customer: true,
    },
  });
}

export async function getDbOrderCodes() {
  const orders = await prisma.order.findMany({
    select: {
      code: true,
    },
  });

  return orders.map((order: OrderCodeRow) => ({
    code: order.code,
  }));
}

export async function getDbOrderStats() {
  const [totalOrders, unpaidOrders, paidOrders, complaints] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({
      where: {
        paymentStatus: {
          contains: "Unpaid",
        },
      },
    }),
    prisma.order.count({
      where: {
        OR: [
          {
            paymentStatus: {
              contains: "paid",
            },
          },
          {
            paymentStatus: {
              contains: "approved",
            },
          },
        ],
      },
    }),
    prisma.complaint.count(),
  ]);

  return [
    {
      label: "Database orders",
      value: String(totalOrders),
    },
    {
      label: "Unpaid",
      value: String(unpaidOrders),
    },
    {
      label: "Paid/approved",
      value: String(paidOrders),
    },
    {
      label: "Complaints",
      value: String(complaints),
    },
  ];
}

export function getOrderItemsSummary(items: OrderItemSummaryRow[]) {
  if (items.length === 0) {
    return "No items";
  }

  return items
    .map((item) => `${item.quantity} ${item.unit} ${item.name}`)
    .join(", ");
}

export function formatOrderTotal(amount: number) {
  return amount > 0 ? formatNaira(amount) : "To be confirmed";
}
