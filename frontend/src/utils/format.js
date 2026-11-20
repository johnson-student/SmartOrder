// Money arrives from the API as text such as "12.50". We only format it for display here.
export function formatMoney(value, currency = 'USD') {
  const n = Number(value);
  if (Number.isNaN(n)) return '';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

export const toCents = (value) => Math.round(Number(value) * 100);
export const fromCents = (cents) => (cents / 100).toFixed(2);

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(iso) {
  return new Date(iso).toLocaleString([], {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(iso, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours} h ago` : `${Math.floor(hours / 24)} d ago`;
}

export const todayString = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local time

export function shiftDate(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// Turns any API / network error into a sentence a person can read.
export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return '';
  if (error.data?.error?.message) return error.data.error.message;
  if (error.status === 'NETWORK_ERROR')
    return 'Cannot reach the server. Check your internet connection.';
  return fallback;
}

export const errorCode = (error) => error?.data?.error?.code;
