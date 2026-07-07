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

Safety rule:
Do not auto-create confirmed orders from inbound WhatsApp messages yet.
Inbound WhatsApp messages can create draft order requests only. Staff must review before creating confirmed orders.
