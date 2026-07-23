import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {verifySessionToken} from "@/lib/sessionToken";
import {isBuyerLoginEligible} from "@/lib/buyerOtp";

export const BUYER_SESSION_COOKIE = "oft_buyer_session";
export const BUYER_CUSTOMER_ID_COOKIE = "oft_buyer_customer_id";
export const BUYER_CONTACT_NAME_COOKIE = "oft_buyer_contact_name";
export const BUYER_CONTACT_ROLE_COOKIE = "oft_buyer_contact_role";
export const BUYER_INVITE_ID_COOKIE = "oft_buyer_invite_id";
export const BUYER_CONTACT_ID_COOKIE = "oft_buyer_contact_id";
export const BUYER_CONTACT_REVISION_COOKIE = "oft_buyer_contact_revision";
export const BUYER_AUTH_MODE_COOKIE = "oft_buyer_auth_mode";

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
  authMode: "invite-code" | "email-otp";
};

export async function getCurrentBuyerActor(): Promise<CurrentBuyerActor> {
  const cookieStore = await cookies();

  const customerId = cookieStore.get(BUYER_CUSTOMER_ID_COOKIE)?.value || null;
  const inviteId = cookieStore.get(BUYER_INVITE_ID_COOKIE)?.value || null;
  const contactId = cookieStore.get(BUYER_CONTACT_ID_COOKIE)?.value || null;
  const contactRevision = cookieStore.get(BUYER_CONTACT_REVISION_COOKIE)?.value || null;
  const authMode = cookieStore.get(BUYER_AUTH_MODE_COOKIE)?.value === "email-otp"
    ? "email-otp"
    : "invite-code";
  const [customer, contact, invite] = await Promise.all([
    customerId ? prisma.customer.findUnique({where: {id: customerId}}) : null,
    contactId ? prisma.buyerContact.findUnique({where: {id: contactId}}) : null,
    authMode === "invite-code" && inviteId
      ? prisma.buyerAccountInvite.findUnique({where: {id: inviteId}})
      : null,
  ]);
  const subject = authMode === "email-otp"
    ? `${customerId}:email-otp:${contactId}:${contactRevision}`
    : `${customerId}:${inviteId}:${contactId}:${contactRevision}`;
  const isAuthenticated = Boolean(
    customerId && contactId && contactRevision && contact &&
    isBuyerLoginEligible(customer, contact) &&
    contact.customerId === customerId && contact.status === "Active" &&
    contact.updatedAt.toISOString() === contactRevision &&
    (authMode === "email-otp" || Boolean(
      invite &&
      invite.customerId === customerId &&
      !invite.status.toLowerCase().includes("cancel")
    )) &&
    verifySessionToken(
      cookieStore.get(BUYER_SESSION_COOKIE)?.value,
      "buyer",
      subject,
    ),
  );

  return {
    isAuthenticated,
    customerId,
    inviteId: isAuthenticated && authMode === "invite-code" ? inviteId : null,
    contactId: isAuthenticated ? contactId : null,
    contactName: isAuthenticated ? contact!.name : null,
    contactRole: isAuthenticated ? contact!.role : null,
    canPlaceOrders: isAuthenticated ? contact!.canPlaceOrders : false,
    canViewReceipts: isAuthenticated ? contact!.canViewReceipts : false,
    canViewCredit: isAuthenticated ? contact!.canViewCredit : false,
    authMode,
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
