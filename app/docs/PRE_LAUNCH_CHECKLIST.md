# OneFarmTech Pre-Launch Checklist

This app is currently safe for local development in SQLite mode.

Do not deploy to Vercel for team or buyer testing until the blocked items below are resolved.

## Current local mode

- Next.js app runs locally
- Prisma local SQLite mode is restored
- Admin pages are database-backed locally
- Group-buys, payments, complaints, receipts, audit logs, and buyer account foundations exist
- Staff access still uses a temporary shared-password gate
- Buyer login is not active

## Blockers before Vercel team testing

1. Reset Supabase database password.
2. Do not paste DATABASE_URL or passwords into chat.
3. Create a dedicated Supabase migration branch.
4. Move Prisma provider from SQLite to Postgres.
5. Remove SQLite adapter from production Prisma setup.
6. Seed Supabase/Postgres.
7. Replace temporary staff password gate with real auth.
8. Add role enforcement for:
   - Super admin
   - Admin
   - Operations
   - Finance
   - Support
   - Buyer account manager
9. Add recurring buyer login for approved business buyers.
10. Protect receipts, credit limits, balances, order history, and payment records behind buyer auth.
11. Add Vercel environment variables only after Supabase is reset and tested.
12. Test locally against Supabase before Vercel deployment.

## Useful local commands

```bash
npm run build
npm run check:prelaunch
npm run check:prelaunch:strictcd /Users/joyjack/Documents/onefarmtech/app

mkdir -p docs

cat > docs/PRE_LAUNCH_CHECKLIST.md <<'EOF'
# OneFarmTech Pre-Launch Checklist

This app is currently safe for local development in SQLite mode.

Do not deploy to Vercel for team or buyer testing until the blocked items below are resolved.

## Current local mode

- Next.js app runs locally
- Prisma local SQLite mode is restored
- Admin pages are database-backed locally
- Group-buys, payments, complaints, receipts, audit logs, and buyer account foundations exist
- Staff access still uses a temporary shared-password gate
- Buyer login is not active

## Blockers before Vercel team testing

1. Reset Supabase database password.
2. Do not paste DATABASE_URL or passwords into chat.
3. Create a dedicated Supabase migration branch.
4. Move Prisma provider from SQLite to Postgres.
5. Remove SQLite adapter from production Prisma setup.
6. Seed Supabase/Postgres.
7. Replace temporary staff password gate with real auth.
8. Add role enforcement for:
   - Super admin
   - Admin
   - Operations
   - Finance
   - Support
   - Buyer account manager
9. Add recurring buyer login for approved business buyers.
10. Protect receipts, credit limits, balances, order history, and payment records behind buyer auth.
11. Add Vercel environment variables only after Supabase is reset and tested.
12. Test locally against Supabase before Vercel deployment.

## Useful local commands

npm run build
npm run check:prelaunch
npm run check:prelaunch:strict

The strict check is expected to fail while the app is still intentionally in local SQLite/basic-auth mode.
