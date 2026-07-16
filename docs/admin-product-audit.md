# OneFarmTech admin product audit

Date: 15 July 2026  
Scope: repository audit only; no routes, business logic, database models, or production data changed.

## Executive summary

The admin is operational but organised around the history of feature delivery rather than staff jobs. Core records and mutations exist for order intake, payments, receipts, delivery, complaints, buyer onboarding, access and communications. The main production risks are discoverability, duplicated representations of the same queue, inconsistent record identifiers in links, in-memory filtering/aggregation, and finite `take` limits presented without pagination or a visible “results truncated” state.

The highest-value first implementation phase is navigation and route-role clarification only: introduce the proposed top-level information architecture, preserve every current route, label compatibility/reference screens, and add route-level regression tests. It is lower risk than immediately merging queries or mutations.

Key findings:

- `/admin/whatsapp`, `/admin/whatsapp-inbox`, and `/admin/buyer-messages` overlap substantially. The latter is already closest to a unified communications workspace.
- `/admin/launch-inbox` duplicates account requests, order requests, and contact enquiries, but adds useful cross-queue triage actions.
- `/admin/customers` and `/admin/buyer-accounts` display the same `Customer` source with different projections; customer detail is the effective buyer record of truth.
- `/admin/drafts` is a thin compatibility page while `/admin/whatsapp-drafts` is the operational draft queue.
- `/admin/complaints` is incomplete: it delegates almost entirely to a shared draft panel rather than offering a scalable issue-management surface.
- Several list pages use fixed caps (`take: 50`, `100`, `200`, or `500`) without pagination, total counts, or truncation warnings. Several others load all matching rows.
- Dashboard and reports calculate overlapping metrics independently, creating definition-drift risk.
- Most mutations are real server actions. Informational readiness, workflow, permissions and security pages deliberately contain controls or cards that resemble operational UI but do not mutate data.

## 1. Full admin route inventory

Classification: **O** operational, **I** informational, **D** duplicated/overlapping, **C** incomplete, **B** backward-compatibility candidate.

