import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {createAuditLog} from "@/lib/auditLog";
import {nextGroupBuyCloseTime} from "@/lib/groupBuySchedule";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Publishes whatever staff prepared ahead of time (status "Draft") for the
// new weekly window. Scheduled for Sunday 19:00 UTC (20:00 WAT) in
// vercel.json -- see close-weekly-group-buys for the matching close job,
// Thursday 21:00 UTC (22:00 WAT).
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }

  const draftGroupBuys = await prisma.groupBuy.findMany({
    where: {status: "Draft"},
  });

  const results = [];

  for (const groupBuy of draftGroupBuys) {
    // Respect a closing date staff already set (e.g. a one-off adjusted
    // window); only fall back to the standard schedule if none was set or
    // it's already in the past.
    const closingDate =
      groupBuy.closingDate && groupBuy.closingDate > new Date()
        ? groupBuy.closingDate
        : nextGroupBuyCloseTime();

    await prisma.groupBuy.update({
      where: {id: groupBuy.id},
      data: {
        status: "Open",
        paymentStatus: "Collecting payments",
        closingDate,
      },
    });

    await createAuditLog({
      action: "Automatically opened group buy for the week",
      entityType: "GroupBuy",
      entityId: groupBuy.id,
      entityLabel: groupBuy.title,
      actorName: "Weekly open automation",
      actorRole: "System",
      newValue: {code: groupBuy.code, status: "Open", closingDate},
    });

    results.push({code: groupBuy.code, closingDate});
  }

  return NextResponse.json({opened: results.length, results});
}
