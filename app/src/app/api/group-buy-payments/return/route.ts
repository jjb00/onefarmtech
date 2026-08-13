import {NextRequest, NextResponse} from "next/server";
import {buildWhatsAppLink} from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// This return route is only a buyer-friendly destination after hosted
// checkout. The signed Paystack webhook and server-side verification remain
// authoritative for payment status.
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  const message = reference
    ? `Hi OneFarmTech, I've completed payment for group-buy reference ${reference}.`
    : "Hi OneFarmTech, I've completed my group-buy payment.";

  return NextResponse.redirect(buildWhatsAppLink(encodeURIComponent(message)), {status: 302});
}
