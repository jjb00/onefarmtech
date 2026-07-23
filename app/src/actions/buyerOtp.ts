"use server";

import crypto from "node:crypto";
import {cookies, headers} from "next/headers";
import {redirect} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {
  BUYER_OTP_TTL_MS,
  buyerOtpCanBeVerified,
  buyerOtpMatches,
  buyerOtpRequestAllowed,
  generateBuyerOtp,
  hashBuyerOtp,
  isBuyerLoginEligible,
  isValidBuyerEmail,
  normalizeBuyerEmail,
  safeOtpRequestMetadata,
} from "@/lib/buyerOtp";
import {createBuyerSession} from "@/lib/buyerSession";
import {sendTransactionalEmail} from "@/lib/email/service";
import {emailTemplates} from "@/lib/email/templates";

const BUYER_OTP_CHALLENGE_COOKIE = "oft_buyer_otp_challenge";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function setChallengeCookie(challengeId: string) {
  const cookieStore = await cookies();
  cookieStore.set(BUYER_OTP_CHALLENGE_COOKIE, challengeId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: BUYER_OTP_TTL_MS / 1000,
  });
}

async function requestMetadata(secret: string) {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  return safeOtpRequestMetadata(
    forwarded,
    requestHeaders.get("user-agent"),
    secret,
  );
}

async function issueBuyerOtp(emailInput: string) {
  const email = normalizeBuyerEmail(emailInput);
  const secret = process.env.SESSION_SECRET || "";
  if (!secret) throw new Error("SESSION_SECRET is required for buyer OTP authentication.");
  const metadata = await requestMetadata(secret);

  const recentChallenges = await prisma.buyerOtpChallenge.findMany({
    where: {
      OR: [
        {recipientEmail: email},
        {requestMetadata: metadata},
      ],
      createdAt: {gte: new Date(Date.now() - 15 * 60 * 1000)},
    },
    orderBy: {createdAt: "desc"},
    select: {id: true, recipientEmail: true, createdAt: true},
  });
  const requestDecision = buyerOtpRequestAllowed(recentChallenges);
  if (!requestDecision.allowed) {
    const sameRecipientChallenge = recentChallenges.find(
      (challenge) => challenge.recipientEmail === email,
    );
    if (sameRecipientChallenge) await setChallengeCookie(sameRecipientChallenge.id);
    return;
  }

  const matchingContacts = await prisma.buyerContact.findMany({
    where: {email: {equals: email, mode: "insensitive"}},
    orderBy: {updatedAt: "desc"},
    include: {customer: true},
    take: 10,
  });
  const contact = matchingContacts.find((candidate) =>
    isBuyerLoginEligible(candidate.customer, candidate, email),
  );
  const eligible = isBuyerLoginEligible(contact?.customer, contact, email);
  const challengeId = crypto.randomUUID();
  const otp = generateBuyerOtp();
  const now = new Date();

  await prisma.$transaction([
    prisma.buyerOtpChallenge.updateMany({
      where: {
        recipientEmail: email,
        consumedAt: null,
        invalidatedAt: null,
      },
      data: {invalidatedAt: now},
    }),
    prisma.buyerOtpChallenge.create({
      data: {
        id: challengeId,
        recipientEmail: email,
        customerId: eligible ? contact!.customerId : null,
        buyerContactId: eligible ? contact!.id : null,
        otpHash: hashBuyerOtp(challengeId, otp, secret),
        expiresAt: new Date(now.getTime() + BUYER_OTP_TTL_MS),
        requestMetadata: metadata,
      },
    }),
  ]);

  await setChallengeCookie(challengeId);

  if (!eligible) return;

  const result = await sendTransactionalEmail({
    deduplicationKey: `buyer-login-otp:${challengeId}`,
    template: "buyer-login-otp",
    to: email,
    content: emailTemplates.buyerLoginOtp(contact!.name, otp),
    storedContent: emailTemplates.buyerLoginOtpStored(),
    relatedType: "BuyerOtpChallenge",
    relatedId: challengeId,
  });

  if (!result.ok) {
    await prisma.buyerOtpChallenge.update({
      where: {id: challengeId},
      data: {invalidatedAt: new Date()},
    });
  }
}

export async function requestBuyerOtpAction(formData: FormData) {
  const email = normalizeBuyerEmail(readText(formData, "email"));
  if (isValidBuyerEmail(email)) await issueBuyerOtp(email);
  redirect("/buyer-login?step=verify&sent=1");
}

export async function resendBuyerOtpAction() {
  const challengeId = (await cookies()).get(BUYER_OTP_CHALLENGE_COOKIE)?.value;
  if (challengeId) {
    const challenge = await prisma.buyerOtpChallenge.findUnique({
      where: {id: challengeId},
      select: {recipientEmail: true},
    });
    if (challenge) await issueBuyerOtp(challenge.recipientEmail);
  }
  redirect("/buyer-login?step=verify&sent=1");
}

export async function verifyBuyerOtpAction(formData: FormData) {
  const otp = readText(formData, "otp").replace(/\D/g, "");
  const cookieStore = await cookies();
  const challengeId = cookieStore.get(BUYER_OTP_CHALLENGE_COOKIE)?.value;
  const secret = process.env.SESSION_SECRET || "";

  if (!challengeId || !/^\d{6}$/.test(otp) || !secret) {
    redirect("/buyer-login?step=verify&error=otp-invalid");
  }

  const challenge = await prisma.buyerOtpChallenge.findUnique({
    where: {id: challengeId},
    include: {
      customer: true,
      buyerContact: true,
    },
  });

  if (!challenge || !buyerOtpCanBeVerified(challenge)) {
    redirect("/buyer-login?step=verify&error=otp-invalid");
  }

  if (!buyerOtpMatches(challenge.id, otp, secret, challenge.otpHash)) {
    const attempts = challenge.attempts + 1;
    await prisma.buyerOtpChallenge.update({
      where: {id: challenge.id},
      data: {
        attempts,
        invalidatedAt: attempts >= 5 ? new Date() : undefined,
      },
    });
    redirect("/buyer-login?step=verify&error=otp-invalid");
  }

  if (
    !challenge.customer ||
    !challenge.buyerContact ||
    !isBuyerLoginEligible(
      challenge.customer,
      challenge.buyerContact,
      challenge.recipientEmail,
    )
  ) {
    await prisma.buyerOtpChallenge.update({
      where: {id: challenge.id},
      data: {invalidatedAt: new Date()},
    });
    redirect("/buyer-login?step=verify&error=otp-invalid");
  }

  const consumed = await prisma.buyerOtpChallenge.updateMany({
    where: {
      id: challenge.id,
      consumedAt: null,
      invalidatedAt: null,
      expiresAt: {gt: new Date()},
    },
    data: {consumedAt: new Date()},
  });
  if (consumed.count !== 1) {
    redirect("/buyer-login?step=verify&error=otp-invalid");
  }

  await createBuyerSession({
    customerId: challenge.customer.id,
    contact: challenge.buyerContact,
    authMode: "email-otp",
  });
  cookieStore.set(BUYER_OTP_CHALLENGE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  redirect("/buyer-account");
}
