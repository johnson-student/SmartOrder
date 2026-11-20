import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useGetMeQuery } from '../../api/apiSlice';
import { hasRole, logout, setProfile } from './authSlice';
import Spinner from '../../components/Spinner';

// Protects the dashboard. `minRole` hides pages the person's role cannot use.
// (The backend enforces the same rules. This only keeps the screens tidy.)
export default function RequireAuth({ minRole = 'STAFF' }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { token, role } = useSelector((s) => s.auth);
  const { data, isError } = useGetMeQuery(undefined, { skip: !token });

  useEffect(() => {
    if (data) dispatch(setProfile(data));
  }, [data, dispatch]);

  useEffect(() => {
    if (isError) dispatch(logout());
  }, [isError, dispatch]);

  if (!token) return <Navigate to="/staff/login" replace state={{ from: location.pathname }} />;
  if (!role) return <Spinner label="Loading your workspace" fullPage />;
  if (!hasRole(role, minRole)) return <Navigate to="/dashboard/orders" replace />;
  return <Outlet />;
}