| Route | Title and purpose | Records / actions / model | Links and classification |
|---|---|---|---|
| `/admin` | Company dashboard; executive and exception overview | Orders, customers, products, suppliers, payments, receipts, complaints, staff, requests, audit and operational events; navigation only | Links to most operational areas; **O/D** because metrics overlap reports and order desk. |
| `/admin/audit-log` | Audit log | Latest 75 `AuditLog`; open detail | Linked from dashboard/system; **O**, but capped without pagination. |
| `/admin/audit-log/[id]` | Audit event detail | One `AuditLog`; read-only JSON/value panels | Back to audit log; **O**. |
| `/admin/buyer-access` | Buyer access | `Customer`, `BuyerContact` (100), `BuyerAccountInvite` (100); create contact/invite, update invite status | Links customer detail; **O**. Large customer selector is uncapped. |
| `/admin/buyer-account-requests` | Account requests | Latest 200 `BuyerAccountRequest`; filter, update status, convert to customer | Buyer onboarding path; **O/D** with launch inbox. |
| `/admin/buyer-accounts` | Buyer accounts | All `Customer` plus contacts/invites/orders/receipts; in-memory filters | Links customer detail; **O/D** with customers. |
| `/admin/buyer-messages` | Buyer messages | Up to 100 `BuyerMessage`, 100 `EmailDelivery`, 50 reconciliation incidents and 50 operational events; filters, email retry, incident resolution | Customer detail; **O**, strongest unified-inbox candidate. |
| `/admin/buyer-profile-requests` | Profile update requests | Latest 100 `BuyerProfileUpdateRequest`; status update | Customer and access links; **O**. |
| `/admin/complaints` | Complaints | Complaint/order data delegated to `DraftOrdersPanel` | Operations/order detail; **C/D**; does not provide a dedicated issue queue. |
| `/admin/contact-enquiries` | Contact enquiries | Latest 100 `ContactEnquiry`; display only | WhatsApp inbox/launch inbox; **O/C** because status actions live elsewhere. |
| `/admin/create-order` | Create order | Customer/product inputs; `createOrderAction` creates `Order` and `OrderItem` | Orders; **O**, should remain a task route/drawer rather than a navigation section. |
| `/admin/customers` | Customers | All `Customer` with relations; create/update entry points and filters | Customer detail, buyer accounts; **O/D** with buyer accounts. |
| `/admin/customers/[id]` | Buyer/customer detail | One `Customer` with contacts, invites, orders, receipts and messages; account update | Orders, receipts, buyer access; **O**, effective buyer source-of-truth view. |
| `/admin/deliveries` | Deliveries | Latest 100 `Delivery`, all partners; filter, assign partner | Orders and delivery partners; **O**. |
| `/admin/delivery-partners` | Delivery partners | All `DeliveryPartner`; create, generate access code, change status | Partner login and deliveries; **O**. Missing from main navigation. |
| `/admin/deployment-readiness` | Deployment readiness | Environment/configuration checks; no operational records | Security/permissions; **I**. |
| `/admin/drafts` | Draft orders | Thin wrapper around `DraftOrdersPanel` | Overlaps WhatsApp drafts; **D/B**. |
| `/admin/group-buys` | Group buys | `GroupBuy`, items, reservations; create/update/reserve | Catalogue/supply; **O**. |
| `/admin/guest-buyers` | Guest buyers | Latest 500 unlinked `Order`, grouped by normalised phone in memory | Orders, assisted order, applications; **O**, but conversion ownership is unclear. |
| `/admin/integration-readiness` | Integration readiness | Environment-variable presence; no secrets displayed | Smoke test; **I**. |
| `/admin/launch-inbox` | Launch inbox | 40 each of applications, order requests and contact enquiries; status updates and conversion | Links the three source queues; **O/D**, valuable triage view. Missing from navigation. |
| `/admin/launch-readiness` | Launch & system checks | Counts/configuration checks | Deployment readiness; **I/D** with other readiness screens. |
| `/admin/launch-smoke-test` | Launch smoke test | Manual checklist | Integration readiness; **I**. Missing from navigation by design. |
| `/admin/logout` | Log out | Logout server action | Reached from shell; **O** utility route. |
| `/admin/operating-manual` | Operating manual | Static SOP content | Workflows, finance, issues; **I/D** with workflows and WhatsApp workflow. |
| `/admin/operations` | Order desk | Aggregate counts for orders, payment requests, deliveries, messages and products; navigation cards | Links intake and active queues; **O**, should be primary daily landing page. |
| `/admin/order-requests` | Order requests | Latest 100 `OrderRequest`; status update | Draft/order conversion paths; **O/D** with launch inbox and WhatsApp drafts. |
| `/admin/orders` | Orders | `Order` list with status/search sorting in page code | Create and order detail; **O**. Query/paging concerns described below. |
| `/admin/orders/[id]` | Order control centre | One `Order` and relations, recent messages, customers and partners; link buyer, create/generate/send payment request, assign delivery, update order, log messages | Finance, delivery, buyer and communications; **O**, central transaction detail but excessively long. |
| `/admin/payment-requests` | Payment requests | Latest 200 `PaymentRequest`, related order/customer and messages; status update, generate link, send WhatsApp, issue receipt | Order/customer; **O**. |
| `/admin/payments` | Payments | Payment records and related orders; filter | Finance links; **O**. |
| `/admin/permissions` | Permissions matrix | Static role/route information | Security/staff; **I**, not a permissions editor. |
| `/admin/pickup-locations` | Pickup locations | All `PickupLocation`; create | Catalogue/supply; **O**. |
| `/admin/products` | Products | All `Product`; create, seed baseline, update details/status; in-memory metrics/filtering | WhatsApp tools; **O**. |
| `/admin/receipts` | Receipts | Latest 100 `Receipt` and 50 eligible orders; issue receipt | Receipt detail; **O**. |
| `/admin/receipts/[code]` | Receipt detail | One `Receipt` with order/payment/customer | Back to receipts/order; **O**. |
| `/admin/reports` | Reports | Broad order/product/payment/receipt queries and in-memory company/KPI/product calculations | Dashboard; **O/D**, uncapped receipt query. |
| `/admin/security` | Auth and access status | Static/readiness facts | Permissions/staff; **I**. |
| `/admin/staff` | Staff & roles | Latest 50 `StaffUser`; create staff record | Permissions/security; **O**, but role record is not necessarily authentication identity. |
| `/admin/suppliers` | Suppliers | Supplier list; create/filter | Catalogue/supply; **O**. |
| `/admin/whatsapp` | Message centre | 50 buyer messages, 50 contact enquiries and operational counts; navigation hub | Inbox, tools, assisted order, buyer messages; **O/D**. |
| `/admin/whatsapp-drafts` | WhatsApp draft orders | Latest 100 WhatsApp `OrderRequest`; review and convert links | Inbox, assisted order, order requests; **O/D**. |
| `/admin/whatsapp-inbox` | WhatsApp inbox | 50 inbound `BuyerMessage` plus 50 unmatched `ContactEnquiry`; contextual links | Message centre, tools, drafts, customers; **O/D**. |
| `/admin/whatsapp-orders/new` | WhatsApp order | Active products and optional draft; create assisted order | Buyer access/orders; **O**, specialised order-create mode. |
| `/admin/whatsapp-tools` | WhatsApp message tools | Products; generate/send storefront menu and product list | Products, inbox, message centre; **O**, template/tool surface. |
| `/admin/whatsapp-workflow` | WhatsApp workflow | Small samples/counts across messages, enquiries, drafts, payments, deliveries and complaints; QA guidance | Numerous workflow routes; **I/D**, should live under System/QA. |
| `/admin/workflows` | Workflows | Order-stage reference and linked order list | Manual, deliveries, receipts, orders; **I/D**. |

