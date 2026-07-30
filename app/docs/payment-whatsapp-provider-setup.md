# OneFarmTech provider setup checklist

Manual dashboard setup still required.

Paystack webhook:
https://YOUR-PRODUCTION-DOMAIN/api/payments/webhook

Flutterwave webhook:
https://YOUR-PRODUCTION-DOMAIN/api/payments/flutterwave/webhook

Meta WhatsApp webhook:
https://YOUR-PRODUCTION-DOMAIN/api/whatsapp/webhook

Required production secrets:
APP_BASE_URL
NEXT_PUBLIC_APP_URL
PAYSTACK_SECRET_KEY
PAYSTACK_PUBLIC_KEY
PAYSTACK_WEBHOOK_SECRET
PAYSTACK_FALLBACK_EMAIL
FLUTTERWAVE_SECRET_KEY
FLUTTERWAVE_PUBLIC_KEY
FLUTTERWAVE_WEBHOOK_SECRET_HASH
FLUTTERWAVE_FALLBACK_EMAIL
PAYMENT_FALLBACK_EMAIL
WHATSAPP_CLOUD_ACCESS_TOKEN
WHATSAPP_CLOUD_PHONE_NUMBER_ID
WHATSAPP_CLOUD_API_VERSION
WHATSAPP_WEBHOOK_VERIFY_TOKEN
WHATSAPP_APP_SECRET
WHATSAPP_AUTO_REPLY_CATALOGUE (set to "true" to enable the interactive ordering bot below)
WHATSAPP_DRIVER_INVITE_TEMPLATE_NAME
WHATSAPP_DRIVER_INVITE_TEMPLATE_LANGUAGE
CRON_SECRET (authorizes the scheduled payment-reminder job; Vercel sends it automatically once set)

Free-text order guessing vs structured self-service ordering:
Free-text messages ("2 baskets tomatoes, deliver tomorrow") still only ever
create a draft order request that staff must review and convert — the
keyword parser is a best-effort guess and was never safe to auto-confirm
from directly.

The interactive WhatsApp flow (src/lib/whatsapp/interactiveOrdering.ts) is a
different, narrower mechanism: it creates a real Order only from a
structured sequence the buyer explicitly drives — tapping one product from
a list, typing an explicit quantity, then tapping "Checkout" to confirm.
There is no free-text guessing in that path. The order is still unpaid and
unfulfilled until a human confirms pricing/availability and payment is
received, so "auto-created" here means "captured without waiting on a
staff member to type it in," not "auto-confirmed and dispatched."

Before enabling in production:
- Get WHATSAPP_DRIVER_INVITE_TEMPLATE_NAME and the existing
  WHATSAPP_PAYMENT_TEMPLATE_NAME / WHATSAPP_BUYER_INVITE_TEMPLATE_NAME
  templates approved in Meta Business Manager (required for any
  business-initiated message sent outside a 24-hour customer reply window
  — the interactive menu/list/button replies don't need this since they're
  always replies to an inbound message, but the driver invite and payment
  reminder sends do).
- Apply the pending Prisma migration (see prisma/migrations/20260730120000_*)
  against the real database — it was intentionally not run automatically
  during development since DATABASE_URL points at a live instance.
- Set CRON_SECRET as a Vercel project environment variable so
  /api/cron/payment-reminders (wired up in vercel.json, hourly) is
  authorized — without it the route returns 401 to everyone, including
  Vercel's own cron trigger.
- Test the full interactive flow (menu -> browse -> pick item -> quantity
  -> checkout) against a real WhatsApp test number before rolling out
  broadly; it has not been exercised against the live Meta Cloud API in
  this environment.
