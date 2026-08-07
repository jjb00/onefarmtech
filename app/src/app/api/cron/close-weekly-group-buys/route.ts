import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {createAuditLog} from "@/lib/auditLog";
import {deriveGroupBuyState} from "@/lib/groupBuyState.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Group buying runs Sunday night to Thursday night -- this closes every
// group buy still open at the end of the window so sourcing can start
// Friday ahead of Friday/Saturday delivery. Scheduled for Thursday 21:00
// UTC (22:00 WAT / Africa-Lagos) in vercel.json -- see
// open-weekly-group-buys for the matching Sunday-night open job.
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
