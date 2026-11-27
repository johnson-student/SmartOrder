import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Home from '../pages/customer/Home';

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

describe('Home landing page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders headline and primary navigation links', () => {
    renderHome();
    expect(screen.getByRole('heading', { name: 'Scan. Order. Enjoy.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Scan a table QR code' })).toHaveAttribute(
      'href',
      '/scan',
    );
    expect(screen.getAllByRole('link', { name: /Set up your restaurant/i })[0]).toHaveAttribute(
      'href',
      '/register',
    );
    expect(screen.getAllByRole('link', { name: /Staff sign in/i })[0]).toHaveAttribute(
      'href',
      '/staff/login',
    );
    expect(screen.queryByRole('link', { name: /Open my last order/i })).not.toBeInTheDocument();
  });

  test('shows last order link when smartqr.lastOrder is stored', () => {
    localStorage.setItem('smartqr.lastOrder', 'order-token-123');
    renderHome();
    expect(screen.getByRole('link', { name: /Open my last order/i })).toHaveAttribute(
      'href',
      '/order/order-token-123',
    );
  });

  test('interactive kitchen ticket preview switches status on click', async () => {
    renderHome();
    expect(screen.getByText('Chef is cooking your dishes')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ready' }));
    expect(screen.getByText('Ready to bring to Table 04')).toBeInTheDocument();
  });
});
