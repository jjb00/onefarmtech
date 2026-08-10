import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {createAuditLog} from "@/lib/auditLog";
import {deriveGroupBuyState} from "@/lib/groupBuyState.js";
import {nextGroupBuyCloseTime} from "@/lib/groupBuySchedule";

async function nextGroupBuyCode() {
  const count = await prisma.groupBuy.count();
  return `GB-${String(count + 1).padStart(4, "0")}`;
}

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
    include: {
      reservations: {select: {quantity: true, paymentStatus: true}},
      items: true,
    },
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

    // Carry the same offer forward into next week's window automatically,
    // so staff only ever set the product/price/target up once instead of
    // re-creating it every week for the Sunday-open cron to find. Cloned as
    // a fresh Draft with zeroed reservations -- this week's buyer activity
    // stays on this record for history/fulfilment, it doesn't roll over.
    const nextCode = await nextGroupBuyCode();
    const nextGroupBuy = await prisma.groupBuy.create({
      data: {
        code: nextCode,
        title: groupBuy.title,
        description: groupBuy.description,
        status: "Draft",
        minQuantity: groupBuy.minQuantity,
        targetQuantity: groupBuy.targetQuantity,
        reservedQuantity: 0,
        unit: groupBuy.unit,
        closingDate: nextGroupBuyCloseTime(),
        pickupWindow: groupBuy.pickupWindow,
        paymentStatus: "Not collecting",
        fulfilmentStatus: "Planning",
        adminNote: groupBuy.adminNote,
        items: {
          create: groupBuy.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            grade: item.grade,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          })),
        },
      },
    });

    await createAuditLog({
      action: "Prepared next week's group buy automatically",
      entityType: "GroupBuy",
      entityId: nextGroupBuy.id,
      entityLabel: nextGroupBuy.title,
      actorName: "Weekly close automation",
      actorRole: "System",
      newValue: {code: nextGroupBuy.code, clonedFrom: groupBuy.code},
    });

    results.push({code: groupBuy.code, from: groupBuy.status, to: derived.status, nextWeek: nextCode});
  }

  return NextResponse.json({closed: results.length, results});
}
