import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {createAuditLog} from "@/lib/auditLog";
import {deriveGroupBuyState} from "@/lib/groupBuyState.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Group buying runs Monday to Friday -- this closes every group buy still
// open at the end of the week so a new one isn't silently rolled over.
// Scheduled for Friday 15:00 UTC (16:00 WAT / Africa-Lagos) in vercel.json.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }

  const openGroupBuys = await prisma.groupBuy.findMany({
    where: {status: {in: ["Open", "Minimum met", "Fully reserved"]}},
    include: {reservations: {select: {quantity: true, paymentStatus: true}}},
  });

  const results = [];

  for (const groupBuy of openGroupBuys) {
    const derived = deriveGroupBuyState({
      currentStatus: groupBuy.status,
      requestedStatus: "Closed",
      minQuantity: groupBuy.minQuantity,
      targetQuantity: groupBuy.targetQuantity,
      fulfilmentStatus: groupBuy.fulfilmentStatus,
      reservations: groupBuy.reservations,
    });

    await prisma.groupBuy.update({
      where: {id: groupBuy.id},
      data: {
        status: derived.status,
        paymentStatus: derived.paymentStatus,
        reservedQuantity: derived.reservedQuantity,
      },
    });

    await createAuditLog({
      action: "Automatically closed group buy for the week",
      entityType: "GroupBuy",
      entityId: groupBuy.id,
      entityLabel: groupBuy.title,
      actorName: "Weekly close automation",
      actorRole: "System",
      newValue: {code: groupBuy.code, status: derived.status},
    });

    results.push({code: groupBuy.code, from: groupBuy.status, to: derived.status});
  }

  return NextResponse.json({closed: results.length, results});
}
