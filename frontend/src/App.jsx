import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { hasRole } from './features/auth/authSlice';
import RequireAuth from './features/auth/RequireAuth';
import Spinner from './components/Spinner';
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
import Home from './pages/customer/Home';
import ScanPage from './pages/customer/ScanPage';
import MenuPage from './pages/customer/MenuPage';
import CartPage from './pages/customer/CartPage';
import TrackPage from './pages/customer/TrackPage';
import { LoginPage, RegisterPage } from './pages/auth';
import NotFound from './pages/NotFound';
const OrdersBoard = lazy(() => import('./pages/dashboard/OrdersBoard'));
const OrderDetail = lazy(() => import('./pages/dashboard/OrderDetail'));
const History = lazy(() => import('./pages/dashboard/History'));
const Overview = lazy(() => import('./pages/dashboard/Overview'));
const Categories = lazy(() => import('./pages/dashboard/Categories'));
const MenuItems = lazy(() => import('./pages/dashboard/MenuItems'));
const Tables = lazy(() => import('./pages/dashboard/Tables'));
const StaffPage = lazy(() => import('./pages/dashboard/StaffPage'));
const Reports = lazy(() => import('./pages/dashboard/Reports'));
const RestaurantSettings = lazy(() => import('./pages/dashboard/RestaurantSettings'));

// "/dashboard" opens the right first page for each role.
function DashboardIndex() {
  const role = useSelector((s) => s.auth.role);
  return <Navigate to={hasRole(role, 'MANAGER') ? 'overview' : 'orders'} replace />;
}

export default function App() {
  return (
    <Suspense fallback={<Spinner label="Loading" fullPage />}>
      <Routes>
        {/* Customers: no account needed */}
        <Route path="/" element={<Home />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/menu/:qrToken" element={<MenuPage />} />
        <Route path="/menu/:qrToken/cart" element={<CartPage />} />
        <Route path="/order/:orderToken" element={<TrackPage />} />

        {/* Restaurant people */}
        <Route path="/staff/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/dashboard" element={<RequireAuth minRole="STAFF" />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardIndex />} />
            <Route path="orders" element={<OrdersBoard />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="history" element={<History />} />
            <Route element={<RequireAuth minRole="MANAGER" />}>
              <Route path="overview" element={<Overview />} />
              <Route path="categories" element={<Categories />} />
              <Route path="menu" element={<MenuItems />} />
              <Route path="tables" element={<Tables />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="reports" element={<Reports />} />
              <Route path="restaurant" element={<RestaurantSettings />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
