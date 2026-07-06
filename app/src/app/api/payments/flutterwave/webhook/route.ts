import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifyFlutterwaveSignature(signature: string | null) {
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;

  if (!secretHash || !signature) {
    return false;
  }

  return signature === secretHash;
}

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("verif-hash");

  if (!verifyFlutterwaveSignature(signature)) {
    return NextResponse.json({ok: false, error: "Invalid signature"}, {status: 401});
  }

  let event: any;

  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ok: false, error: "Invalid JSON"}, {status: 400});
  }

  const status = String(event?.data?.status || event?.status || "").toLowerCase();
  const txRef = String(event?.data?.tx_ref || event?.tx_ref || "").trim();
  const transactionId = String(event?.data?.id || event?.transaction_id || "").trim();

  if (status !== "successful" && status !== "success") {
    return NextResponse.json({ok: true, ignored: status || "non-success"});
  }

  if (!txRef) {
    return NextResponse.json({ok: false, error: "Missing tx_ref"}, {status: 400});
  }

  const paymentRequest = await prisma.paymentRequest.findFirst({
    where: {
      OR: [
        {reference: txRef},
        {gatewayReference: txRef},
      ],
    },
    include: {
      order: true,
    },
  });

  if (!paymentRequest) {
    return NextResponse.json({ok: true, ignored: "payment request not found"});
  }

  const existingPayment = await prisma.payment.findFirst({
    where: {
      reference: paymentRequest.reference,
      orderId: paymentRequest.orderId,
    },
  });

  const paidAt = new Date();

  await prisma.paymentRequest.update({
    where: {id: paymentRequest.id},
    data: {
      provider: "Flutterwave",
      gatewayReference: transactionId || txRef,
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
        provider: "Flutterwave",
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
        body: `Flutterwave confirmed payment for order ${paymentRequest.order.code}.\\n\\nReference: ${paymentRequest.reference}\\nAmount: ${formatNaira(paymentRequest.amount)}\\nStatus: Paid`,
        channel: "Portal",
        direction: "Outbound",
        status: "Unread",
        recipient: paymentRequest.order.phone,
        source: "Flutterwave webhook",
        relatedType: "Payment",
        relatedId: payment.id,
        metadata: JSON.stringify({
          provider: "Flutterwave",
          txRef,
          transactionId,
        }),
      },
    });
  }

  return NextResponse.json({ok: true});
}
