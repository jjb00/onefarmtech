// Group buying runs a fixed weekly cadence: opens Sunday night, closes
// Thursday night, leaving Friday free for sourcing ahead of Friday/Saturday
// delivery. Africa/Lagos (WAT) is a fixed UTC+1 year-round -- Nigeria does
// not observe daylight saving time, so this offset is safe to hardcode.
const WAT_OFFSET_HOURS = 1;

export const GROUP_BUY_OPEN_DAY = 0; // Sunday
export const GROUP_BUY_OPEN_HOUR_WAT = 20; // 8pm WAT
export const GROUP_BUY_CLOSE_DAY = 4; // Thursday
export const GROUP_BUY_CLOSE_HOUR_WAT = 22; // 10pm WAT

function watDateAt(year: number, month: number, date: number, hourWat: number) {
  return new Date(Date.UTC(year, month, date, hourWat - WAT_OFFSET_HOURS, 0, 0));
}

function nextWeekday(from: Date, targetDay: number, hourWat: number) {
  const daysAhead = (targetDay - from.getUTCDay() + 7) % 7;
  let candidate = watDateAt(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + daysAhead, hourWat);
  if (candidate <= from) {
    candidate = watDateAt(candidate.getUTCFullYear(), candidate.getUTCMonth(), candidate.getUTCDate() + 7, hourWat);
  }
  return candidate;
}

export function nextGroupBuyOpenTime(from: Date = new Date()) {
  return nextWeekday(from, GROUP_BUY_OPEN_DAY, GROUP_BUY_OPEN_HOUR_WAT);
}

export function nextGroupBuyCloseTime(from: Date = new Date()) {
  return nextWeekday(from, GROUP_BUY_CLOSE_DAY, GROUP_BUY_CLOSE_HOUR_WAT);
}
