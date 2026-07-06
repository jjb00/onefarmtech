import crypto from "node:crypto";
import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifyPaystackSignature(rawBody: string, signature: string | null) {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;

  if (!secret || !signature) {
    return false;
  }

  const hash = crypto
    .createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ok: false, error: "Invalid signature"}, {status: 401});
  }

  let event: any;

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ok: false, error: "Invalid JSON"}, {status: 400});
  }

  if (event?.event !== "charge.success") {
    return NextResponse.json({ok: true, ignored: event?.event || "unknown"});
  }

  const data = event.data || {};
  const gatewayReference = String(data.reference || "").trim();

  if (!gatewayReference) {
    return NextResponse.json({ok: false, error: "Missing reference"}, {status: 400});
  }

  const paymentRequest = await prisma.paymentRequest.findFirst({
    where: {
      OR: [
        {gatewayReference},
        {reference: gatewayReference},
      ],
    },
    include: {
      order: true,
    },
  });

  if (!paymentRequest) {
    return NextResponse.json({ok: true, ignored: "payment request not found"});
  }

  const paidAt = data.paid_at ? new Date(data.paid_at) : new Date();

  const existingPayment = await prisma.payment.findFirst({
    where: {
      reference: paymentRequest.reference,
      orderId: paymentRequest.orderId,
    },
  });

  await prisma.paymentRequest.update({
    where: {id: paymentRequest.id},
    data: {
      provider: "Paystack",
      gatewayReference,
      status: "Paid",
      paidAt,
    },
  });

  const payment =
    existingPayment ||
    (await prisma.payment.create({
      data: {
        orderId: paymentRequest.orderId,
        reference: paymentRequest.reference,
        provider: "Paystack",
        amount: paymentRequest.amount,
        status: "Paid",
        paidAt,
      },
    }));

  await prisma.order.update({
    where: {id: paymentRequest.orderId},
    data: {
      paymentStatus: "Paid",
      paymentReference: paymentRequest.reference,
    },
  });

  if (paymentRequest.customerId && !existingPayment) {
    await prisma.buyerMessage.create({
      data: {
        customerId: paymentRequest.customerId,
        title: `Payment received for ${paymentRequest.order.code}`,
        body: `Paystack confirmed payment for order ${paymentRequest.order.code}.\\n\\nReference: ${paymentRequest.reference}\\nAmount: ${formatNaira(paymentRequest.amount)}\\nStatus: Paid`,
        channel: "Portal",
        direction: "Outbound",
        status: "Unread",
        recipient: paymentRequest.order.phone,
        source: "Paystack webhook",
        relatedType: "Payment",
        relatedId: payment.id,
        metadata: JSON.stringify({
          provider: "Paystack",
          gatewayReference,
          event: event.event,
        }),
      },
    });
  }

  return NextResponse.json({ok: true});
}