## 2. Navigation audit

Navigation source: `app/src/data/adminNavigation.ts`; rendering: `AdminLayoutFrame`, `AdminShell`, `AdminSidebarGroup`, `AdminModuleNav`.

### Duplicated and unclear destinations

- “Message centre”, “WhatsApp inbox” and “Buyer messages” describe overlapping communications. `Buyer messages` is not in the sidebar even though dashboard exceptions link to it.
- “Buyer accounts” and “Customers” expose the same `Customer` master records; “Customers” being secondary does not explain the distinction.
- “Order drafts” means WhatsApp drafts, while `/admin/drafts` also exists and is not navigated.
- “Launch & system checks”, “Deployment”, “Integration readiness”, “Workflow test”, “Security” and “Permissions” fragment settings/readiness.
- “New order” is a frequent action, not an information-architecture destination; it should remain a global action after consolidation.

### Missing routes

Operationally relevant routes absent from the main navigation include `/admin/buyer-messages`, `/admin/delivery-partners`, `/admin/order-requests`, and `/admin/launch-inbox`. Detail, logout, smoke-test and assisted-create routes are appropriately contextual. `/admin/drafts` is likely intentionally hidden compatibility debt.

### Excessive hierarchy and labels

The sidebar has seven groups and approximately thirty destinations. “Sales” combines order creation and communications, while “Buyer accounts” contains both master data and intake. The proposed Communications and Buyers groupings better match ownership.

### Interaction concerns

- `AdminSidebarGroup` restores open state by synchronously setting React state in an effect (`app/src/components/admin/AdminSidebarGroup.tsx:24-27`), currently triggering a lint error.
- Readiness/security/permissions cards use the same visual vocabulary as actionable modules despite being read-only.
- Metric cards frequently act as filters by changing query parameters; this behavior is not consistently signposted.
- `/admin/orders/[id]` repeats payment and delivery controls in multiple sections, making the authoritative action location unclear (`:455-529`, `:803-910`, `:1026-1055`, `:1417-1554`).
- No statically missing route target was found among the principal links inspected. One identifier inconsistency is high risk: guest-buyer order links use `order.id` (`guest-buyers/page.tsx:328`), while most order links use `order.code`; the detail loader must support both or this becomes a broken link.

### Tabs / filtered views rather than routes

- Unified inbox tabs: inbound WhatsApp, all message log, email failures, unmatched enquiries, reconciliation.
- Buyers tabs: all buyers, guests, applications, access, update requests.
- System tabs: readiness, integrations, deployment, security/permissions, audit/QA.
- Order detail tabs: overview, payment, delivery, communications, issues/evidence.

## 3. Workflow mapping

### Inbound WhatsApp to confirmed order

`/api/whatsapp/webhook` → known sender `BuyerMessage` or unknown sender `ContactEnquiry` → optional WhatsApp `OrderRequest` draft → `/admin/whatsapp-inbox` and `/admin/whatsapp-drafts` → `/admin/whatsapp-orders/new?draftId=...` → `Order`/`OrderItem`.

Duplications/dead ends: the same inbound is visible in message centre, inbox, buyer messages, contact enquiries and sometimes order requests. Unknown-sender ownership remains on `ContactEnquiry`; conversion to customer/order is not a single guided action. Draft conversion status is maintained separately from order state.

### Manual order creation

`/admin/create-order` → `createOrderAction` → `Order` + `OrderItem` → `/admin/orders/[code]`. Product/customer selection exists. Guest ownership can remain unlinked; customer creation/linking is elsewhere.

### Order to payment request

Order detail → `createPaymentRequestFromOrderAction` → `PaymentRequest` → provider link generation → WhatsApp send/evidence in `BuyerMessage`. The same controls also appear on `/admin/payment-requests`; repeated controls create ownership ambiguity.

### Payment request to confirmed payment

Provider webhook verifies event → updates `PaymentRequest` and creates/updates `Payment`/order payment state; manual paths also exist in order operations. Reconciliation failures appear in `/admin/buyer-messages?view=reconciliation`. Provider request status, payment status and order payment status are separate fields whose transition authority needs explicit documentation.

### Payment to receipt

Paid request or receipt queue → receipt action → `Receipt` linked to order/customer/payment where available → `/admin/receipts/[code]`. Receipt actions appear in both payment requests and receipts. Idempotency should be expressed as a visible “receipt exists” state, not only action-level protection.

### Order to delivery

Order detail → create/assign `Delivery` and `DeliveryPartner` → `/admin/deliveries` → partner portal updates → order fulfilment update and buyer communication evidence. Assignment occurs in both order detail and delivery queue; delivery should own logistics status, with order status derived or synchronised deliberately.

### Delivery/order to complaint resolution

