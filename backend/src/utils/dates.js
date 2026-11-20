// Helpers for "a day in the restaurant's time zone". The database stores UTC.

function isValidTimeZone(tz) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function tzOffsetMs(date, tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

// "2026-11-13" in Asia/Phnom_Penh -> the UTC Date when that day starts there.
function startOfDayUtc(dateStr, tz) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d);
  return new Date(guess - tzOffsetMs(new Date(guess), tz));
}

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// Today's date (YYYY-MM-DD) in a time zone.
function todayIn(tz) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
}

// The calendar day (YYYY-MM-DD) of a UTC instant in a time zone.
function dayOf(date, tz) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(date);
}

// from/to are inclusive dates. Returns [startUtc, endUtcExclusive].
function rangeUtc(from, to, tz) {
  return [startOfDayUtc(from, tz), startOfDayUtc(addDays(to, 1), tz)];
}

function isRealDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(`${dateStr}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr;
}

module.exports = {
  isValidTimeZone,
  startOfDayUtc,
  addDays,
  todayIn,
  dayOf,
  rangeUtc,
  isRealDate,
};
