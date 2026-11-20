const {
  startOfDayUtc,
  rangeUtc,
  dayOf,
  isRealDate,
  isValidTimeZone,
  addDays,
} = require('../../src/utils/dates');

describe('date helpers', () => {
  test('a day in Phnom Penh (UTC+7) starts at 17:00 UTC the day before', () => {
    expect(startOfDayUtc('2026-11-13', 'Asia/Phnom_Penh').toISOString()).toBe(
      '2026-11-12T17:00:00.000Z',
    );
  });

  test('rangeUtc is inclusive of the last day', () => {
    const [start, end] = rangeUtc('2026-11-13', '2026-11-14', 'Asia/Phnom_Penh');
    expect(start.toISOString()).toBe('2026-11-12T17:00:00.000Z');
    expect(end.toISOString()).toBe('2026-11-14T17:00:00.000Z');
  });

  test('dayOf uses the restaurant time zone, not UTC', () => {
    // 20:00 UTC is already the next morning in Phnom Penh
    expect(dayOf(new Date('2026-11-13T20:00:00Z'), 'Asia/Phnom_Penh')).toBe('2026-11-14');
    expect(dayOf(new Date('2026-11-13T20:00:00Z'), 'UTC')).toBe('2026-11-13');
  });

  test('validation helpers', () => {
    expect(isRealDate('2026-02-30')).toBe(false);
    expect(isRealDate('2026-11-13')).toBe(true);
    expect(isValidTimeZone('Asia/Phnom_Penh')).toBe(true);
    expect(isValidTimeZone('Mars/Base')).toBe(false);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});
