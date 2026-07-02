PRAGMA foreign_keys = OFF;

DELETE FROM "Complaint";
DELETE FROM "Payment";
DELETE FROM "OrderItem";
DELETE FROM "Order";
DELETE FROM "Product";
DELETE FROM "Supplier";
DELETE FROM "Customer";
DELETE FROM "PickupLocation";

PRAGMA foreign_keys = ON;

INSERT INTO "Customer" (
  id, name, phone, email, buyerType, location, paymentTerms, creditLimit, status, createdAt, updatedAt
) VALUES
  ('cust_mama_t_foods', 'Mama T Foods', '+2348000000001', 'orders@mamatfoods.example', 'Restaurant', 'Yaba, Lagos', 'Deposit before sourcing, balance before dispatch', 150000, 'Active', datetime('now'), datetime('now')),
  ('cust_chika_household', 'Chika Household', '+2348000000002', NULL, 'Large household', 'Ikeja, Lagos', 'Full payment before sourcing', 0, 'Active', datetime('now'), datetime('now')),
  ('cust_green_bowl', 'Green Bowl Caterers', '+2348000000003', 'procurement@greenbowl.example', 'Caterer', 'Lekki, Lagos', 'Full payment or approved deposit', 75000, 'Active', datetime('now'), datetime('now')),
  ('cust_urban_mart', 'Urban Mini Mart', '+2348000000004', 'buying@urbanmart.example', 'Retailer', 'Surulere, Lagos', '7-day credit after approval', 500000, 'Credit approved', datetime('now'), datetime('now'));

INSERT INTO "Product" (
  id, name, category, unit, grade, basePrice, availability, status, createdAt, updatedAt
) VALUES
  ('prod_tomatoes_a', 'Tomatoes', 'Vegetables', 'basket', 'Grade A', 22000, 'Available', 'Active', datetime('now'), datetime('now')),
  ('prod_pepper_a', 'Fresh pepper', 'Vegetables', 'bag', 'Grade A', 18000, 'Available', 'Active', datetime('now'), datetime('now')),
  ('prod_onions_standard', 'Onions', 'Vegetables', 'bag', 'Standard', 30000, 'Limited', 'Active', datetime('now'), datetime('now')),
  ('prod_rice_50kg', 'Rice', 'Grains', '50kg bag', 'Standard', 72000, 'Available', 'Active', datetime('now'), datetime('now'));

INSERT INTO "Supplier" (
  id, name, type, phone, location, produceFocus, reliability, paymentMethod, status, createdAt, updatedAt
) VALUES
  ('supp_kaduna_veg_cluster', 'Kaduna Vegetable Cluster', '+2348111111111', 'Farmer group', 'Kaduna', 'Tomatoes, pepper, onions', 'Trusted', 'Bank transfer', 'Active', datetime('now'), datetime('now')),
  ('supp_oyo_aggregator', 'Oyo Fresh Produce Aggregator', '+2348222222222', 'Aggregator', 'Oyo', 'Yam, cassava, plantain', 'Verified', 'Bank transfer', 'Active', datetime('now'), datetime('now')),
  ('supp_niger_grains', 'Niger Grains Cooperative', '+2348333333333', 'Cooperative', 'Niger State', 'Rice, beans, maize', 'Unrated', 'Bank transfer', 'Pilot', datetime('now'), datetime('now'));

INSERT INTO "PickupLocation" (
  id, name, area, address, fee, days, status, createdAt, updatedAt
) VALUES
  ('pickup_yaba', 'Yaba Collection Point', 'Yaba', 'Listed pickup partner location', 0, 'Wednesday, Saturday', 'Active', datetime('now'), datetime('now')),
  ('pickup_ikeja', 'Ikeja Office Pickup', 'Ikeja', 'OneFarmTech office / dispatch point', 0, 'Monday to Saturday', 'Active', datetime('now'), datetime('now')),
  ('pickup_lekki', 'Lekki Weekend Pickup', 'Lekki', 'Weekend collection partner', 1000, 'Saturday', 'Pilot', datetime('now'), datetime('now'));

