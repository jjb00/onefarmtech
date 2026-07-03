export const mockPayments = [
  {
    reference: "PAY-OFT-0001",
    order: "OFT-0001",
    buyer: "Mama T Foods",
    method: "Paystack",
    amount: "₦100,000",
    status: "Deposit paid",
    date: "Today",
  },
  {
    reference: "PAY-OFT-0002",
    order: "OFT-0002",
    buyer: "Chika Household",
    method: "Bank transfer",
    amount: "₦22,000",
    status: "Fully paid",
    date: "Today",
  },
  {
    reference: "PAY-OFT-0003",
    order: "OFT-0003",
    buyer: "Green Bowl Caterers",
    method: "Pending",
    amount: "₦0",
    status: "Unpaid",
    date: "Yesterday",
  },
  {
    reference: "PAY-OFT-0004",
    order: "OFT-0004",
    buyer: "Urban Mini Mart",
    method: "Credit terms",
    amount: "₦460,000",
    status: "Credit approved",
    date: "Yesterday",
  },
];

export const mockComplaints = [
  {
    code: "CMP-001",
    order: "OFT-0001",
    buyer: "Mama T Foods",
    issue: "Tomatoes softer than expected",
    priority: "Medium",
    status: "Under review",
    resolution: "Quality photo requested",
  },
  {
    code: "CMP-002",
    order: "OFT-0002",
    buyer: "Chika Household",
    issue: "Pickup time unclear",
    priority: "Low",
    status: "Resolved",
    resolution: "Pickup message resent",
  },
  {
    code: "CMP-003",
    order: "OFT-0004",
    buyer: "Urban Mini Mart",
    issue: "Delivery fee dispute",
    priority: "High",
    status: "Open",
    resolution: "Admin to confirm zone pricing",
  },
];

export const mockPickupLocations = [
  {
    name: "Yaba Collection Point",
    area: "Yaba",
    address: "Listed pickup partner location",
    fee: "Free",
    days: "Wednesday, Saturday",
    status: "Active",
  },
  {
    name: "Ikeja Office Pickup",
    area: "Ikeja",
    address: "OneFarmTech office / dispatch point",
    fee: "Free",
    days: "Monday to Saturday",
    status: "Active",
  },
  {
    name: "Lekki Weekend Pickup",
    area: "Lekki",
    address: "Weekend collection partner",
    fee: "₦1,000 handling",
    days: "Saturday",
    status: "Pilot",
  },
];

export const orderFormOptions = {
  buyerTypes: [
    "Individual",
    "Restaurant",
    "Hotel",
    "Caterer",
    "Retailer",
    "Food vendor",
    "Large household",
    "Buying group",
    "Food processor",
  ],
  orderTypes: ["Direct", "Group-buy", "Recurring", "Pre-harvest"],
  paymentStatuses: [
    "Unpaid",
    "Deposit pending",
    "Deposit paid",
    "Fully paid",
    "Credit approved",
    "Refund pending",
  ],
  fulfilmentStatuses: [
    "New order",
    "Awaiting customer confirmation",
    "Allocation approved",
    "Allocation",
    "Quality checked",
    "Packed",
    "Ready for dispatch",
    "Out for delivery",
    "Delivered",
    "Completed",
    "Issue reported",
    "Cancelled",
  ],
  deliveryMethods: [
    "Pickup from office",
    "Pickup from listed location",
    "Platform delivery",
    "Customer arranged delivery",
    "Scheduled delivery",
  ],
};

export function opsBadgeClass(status: string) {
  const value = status.toLowerCase();

  if (
    value.includes("paid") ||
    value.includes("approved") ||
    value.includes("resolved") ||
    value.includes("active")
  ) {
    return "bg-[#e7f3df] text-[#1f7a3f]";
  }

  if (
    value.includes("unpaid") ||
    value.includes("open") ||
    value.includes("high") ||
    value.includes("under review")
  ) {
    return "bg-[#fff1d6] text-[#8a5a00]";
  }

  return "bg-[#f7f5ec] text-[#405348]";
}
