# PostgreSQL production baseline

The live Supabase database predates Prisma Migrate tracking and has no `public._prisma_migrations` table. Its existing schema was created through schema synchronization rather than the active migration history.

The original migrations used SQLite SQL and an SQLite migration lock. They are preserved under `prisma/migrations-sqlite-archive/` for historical reference only. Prisma Migrate reads only `prisma/migrations/`, so the archive must never be moved back into that active directory.

## How the baseline was generated

`20260714000000_postgresql_baseline/migration.sql` was generated from an empty schema to a read-only introspection of the live Supabase PostgreSQL schema:

```bash
npx prisma db pull --print
npx prisma migrate diff --from-empty --to-config-datasource --script
```

The live introspection confirmed that the baseline schema does not contain `EmailDelivery`, `EmailProviderEvent`, `PaymentReconciliationIncident`, or `OperationalEvent`. Those tables remain exclusively in the two later additive migrations.

## Production deployment procedure

Back up and verify production before running any command. Then, from the exact release artifact and with the production `DATABASE_URL` configured:

```bash
npx prisma migrate resolve --applied 20260714000000_postgresql_baseline
npx prisma migrate status
npx prisma migrate deploy
npx prisma migrate status
```

`migrate resolve --applied` creates Prisma migration tracking and records the baseline without executing its `CREATE TABLE` statements against tables that already exist. Never execute the baseline SQL against the existing production schema.

After the baseline is recorded, `migrate deploy` should execute only:

1. `20260714150000_add_email_delivery_and_payment_reconciliation`
2. `20260714170000_add_delivery_events_retries_and_operational_events`

Verify that all three migrations appear as applied and confirm that the four operational tables exist.

## Failure recovery

Both pending migrations are additive. If deployment fails:

1. Stop application deployment and preserve the database state and logs.
2. Do not delete `_prisma_migrations`, reset the database, or rerun the baseline SQL.
3. Inspect `npx prisma migrate status` and the failed row in `_prisma_migrations` using read-only database access.
4. Compare the partially created tables, indexes and constraints with the failed migration SQL.
5. Take a fresh backup before any repair.
6. Complete or revert only the partial additive objects through a reviewed SQL repair.
7. Use `prisma migrate resolve --rolled-back <migration-name>` only when the failed migration has been fully and safely reverted, or `--applied` only when every statement has been verified as present.
8. Run `npx prisma migrate deploy` again and verify schema drift before releasing application traffic.

Because these migrations introduce application dependencies, rolling back application code without removing the additive tables is safer than dropping production tables. Do not drop operational tables during an emergency rollback unless a separately reviewed data-retention plan explicitly requires it.
