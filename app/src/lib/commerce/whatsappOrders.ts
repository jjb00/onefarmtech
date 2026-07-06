import {prisma} from "@/lib/prisma";

export function normalisePhone(input: string | null | undefined) {
  const raw = String(input || "").trim();
  if (!raw) return "";

  const digits = raw.replace(/[^\d]/g, "");

  if (!digits) return "";

  if (digits.startsWith("234")) return `+${digits}`;
  if (digits.startsWith("0") && digits.length >= 10) return `+234${digits.slice(1)}`;
  if (raw.startsWith("+")) return `+${digits}`;

  return `+${digits}`;
}

export function parseMoney(input: FormDataEntryValue | null, fallback = 0) {
  const value = String(input || "").replace(/[^\d]/g, "");
  if (!value) return fallback;
  return Number.parseInt(value, 10) || fallback;
}

export function parseQuantity(input: FormDataEntryValue | null) {
  const value = String(input || "").replace(/[^\d]/g, "");
  if (!value) return 0;
  return Number.parseInt(value, 10) || 0;
}

export function formatNaira(amount: number | null | undefined) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export async function makePaymentReference(orderCode: string) {
  const cleanCode = orderCode.replace(/[^A-Z0-9-]/gi, "").toUpperCase();
  const base = `PAY-${cleanCode}`;

  const existing = await prisma.paymentRequest.count({
    where: {
      reference: {
        startsWith: base,
      },
    },
  });

  return existing === 0 ? base : `${base}-${existing + 1}`;
}

export async function matchBuyerByPhone(phoneInput: string) {
  const phone = normalisePhone(phoneInput);

  if (!phone) {
    return {
      phone,
      customer: null,
      buyerContact: null,
      matchType: "none" as const,
    };
  }

  const phoneDigits = phone.replace(/[^\d]/g, "");
  const localZero = phoneDigits.startsWith("234") ? `0${phoneDigits.slice(3)}` : phoneDigits;

  const buyerContact = await prisma.buyerContact.findFirst({
    where: {
      OR: [
        {phoneNormalized: phone},
        {phoneNormalized: phoneDigits},
        {phoneNormalized: localZero},
        {phone: phone},
        {phone: phoneDigits},
        {phone: localZero},
      ],
    },
    include: {
      customer: true,
    },
  });

  if (buyerContact?.customer) {
    return {
      phone,
      customer: buyerContact.customer,
      buyerContact,
      matchType: "buyerContact" as const,
    };
  }

  const customer = await prisma.customer.findFirst({
    where: {
      OR: [
        {phoneNormalized: phone},
        {phoneNormalized: phoneDigits},
        {phoneNormalized: localZero},
        {phone: phone},
        {phone: phoneDigits},
        {phone: localZero},
      ],
    },
  });

  return {
    phone,
    customer,
    buyerContact: null,
    matchType: customer ? ("customer" as const) : ("none" as const),
  };
}
