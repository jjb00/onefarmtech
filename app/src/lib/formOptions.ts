export const buyerAccountTypeOptions = [
  "Household buyer",
  "Estate / compound buyer",
  "Restaurant / food business",
  "Retailer / reseller",
  "Corporate / office buyer",
  "School / institution",
  "Other",
] as const;

export const orderBuyerTypeOptions = [
  "Household",
  "Restaurant / food business",
  "Retailer / reseller",
  "Office / corporate",
  "Estate / group-buy",
  "School / institution",
  "Other",
] as const;

export const orderFrequencyOptions = [
  "One-off order",
  "Weekly",
  "Twice weekly",
  "Monthly",
  "As needed",
] as const;

export const estimatedSpendOptions = [
  "Under ₦25,000",
  "₦25,000 - ₦50,000",
  "₦50,000 - ₦100,000",
  "₦100,000 - ₦250,000",
  "₦250,000+",
  "Not sure yet",
] as const;

export const deliveryPreferenceOptions = [
  "Delivery",
  "Pickup",
  "Either delivery or pickup",
  "Group-buy delivery",
] as const;

export const timingOptions = [
  "Today",
  "Tomorrow",
  "This week",
  "Next week",
  "Recurring",
  "Flexible",
] as const;

export const enquiryTypeOptions = [
  "Buyer account request",
  "Order support",
  "Payment / receipt",
  "Delivery / pickup",
  "Supplier / partner enquiry",
  "General enquiry",
] as const;

export const staffStatusOptions = [
  "Active",
  "Suspended",
  "Inactive",
] as const;

export const productCategoryOptions = [
  "Vegetables",
  "Fruits",
  "Tubers",
  "Grains",
  "Seeds",
  "Spices / herbs",
  "Poultry",
  "Meat",
  "Fish / seafood",
  "Seasonal / other",
] as const;

export const productUnitOptions = [
  "kg",
  "bag",
  "basket",
  "crate",
  "bunch",
  "piece",
  "dozen",
  "tray",
  "carton",
  "paint bucket",
] as const;

export const productAvailabilityOptions = [
  "Available",
  "Limited",
  "Seasonal",
  "Unavailable",
] as const;

export const productStatusOptions = [
  "Active",
  "Paused",
  "Archived",
] as const;
