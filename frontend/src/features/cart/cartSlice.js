import { createSlice } from '@reduxjs/toolkit';
import { toCents } from '../../utils/format';

const STORAGE_KEY = 'smartqr.cart';

// A function, so every reset gets a brand new array (Redux freezes state objects after use).
const emptyCart = () => ({ qrToken: null, currency: 'USD', requestId: null, note: '', lines: [] });

export function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.lines)) return { ...emptyCart(), ...saved };
  } catch {
    /* ignore a broken or blocked storage */
  }
  return emptyCart();
}

export function saveCart(cart) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    /* ignore */
  }
}

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
        (c ^ ((Math.random() * 16) >> (c / 4))).toString(16),
      );

// Same dish + same note = same line.
export const lineKey = (itemId, notes) => `${itemId}|${(notes || '').trim().toLowerCase()}`;

const slice = createSlice({
  name: 'cart',
  initialState: loadCart(),
  reducers: {
    addItem: (state, { payload }) => {
      const { qrToken, currency, item, quantity = 1, notes = '' } = payload;
      // A cart belongs to ONE table. Scanning another table starts a new cart.
      if (state.qrToken !== qrToken) Object.assign(state, emptyCart(), { qrToken });
      state.currency = currency;
      if (!state.requestId) state.requestId = newId();
      const key = lineKey(item.item_id, notes);
      const line = state.lines.find((l) => l.key === key);
      if (line) line.quantity = Math.min(99, line.quantity + quantity);
      else {
        state.lines.push({
          key,
          item_id: item.item_id,
          name: item.name,
          price: item.price,
          quantity: Math.min(99, quantity),
          notes: notes.trim(),
        });
      }
    },
    setQuantity: (state, { payload: { key, quantity } }) => {
      const line = state.lines.find((l) => l.key === key);
      if (!line) return;
      if (quantity < 1) state.lines = state.lines.filter((l) => l.key !== key);
      else line.quantity = Math.min(99, quantity);
    },
    removeLine: (state, { payload: key }) => {
      state.lines = state.lines.filter((l) => l.key !== key);
    },
    removeItems: (state, { payload: itemIds }) => {
      state.lines = state.lines.filter((l) => !itemIds.includes(l.item_id));
    },
    setNote: (state, { payload }) => {
      state.note = payload;
    },
    // After a successful order: empty cart and a NEW request id for the next order.
    clearCart: (state) => {
      state.lines = [];
      state.note = '';
      state.requestId = null;
    },
  },
});

export const { addItem, setQuantity, removeLine, removeItems, setNote, clearCart } = slice.actions;
export default slice.reducer;

export const selectCart = (s) => s.cart;
export const selectCartCount = (s) => s.cart.lines.reduce((n, l) => n + l.quantity, 0);
export const selectCartTotalCents = (s) =>
  s.cart.lines.reduce((sum, l) => sum + toCents(l.price) * l.quantity, 0);
