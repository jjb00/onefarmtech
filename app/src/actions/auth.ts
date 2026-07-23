"use server";

import {cookies} from "next/headers";
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

  if (!buyerIdentifier || !buyerAccessCode) {
    redirect("/buyer-login?error=missing");
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
    redirect("/buyer-login?error=invalid");
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
    redirect("/buyer-login?error=identifier");
  }

  if (invite.status.toLowerCase().includes("cancel")) {
    redirect("/buyer-login?error=cancelled");
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    redirect("/buyer-login?error=expired");
  }

  if (!isBuyerLoginEligible(customer, matchingContact)) {
    redirect("/buyer-login?error=not-ready");
  }

  if (!matchingContact || matchingContact.status !== "Active") {
    redirect("/buyer-login?error=contact");
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
