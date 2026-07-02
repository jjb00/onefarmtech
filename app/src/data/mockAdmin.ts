export const mockCustomers = [
  {
    name: "Mama T Foods",
    type: "Restaurant",
    phone: "+234 800 000 0001",
    location: "Ikeja",
    paymentTerms: "Deposit",
    creditLimit: "₦250,000",
    status: "Verified",
  },
  {
    name: "Chika Household",
    type: "Large household",
    phone: "+234 800 000 0002",
    location: "Yaba",
    paymentTerms: "Upfront",
    creditLimit: "None",
    status: "Active",
  },
  {
    name: "Green Bowl Caterers",
    type: "Caterer",
    phone: "+234 800 000 0003",
    location: "Lekki",
    paymentTerms: "Upfront",
    creditLimit: "Pending",
    status: "New",
  },
  {
    name: "Urban Mini Mart",
    type: "Retailer",
    phone: "+234 800 000 0004",
    location: "Ajah",
    paymentTerms: "7 days",
    creditLimit: "₦500,000",
    status: "Verified",
  },
];

export const mockProducts = [
  {
    name: "Tomatoes",
    category: "Vegetables",
    unit: "Basket",
    grade: "A / B",
    availability: "Seasonal",
    status: "Active",
  },
  {
    name: "Pepper",
    category: "Vegetables",
    unit: "Kg / Bag",
    grade: "A / B",
    availability: "Available",
    status: "Active",
  },
  {
    name: "Irish Potatoes",
    category: "Tubers",
    unit: "Kg / Bag",
    grade: "Standard",
    availability: "Available",
    status: "Group-buy",
  },
  {
    name: "Yam",
    category: "Tubers",
    unit: "Tuber / Bundle",
    grade: "A / B",
    availability: "Limited",
    status: "Active",
  },
  {
    name: "Rice",
    category: "Grains",
    unit: "Bag",
    grade: "Standard",
    availability: "Available",
    status: "Active",
  },
];

export const mockSuppliers = [
  {
    name: "Baba Musa Farm Network",
    location: "Kaduna rural cluster",
    produce: "Tomatoes, pepper, onions",
    reliability: "High",
    paymentPreference: "Bank transfer",
    status: "Trusted",
  },
  {
    name: "Ola Yam Aggregators",
    location: "Oyo village route",
    produce: "Yam, cassava",
    reliability: "Medium",
    paymentPreference: "Transfer / cash",
    status: "Active",
  },
  {
    name: "North Belt Potato Supply",
    location: "Plateau supply route",
    produce: "Irish potatoes",
    reliability: "High",
    paymentPreference: "Bank transfer",
    status: "Trusted",
  },
];

export const mockGroupBuys = [
  {
    title: "Irish Potatoes Split",
    product: "Irish Potatoes",
    target: "50kg",
    committed: "38kg",
    minimum: "40kg",
    closes: "Friday 5pm",
    fulfilment: "Saturday pickup",
    status: "Open",
  },
  {
    title: "Tomato Basket Group-buy",
    product: "Tomatoes",
    target: "12 baskets",
    committed: "7 baskets",
    minimum: "8 baskets",
    closes: "Wednesday 6pm",
    fulfilment: "Thursday delivery",
    status: "Open",
  },
  {
    title: "Onion Bag Split",
    product: "Onions",
    target: "4 bags",
    committed: "4 bags",
    minimum: "3 bags",
    closes: "Closed",
    fulfilment: "Ready for sourcing",
    status: "Minimum met",
  },
];

export const mockDeliveries = [
  {
    order: "OFT-0001",
    buyer: "Mama T Foods",
    method: "Platform delivery",
    area: "Ikeja",
    fee: "₦3,000",
    status: "Preparing",
  },
  {
    order: "OFT-0002",
    buyer: "Chika Household",
    method: "Pickup point",
    area: "Yaba",
    fee: "Free",
    status: "Pickup Saturday",
  },
  {
    order: "OFT-0004",
    buyer: "Urban Mini Mart",
    method: "Scheduled delivery",
    area: "Ajah",
    fee: "₦6,000",
    status: "Ready for dispatch",
  },
];

export function badgeClass(status: string) {
  const value = status.toLowerCase();

  if (
    value.includes("verified") ||
    value.includes("trusted") ||
    value.includes("active") ||
    value.includes("open") ||
    value.includes("met") ||
    value.includes("ready")
  ) {
    return "bg-[#e7f3df] text-[#1f7a3f]";
  }

  if (
    value.includes("pending") ||
    value.includes("limited") ||
    value.includes("medium") ||
    value.includes("preparing")
  ) {
    return "bg-[#fff1d6] text-[#8a5a00]";
  }

  return "bg-[#f7f5ec] text-[#405348]";
}
