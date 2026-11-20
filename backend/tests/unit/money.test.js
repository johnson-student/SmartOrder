const { parseCents, formatCents, inputToCents } = require('../../src/utils/money');

describe('money helpers', () => {
  test('parseCents reads MySQL DECIMAL text exactly', () => {
    expect(parseCents('12.50')).toBe(1250);
    expect(parseCents('0.05')).toBe(5);
    expect(parseCents('7')).toBe(700);
    expect(parseCents('1234567.8')).toBe(123456780);
  });

  test('formatCents always gives 2 decimals', () => {
    expect(formatCents(1250)).toBe('12.50');
    expect(formatCents(5)).toBe('0.05');
    expect(formatCents(0)).toBe('0.00');
  });

  test('inputToCents accepts numbers and text with at most 2 decimals', () => {
    expect(inputToCents(3.5)).toBe(350);
    expect(inputToCents('3.50')).toBe(350);
    expect(inputToCents(0)).toBe(0);
    expect(inputToCents(19.99)).toBe(1999);
  });

  test('inputToCents rejects bad values', () => {
    expect(inputToCents(-1)).toBeNull();
    expect(inputToCents(1.234)).toBeNull();
    expect(inputToCents('abc')).toBeNull();
    expect(inputToCents(NaN)).toBeNull();
    expect(inputToCents(1e12)).toBeNull();
  });

  test('line totals are exact (no floating point drift)', () => {
    // 0.1 + 0.2 is the classic floating point trap
    expect(formatCents(parseCents('0.10') * 3 + parseCents('0.20'))).toBe('0.50');
  });
});
