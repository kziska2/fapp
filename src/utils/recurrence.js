const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toStr(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parse(dateStr) {
  return new Date(dateStr + 'T12:00:00');
}

// Clamps e.g. "the 31st" to the 28th/29th/30th in a short month, rather than
// rolling over into the next month.
function clampDayInMonth(year, monthIndex, day) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(day, lastDay);
}

// The first date on/after `fromDate` that matches the rule's day (day-of-month
// for monthly, day-of-week for weekly).
export function firstOccurrenceOnOrAfter(fromDate, frequency, anchorDay) {
  const d = parse(fromDate);
  if (frequency === 'monthly') {
    const day = clampDayInMonth(d.getFullYear(), d.getMonth(), anchorDay);
    let candidate = new Date(d.getFullYear(), d.getMonth(), day);
    // Compare by date string, not Date object — `candidate` lands at midnight
    // while `d` is parsed at noon, so a same-day match would otherwise compare
    // as "earlier" and wrongly roll over to next month.
    if (toStr(candidate) < fromDate) {
      const nextDay = clampDayInMonth(d.getFullYear(), d.getMonth() + 1, anchorDay);
      candidate = new Date(d.getFullYear(), d.getMonth() + 1, nextDay);
    }
    return toStr(candidate);
  }
  const diff = (anchorDay - d.getDay() + 7) % 7;
  const candidate = new Date(d);
  candidate.setDate(candidate.getDate() + diff);
  return toStr(candidate);
}

// The occurrence after `currentDate` — always strictly later, so repeated
// firing can't get stuck on the same date.
export function nextOccurrence(currentDate, frequency, anchorDay) {
  const d = parse(currentDate);
  if (frequency === 'monthly') {
    const day = clampDayInMonth(d.getFullYear(), d.getMonth() + 1, anchorDay);
    return toStr(new Date(d.getFullYear(), d.getMonth() + 1, day));
  }
  const candidate = new Date(d);
  candidate.setDate(candidate.getDate() + 7);
  return toStr(candidate);
}

function ordinal(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'st';
  if (n % 10 === 2 && n % 100 !== 12) return 'nd';
  if (n % 10 === 3 && n % 100 !== 13) return 'rd';
  return 'th';
}

export function describeSchedule(frequency, anchorDay) {
  if (frequency === 'weekly') return `Weekly on ${WEEKDAYS[anchorDay]}`;
  return `Monthly on the ${anchorDay}${ordinal(anchorDay)}`;
}

export const WEEKDAY_NAMES = WEEKDAYS;
