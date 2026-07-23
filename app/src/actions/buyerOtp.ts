"use server";

import crypto from "node:crypto";
import net from "node:net";
import {cookies, headers} from "next/headers";
import {redirect} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {
  BUYER_OTP_TTL_MS,
  BUYER_OTP_CHALLENGE_COOKIE,
  buyerOtpCanBeVerified,
  buyerOtpMatches,
  buyerOtpRequestLimits,
  consumeBuyerOtpChallenge,
  generateBuyerOtp,
  hashBuyerOtp,
  hashOtpRequestIdentifier,
  isBuyerLoginEligible,
  isValidBuyerEmail,
  normalizeBuyerEmail,
  recordFailedBuyerOtpAttempt,
  safeOtpRequestMetadata,
} from "@/lib/buyerOtp";
import {createBuyerSession} from "@/lib/buyerSession";
import {sendTransactionalEmail} from "@/lib/email/service";
import {emailTemplates} from "@/lib/email/templates";

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

function validIpFromHeader(value: string | null, useLast = false) {
  const values = String(value || "")
    .split(",")
    .map((candidate) => candidate.trim())
    .filter(Boolean);
  if (useLast) values.reverse();
  return values.find((candidate) => net.isIP(candidate)) || null;
}

async function requestContext(secret: string) {
  const requestHeaders = await headers();
  // Prefer platform/proxy-owned headers. The last x-forwarded-for hop is safer
  // than accepting a client-prepended first value when no Vercel header exists.
  const ip =
    validIpFromHeader(requestHeaders.get("x-vercel-forwarded-for")) ||
    validIpFromHeader(requestHeaders.get("x-real-ip")) ||
    validIpFromHeader(requestHeaders.get("x-forwarded-for"), true);
  return {
    ipHash: hashOtpRequestIdentifier(ip, secret),
    metadata: safeOtpRequestMetadata(ip, requestHeaders.get("user-agent"), secret),
  };
}

async function issueBuyerOtp(emailInput: string) {
  const email = normalizeBuyerEmail(emailInput);
  const secret = process.env.SESSION_SECRET || "";
  if (!secret) throw new Error("SESSION_SECRET is required for buyer OTP authentication.");
  const context = await requestContext(secret);

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
  const since = new Date(now.getTime() - 15 * 60 * 1000);
  let issueResult:
    | {created: true}
    | {created: false};

  try {
    issueResult = await prisma.$transaction(async (tx) => {
      const [recipientChallenges, ipChallenges] = await Promise.all([
        tx.buyerOtpChallenge.findMany({
          where: {recipientEmail: email, createdAt: {gte: since}},
          orderBy: {createdAt: "desc"},
          select: {createdAt: true},
        }),
        context.ipHash
          ? tx.buyerOtpChallenge.findMany({
              where: {requestIpHash: context.ipHash, createdAt: {gte: since}},
              orderBy: {createdAt: "desc"},
              select: {createdAt: true},
            })
          : Promise.resolve([]),
      ]);
      const limits = buyerOtpRequestLimits(recipientChallenges, ipChallenges, now);
      if (!limits.allowed) {
        return {
          created: false as const,
        };
      }

      await tx.buyerOtpChallenge.updateMany({
        where: {
          recipientEmail: email,
          consumedAt: null,
          invalidatedAt: null,
        },
        data: {invalidatedAt: now},
      });
      await tx.buyerOtpChallenge.create({
        data: {
          id: challengeId,
          recipientEmail: email,
          customerId: eligible ? contact!.customerId : null,
          buyerContactId: eligible ? contact!.id : null,
          otpHash: hashBuyerOtp(challengeId, otp, secret),
          expiresAt: new Date(now.getTime() + BUYER_OTP_TTL_MS),
          requestIpHash: context.ipHash,
          requestMetadata: context.metadata,
        },
      });
      return {created: true as const};
    }, {isolationLevel: "Serializable"});
  } catch (error) {
    // A serializable conflict means a concurrent request won. Suppress this
    // request rather than issuing another email or exposing account state.
    if ((error as {code?: string})?.code === "P2034") return;
    throw error;
  }

  if (!issueResult.created) {
    return;
  }

  await setChallengeCookie(challengeId);

  if (!eligible) return;

  let result;
  try {
    result = await sendTransactionalEmail({
      deduplicationKey: `buyer-login-otp:${challengeId}`,
      template: "buyer-login-otp",
      to: email,
      content: emailTemplates.buyerLoginOtp(contact!.name, otp),
      storedContent: emailTemplates.buyerLoginOtpStored(),
      relatedType: "BuyerOtpChallenge",
      relatedId: challengeId,
    });
  } catch {
    await prisma.buyerOtpChallenge.update({
      where: {id: challengeId},
      data: {invalidatedAt: new Date()},
    });
    return;
  }

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
  const otp = readText(formData, "otp");
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
    await recordFailedBuyerOtpAttempt(prisma, challenge.id);
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

  const consumed = await consumeBuyerOtpChallenge(prisma, challenge.id);
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
