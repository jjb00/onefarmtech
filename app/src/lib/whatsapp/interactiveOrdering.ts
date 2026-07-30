import {prisma} from "@/lib/prisma";
import {sendWhatsAppButtonsMessage, sendWhatsAppListMessage, sendWhatsAppTextMessage} from "@/lib/whatsapp/provider";
import {formatWhatsAppNaira, isProductAvailableForWhatsApp} from "@/lib/whatsapp/productCatalogue";
import {
  addToCart,
  cartTotal,
  clearOrderSession,
  getOrderSession,
  upsertOrderSession,
  type WhatsAppCartItem,
} from "@/lib/whatsapp/orderSession";
import {fulfilmentEstimateForStockTypes} from "@/lib/commerce/fulfilmentEstimate";
import {initialFulfilmentStatus} from "@/lib/orderStatusRules.js";
import {createAuditLog} from "@/lib/auditLog";
import {replyWithOrderStatus} from "@/lib/whatsapp/statusReply";

const MENU_BUTTONS = [
  {id: "menu_browse", title: "Browse & Order"},
  {id: "menu_track", title: "Track my order"},
  {id: "menu_support", title: "Talk to support"},
];

async function sendMainMenu(to: string) {
  await sendWhatsAppButtonsMessage({
    to,
    body: "Welcome to OneFarmTech 🌱\nWhat would you like to do?",
    buttons: MENU_BUTTONS,
  });
}

async function sendProductList(to: string) {
  const products = await prisma.product.findMany({
    where: {status: "Active"},
    orderBy: [{category: "asc"}, {name: "asc"}],
    take: 10,
  });
  const available = products.filter(isProductAvailableForWhatsApp);

  if (!available.length) {
    await sendWhatsAppTextMessage({
      to,
      body: "Our produce list is being updated right now. Reply with what you need and the team will confirm shortly.",
    });
    return;
  }

  await sendWhatsAppListMessage({
    to,
    header: "Today's produce",
    body: "Pick an item to add to your order.",
    buttonLabel: "View items",
    sections: [
      {
        title: "Available now",
        rows: available.map((product) => ({
          id: `product_${product.id}`,
          title: product.name,
          description: `${formatWhatsAppNaira(product.basePrice)} / ${product.unit}`,
        })),
      },
    ],
  });
}

function cartSummary(cart: WhatsAppCartItem[]) {
  const lines = cart.map(
    (item) => `${item.quantity} ${item.unit} ${item.name} — ${formatWhatsAppNaira(item.unitPrice * item.quantity)}`,
  );
  lines.push("", `Total: ${formatWhatsAppNaira(cartTotal(cart))}`);
  return lines.join("\n");
}

async function sendCartReview(to: string, cart: WhatsAppCartItem[]) {
  await sendWhatsAppButtonsMessage({
    to,
    body: `Your order so far:\n\n${cartSummary(cart)}`,
    buttons: [
      {id: "cart_checkout", title: "Checkout"},
      {id: "cart_add_more", title: "Add another item"},
      {id: "cart_cancel", title: "Cancel order"},
    ],
  });
}

async function nextOrderCode() {
  const count = await prisma.order.count();
  return `OFT-${String(count + 1).padStart(5, "0")}`;
}

async function checkout(input: {to: string; from: string; customerId: string | null; cart: WhatsAppCartItem[]}) {
  const {cart} = input;

  if (!cart.length) {
    await sendWhatsAppTextMessage({to: input.to, body: 'Your cart is empty. Reply "menu" to start an order.'});
    return;
  }

  const subtotal = cartTotal(cart);
  const {label} = fulfilmentEstimateForStockTypes(cart.map((item) => item.stockType));
  const customer = input.customerId ? await prisma.customer.findUnique({where: {id: input.customerId}}) : null;

  const order = await prisma.order.create({
    data: {
      code: await nextOrderCode(),
      customerId: input.customerId,
      buyerName: customer?.name || "WhatsApp buyer",
      phone: input.from,
      buyerType: customer?.buyerType || "WhatsApp buyer",
      orderType: "WhatsApp self-service",
      paymentStatus: "Payment pending",
      fulfilmentStatus: initialFulfilmentStatus("Delivery", "WhatsApp order received"),
      deliveryMethod: "Delivery",
      source: "WhatsApp",
      sourcePhone: input.from,
      subtotal,
      totalAmount: subtotal,
      estimatedTotal: subtotal,
      adminNote: `Created automatically from the WhatsApp ordering flow. Estimated fulfilment: ${label}.`,
      items: {
        create: cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          grade: "Standard",
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          lineTotal: item.unitPrice * item.quantity,
        })),
      },
    },
  });

  const reference = `PAY-${order.code}-${Date.now().toString(36).toUpperCase()}`;

  await prisma.paymentRequest.create({
    data: {
      orderId: order.id,
      customerId: input.customerId,
      provider: "Manual",
      reference,
      amount: subtotal,
      currency: "NGN",
      status: "Pending",
    },
  });

  await prisma.order.update({where: {id: order.id}, data: {paymentReference: reference}});

  await createAuditLog({
    action: "Created order from WhatsApp self-service ordering",
    entityType: "Order",
    entityId: order.id,
    entityLabel: order.code,
    actorName: "WhatsApp bot",
    actorRole: "System",
    newValue: {code: order.code, subtotal, itemCount: cart.length, fulfilmentEstimate: label},
  });

  await sendWhatsAppTextMessage({
    to: input.to,
    body: [
      `Order ${order.code} received. Thank you!`,
      "",
      cartSummary(cart),
      "",
      `Estimated fulfilment: ${label}.`,
      "",
      'The team will confirm final pricing and send a payment link shortly. Reply "menu" any time for options.',
    ].join("\n"),
  });

  await clearOrderSession(input.from);
}

