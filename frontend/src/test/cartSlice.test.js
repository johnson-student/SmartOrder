import cartReducer, {
  addItem,
  clearCart,
  lineKey,
  removeItems,
  removeLine,
  selectCartCount,
  selectCartTotalCents,
  setQuantity,
} from '../features/cart/cartSlice';

const empty = { qrToken: null, currency: 'USD', requestId: null, note: '', lines: [] };
const latte = { item_id: 1, name: 'Latte', price: '3.50' };
const amok = { item_id: 2, name: 'Fish Amok', price: '7.50' };
const add = (state, item, extra = {}) =>
  cartReducer(state, addItem({ qrToken: 'tokenA', currency: 'USD', item, ...extra }));
const wrap = (cart) => ({ cart });

describe('cart', () => {
  test('adding the same dish with the same note merges into one line', () => {
    let s = add(empty, latte, { quantity: 1 });
    s = add(s, latte, { quantity: 2 });
    expect(s.lines).toHaveLength(1);
    expect(s.lines[0].quantity).toBe(3);
  });

  test('a different note makes a separate line', () => {
    let s = add(empty, latte, { notes: 'no ice' });
    s = add(s, latte, { notes: '' });
    expect(s.lines).toHaveLength(2);
    expect(lineKey(1, ' No Ice ')).toBe(lineKey(1, 'no ice'));
  });

  test('totals update when quantities change (in exact cents)', () => {
    let s = add(empty, latte, { quantity: 2 });
    s = add(s, amok);
    expect(selectCartTotalCents(wrap(s))).toBe(1450);
    expect(selectCartCount(wrap(s))).toBe(3);
    s = cartReducer(s, setQuantity({ key: s.lines[0].key, quantity: 4 }));
    expect(selectCartTotalCents(wrap(s))).toBe(2150);
  });

  test('quantity below 1 removes the line; quantity is capped at 99', () => {
    let s = add(empty, latte);
    s = cartReducer(s, setQuantity({ key: s.lines[0].key, quantity: 500 }));
    expect(s.lines[0].quantity).toBe(99);
    s = cartReducer(s, setQuantity({ key: s.lines[0].key, quantity: 0 }));
    expect(s.lines).toHaveLength(0);
  });

  test('scanning a different table starts a fresh cart', () => {
    let s = add(empty, latte);
    s = cartReducer(s, addItem({ qrToken: 'tokenB', currency: 'KHR', item: amok }));
    expect(s.qrToken).toBe('tokenB');
    expect(s.lines.map((l) => l.name)).toEqual(['Fish Amok']);
  });

  test('the request id stays the same while ordering, and changes after an order is placed', () => {
    let s = add(empty, latte);
    const id = s.requestId;
    expect(id).toBeTruthy();
    s = add(s, amok);
    expect(s.requestId).toBe(id);
    s = cartReducer(s, clearCart());
    expect(s.lines).toHaveLength(0);
    expect(s.requestId).toBeNull();
    s = add(s, latte);
    expect(s.requestId).not.toBe(id);
  });

  test('removing lines and unavailable items', () => {
    let s = add(add(empty, latte), amok);
    s = cartReducer(s, removeItems([1]));
    expect(s.lines.map((l) => l.item_id)).toEqual([2]);
    s = cartReducer(s, removeLine(s.lines[0].key));
    expect(s.lines).toHaveLength(0);
  });
});
