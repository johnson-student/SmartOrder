import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../api/apiSlice';
import { createSocket } from '../api/socket';
import { logout } from '../features/auth/authSlice';
import { showToast } from '../features/ui/toastSlice';

// Live connection for the staff dashboard (FR-23, FR-26).
// Events only trigger a refetch, so the screen always shows what the database says.
export default function useStaffRealtime() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);
  const [status, setStatus] = useState('connecting'); // connecting | live | offline

  useEffect(() => {
    if (!token) return undefined;
    const socket = createSocket({ token });
    const refresh = () => dispatch(api.util.invalidateTags(['Orders', 'Order', 'Report']));

    socket.on('connect', () => {
      // Join the restaurant room. This also runs again after every reconnect.
      socket.emit('join:restaurant', {}, (reply) => {
        if (reply?.ok) {
          setStatus('live');
          refresh(); // reload the current state after (re)connecting
        } else {
          setStatus('offline');
        }
      });
    });
    socket.on('disconnect', () => setStatus('offline'));
    socket.on('connect_error', (err) => {
      setStatus('offline');
      if (['ACCOUNT_INACTIVE', 'UNAUTHENTICATED'].includes(err.message)) dispatch(logout());
    });
    socket.on('order:created', (order) => {
      refresh();
      dispatch(
        showToast(`New order #${order.order_number} for table ${order.table?.table_number}`, 'new'),
      );
    });
    socket.on('order:updated', refresh);

    return () => socket.close();
  }, [token, dispatch]);

  return status;
}
