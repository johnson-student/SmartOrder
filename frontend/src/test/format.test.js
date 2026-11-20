import { errorMessage, fromCents, shiftDate, timeAgo, toCents } from '../utils/format';

test('money helpers avoid floating point errors', () => {
  expect(toCents('3.50')).toBe(350);
  expect(toCents('19.99')).toBe(1999);
  expect(fromCents(1450)).toBe('14.50');
  expect(fromCents(toCents('0.1') * 3)).toBe('0.30');
});

test('timeAgo', () => {
  const now = Date.now();
  expect(timeAgo(new Date(now - 10_000).toISOString(), now)).toBe('just now');
  expect(timeAgo(new Date(now - 5 * 60_000).toISOString(), now)).toBe('5 min ago');
  expect(timeAgo(new Date(now - 3 * 3600_000).toISOString(), now)).toBe('3 h ago');
});

test('shiftDate', () => {
  expect(shiftDate('2026-03-01', -1)).toBe('2026-02-28');
  expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01');
});

test('errorMessage prefers the API message and explains network problems', () => {
  expect(errorMessage({ status: 409, data: { error: { message: 'Taken.' } } })).toBe('Taken.');
  expect(errorMessage({ status: 'NETWORK_ERROR', data: {} })).toMatch(/Cannot reach the server/);
  expect(errorMessage(undefined)).toBe('');
});
