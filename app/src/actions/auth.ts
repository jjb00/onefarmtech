"use server";

import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {
  STAFF_EMAIL_COOKIE,
  STAFF_NAME_COOKIE,
  STAFF_ROLE_COOKIE,
  STAFF_SESSION_COOKIE,
} from "@/lib/currentStaff";
import {
  BUYER_CONTACT_NAME_COOKIE,
  BUYER_CONTACT_ROLE_COOKIE,
  BUYER_CUSTOMER_ID_COOKIE,
  BUYER_INVITE_ID_COOKIE,
  BUYER_SESSION_COOKIE,
} from "@/lib/currentBuyer";
import {isStaffRole} from "@/lib/permissions";
import {prisma} from "@/lib/prisma";

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

export async function loginAction(formData: FormData) {
  const password = readText(formData, "password");
  const nextPath = readText(formData, "next", "/admin");
  const staffName = readText(formData, "staffName", "Local staff user");
  const staffEmail = readText(formData, "staffEmail");
  const roleInput = readText(formData, "staffRole", "Admin");
  const staffRole = isStaffRole(roleInput) ? roleInput : "Admin";
  const expectedPassword = process.env.ADMIN_PASSWORD || "onefarmtech-admin";

  if (password !== expectedPassword) {
    redirect(`/staff-login?error=1&next=${encodeURIComponent(nextPath)}`);
  }

  const cookieStore = await cookies();

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 8,
  };

  cookieStore.set(STAFF_SESSION_COOKIE, "authenticated", cookieOptions);
  cookieStore.set(STAFF_NAME_COOKIE, staffName, cookieOptions);
  cookieStore.set(STAFF_ROLE_COOKIE, staffRole, cookieOptions);

  if (staffEmail) {
    cookieStore.set(STAFF_EMAIL_COOKIE, staffEmail, cookieOptions);
  } else {
    cookieStore.set(STAFF_EMAIL_COOKIE, "", {
      ...cookieOptions,
      maxAge: 0,
    });
  }

  redirect(nextPath.startsWith("/admin") ? nextPath : "/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();

  for (const cookieName of [
    STAFF_SESSION_COOKIE,
    STAFF_NAME_COOKIE,
    STAFF_EMAIL_COOKIE,
    STAFF_ROLE_COOKIE,
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
    redirect("/buyer-account-request?buyerLogin=missing");
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
    redirect("/buyer-account-request?buyerLogin=invalid");
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
    redirect("/buyer-account-request?buyerLogin=identifier");
  }

  if (invite.status.toLowerCase().includes("cancel")) {
    redirect("/buyer-account-request?buyerLogin=cancelled");
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    redirect("/buyer-account-request?buyerLogin=expired");
  }

  if (customer.status !== "Active" || !customer.accountLoginReady) {
    redirect("/buyer-account-request?buyerLogin=not-ready");
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

  const cookieStore = await cookies();

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };

  cookieStore.set(BUYER_SESSION_COOKIE, "authenticated", cookieOptions);
  cookieStore.set(BUYER_CUSTOMER_ID_COOKIE, customer.id, cookieOptions);
  cookieStore.set(BUYER_INVITE_ID_COOKIE, updatedInvite.id, cookieOptions);
  cookieStore.set(
    BUYER_CONTACT_NAME_COOKIE,
    matchingContact?.name || customer.name,
    cookieOptions,
  );
  cookieStore.set(
    BUYER_CONTACT_ROLE_COOKIE,
    matchingContact?.role || invite.role,
    cookieOptions,
  );

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
  ]) {
    cookieStore.set(cookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }

  redirect("/buyer-account-request");
}
