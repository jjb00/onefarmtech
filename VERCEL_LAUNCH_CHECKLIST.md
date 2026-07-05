# OneFarmTech Vercel Launch Checklist

## Required Vercel environment variables

Set these in Vercel Project Settings → Environment Variables.

### Database

DATABASE_URL=
Use the Supabase Session Pooler URL, not local SQLite.

Expected format:
postgresql://postgres.xloyvtcawopixkzteiup:<password>@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=no-verify&pgbouncer=true&connection_limit=3

### Admin access

ADMIN_PASSWORD=
Set a strong password for the controlled launch staff gate.

Do not rely on fallback local password:
onefarmtech-admin

## Launch status

Current soft-launch status:

- Public forms are database-backed.
- Order requests save to Supabase/Postgres.
- Buyer account requests save to Supabase/Postgres.
- Contact enquiries save to Supabase/Postgres.
- Admin Launch Inbox reviews all incoming records.
- Admin area is protected by staff login gate.
- WhatsApp follow-up is manual from Launch Inbox.
- Email follow-up is manual/mailto.
- Buyer login is approval/invite-based and not yet full account auth.
- Named staff accounts and role permissions are next phase.
- Payment, wallet, bank, credit, and split-order automation are next phase.

## Vercel deployment steps

1. Push current branch to GitHub.
2. Import/project connect in Vercel.
3. Set DATABASE_URL and ADMIN_PASSWORD.
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
