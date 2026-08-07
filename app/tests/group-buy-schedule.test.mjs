import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {nextGroupBuyOpenTime, nextGroupBuyCloseTime} from "../src/lib/groupBuySchedule.ts";

const read = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("next open/close times land on the stated Sunday-night/Thursday-night schedule", () => {
  // Friday morning -- both the open and close windows for the week have
  // already passed, so both should roll to next week.
  const fridayMorning = new Date("2026-08-07T09:00:00Z");
  const open = nextGroupBuyOpenTime(fridayMorning);
  const close = nextGroupBuyCloseTime(fridayMorning);
  assert.equal(open.getUTCDay(), 0, "opens on a Sunday");
  assert.equal(open.getUTCHours(), 19, "opens at 19:00 UTC (20:00 WAT)");
  assert.equal(close.getUTCDay(), 4, "closes on a Thursday");
  assert.equal(close.getUTCHours(), 21, "closes at 21:00 UTC (22:00 WAT)");
  assert.ok(open < close, "the open time precedes the close time within the same window");
});

test("a moment right after the open time rolls to the following week, not the same instant", () => {
  const justAfterOpen = new Date("2026-08-09T19:30:00Z"); // Sunday, 30min after 19:00 UTC open
  const open = nextGroupBuyOpenTime(justAfterOpen);
  assert.ok(open.getTime() > justAfterOpen.getTime());
  assert.equal((open.getTime() - justAfterOpen.getTime()) / (1000 * 60 * 60 * 24) > 6, true);
});

test("a new admin-created group buy starts as Draft, not Closed, and defaults its closing date to the schedule", () => {
  const actions = read("src/actions/groupBuys.ts");
  assert.match(actions, /status: "Draft"/);
  assert.doesNotMatch(actions, /status: "Closed",\s*\n\s*minQuantity/);
  assert.match(actions, /closingDate: closingDate \|\| nextGroupBuyCloseTime\(\)/);
});

test("the weekly open cron only publishes prepared (Draft) group buys and leaves buyer-submitted proposals for review", () => {
  const openCron = read("src/app/api/cron/open-weekly-group-buys/route.ts");
  const proposalAction = read("src/actions/groupBuys.ts");
  assert.match(openCron, /where: \{status: "Draft"\}/);
  assert.match(proposalAction, /status: "Proposed"/);
});

test("vercel.json schedules both the open and close crons a week apart, open before close", () => {
  const vercelConfig = JSON.parse(read("vercel.json"));
  const crons = vercelConfig.crons;
  const open = crons.find((c) => c.path === "/api/cron/open-weekly-group-buys");
  const close = crons.find((c) => c.path === "/api/cron/close-weekly-group-buys");
  assert.ok(open, "open cron is registered");
  assert.ok(close, "close cron is registered");
  assert.equal(open.schedule, "0 19 * * 0");
  assert.equal(close.schedule, "0 21 * * 4");
});

test("the homepage renders a live countdown in both the open and closed states", () => {
  const homepage = read("src/app/page.tsx");
  assert.match(homepage, /GroupBuyCountdown targetIso=\{activity\.closingDate\}/);
  assert.match(homepage, /GroupBuyCountdown targetIso=\{nextGroupBuyOpenTime\(\)\.toISOString\(\)\}/);
});