/**
 * Routes an inbound WhatsApp message through the interactive ordering
 * flow when it's a button/list reply, a quantity reply while mid-flow, or
 * a fresh shopping-intent message that should surface the main menu.
 * Returns handled: true when this module has fully responded and the
 * webhook's generic pipeline (draft creation, catalogue text auto-reply)
 * should be skipped for this message.
 */
export async function handleInteractiveOrderingMessage(input: {
  from: string;
  body: string;
  message: {type?: string; interactive?: {button_reply?: {id?: string}; list_reply?: {id?: string}}};
  customerId: string | null;
  triggerMenu: boolean;
}): Promise<{handled: boolean}> {
  const {from, message, customerId} = input;

  const interactiveReplyId =
    message?.type === "interactive"
      ? message?.interactive?.button_reply?.id || message?.interactive?.list_reply?.id || null
      : null;

  if (interactiveReplyId) {
    if (interactiveReplyId === "menu_browse" || interactiveReplyId === "cart_add_more") {
      await sendProductList(from);
      await upsertOrderSession({phone: from, step: "browsing", customerId});
      return {handled: true};
    }

    if (interactiveReplyId === "menu_track") {
      const result = await replyWithOrderStatus({to: from, customerId});
      if (!result.sent) {
        await sendWhatsAppTextMessage({
          to: from,
          body: 'We could not find a recent order for this number. Reply "menu" for options or ask the team directly.',
        });
      }
      return {handled: true};
    }

    if (interactiveReplyId === "menu_support") {
      await sendWhatsAppTextMessage({
        to: from,
        body: "A team member will be with you shortly. You can describe your question now and we'll pick it up.",
      });
      return {handled: true};
    }

    if (interactiveReplyId.startsWith("product_")) {
      const productId = interactiveReplyId.slice("product_".length);
      const product = await prisma.product.findUnique({where: {id: productId}});

      if (!product) {
        await sendWhatsAppTextMessage({to: from, body: 'That item is no longer available. Reply "menu" to see current options.'});
        return {handled: true};
      }

      await upsertOrderSession({phone: from, step: "awaiting_quantity", pendingProductId: product.id, customerId});
      await sendWhatsAppTextMessage({
        to: from,
        body: `How many ${product.unit} of ${product.name} would you like? Just reply with a number.`,
      });
      return {handled: true};
    }

    if (interactiveReplyId === "cart_checkout") {
      const session = await getOrderSession(from);
      await checkout({to: from, from, customerId, cart: session?.cart || []});
      return {handled: true};
    }

    if (interactiveReplyId === "cart_cancel") {
      await clearOrderSession(from);
      await sendWhatsAppTextMessage({to: from, body: 'Order cancelled. Reply "menu" any time to start again.'});
      return {handled: true};
    }

    return {handled: false};
  }

  const session = await getOrderSession(from);

  if (session?.step === "awaiting_quantity" && session.pendingProductId) {
    const quantity = parseInt(String(input.body || "").replace(/[^\d]/g, ""), 10);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      await sendWhatsAppTextMessage({to: from, body: "Please reply with a number, e.g. 2"});
      return {handled: true};
    }

    const product = await prisma.product.findUnique({where: {id: session.pendingProductId}});

    if (!product) {
      await clearOrderSession(from);
      await sendWhatsAppTextMessage({to: from, body: 'That item is no longer available. Reply "menu" to see current options.'});
      return {handled: true};
    }

    const updated = await addToCart(from, {
      productId: product.id,
      name: product.name,
      unit: product.unit,
      unitPrice: product.basePrice,
      quantity,
      stockType: product.stockType,
    });

    await sendCartReview(from, updated.cart);
    return {handled: true};
  }

  if (input.triggerMenu && !session) {
    await sendMainMenu(from);
    return {handled: true};
  }

  return {handled: false};
}
