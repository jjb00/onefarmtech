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
Required in production. JSON map of staff email → scrypt password hash. Each active `StaffUser`
row must have a matching entry here; role and identity are resolved from the database, this only
supplies the password check.

### Database performance

DATABASE_POOL_MAX=
Match this to your pooler's connection_limit (e.g. Supabase pgbouncer `connection_limit=3` in the
DATABASE_URL query string). Do not leave this at 1 in production — admin pages run several queries
in parallel per request, and a pool of 1 forces them to queue instead of overlapping.

Also confirm the Vercel project's function region is pinned near your database region (see
`vercel.json`) — cross-region round trips on every query are a common cause of a slow-feeling
admin panel.

## Launch status

Current status:

- Public forms are database-backed (order requests, buyer account requests, contact enquiries).
- Admin Launch Inbox reviews all incoming records.
- Admin area is protected by named staff login — see `app/src/lib/permissions.ts` and
  `app/src/lib/adminAccess.ts` for the role/capability model.
- Buyer login supports invite-code access; email-OTP or other stronger flows should be preferred
  where available.
- Payment, wallet, bank, credit, and split-order automation remain manual/staff-driven.

## Vercel deployment steps

1. Push current branch to GitHub.
2. Import/project connect in Vercel.
3. Set DATABASE_URL, SESSION_SECRET, STAFF_PASSWORD_HASHES, DATABASE_POOL_MAX, and the
   Turnstile/payment/WhatsApp keys your environment needs.
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
