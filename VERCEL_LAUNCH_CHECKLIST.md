# OneFarmTech Vercel Launch Checklist

## Required Vercel environment variables

Set these in Vercel Project Settings → Environment Variables.

### Database

DATABASE_URL=
Use the Supabase Session Pooler URL, not local SQLite.

Expected format:
postgresql://postgres.xloyvtcawopixkzteiup:<password>@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=no-verify&pgbouncer=true&connection_limit=3

### Admin and buyer access

Named staff auth and signed sessions are live — there is no shared admin password.

SESSION_SECRET=
Required in production. Signs staff, buyer and delivery-partner session cookies. Generate with
`openssl rand -hex 32` and never reuse the local dev fallback value.

STAFF_PASSWORD_HASHES=
Required in production. JSON map of staff email → scrypt password hash (see `.env.example` for
the generator snippet). Each active `StaffUser` row must have a matching entry here; role and
identity are resolved from the database, this only supplies the password check.

### Bot protection

NEXT_PUBLIC_TURNSTILE_SITE_KEY= / TURNSTILE_SECRET_KEY=
Required in production. Public forms (contact, order request, career application, supplier
enquiry) reject submissions without a valid Turnstile token once these are set.

## Launch status

Current status:

- Public forms are database-backed (order requests, buyer account requests, contact enquiries)
  and protected by Turnstile + honeypot + submission dedupe.
- Admin Launch Inbox reviews all incoming records.
- Admin area is protected by named staff login with per-role page access — see
  `app/src/lib/permissions.ts` and `app/src/lib/adminAccess.ts`.
- Buyer login supports both invite-code and email-OTP. Email-OTP is the stronger path
  (rate-limited, hashed, short-lived codes); prefer it over invite-code where possible.
- WhatsApp inbound messages are logged to the database automatically and routed to draft
  orders, complaints, or follow-ups; outbound sending (catalogue, drafts, payment links) is
  still staff-initiated from the admin inbox, not a full conversational bot.
- Payment confirmation (Paystack/Flutterwave) is automatic via verified webhooks.
- Delivery partner accounts are admin-invited only; there is no self-service driver signup yet.

## Vercel deployment steps

1. Push current branch to GitHub.
2. Import/project connect in Vercel.
3. Set DATABASE_URL, SESSION_SECRET, STAFF_PASSWORD_HASHES, and the Turnstile/payment/WhatsApp
   keys listed in `app/.env.example`.
4. Deploy preview.
5. Test:
   - /
   - /order-request
   - /buyer-account-request
   - /contact
   - /buyer-login
   - /staff-login
   - /admin/launch-inbox
6. Submit test records from public forms.
7. Confirm records appear in /admin/launch-inbox.
8. Confirm /admin redirects to /staff-login when logged out.
9. Confirm no .env or database file is committed.

## Monday launch positioning

Use:
Controlled soft launch / pilot.

Do not present as:
Full automated financial, credit, wallet, or banking platform.
