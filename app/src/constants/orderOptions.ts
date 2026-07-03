import type {
  BuyerType,
  DeliveryMethod,
  FulfilmentStatus,
  OrderType,
  PaymentStatus,
  ProduceGrade,
} from "@/types/domain";

export const buyerTypes: BuyerType[] = [
  "Individual",
  "Restaurant",
  "Hotel",
  "Caterer",
  "Retailer",
  "Food vendor",
  "Large household",
  "Buying group",
  "Food processor",
];

export const orderTypes: OrderType[] = [
  "Direct",
  "Group-buy",
  "Recurring",
  "Pre-harvest",
];

export const paymentStatuses: PaymentStatus[] = [
  "Unpaid",
  "Deposit pending",
  "Deposit paid",
  "Fully paid",
  "Payment failed",
  "Refund pending",
  "Refunded",
  "Credit approved",
  "Pay on delivery approved",
];

export const fulfilmentStatuses: FulfilmentStatus[] = [
  "New order",
  "Awaiting customer confirmation",
  "Allocation approved",
  "Allocation",
  "Awaiting harvest",
  "Picked up",
  "Quality checked",
  "Packed",
  "Ready for dispatch",
  "Out for delivery",
  "Delivered",
  "Completed",
  "Issue reported",
  "Cancelled",
];

export const deliveryMethods: DeliveryMethod[] = [
  "Pickup from office",
  "Pickup from listed location",
  "Platform delivery",
  "Customer arranged delivery",
  "Scheduled delivery",
];

export const produceGrades: ProduceGrade[] = [
  "Grade A",
  "Grade B",
  "Processing grade",
  "Standard",
];

export const produceItems = [
  "Tomatoes",
  "Pepper",
  "Onions",
  "Irish Potatoes",
  "Yam",
  "Rice",
  "Beans",
  "Garri",
  "Plantain",
  "Cassava",
];

export const paymentRules = [
  {
    title: "New individual buyers",
    description: "Require full payment before order allocation or dispatch.",
  },
  {
    title: "New business buyers",
    description: "Use full payment or deposit before order allocation until trust is built.",
  },
  {
    title: "Verified business buyers",
    description: "May receive credit limits, 7-day terms, or PO support after approval.",
  },
  {
    title: "Group-buy buyers",
    description: "Payment reserves a slot. If minimum quantity fails, admin handles refund or rollover.",
  },
  {
    title: "Farmer/supplier payment",
    description: "Farmers should be paid when goods leave them or after quality confirmation at pickup.",
  },
];

export const orderWorkflowSteps = [
  "Capture buyer and contact details",
  "Confirm produce item, grade, quantity, and unit",
  "Confirm delivery method, pickup point, or delivery zone",
  "Set payment requirement based on buyer type",
  "Send payment instruction or payment link",
  "Confirm payment or approved credit terms",
  "Approve order for allocation",
  "Assign supplier or route",
  "Record quality check before dispatch",
  "Update buyer by WhatsApp",
  "Mark delivered, completed, or issue reported",
];
