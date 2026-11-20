import { io } from 'socket.io-client';
import { API_URL } from './axiosInstance';

// The Socket.IO server runs on the same host as the API (without the /api/v1 part).
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || new URL(API_URL).origin;

export function createSocket(auth = {}) {
  return io(SOCKET_URL, {
    auth,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelayMax: 5000,
  });
}
