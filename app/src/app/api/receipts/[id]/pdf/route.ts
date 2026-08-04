import {NextRequest, NextResponse} from "next/server";
import {renderToBuffer} from "@react-pdf/renderer";
import {prisma} from "@/lib/prisma";
import {getCurrentBuyerActor} from "@/lib/currentBuyer";
import {getCurrentStaffActor} from "@/lib/currentStaff";
import ReceiptDocument from "@/lib/receipts/ReceiptDocument";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;

  const receipt = await prisma.receipt.findUnique({
    where: {id},
    include: {
      customer: {select: {id: true, location: true, buyerContacts: {where: {canViewReceipts: true}, select: {id: true}}}},
      order: {
        select: {
          code: true,
          deliveryMethod: true,
          subtotal: true,
          deliveryFee: true,
          serviceFee: true,
          discountAmount: true,
          totalAmount: true,
          items: {select: {name: true, grade: true, quantity: true, unit: true, unitPrice: true, lineTotal: true}},
        },
      },
    },
  });

  if (!receipt) {
    return NextResponse.json({error: "Receipt not found."}, {status: 404});
  }

  const buyer = await getCurrentBuyerActor();
  const buyerOwnsReceipt = buyer.isAuthenticated && buyer.canViewReceipts && buyer.customerId === receipt.customerId;

  if (!buyerOwnsReceipt) {
    const staff = await getCurrentStaffActor();
    if (!staff.isAuthenticated) {
      return NextResponse.json({error: "Not authorised to view this receipt."}, {status: 403});
    }
  }

  const buffer = await renderToBuffer(
    ReceiptDocument({
      receipt: {
        code: receipt.code,
        issuedAt: receipt.issuedAt,
        amount: receipt.amount,
        status: receipt.status,
        buyerName: receipt.buyerName,
        buyerEmail: receipt.buyerEmail,
        buyerAddress: receipt.customer?.location || null,
        order: receipt.order,
      },
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="OneFarmTech-Receipt-${receipt.code}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
