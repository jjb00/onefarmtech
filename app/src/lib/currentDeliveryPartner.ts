import {cookies} from "next/headers";
import {prisma} from "@/lib/prisma";

const SESSION_COOKIE = "oft_delivery_partner_session";
const PARTNER_ID_COOKIE = "oft_delivery_partner_id";

export async function getCurrentDeliveryPartner() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  const partnerId = cookieStore.get(PARTNER_ID_COOKIE)?.value;

  if (!session || !partnerId) {
    return null;
  }

  const partner = await prisma.deliveryPartner.findFirst({
    where: {
      id: partnerId,
      status: "Active",
      accessStatus: "Active",
    },
  });

  if (!partner || session !== `delivery-partner:${partner.id}`) {
    return null;
  }

  return partner;
}

export async function setDeliveryPartnerSession(partnerId: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, `delivery-partner:${partnerId}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  cookieStore.set(PARTNER_ID_COOKIE, partnerId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearDeliveryPartnerSession() {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  cookieStore.set(PARTNER_ID_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
