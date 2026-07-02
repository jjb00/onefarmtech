export type BuyerType =
  | "Individual"
  | "Restaurant"
  | "Hotel"
  | "Caterer"
  | "Retailer"
  | "Food vendor"
  | "Large household"
  | "Buying group"
  | "Food processor";

export type OrderType = "Direct" | "Group-buy" | "Recurring" | "Pre-harvest";

export type PaymentStatus =
  | "Unpaid"
  | "Deposit pending"
  | "Deposit paid"
  | "Fully paid"
  | "Payment failed"
  | "Refund pending"
  | "Refunded"
  | "Credit approved"
  | "Pay on delivery approved";

export type FulfilmentStatus =
  | "New order"
  | "Awaiting customer confirmation"
  | "Approved for sourcing"
  | "Sourcing"
  | "Awaiting harvest"
  | "Picked up"
  | "Quality checked"
  | "Packed"
  | "Ready for dispatch"
  | "Out for delivery"
  | "Delivered"
  | "Completed"
  | "Issue reported"
  | "Cancelled";

export type DeliveryMethod =
  | "Pickup from office"
  | "Pickup from listed location"
  | "Platform delivery"
  | "Customer arranged delivery"
  | "Scheduled delivery";

export type ProduceGrade = "Grade A" | "Grade B" | "Processing grade" | "Standard";

export type OrderRecord = {
  code: string;
  buyer: string;
  buyerType: string;
  phone: string;
  items: string;
  orderType: string;
  paymentStatus: string;
  fulfilmentStatus: string;
  total: string;
  delivery: string;
  date: string;
};