Order detail or inbound WhatsApp complaint → `Complaint` → `/admin/complaints`/order detail. The dedicated complaint page is incomplete and ownership of resolution is unclear. Complaint status and order/delivery state are not presented as one exception workflow.

### Guest buyer to approved buyer account

Unlinked orders → `/admin/guest-buyers`, grouped by normalised phone → staff moves to applications/assisted order/customer tools → `Customer`, then contacts/invite. There is no single conversion action from the grouped guest identity, risking duplicate customer creation and leaving historic orders unlinked.

### Buyer account request to login-ready access

Public request → `BuyerAccountRequest` → `/admin/buyer-account-requests` or launch inbox → conversion to `Customer` → `/admin/buyer-access` creates `BuyerContact` and `BuyerAccountInvite` → invite status/access readiness. Conversion and access are separate, but the source request does not visibly own or link to the resulting customer across the entire flow.

## 4. Consolidation recommendations

| Existing surface | Recommendation | Compatibility/risk |
|---|---|---|
| Company dashboard | Remain standalone | Define metrics centrally before changing calculations. |
| Order desk | Remain standalone daily workbench | Avoid duplicating full lists; use counts and exception previews. |
| Orders + create order | Orders standalone; create as contextual route/drawer | Preserve deep links and form action. |
| Message centre | Absorb into Unified inbox overview | Keep route temporarily redirecting or rendering the new default view. |
| WhatsApp inbox | Unified inbox filtered tab | Preserve direct route during transition. |
| Buyer messages | Become Unified inbox foundation | It already combines channels/failures/reconciliation. |
| WhatsApp drafts | Remain an Operations intake filtered view | Draft conversion is a distinct job. |
| Contact enquiries | Unified inbox “Unmatched/enquiries” view | Public non-WhatsApp enquiries still need type/source filters. |
| Launch inbox | Absorb as cross-intake view in Order desk/Unified inbox | Preserve until status actions are moved safely. |
| Customers + buyer accounts | One All buyers list with buyer detail | Do not merge data models; both are already `Customer`. |
| Guest buyers | Buyers tab | Conversion needs a transaction-safe server action before UI consolidation. |
| Account requests | Buyers Applications tab | Preserve public-source record and audit trail. |
| Buyer access | Buyers Access tab or buyer-detail tab | Bulk access queue remains useful. |
| Profile requests | Buyers Update requests tab | Keep source records immutable/auditable. |
| Payment requests | Standalone finance queue | Operationally distinct from settled payments. |
| Payments | Standalone ledger view | Treat as immutable evidence where possible. |
| Receipts | Standalone finance queue/archive | Receipt detail remains standalone. |
| Reconciliation | Dedicated Finance tab, sourced from current unified inbox | Finance ownership is clearer than Communications. |
| Deliveries | Standalone | Partner administration becomes secondary/settings link. |
| Complaints | Rename/rebuild as Issues | Combine complaints, delivery exceptions and operational ownership without deleting `Complaint`. |
| Reports | Standalone | Centralise definitions first. |
| Readiness/workflow/manual pages | System & Settings tabs/reference pages | Preserve URLs for runbooks and bookmarks. |

## 5. Scalability audit

### At approximately 100 records

Fixed-cap pages begin silently hiding older records: contact enquiries/order requests/profile updates (100), receipts (100), deliveries (100), WhatsApp drafts (100), access contacts/invites (100). They need total count, pagination cursor, and a clear result range.

### At approximately 1,000 records

- Buyer accounts and customers load all customers plus nested relations and filter in memory.
- Guest buyers load 500 orders then group by phone, so the resulting “guest buyer” population is incomplete and biased to recent orders.
- Products, suppliers, group buys, partners and pickup locations have no consistent pagination.
- Search based on `contains` without documented indexed strategy will degrade, especially across related customer names/messages.
- Expanded card layouts on applications, profile updates, group buys and order detail become slow to scan.

### At approximately 10,000 records

- Reports’ uncapped receipt query (`reports/page.tsx:32`) and other broad datasets are not viable.
- Dashboard metrics derived from loaded arrays rather than database aggregates risk high memory and latency.
- Deep relational includes for all customers/orders create payload amplification.
- `take` without cursor pagination is not a scalable substitute; staff cannot reach records beyond the cap.
- Full-table selectors (customers, products, partners) require asynchronous search/autocomplete.

### Query and presentation findings

- Prefer database `where`, `count`, `aggregate`, `groupBy`, cursor pagination, stable ordering and indexed equality/status/date filters.
- Avoid client/application filtering after uncapped `findMany` for list pages.
- Standardise a default page size (for example 25/50) with total/next cursor.
- Add responsive row summaries or detail drawers to wide tables; current minimum-width tables force horizontal scrolling.
- Consolidate repeated “latest N” query definitions so dashboards and modules use the same status semantics.

## 6. Interaction audit

