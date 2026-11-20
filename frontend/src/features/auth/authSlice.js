import { createSlice } from '@reduxjs/toolkit';
import { tokenStorage } from '../../api/tokenStorage';

const initialState = {
  token: tokenStorage.get(),
  user: null,
  role: null,
  restaurant: null,
};

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // payload: { token, user, role, restaurant } (from login / register)
    setCredentials: (state, { payload }) => ({ ...state, ...payload }),
    // payload: { user, role, restaurant } (from GET /auth/me)
    setProfile: (state, { payload }) => ({ ...state, ...payload }),
    logout: () => ({ token: null, user: null, role: null, restaurant: null }),
  },
});

export const { setCredentials, setProfile, logout } = slice.actions;
export default slice.reducer;

const RANK = { STAFF: 1, MANAGER: 2, OWNER: 3 };
export const hasRole = (role, min) => !!role && RANK[role] >= RANK[min];
export const selectAuth = (s) => s.auth;
