"use server";

import {cookies, headers} from "next/headers";
import {redirect} from "next/navigation";
import {
  STAFF_SESSION_COOKIE,
} from "@/lib/currentStaff";
import {
  BUYER_CONTACT_NAME_COOKIE,
  BUYER_CONTACT_ROLE_COOKIE,
  BUYER_CUSTOMER_ID_COOKIE,
  BUYER_INVITE_ID_COOKIE,
  BUYER_CONTACT_ID_COOKIE,
  BUYER_CONTACT_REVISION_COOKIE,
  BUYER_SESSION_COOKIE,
  BUYER_AUTH_MODE_COOKIE,
} from "@/lib/currentBuyer";
import {prisma} from "@/lib/prisma";
import {createBuyerSession} from "@/lib/buyerSession";
import {
  BUYER_OTP_CHALLENGE_COOKIE,
  isBuyerLoginEligible,
} from "@/lib/buyerOtp";
import {isLoginRateLimited, loginFingerprint, recordLoginAttempt} from "@/lib/loginRateLimit.js";

function readText(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeIdentity(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function normalizePhone(value: string | null | undefined) {
  return (value || "").replace(/\D/g, "");
}

function identityMatches(input: string, target: string | null | undefined) {
  if (!input || !target) {
    return false;
  }

  const inputText = normalizeIdentity(input);
  const targetText = normalizeIdentity(target);

  if (inputText === targetText) {
    return true;
  }

  const inputPhone = normalizePhone(input);
  const targetPhone = normalizePhone(target);

  return Boolean(inputPhone && targetPhone && inputPhone === targetPhone);
}

export async function logoutAction() {
  const cookieStore = await cookies();

  for (const cookieName of [
    STAFF_SESSION_COOKIE,
  ]) {
    cookieStore.set(cookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }

  redirect("/staff-login");
}

export async function buyerLoginAction(formData: FormData) {
  const buyerIdentifier = readText(formData, "buyerIdentifier");
  const buyerAccessCode = readText(formData, "buyerAccessCode").toUpperCase();

  const requestHeaders = await headers();
  const ipAddress =
    requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const fingerprint = loginFingerprint("buyer", buyerIdentifier, ipAddress, process.env.SESSION_SECRET);

  async function reject(error: string): Promise<never> {
    await recordLoginAttempt({
      db: prisma,
      action: "Rejected buyer login",
      fingerprint,
      actorEmail: buyerIdentifier || null,
    });
    redirect(`/buyer-login?error=${error}`);
  }

  if (!buyerIdentifier || !buyerAccessCode) {
    return reject("missing");
  }

  if (await isLoginRateLimited({db: prisma, action: "Rejected buyer login", fingerprint})) {
    await recordLoginAttempt({
      db: prisma,
      action: "Rate limited buyer login",
      fingerprint,
      actorEmail: buyerIdentifier || null,
    });
    redirect("/buyer-login?error=too-many-attempts");
  }

  const invite = await prisma.buyerAccountInvite.findUnique({
    where: {inviteCode: buyerAccessCode},
    include: {
      customer: {
        include: {
          buyerContacts: {
            orderBy: {createdAt: "desc"},
          },
        },
      },
    },
  });

  if (!invite) {
    return reject("invalid");
  }

  const customer = invite.customer;

  const inviteTargetMatches =
    identityMatches(buyerIdentifier, invite.email) ||
    identityMatches(buyerIdentifier, invite.phone);

  const customerTargetMatches =
    identityMatches(buyerIdentifier, customer.email) ||
    identityMatches(buyerIdentifier, customer.phone);

  const matchingContact = customer.buyerContacts.find(
    (contact) =>
      identityMatches(buyerIdentifier, contact.email) ||
      identityMatches(buyerIdentifier, contact.phone),
  );

  if (!inviteTargetMatches && !customerTargetMatches && !matchingContact) {
    return reject("identifier");
  }

  if (invite.status.toLowerCase().includes("cancel")) {
    return reject("cancelled");
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return reject("expired");
  }

  if (!isBuyerLoginEligible(customer, matchingContact)) {
    return reject("not-ready");
  }

  if (!matchingContact || matchingContact.status !== "Active") {
    return reject("contact");
  }

  const updatedInvite = await prisma.buyerAccountInvite.update({
    where: {id: invite.id},
    data: {
      acceptedAt: invite.acceptedAt || new Date(),
      status: invite.status === "Ready to send" || invite.status === "Sent manually"
        ? "Accepted"
        : invite.status,
    },
  });

  await recordLoginAttempt({
    db: prisma,
    action: "Completed buyer login",
    fingerprint,
    actorEmail: buyerIdentifier,
    entityId: customer.id,
  });

  await createBuyerSession({
    customerId: customer.id,
    contact: matchingContact,
    authMode: "invite-code",
    inviteId: updatedInvite.id,
  });

  redirect("/buyer-account");
}

export async function buyerLogoutAction() {
  const cookieStore = await cookies();

  for (const cookieName of [
    BUYER_SESSION_COOKIE,
    BUYER_CUSTOMER_ID_COOKIE,
    BUYER_CONTACT_NAME_COOKIE,
    BUYER_CONTACT_ROLE_COOKIE,
    BUYER_INVITE_ID_COOKIE,
    BUYER_CONTACT_ID_COOKIE,
    BUYER_CONTACT_REVISION_COOKIE,
    BUYER_AUTH_MODE_COOKIE,
    BUYER_OTP_CHALLENGE_COOKIE,
  ]) {
    cookieStore.set(cookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }

  redirect("/buyer-login");
}