- `/admin/contact-enquiries` presents status but no action; updates exist in launch inbox, creating a dead-end list.
- `/admin/complaints` lacks obvious dedicated resolution actions in its page implementation.
- Read-only Permissions and Security pages can be mistaken for management screens because their titles imply editable configuration.
- Dashboard and metric cards are clickable while visually similar informational cards elsewhere are not.
- Long order detail repeats actions and uses multiple disclosure/card styles, increasing the likelihood of staff acting in the wrong section.
- Product seed-baseline is a high-impact operational control placed beside ordinary create/edit controls; it needs explicit confirmation and production policy.
- External WhatsApp/email buttons in launch inbox leave the application; evidence depends on separate logging and should be labelled accordingly.
- Filters use inconsistent terminology (`status`, provider-as-status, “All” case variants) and do not consistently show active-filter counts or reset behavior.
- There is no shared modal/drawer pattern; long inline forms and disclosure panels substitute for focused editing.

## 7. Data consistency observations

These are validation questions, not conclusions that production data is wrong:

- `Order.paymentStatus`, `PaymentRequest.status` and `Payment.status` can disagree. Define which provider event or manual action is authoritative and which transitions are permitted.
- `Order.fulfilmentStatus` and `Delivery.status` may diverge. Define whether delivery drives order fulfilment or both are independently editable.
- Receipt creation is available from multiple screens. Confirm uniqueness expectation per order, payment or payment request; the schema does not visibly declare a one-receipt-per-payment rule.
- Manual payment creation can result in a paid order with zero/incorrect total unless action validation consistently rejects it.
- Guest grouping uses phone normalisation in application code, while customer matching also occurs in WhatsApp helpers. A single canonical identity rule is needed to prevent duplicate customers.
- Customer credit/outstanding metrics and order/payment totals are calculated in several pages. Clarify whether balances are stored ledger values or derived totals.
- Product availability, status and counts are represented separately. Define whether “active”, “available” and WhatsApp-visible mean the same thing.
- Complaint resolution does not inherently define whether an order/delivery should reopen, refund or remain delivered.
- Buyer request conversion should record the resulting customer ID explicitly or through auditable metadata so repeated conversion cannot create duplicates.
- Code generation based on row counts in actions is concurrency-sensitive; unique constraints may reject collisions but staff need recoverable error handling.

## 8. Shared component audit

### Existing reusable components

- Page shells/headers: `AdminPageShell`, `portal/AdminPage`, `AdminStandalonePage`, `AdminShell`, `AdminLayoutFrame`.
- Metrics: `StatCard`, `AdminHealthGrid`; additional local `Metric`, `MetricCard`, `AdminCompactMetric` implementations exist.
- Tables: `AdminTableShell`.
- Filters/view controls: `AdminViewControls`, `AdminModuleNav`.
- Status: `StatusBadge`, buyer `BuyerMessageStatusPill`; many pages also implement local coloured spans.
- Accordions: `AdminDisclosure`, `AdminSidebarGroup`.
- Actions/forms: `AdminActionButton`, `CreateOrderClient`, shared `FormField`, `SelectField`, `TextAreaField`.
- Operational/detail panels: `AdminInfoCard`, `OrderTraceabilityPanel`, `DraftOrdersPanel`, `OperationalTimeline`, `QuickActionsGrid`.
- Empty states: mostly local table rows or paragraphs; no consistent shared empty-state component.
- Drawers/modals: no general admin drawer/modal abstraction found.
- Pagination: no shared pagination component found.
- Navigation: `AdminModuleNav`, `AdminSidebarGroup`, `AdminLayoutFrame`, navigation data module.

### Duplication

Local metric cards, status pills, info panels, filter forms, empty rows and table markup recur across dashboard, enquiries, buyers, finance and catalogue pages. Two page-shell families (`AdminPageShell` and `portal/AdminPage`) create inconsistent header/action APIs. Consolidation should begin with primitives only after visual snapshots and behavior tests exist.

## 9. Recommended target architecture

### Dashboard

Company overview, exceptions and links only. Use shared metric definitions with Reports.

### Operations

- Order desk
- All orders
- Deliveries
- Issues

Keep assisted/manual create as actions. Put draft/order-request intake in Order desk filters. “Issues” should initially compose existing complaints/delivery exceptions without altering models.

### Communications

- Unified inbox
- Templates/message tools and delivery log where needed

Use `BuyerMessage`, `EmailDelivery`, `ContactEnquiry`, reconciliation/operational events as separate sources behind explicit tabs—not a premature polymorphic schema rewrite. Finance reconciliation may later move to Finance while remaining linkable.

### Buyers

- All buyers
- Guests
- Applications
- Access
- Update requests

Use `Customer` detail as the master UI. Preserve request records and audit conversion rather than overwriting them.

### Finance

- Payment requests
- Payments
- Receipts
- Reconciliation

Document status authority before any UI merge.

### Catalogue & Supply

