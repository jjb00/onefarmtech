# OneFarmTech — Handover to Codex

Written 2026-08-10 by Claude Code, at Joy's (founder) request to move active development to Codex. This is an honest state-of-the-project document — what's real, what's verified, what's still open, and what NOT to re-litigate from scratch.

## What the business is

OneFarmTech is a WhatsApp-first fresh produce supply platform for Nigerian buyers (restaurants, retailers, households, group buys). Live at **onefarmtech.com**. Founder (Joy) is non-technical and delegates engineering entirely.

## Repo / environment basics

- Working directory: `app/` (this file sits one level up, at the repo root).
- Deployed on Vercel, project `nexterra/onefarmtech`. Deploy with `git push origin main` (usually auto-deploys) or `npx vercel --prod --yes` from `app/` as a manual fallback if a push doesn't trigger a build within ~30s.
- Database: Supabase Postgres (`eu-west-1`), pooled via pgbouncer on port 6543. Connection string in `app/.env`.
- **Do NOT use `npx prisma migrate deploy` or `migrate resolve`** — both hang or fail (`P1017`) against the pooled connection. Instead: hand-write `migration.sql` under `prisma/migrations/<timestamp>_<name>/`, apply it directly with a raw `pg` `Pool` (see any recent migration folder for the pattern used), then `npx prisma generate`.
- After any schema change, restart the dev server (Next.js/Turbopack caches the old Prisma client).
- Test baseline: `node --test 'tests/**/*.test.mjs'` from `app/` currently has **5 pre-existing failing tests** that are stale literal-source-text assertions from earlier page designs, not real bugs. As of this handover the count was 272 tests, 267 passing, 5 failing (same 5 as before — confirm this exact baseline hasn't grown before trusting a change is clean).
- Build check before any deploy: `npm run build` (catches bundler issues `tsc --noEmit` alone misses).

## What's actually live and working

- **Ordering**: WhatsApp (Cloud API, official/sanctioned — see AI section below for why this matters), web order form, and admin-manual order creation. All three real and tested.
- **Payments**: Paystack live (`PAYSTACK_SECRET_KEY`/`PAYSTACK_PUBLIC_KEY` are live keys), webhook confirmed wired at `/api/payments/webhook`, checkout redirect bug fixed (was dumping buyers on the admin login page after paying — fixed in `paymentInitialization.js`).
- **Delivery**: OneFarmTech-arranged delivery is mostly automated (driver gets a WhatsApp job notification, updates status via buttons, buyer notified automatically). Pickup fulfilment is still fully manual (staff moves status by hand in admin) — legitimate next automation candidate, not started.
- **Group buying**: weekly Sunday-20:00-WAT-open / Thursday-22:00-WAT-close cycle, via Vercel cron (`vercel.json`). Self-sustaining as of this handover — when a group buy closes, the close-cron automatically clones it into next week's draft, so it no longer silently goes dormant. Just-added: price tiers (`GroupBuyPriceTier` model — buyers get a better price as the group grows, everyone settles at the best tier reached by close) and a soft cap of 5 concurrently-live group buys. **Not yet built**: actual Paystack charge/refund wiring for group-buy reservations — today reservation "paid" status is set manually by staff, there is no real checkout link generated for a group-buy reservation. See `src/lib/groupBuySchedule.ts`, `src/lib/groupBuyState.js`, `src/actions/groupBuys.ts`.
- **Careers page** (`/careers`): fully built, not a stub — 15 real roles, working department/location/stage filters, full `JobPosting` structured data (all Google-required + recommended fields, verified present and valid via direct JSON-LD parsing of the live page), complete application modal (email/phone/CV upload with type+size validation, consent checkbox, Turnstile bot-check gating submit). Verified end-to-end on desktop and mobile.
- **Admin dashboard** (`/admin`): a real "Today" queue view with live DB-backed counts (new order requests, orders needing action, payment follow-up, fulfilment, buyer applications, profile updates, complaints, WhatsApp messages needing reply) each linking into a filtered work queue. Some genuinely dead/unused scaffolding (`QuickActionsGrid`, `OperationalTimeline`, `AdminHealthGrid` components, never rendered by any route) was removed this session.

## The traffic / SEO / "career page had hundreds of applications, now nothing" problem — READ THIS BEFORE RE-INVESTIGATING

This has been investigated multiple times this project and **the root cause is still not confirmed**, but a lot of dead ends have already been ruled out — don't re-walk them:

- The `/careers` page's `JobPosting` structured data was checked directly (fetched the live page, parsed the actual JSON-LD) and is present and valid — all Google-required fields plus the recommended `logo` and `identifier` fields.
- Spoofed both a Googlebot and an Indeed-style crawler user-agent against the live site — both got clean 200 responses, no Cloudflare challenge blocking them. (Cloudflare sits in front of this domain and does auto-block AI-training crawlers like GPTBot/Google-Extended via robots.txt, but that's unrelated to real search/job crawling, which was separately confirmed unblocked.)
- Two real, separate bugs were found and fixed earlier in the project that *did* break public form submissions for a period (Turnstile bot-check breaking submissions when first added; a CV-upload field sitting outside the `<form>` tag breaking 100% of career applications for ~12 days) — both are fixed and verified now, and Resend delivery events confirm the underlying contact/careers email pipeline receives mail.
- **Umami analytics was silently broken** (found and fixed 2026-08-07/08): the tracking call used an object argument that replaced Umami's default context instead of merging with it, dropping the `hostname` field required by domain verification — every event was silently rejected server-side with zero client-visible error, explaining a "0 visitors" dashboard reading despite the site clearly being visited. This is now fixed and verified live (confirmed via monkey-patching `window.fetch` to inspect actual outbound payloads). **This means: analytics from before the fix are meaningless/missing; anything after the fix date should be trusted.**
- Joy stated no Indeed Employer account exists, yet people found jobs via Indeed at a past traffic peak. This is real and not mysterious — Indeed runs an organic crawler (like Google does) that picks up valid `JobPosting` structured data from any public page with no employer account or submission required. It is **not** something any AI agent (ChatGPT's, Claude's, or otherwise) can "do" on your behalf — there is no such capability. If listings stopped showing, that's an Indeed-crawl-state question.
- **The actual blocker to answering "why did traffic/applications drop": nobody has checked Google Search Console or an Indeed dashboard for onefarmtech.com.** This cannot be diagnosed from outside the site — every externally-checkable thing has been checked and is clean. Getting Joy to share a screenshot of Search Console's Coverage/Pages report, or setting up a free Indeed Employer account for real visibility into listing views/clicks, is very likely the single highest-leverage next step on this whole problem. Don't spend more engineering time on structured-data/crawler-access theories without this — they've been ruled out.

## Group-buy model — decided, partially built

Joy's confirmed model (as of this handover):
1. Buyers propose a group buy (via `/group-buy-request` — this flow already exists); staff sets real pricing tiers and approves.
2. Many can run concurrently (buyer-driven), capped at 5 live at once so approval/sourcing load stays manageable for a small team.
3. Tiered pricing: price drops as more people join; **everyone in the group settles at the best tier reached by close**, not just whoever joined first (this was an explicit, deliberate choice — "buy in bulk, buy cheaper" only works if the reward is collective).
4. Payment timing decision made but **not yet built**: charge each buyer at the tier active when they join, auto-refund the difference if a better tier is unlocked by close. This requires building real Paystack checkout for group-buy reservations first (doesn't exist today) before the refund logic can sit on top of it — do not build refund logic before the underlying charge flow is real, it has genuine payment-correctness risk.
5. How buyers actually join/order (WhatsApp deep-link vs. web form vs. something richer) was explicitly deferred until the AI/conversational WhatsApp work below happens — Joy's call, not an oversight.

## AI — nothing built yet, blocked on Joy

- Zero AI/LLM provider dependency exists in the codebase as of this handover. Checked directly (grepped for `ANTHROPIC`/`OPENAI`/`CLAUDE_API`/`LLM_` in `.env`, `.env.local`, and Vercel production env) — nothing there, despite Joy believing she'd already shared a key. She hasn't.
- What Joy wants, in two phases (her framing, not yet built):
  1. **Phase 1 — conversational WhatsApp**: an LLM that can hold a real conversation (not just interactive buttons) and take real actions (look up order status, real prices, create draft orders) via tool-calling into the database — interactive buttons should stay for the simple stuff.
  2. **Phase 2 — voice**: customers can call and talk to an AI support agent (she referenced Boardy.ai as the bar for "real and natural" conversational voice AI). This is a meaningfully bigger, separate project — needs a telephony provider (e.g. Twilio) plus a real-time voice model, distinct infrastructure and cost from phase 1, and should be sequenced after phase 1's database/tool-calling logic is proven, reusing it rather than building twice.
- **Important, current-architecture-specific constraint**: the existing WhatsApp integration (`src/lib/whatsapp/`) is built entirely on Meta's official Cloud API, which is strictly 1:1 messaging — it has no capability to read or send messages inside an actual WhatsApp group chat. This was investigated at length after Joy specifically asked about literal WhatsApp-group-based ordering; confirmed via full codebase search that no such capability exists or was ever built. If asked to build "AI that reads WhatsApp group chats," know that this requires either Meta's separate, restrictive Groups API (capped participants, blocks polls/interactive messages, requires an upgraded account tier) or an unofficial WhatsApp-Web-emulation library (ToS/ban risk to the business number) — Joy was walked through this tradeoff and explicitly deferred the join-mechanism question rather than choosing either.

## A hard line that was held this session — know this going in

Joy explicitly asked, multiple times and with real frustration, for a group-buy homepage "progress bar" to show a **fabricated percentage that rotates randomly between 50-90% daily**, framed as gamification/an MVP test on a small closed network. This was declined and not built, on the grounds that it's a fake-scarcity dark pattern — real people (however few) would be shown a number designed to look like real demand when it isn't, which is deceptive regardless of audience size or "it's just a design" framing. **If Codex is asked for something similar, this context is relevant — it's not a technical limitation, it's a considered position that fabricated activity/demand numbers presented as real to actual site visitors shouldn't be built**, and Codex's own judgment should apply here rather than assuming the prior refusal was Claude-specific. What *was* built instead as a middle ground: a genuinely real, honest progress bar driven by elapsed time in the group-buy window (`groupBuyWindowProgress` in `src/lib/groupBuySchedule.ts`) — moves every day on its own, claims nothing about demand.

## Outstanding, unblocked, ready to pick up

1. Real Paystack checkout for group-buy reservations (blocks the tier-refund logic above).
2. Pickup fulfilment automation (mirror the existing driver-status-update pattern for pickup-location staff).
3. Bank-transfer WhatsApp flow — scoped, not built: needs Joy's real bank account details (not placeholder), confirmation the order code doubles as payment reference, and whether it's one account or several. The manual-reconciliation backend already exists (`createPaymentAction` in `src/actions/orderOperations.ts`).
4. AI phase 1 (WhatsApp conversational) — blocked on Joy actually providing an Anthropic (or other LLM provider) API key; she was given exact steps to get one but hadn't completed it as of this handover.
5. Traffic/SEO root cause — blocked on Joy sharing Search Console/Indeed dashboard access or screenshots; see the section above, don't re-investigate what's already ruled out.

## Persistent memory

Claude Code maintains project memory files at `/Users/joyjack/.claude/projects/-Users-joyjack-Documents-onefarmtech/memory/` — `MEMORY.md` is the index. These contain user-preference/feedback context (e.g. Joy is authorized for autonomous fix-and-deploy without per-change approval given build+test verification; never fabricate real-looking activity numbers; never use `@nexterracap.com` addresses in anything OneFarmTech-facing, route by type to `@onefarmtech.com`). Not automatically available to Codex, but worth knowing this context existed and shaped prior decisions if Joy references something that seems to assume prior context.
