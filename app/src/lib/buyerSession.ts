import {cookies} from "next/headers";
import {
  BUYER_AUTH_MODE_COOKIE,
  BUYER_CONTACT_ID_COOKIE,
  BUYER_CONTACT_NAME_COOKIE,
  BUYER_CONTACT_REVISION_COOKIE,
  BUYER_CONTACT_ROLE_COOKIE,
  BUYER_CUSTOMER_ID_COOKIE,
  BUYER_INVITE_ID_COOKIE,
  BUYER_SESSION_COOKIE,
} from "@/lib/currentBuyer";
import {createSessionToken} from "@/lib/sessionToken";

export async function createBuyerSession(input: {
  customerId: string;
  contact: {id: string; name: string; role: string; updatedAt: Date};
  authMode: "invite-code" | "email-otp";
  inviteId?: string | null;
}) {
  const revision = input.contact.updatedAt.toISOString();
  const inviteId = input.authMode === "invite-code" ? input.inviteId || "" : "";
  const subject = input.authMode === "email-otp"
    ? `${input.customerId}:email-otp:${input.contact.id}:${revision}`
    : `${input.customerId}:${inviteId}:${input.contact.id}:${revision}`;
  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };

  cookieStore.set(BUYER_SESSION_COOKIE, createSessionToken("buyer", subject), cookieOptions);
  cookieStore.set(BUYER_CUSTOMER_ID_COOKIE, input.customerId, cookieOptions);
  cookieStore.set(BUYER_CONTACT_ID_COOKIE, input.contact.id, cookieOptions);
  cookieStore.set(BUYER_CONTACT_REVISION_COOKIE, revision, cookieOptions);
  cookieStore.set(BUYER_CONTACT_NAME_COOKIE, input.contact.name, cookieOptions);
  cookieStore.set(BUYER_CONTACT_ROLE_COOKIE, input.contact.role, cookieOptions);
  cookieStore.set(BUYER_AUTH_MODE_COOKIE, input.authMode, cookieOptions);

  if (inviteId) cookieStore.set(BUYER_INVITE_ID_COOKIE, inviteId, cookieOptions);
  else cookieStore.set(BUYER_INVITE_ID_COOKIE, "", {...cookieOptions, maxAge: 0});
}
