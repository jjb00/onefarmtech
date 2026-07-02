import { prisma } from "@/lib/prisma";

export async function getDbCustomers() {
  return prisma.customer.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      orders: true,
    },
  });
}

export async function getDbProducts() {
  return prisma.product.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      orderItems: true,
    },
  });
}

export async function getDbSuppliers() {
  return prisma.supplier.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function getDbPayments() {
  return prisma.payment.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      order: {
        include: {
          customer: true,
        },
      },
    },
  });
}

export async function getDbComplaints() {
  return prisma.complaint.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      order: {
        include: {
          customer: true,
        },
      },
    },
  });
}

export async function getDbPickupLocations() {
  return prisma.pickupLocation.findMany({
    orderBy: {
      name: "asc",
    },
  });
}