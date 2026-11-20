// Money is calculated in whole cents (integers) to avoid floating point mistakes.
// MySQL DECIMAL values arrive as strings such as "12.50".

const MAX_CENTS = 9999999999; // DECIMAL(10,2) maximum

// "12.50" -> 1250
function parseCents(decimalString) {
  const s = String(decimalString);
  if (!/^\d+(\.\d{1,2})?$/.test(s)) throw new Error(`Invalid money value: ${s}`);
  const [whole, frac = ''] = s.split('.');
  return parseInt(whole, 10) * 100 + parseInt((frac + '00').slice(0, 2), 10);
}

// 1250 -> "12.50"
function formatCents(cents) {
  const c = Math.round(cents);
  return `${Math.floor(c / 100)}.${String(c % 100).padStart(2, '0')}`;
}

// User input (number or text) -> cents, or null when invalid.
function inputToCents(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) return null;
    const cents = Math.round(value * 100);
    if (Math.abs(value * 100 - cents) > 1e-6 || cents > MAX_CENTS) return null;
    return cents;
  }
  if (typeof value === 'string' && /^\d+(\.\d{1,2})?$/.test(value.trim())) {
    const cents = parseCents(value.trim());
    return cents > MAX_CENTS ? null : cents;
  }
  return null;
}

module.exports = { parseCents, formatCents, inputToCents, MAX_CENTS };
