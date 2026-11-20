import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { hasRole, logout } from '../features/auth/authSlice';
import useStaffRealtime from '../hooks/useStaffRealtime';
import ToastHost from '../components/ToastHost';
import Button from '../components/Button';

const NAV = [
  { to: 'overview', label: 'Overview', min: 'MANAGER' },
  { to: 'orders', label: 'Live orders', min: 'STAFF' },
  { to: 'history', label: 'Order history', min: 'STAFF' },
  { to: 'categories', label: 'Menu categories', min: 'MANAGER' },
  { to: 'menu', label: 'Menu items', min: 'MANAGER' },
  { to: 'tables', label: 'Tables & QR codes', min: 'MANAGER' },
  { to: 'staff', label: 'Staff', min: 'MANAGER' },
  { to: 'reports', label: 'Reports', min: 'MANAGER' },
  { to: 'restaurant', label: 'Restaurant', min: 'MANAGER' },
];

const LIVE = {
  live: { dot: 'bg-leaf', text: 'Live' },
  connecting: { dot: 'bg-saffron', text: 'Connecting' },
  offline: { dot: 'bg-brick', text: 'Offline, reconnecting' },
};

export default function DashboardLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, role, restaurant } = useSelector((s) => s.auth);
  const status = useStaffRealtime();
  const [open, setOpen] = useState(false);
  const live = LIVE[status];

  const signOut = () => {
    dispatch(logout());
    navigate('/staff/login', { replace: true });
  };

  const nav = (
    <nav aria-label="Dashboard" className="flex flex-col gap-1">
      {NAV.filter((n) => hasRole(role, n.min)).map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex min-h-11 items-center rounded-md px-3 font-semibold ${isActive ? 'bg-lagoon text-white' : 'text-ink hover:bg-lagoon-tint'}`
          }
        >
          {n.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen md:flex">
      <ToastHost />

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 py-2 md:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-label="Open menu"
          onClick={() => setOpen(!open)}
          className="flex h-11 w-11 items-center justify-center rounded-md text-2xl hover:bg-paper"
        >
          ☰
        </button>
        <p className="truncate px-2 font-bold">{restaurant?.name}</p>
        <span className="flex items-center gap-1 text-sm text-ink-soft">
          <span className={`h-2.5 w-2.5 rounded-full ${live.dot}`} aria-hidden="true" />
          {live.text}
        </span>
      </header>

      <aside
        className={`${open ? 'block' : 'hidden'} fixed inset-0 top-[57px] z-20 overflow-y-auto bg-white p-4 md:static md:block md:w-64 md:shrink-0 md:border-r md:border-line`}
      >
        <div className="hidden md:block">
          <p className="text-xs font-bold uppercase tracking-widest text-lagoon">SmartQR</p>
          <p className="mt-1 text-lg font-extrabold leading-tight">{restaurant?.name}</p>
          <p className="mb-4 mt-1 flex items-center gap-2 text-sm text-ink-soft">
            <span className={`h-2.5 w-2.5 rounded-full ${live.dot}`} aria-hidden="true" />
            {live.text}
          </p>
        </div>
        {nav}
        <div className="mt-6 border-t border-line pt-4">
          <p className="font-semibold">{user?.full_name}</p>
          <p className="mb-3 text-sm capitalize text-ink-soft">{role?.toLowerCase()}</p>
          <Button tone="secondary" className="w-full" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-5 md:px-8 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