INSERT INTO "Order" (
  id, code, customerId, buyerName, phone, buyerType, orderType, paymentStatus,
  fulfilmentStatus, deliveryMethod, deliveryNote, estimatedTotal, adminNote, createdAt, updatedAt
) VALUES
  ('order_0001', 'OFT-0001', 'cust_mama_t_foods', 'Mama T Foods', '+2348000000001', 'Restaurant', 'Direct', 'Deposit paid', 'Approved for sourcing', 'Platform delivery', 'Deliver to Yaba before 11am', 100000, 'Priority restaurant buyer. Confirm grade before dispatch.', datetime('now'), datetime('now')),
  ('order_0002', 'OFT-0002', 'cust_chika_household', 'Chika Household', '+2348000000002', 'Large household', 'Group-buy', 'Fully paid', 'Ready for dispatch', 'Pickup from listed location', 'Pickup from Ikeja office', 22000, 'Part of tomato group-buy.', datetime('now'), datetime('now')),
  ('order_0003', 'OFT-0003', 'cust_green_bowl', 'Green Bowl Caterers', '+2348000000003', 'Caterer', 'Recurring', 'Unpaid', 'Awaiting customer confirmation', 'Scheduled delivery', 'Needs weekly supply quote', 0, 'Confirm recurring order volume before sourcing.', datetime('now'), datetime('now')),
  ('order_0004', 'OFT-0004', 'cust_urban_mart', 'Urban Mini Mart', '+2348000000004', 'Retailer', 'Direct', 'Credit approved', 'Sourcing', 'Platform delivery', 'Deliver to Surulere store', 460000, 'Credit approved buyer. Track payment due date later.', datetime('now'), datetime('now'));

INSERT INTO "OrderItem" (
  id, orderId, productId, name, grade, quantity, unit, unitPrice, lineTotal
) VALUES
  ('item_0001', 'order_0001', 'prod_tomatoes_a', 'Tomatoes', 'Grade A', 3, 'basket', 22000, 66000),
  ('item_0002', 'order_0001', 'prod_pepper_a', 'Fresh pepper', 'Grade A', 2, 'bag', 17000, 34000),
  ('item_0003', 'order_0002', 'prod_tomatoes_a', 'Tomatoes', 'Grade A', 1, 'basket', 22000, 22000),
  ('item_0004', 'order_0004', 'prod_rice_50kg', 'Rice', 'Standard', 5, '50kg bag', 72000, 360000),
  ('item_0005', 'order_0004', 'prod_onions_standard', 'Onions', 'Standard', 3, 'bag', 33333, 100000);

INSERT INTO "Payment" (
  id, orderId, reference, provider, amount, status, paidAt, createdAt
) VALUES
  ('pay_0001', 'order_0001', 'PAY-OFT-0001', 'Paystack', 100000, 'Deposit paid', datetime('now'), datetime('now')),
  ('pay_0002', 'order_0002', 'PAY-OFT-0002', 'Bank transfer', 22000, 'Fully paid', datetime('now'), datetime('now')),
  ('pay_0004', 'order_0004', 'PAY-OFT-0004', 'Credit terms', 460000, 'Credit approved', NULL, datetime('now'));

INSERT INTO "Complaint" (
  id, orderId, code, issue, priority, status, resolution, createdAt, updatedAt
) VALUES
  ('cmp_0001', 'order_0001', 'CMP-001', 'Tomatoes softer than expected', 'Medium', 'Under review', 'Quality photo requested', datetime('now'), datetime('now')),
  ('cmp_0002', 'order_0002', 'CMP-002', 'Pickup time unclear', 'Low', 'Resolved', 'Pickup message resent', datetime('now'), datetime('now'));
