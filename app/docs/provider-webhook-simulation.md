# Provider webhook simulation

Use this before real provider dashboard setup.

## Start local app

Run:

npm run dev -- -p 3002

## Paystack simulation

Use an existing PaymentRequest.reference.

Run:

WEBHOOK_TEST_BASE_URL=http://localhost:3002 npm run simulate:paystack -- PAYMENT_REFERENCE

Expected:
- payment request becomes Paid
- payment record is created
- order payment status updates
- buyer message evidence is logged if linked

## Flutterwave simulation

Run:

WEBHOOK_TEST_BASE_URL=http://localhost:3002 npm run simulate:flutterwave -- PAYMENT_REFERENCE

Expected:
- payment request becomes Paid
- payment record is created
- order payment status updates

## WhatsApp simulation

Run:

WEBHOOK_TEST_BASE_URL=http://localhost:3002 npm run simulate:whatsapp -- +2348012345678 "I want 2 baskets of tomatoes delivered to Lekki tomorrow"

Expected:
- inbound message is accepted
- message appears in WhatsApp inbox if matched
- likely order creates draft in WhatsApp drafts
