const { canTransition, TRANSITIONS } = require('../../src/modules/orders/order.constants');

describe('order status transitions (Report v2.0 section 14)', () => {
  test.each([
    ['PENDING', 'PREPARING'],
    ['PENDING', 'CANCELLED'],
    ['PREPARING', 'READY'],
    ['PREPARING', 'CANCELLED'],
    ['READY', 'COMPLETED'],
    ['READY', 'CANCELLED'],
  ])('%s -> %s is allowed', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  test.each([
    ['PENDING', 'READY'],
    ['PENDING', 'COMPLETED'],
    ['PREPARING', 'PENDING'],
    ['READY', 'PREPARING'],
    ['COMPLETED', 'CANCELLED'],
    ['CANCELLED', 'PENDING'],
  ])('%s -> %s is rejected', (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });

  test('COMPLETED and CANCELLED are final', () => {
    expect(TRANSITIONS.COMPLETED).toEqual([]);
    expect(TRANSITIONS.CANCELLED).toEqual([]);
  });
});
