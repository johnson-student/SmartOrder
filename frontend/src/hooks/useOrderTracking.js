import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { api } from '../api/apiSlice';
import { createSocket } from '../api/socket';

// Live updates for ONE order. The secret order token is the only key.
export default function useOrderTracking(orderToken) {
  const dispatch = useDispatch();
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!orderToken) return undefined;
    const socket = createSocket({});
    const refresh = () => dispatch(api.util.invalidateTags([{ type: 'Tracked', id: orderToken }]));

    socket.on('connect', () => {
      socket.emit('join:order', { token: orderToken }, (reply) => {
        setLive(!!reply?.ok);
        if (reply?.ok) refresh();
      });
    });
    socket.on('disconnect', () => setLive(false));
    socket.on('connect_error', () => setLive(false));
    socket.on('order:status_changed', refresh);

    return () => socket.close();
  }, [orderToken, dispatch]);

  return live;
}
