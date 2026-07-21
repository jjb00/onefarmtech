import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {verifySessionToken} from "@/lib/sessionToken";

export const BUYER_SESSION_COOKIE = "oft_buyer_session";
export const BUYER_CUSTOMER_ID_COOKIE = "oft_buyer_customer_id";
export const BUYER_CONTACT_NAME_COOKIE = "oft_buyer_contact_name";
export const BUYER_CONTACT_ROLE_COOKIE = "oft_buyer_contact_role";
export const BUYER_INVITE_ID_COOKIE = "oft_buyer_invite_id";
export const BUYER_CONTACT_ID_COOKIE = "oft_buyer_contact_id";
export const BUYER_CONTACT_REVISION_COOKIE = "oft_buyer_contact_revision";

export type CurrentBuyerActor = {
  isAuthenticated: boolean;
  customerId: string | null;
  inviteId: string | null;
  contactName: string | null;
  contactRole: string | null;
  contactId: string | null;
  canPlaceOrders: boolean;
  canViewReceipts: boolean;
  canViewCredit: boolean;
  authMode: "invite-code";
};

export async function getCurrentBuyerActor(): Promise<CurrentBuyerActor> {
  const cookieStore = await cookies();

  const customerId = cookieStore.get(BUYER_CUSTOMER_ID_COOKIE)?.value || null;
  const inviteId = cookieStore.get(BUYER_INVITE_ID_COOKIE)?.value || null;
  const contactId = cookieStore.get(BUYER_CONTACT_ID_COOKIE)?.value || null;
  const contactRevision = cookieStore.get(BUYER_CONTACT_REVISION_COOKIE)?.value || null;
  const contact = contactId ? await prisma.buyerContact.findUnique({where: {id: contactId}}) : null;
  const invite = inviteId ? await prisma.buyerAccountInvite.findUnique({where: {id: inviteId}}) : null;
  const isAuthenticated = Boolean(
    customerId && inviteId && contactId && contactRevision && contact && invite &&
    contact.customerId === customerId && contact.status === "Active" && contact.updatedAt.toISOString() === contactRevision &&
    invite.customerId === customerId && !invite.status.toLowerCase().includes("cancel") &&
    verifySessionToken(
      cookieStore.get(BUYER_SESSION_COOKIE)?.value,
      "buyer",
      `${customerId}:${inviteId}:${contactId}:${contactRevision}`,
    ),
  );

  return {
    isAuthenticated,
    customerId,
    inviteId,
    contactId: isAuthenticated ? contactId : null,
    contactName: isAuthenticated ? contact!.name : null,
    contactRole: isAuthenticated ? contact!.role : null,
    canPlaceOrders: isAuthenticated ? contact!.canPlaceOrders : false,
    canViewReceipts: isAuthenticated ? contact!.canViewReceipts : false,
    canViewCredit: isAuthenticated ? contact!.canViewCredit : false,
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

export type BuyerCapability = "canPlaceOrders" | "canViewReceipts" | "canViewCredit";
export async function requireBuyerCapability(capability: BuyerCapability) {
  const result = await requireBuyer();
  if (!result.buyer[capability]) redirect(`/buyer-account?permission=${capability}`);
  return result;
}

export async function getCurrentBuyer() {
  return getCurrentBuyerActor();
}
