import {NextRequest, NextResponse} from "next/server";
import {buildWhatsAppLink} from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Where a buyer's browser lands after finishing checkout on Paystack or
 * Flutterwave's hosted page. This is a UX courtesy only -- payment status
 * itself is confirmed by the provider webhook, not by the buyer reaching
 * this page. Every buyer payment link used to default to /admin/payments,
 * a staff-only page, which sent every paying buyer straight to a login
 * wall right after they paid.
 */
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  const message = reference
    ? `Hi OneFarmTech, I've completed payment for order reference ${reference}.`
    : "Hi OneFarmTech, I've completed payment.";

  return NextResponse.redirect(buildWhatsAppLink(encodeURIComponent(message)), {status: 302});
}