Products, group buys, suppliers, pickup locations and delivery partners where organisational ownership dictates. Delivery partners may alternatively sit under Operations settings.

### Reports

Standalone, database-aggregated and definition-driven.

### System & Settings

Staff, permissions, security, integrations, deployment/readiness, audit log, operating manual and QA workflows. Read-only screens must be labelled “status”, “reference” or “checklist”.

Risks/exceptions: route redirects can break bookmarks and authorization maps; merging surfaces can accidentally remove unique mutations; unified queries can become slower than separate queues; role visibility must be tested for every destination; no model consolidation should occur until source ownership and retention rules are approved.

## 10. Phased implementation plan

### Phase 1 — information architecture without route removal

Files: `src/data/adminNavigation.ts`, navigation components, `src/lib/adminAccess.ts`, navigation tests. Introduce target groups and clearer labels; keep current URLs; add Unified inbox/Issues/Reconciliation aliases only if they render existing components. Validate every role and link. Independently reversible.

### Phase 2 — shared list foundations

Files: new shared pagination/search/empty-state/status components plus one pilot queue (contact enquiries). Add URL-driven server pagination and total/result range. No business mutation changes. Use the pilot to establish tests and accessibility behavior.

### Phase 3 — unified communications shell

Files: `/admin/buyer-messages`, `/admin/whatsapp`, `/admin/whatsapp-inbox`, `/admin/contact-enquiries`, communications actions/components. Build tabs over existing sources and retain legacy routes as compatibility views/redirects. Test known/unknown inbound, filters, retry and reconciliation authorization.

### Phase 4 — buyer workspace

Files: customers, buyer accounts, guests, requests, access, updates and customer detail. Create All buyers shell and tabs; retain source records. Add explicit, idempotent guest/application conversion design before implementing conversion.

### Phase 5 — operations and order detail

Files: operations, orders, order detail, create/assisted order, drafts/order requests, deliveries, complaints. Move repeated controls into tested task panels; introduce order-detail tabs; establish Issues composition. Do not change state transitions in the same commit as layout moves.

### Phase 6 — finance status authority

Files: payment requests, payments, receipts, reconciliation and payment actions/webhooks. First document/test state transitions and receipt idempotency; then consolidate filters and links. Keep provider webhook changes isolated from UI commits.

### Phase 7 — database-backed reporting and scale

Files: dashboard, reports, list queries and possibly schema indexes in a separately approved migration. Replace broad queries/in-memory aggregates with shared database definitions. Benchmark representative 100/1,000/10,000-record fixtures.

### Phase 8 — system/reference consolidation and compatibility cleanup

Files: readiness, deployment, integration, security, permissions, manual/workflow pages and legacy route wrappers. Clearly label informational screens, consolidate tabs, observe route usage, then propose removals separately. No removal without explicit approval.

For every phase: snapshot `git status`; add targeted tests; run `npm run lint`, `npx tsc --noEmit`, `npm run test:production-foundations`, and the production build where appropriate; commit independently; retain redirects/compatibility routes until production usage is verified.

## Validation baseline

The repository scripts are defined in `app/package.json`. Prisma contains 28 models, including the principal operational sources `Customer`, `Order`, `PaymentRequest`, `Payment`, `Receipt`, `Delivery`, `Complaint`, `BuyerMessage`, `ContactEnquiry`, `OrderRequest`, account/access models, audit and operational evidence.

The validation results and final working-tree status are recorded in the handoff accompanying this report.

## Phase 1 implementation status

Phase 1 implemented the approved job-based sidebar groups: Dashboard, Operations, Communications, Buyers, Finance, Catalogue & supply, Reports, and System & settings. The unified Inbox now points to `/admin/buyer-messages`; Issues retains `/admin/complaints`; Reconciliation uses the supported `/admin/buyer-messages?view=reconciliation` filter; and System status uses `/admin/launch-readiness` as the strongest overview.

All legacy routes identified by the audit remain in place without redirects. Relevant legacy routes contribute to the active state of their nearest sidebar group while remaining accessible contextually or by direct URL. Role filtering continues to use the existing admin access map, so inaccessible links are not rendered.

A compact reusable page header was introduced and piloted only on Orders, Deliveries and Customers. Their queries, filters, tables, server actions and operational behavior were not changed.

Deferred issues include list pagination, unified communications queries, complaint/Issues completeness, buyer-list consolidation, finance state authority, and broader page-header migration. The recommended next phase is the shared list-foundation pilot on Contact enquiries, adding server-driven pagination, result counts, search and a reusable empty state without changing its record workflow.

## Phase 2 implementation status

The Contact enquiries pilot now uses reusable, record-agnostic list toolbar, result-count, pagination and empty-state components. URL parameters drive database-level search across contact identity and message fields, exact status/type/source filters, stable offset pagination, and page sizes of 25, 50 or 100. Invalid and out-of-range pages resolve safely, and active filters are retained by pagination links.

