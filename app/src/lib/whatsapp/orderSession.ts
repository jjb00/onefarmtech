import {prisma} from "@/lib/prisma";

// Cart/step state for one WhatsApp phone number, kept between separate
// stateless webhook calls. Sessions expire after a period of inactivity so
// an abandoned browse doesn't linger forever.
export const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

export type WhatsAppCartItem = {
  productId: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  stockType: string;
};

export type WhatsAppOrderStep = "browsing" | "awaiting_quantity" | "cart_review";

function parseCart(raw: string): WhatsAppCartItem[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getOrderSession(phone: string) {
  const session = await prisma.whatsAppOrderSession.findUnique({where: {phone}});
  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.whatsAppOrderSession.delete({where: {phone}}).catch(() => {});
    return null;
  }

  return {...session, cart: parseCart(session.cart)};
}

export async function upsertOrderSession(input: {
  phone: string;
  step: WhatsAppOrderStep;
  cart?: WhatsAppCartItem[];
  customerId?: string | null;
  pendingProductId?: string | null;
}) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const existing = await prisma.whatsAppOrderSession.findUnique({where: {phone: input.phone}});
  const cart = input.cart ?? (existing ? parseCart(existing.cart) : []);

  const session = await prisma.whatsAppOrderSession.upsert({
    where: {phone: input.phone},
    create: {
      phone: input.phone,
      step: input.step,
      cart: JSON.stringify(cart),
      customerId: input.customerId || null,
      pendingProductId: input.pendingProductId || null,
      expiresAt,
    },
    update: {
      step: input.step,
      cart: JSON.stringify(cart),
      ...(input.customerId !== undefined ? {customerId: input.customerId} : {}),
      pendingProductId: input.pendingProductId !== undefined ? input.pendingProductId : null,
      expiresAt,
    },
  });

  return {...session, cart};
}

export async function addToCart(phone: string, item: WhatsAppCartItem) {
  const session = await getOrderSession(phone);
  const cart = session?.cart || [];
  const existingLine = cart.find((line) => line.productId === item.productId);

  const nextCart = existingLine
    ? cart.map((line) => (line.productId === item.productId ? {...line, quantity: line.quantity + item.quantity} : line))
    : [...cart, item];

  return upsertOrderSession({phone, step: "cart_review", cart: nextCart, customerId: session?.customerId});
}

export async function clearOrderSession(phone: string) {
  await prisma.whatsAppOrderSession.delete({where: {phone}}).catch(() => {});
}

export function cartTotal(cart: WhatsAppCartItem[]) {
  return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}
