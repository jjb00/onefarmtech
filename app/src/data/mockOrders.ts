export const mockOrders = [
  {
    code: "OFT-0001",
    buyer: "Mama T Foods",
    buyerType: "Restaurant",
    phone: "+234 800 000 0001",
    items: "Tomatoes, pepper, onions",
    orderType: "Recurring",
    paymentStatus: "Deposit paid",
    fulfilmentStatus: "Sourcing",
    total: "₦185,000",
    delivery: "Platform delivery",
    date: "Today",
  },
  {
    code: "OFT-0002",
    buyer: "Chika Household",
    buyerType: "Large household",
    phone: "+234 800 000 0002",
    items: "Irish potatoes - 10kg",
    orderType: "Group-buy",
    paymentStatus: "Fully paid",
    fulfilmentStatus: "Minimum met",
    total: "₦22,000",
    delivery: "Pickup point",
    date: "Today",
  },
  {
    code: "OFT-0003",
    buyer: "Green Bowl Caterers",
    buyerType: "Caterer",
    phone: "+234 800 000 0003",
    items: "Yam - 50 tubers",
    orderType: "Direct",
    paymentStatus: "Unpaid",
    fulfilmentStatus: "New order",
    total: "₦310,000",
    delivery: "Customer pickup",
    date: "Yesterday",
  },
  {
    code: "OFT-0004",
    buyer: "Urban Mini Mart",
    buyerType: "Retailer",
    phone: "+234 800 000 0004",
    items: "Rice, beans, garri",
    orderType: "Direct",
    paymentStatus: "Credit approved",
    fulfilmentStatus: "Ready for dispatch",
    total: "₦460,000",
    delivery: "Scheduled delivery",
    date: "Yesterday",
  },
];

export const mockStats = [
  { label: "New orders", value: "12" },
  { label: "Paid / ready", value: "7" },
  { label: "In sourcing", value: "5" },
  { label: "Issues", value: "1" },
];

export const adminModules = [
  "Orders",
  "Customers",
  "Products",
  "Farmers & suppliers",
  "Group-buys",
  "Payments",
  "Deliveries",
  "Complaints",
];

export function paymentStatusClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("paid") || normalized.includes("approved")) {
    return "bg-[#e7f3df] text-[#1f7a3f]";
  }

  if (normalized.includes("unpaid") || normalized.includes("issue")) {
    return "bg-[#fff1d6] text-[#8a5a00]";
  }

  return "bg-[#f7f5ec] text-[#405348]";
}


export function getMockOrderByCode(code: string) {
  return mockOrders.find((order) => order.code === code);
}