Rows use concise message previews with responsive mobile cards. An accessible Manage disclosure reveals the complete message and reuses the existing authorised, audited `updateContactEnquiryStatusAction`; no mutation logic was duplicated or moved.

No schema index was added. Future scale work should consider indexes for `createdAt`, `status`, `source`, `enquiryType`, and the identity fields used frequently in search. Text `contains` search may ultimately require PostgreSQL trigram or full-text indexing after production query analysis.

Validation and the remaining documented lint baseline are recorded in the Phase 2 handoff. Known limitations are offset cost at very high page numbers and dynamic filter-value queries on every request. The recommended next rollout page is Order requests because it has the same capped intake-queue shape and existing status workflow.

## Phase 2B implementation status

Order requests now reuses the Phase 2 list toolbar, result count, pagination, empty state and URL-parameter utilities. It performs database-level search, exact status/source/buyer-type/conversion filtering, stable offset pagination and accurate counts with page sizes of 25, 50 or 100. Desktop rows and mobile cards retain requester identity, status and a review action while long item/message content stays inside an accessible disclosure.

The queue reuses the existing authorised and audited status action. Only WhatsApp inbound drafts receive the existing assisted-order conversion link. Converted drafts expose the recorded order link when `adminNote` contains `convertedOrderId`; records merely marked converted without that evidence explicitly report that no reliable link is stored and do not offer repeat conversion.

The shared toolbar was extended only with generic search-label and placeholder properties, preserving Contact enquiries behavior. No schema or index changed. Future indexes should be evaluated for `createdAt`, `status`, `source`, buyer type/conversion queries, phone/email identity lookup and text search. Known limitations remain offset cost, per-request distinct filter queries, and the lack of a reliably linked conversion flow for public order requests.

Validation is recorded in the Phase 2B handoff. The recommended next work is not Phase 3 consolidation: first apply the list foundation to Buyer account requests or address the documented TypeScript/lint baseline in a separately scoped quality phase.

## Phase 2C implementation status

Buyer account requests now reuse the shared list toolbar, result count, pagination, empty state and parameter utilities. Database-level search covers applicant, organisation, contact, location, registration, produce needs, message and conversion-note fields. Exact status, buyer type, source and conversion-evidence filters combine with stable offset pagination and page sizes of 25, 50 or 100.

Applications use compact desktop rows and mobile cards with an accessible review disclosure containing the existing application fields. Status and conversion forms reuse the authorised server actions. The UI suppresses repeat conversion after `Converted to customer`, parses the existing `Converted to customer record: <id>` evidence, verifies the linked customer on the current page, and links to customer detail when available. Converted records without reliable evidence are explicitly labelled. Customer conversion and buyer access remain separate stages.

No shared component change was needed. No schema or index changed. The existing conversion action always creates a Customer and does not itself check request status or match existing customers, so UI suppression is not a concurrency/idempotency guarantee; hardening that action requires a separately approved business-logic phase. Future query work should assess indexes for creation time, status, buyer type, source, applicant email/phone and a first-class converted-customer relationship rather than text evidence.

Validation is recorded in the Phase 2C handoff. The recommended next phase is a scoped quality and conversion-idempotency review before broader Buyers workspace consolidation.

## Buyer conversion integrity phase status

The previous BuyerAccountRequest conversion performed request lookup, Customer creation, request update and audit logging as separate operations, allowing retries or concurrent staff actions to create duplicate Customers. Conversion is now executed in one interactive Prisma transaction with a PostgreSQL transaction-scoped advisory lock derived from the request ID. All application processes therefore serialize conversion of the same request before reading its state; Customer creation, conversion evidence, request status and audit evidence commit or roll back together.

No schema change was required. Historical `Converted to customer record: <id>` notes remain supported. A valid linked customer is returned idempotently; malformed evidence and missing recorded customers produce controlled UI errors. Rejected and closed requests are blocked. First conversion creates one creation audit event containing request/customer IDs and timestamp; repeat resolution creates a distinct idempotency audit event rather than another creation event.

Customer has no unique email, phone, registration or account-code identity rule, so conversion deliberately does not match or merge existing customers. Customer uses only a generated CUID and has no count-based business code. Login access and invitations remain separate. A future first-class `convertedCustomerId @unique` relation would improve queryability and database portability, with a nullable field, `onDelete: SetNull`, a reverse Customer relation, and a reviewed backfill from valid historical notes; it is not necessary for correctness while PostgreSQL advisory locking is enforced.

Validation is recorded in the phase handoff. Known limitations are PostgreSQL-specific locking, text-based historical linkage, and the need for every conversion entry point to call the hardened action. The next recommended phase is a focused lint/TypeScript quality pass or a separately approved migration to first-class conversion linkage—not Buyers workspace consolidation.
## Phase 3A Communications workspace status

