import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {verifySessionToken} from "@/lib/sessionToken";

export const BUYER_SESSION_COOKIE = "oft_buyer_session";
export const BUYER_CUSTOMER_ID_COOKIE = "oft_buyer_customer_id";
export const BUYER_CONTACT_NAME_COOKIE = "oft_buyer_contact_name";
export const BUYER_CONTACT_ROLE_COOKIE = "oft_buyer_contact_role";
export const BUYER_INVITE_ID_COOKIE = "oft_buyer_invite_id";

export type CurrentBuyerActor = {
  isAuthenticated: boolean;
  customerId: string | null;
  inviteId: string | null;
  contactName: string | null;
  contactRole: string | null;
  authMode: "invite-code";
};

export async function getCurrentBuyerActor(): Promise<CurrentBuyerActor> {
  const cookieStore = await cookies();

  const customerId = cookieStore.get(BUYER_CUSTOMER_ID_COOKIE)?.value || null;
  const inviteId = cookieStore.get(BUYER_INVITE_ID_COOKIE)?.value || null;
  const isAuthenticated = Boolean(
    customerId && inviteId && verifySessionToken(
      cookieStore.get(BUYER_SESSION_COOKIE)?.value,
      "buyer",
      `${customerId}:${inviteId}`,
    ),
  );

  return {
    isAuthenticated,
    customerId,
    inviteId,
    contactName: cookieStore.get(BUYER_CONTACT_NAME_COOKIE)?.value || null,
    contactRole: cookieStore.get(BUYER_CONTACT_ROLE_COOKIE)?.value || null,
    authMode: "invite-code",
  };
}

export async function requireBuyer() {
  const buyer = await getCurrentBuyerActor();

  if (!buyer.isAuthenticated || !buyer.customerId) {
    redirect("/buyer-account-request?buyerLogin=required");
  }

  const customer = await prisma.customer.findUnique({
    where: {id: buyer.customerId},
    include: {
      buyerContacts: {
        orderBy: {createdAt: "desc"},
      },
      buyerInvites: {
        orderBy: {createdAt: "desc"},
      },
      orders: {
        orderBy: {createdAt: "desc"},
        take: 8,
      },
      receipts: {
        orderBy: {issuedAt: "desc"},
        take: 8,
      },
    },
  });

  if (!customer || customer.status !== "Active" || !customer.accountLoginReady) {
    redirect("/buyer-account-request?buyerLogin=not-ready");
  }

  return {
    buyer,
    customer,
  };
}

export async function getCurrentBuyer() {
  return getCurrentBuyerActor();
}
