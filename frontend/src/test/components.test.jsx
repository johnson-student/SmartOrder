import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { makeStore } from '../app/store';
import RequireAuth from '../features/auth/RequireAuth';
import StatusBadge from '../components/StatusBadge';
import QuantityStepper from '../components/QuantityStepper';
import CartPage from '../pages/customer/CartPage';

const authed = (role) => ({
  auth: {
    token: 'tok',
    user: { user_id: 1, full_name: 'Test User', email: 't@t.dev' },
    role,
    restaurant: { name: 'R', currency: 'USD' },
  },
});

function renderGuard(state, minRole) {
  return render(
    <Provider store={makeStore(state)}>
      <MemoryRouter initialEntries={['/dashboard/secret']}>
        <Routes>
          <Route path="/staff/login" element={<p>login page</p>} />
          <Route path="/dashboard/orders" element={<p>orders page</p>} />
          <Route element={<RequireAuth minRole={minRole} />}>
            <Route path="/dashboard/secret" element={<p>secret page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('RequireAuth', () => {
  test('visitors without a token are sent to the login page', () => {
    renderGuard({ auth: { token: null, user: null, role: null, restaurant: null } }, 'STAFF');
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  test('a Staff member cannot open a Manager page', () => {
    renderGuard(authed('STAFF'), 'MANAGER');
    expect(screen.getByText('orders page')).toBeInTheDocument();
    expect(screen.queryByText('secret page')).not.toBeInTheDocument();
  });

  test('a Manager and an Owner can open a Manager page', () => {
    renderGuard(authed('MANAGER'), 'MANAGER');
    expect(screen.getByText('secret page')).toBeInTheDocument();
  });
});

test('StatusBadge shows readable text, not only colour', () => {
  render(<StatusBadge status="PREPARING" />);
  expect(screen.getByText('Preparing')).toBeInTheDocument();
});

test('QuantityStepper cannot go below the minimum', async () => {
  const onChange = vi.fn();
  render(<QuantityStepper value={1} onChange={onChange} />);
  expect(screen.getByRole('button', { name: 'Decrease' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Increase' }));
  expect(onChange).toHaveBeenCalledWith(2);
});

describe('CartPage', () => {
  const cart = {
    qrToken: 'abc',
    currency: 'USD',
    requestId: 'r1',
    note: '',
    lines: [
      { key: '1|', item_id: 1, name: 'Latte', price: '3.50', quantity: 2, notes: '' },
      { key: '2|', item_id: 2, name: 'Fish Amok', price: '7.50', quantity: 1, notes: 'no chili' },
    ],
  };
  const renderCart = (c) =>
    render(
      <Provider store={makeStore({ cart: c })}>
        <MemoryRouter initialEntries={['/menu/abc/cart']}>
          <Routes>
            <Route path="/menu/:qrToken/cart" element={<CartPage />} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

  test('shows the lines, the note and the total', () => {
    renderCart(cart);
    expect(screen.getByText('Latte')).toBeInTheDocument();
    expect(screen.getByText('“no chili”')).toBeInTheDocument();
    expect(screen.getAllByText('$14.50').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Place order' })).toBeEnabled();
  });

  test('changing a quantity updates the total', async () => {
    renderCart(cart);
    await userEvent.click(screen.getAllByRole('button', { name: 'Increase' })[0]);
    expect(screen.getAllByText('$18.00').length).toBeGreaterThan(0);
  });

  test('an empty cart cannot be submitted', () => {
    renderCart({ ...cart, lines: [] });
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Place order' })).not.toBeInTheDocument();
  });

  test('a cart for another table is ignored', () => {
    renderCart({ ...cart, qrToken: 'other' });
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });
});