`/admin/buyer-messages` is now the canonical staff Inbox. Its URL-driven views are All activity, WhatsApp, Enquiries, Email delivery and Reconciliation. Invalid views return safely to the default Inbox. The Finance reconciliation URL remains `/admin/buyer-messages?view=reconciliation`.

The workspace retains separate `BuyerMessage`, `ContactEnquiry`, `EmailDelivery`, `PaymentReconciliationIncident` and operational-event concepts; no polymorphic model or migration was introduced. All activity uses independently capped previews (eight recent records per source) and labels that limitation rather than presenting a false globally paginated timeline.

WhatsApp, Enquiries, Email delivery and Reconciliation use database counts, stable `createdAt`/ID ordering, 25-record defaults with 25/50/100 options, database search/filtering, safe out-of-range correction, result ranges and query-preserving pagination. Enquiries follows the Phase 2 query rules and shared list controls. Unknown WhatsApp contacts remain discoverable as `ContactEnquiry` records and are linked explicitly from the WhatsApp view.

Existing enquiry status updates, failed-email retry and reconciliation resolution actions are retained without duplication. Customer links, related-order links where the existing source identity is reliable, and contextual links to Order requests, WhatsApp drafts, WhatsApp tools and All buyers remain available.

Legacy `/admin/whatsapp`, `/admin/whatsapp-inbox`, `/admin/contact-enquiries`, `/admin/launch-inbox`, `/admin/whatsapp-drafts` and `/admin/whatsapp-tools` routes remain operational and link to the unified Inbox. A later compatibility phase may consolidate the first two and the communications portion of Launch inbox after role access and unique intent-routing actions are deliberately reconciled. Contact enquiries should remain a useful direct queue; draft orders and tools remain Order desk destinations.

Known limitations: email and reconciliation records use loose related-type/reference fields rather than direct customer/order relations; operational events remain a recent All-activity signal rather than a full standalone view; no new indexes were added. Future index review should cover case-insensitive search fields and stable timestamp/ID pagination patterns after production query analysis.

Recommended Phase 3B: reconcile role access for the canonical Inbox (especially Finance reconciliation and Support WhatsApp), extract the Contact enquiries presentation into one reusable renderer, add operational-event filtering/detail review, then assess legacy compatibility treatment without redirecting until unique actions have a confirmed home.
## Phase 3B Communications access and compatibility status

Communications access now uses both query-aware proxy authorization and server-side view resolution. Super admin and Admin can use every Inbox view. Operations can use every view but cannot resolve reconciliation incidents. Support can use All activity, WhatsApp, Enquiries, Email delivery and Operational events; Reconciliation is hidden and direct access falls back safely. Finance can access only `/admin/buyer-messages?view=reconciliation` and can resolve incidents. Buyer account managers retain their existing standalone Contact enquiries access but do not receive the canonical Inbox. Reconciliation and email-retry actions enforce their own role lists independently of page visibility.

The canonical Inbox adds `/admin/buyer-messages?view=operations`. Operational events use database counts, 25/50/100 page sizes, stable timestamp/ID ordering, database search across category, summary, route and related identity, and exact filters populated from stored status, category, severity and related-type values. Desktop rows and mobile cards retain identity, state and Review access. Metadata is not displayed. All currently persisted events use status `Open`; actual severities distinguish `Info`, `Warning` and `Error`. No operational-event status mutation exists, so none was invented.

Contact enquiries now have one focused server-rendered implementation in `ContactEnquiriesList`. Both `/admin/contact-enquiries` and the Inbox Enquiries view use its query construction, counts, pagination, search, filters, table/cards, disclosure, status action and empty states.

Legacy classification: `/admin/whatsapp` is a compatibility candidate retaining cross-workflow counters; `/admin/whatsapp-inbox` is a mixed compatibility candidate retaining intent classification and workflow recommendations; `/admin/contact-enquiries` remains a direct queue backed by the shared renderer; `/admin/launch-inbox` remains mixed cross-queue triage with buyer conversion and three status workflows; `/admin/whatsapp-drafts` remains a unique Operations intake page; `/admin/whatsapp-tools` remains a dedicated contextual sending tool. No route was removed or redirected.

Launch inbox now labels ownership explicitly: Buyer applications belong to Buyers, Order requests to Operations and Contact enquiries to Communications. Its existing mutations and direct follow-up actions remain intact; it should later become a concise launch-only triage page after each canonical queue is proven operational.

Known limitations: OperationalEvent has no acknowledgement/resolution fields or action; Finance route admission depends on the reconciliation query parameter; related operational records link only for reliably recognised stored types. Recommended next work is a production-data review of event categories/severities and route metrics, followed by a deliberate compatibility decision for the two legacy WhatsApp overview pages. Buyers workspace consolidation remains out of scope.

Validation: 31 focused Communications, Phase 2 list and conversion-integrity tests plus 21 production-foundation tests passed; changed-file and global lint passed; TypeScript passed. The production build was started and remained active at final reporting, so its result was not inferred or forced.
