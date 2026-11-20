import { configureStore } from '@reduxjs/toolkit';
import { api } from '../api/apiSlice';
import { setUnauthorizedHandler } from '../api/axiosInstance';
import { tokenStorage } from '../api/tokenStorage';
import authReducer, { logout } from '../features/auth/authSlice';
import cartReducer, { saveCart } from '../features/cart/cartSlice';
import toastReducer from '../features/ui/toastSlice';

export function makeStore(preloadedState) {
  const store = configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      auth: authReducer,
      cart: cartReducer,
      toasts: toastReducer,
    },
    middleware: (getDefault) => getDefault().concat(api.middleware),
    preloadedState,
  });

  // Keep the token and the cart in the browser's storage whenever they change.
  let lastToken = store.getState().auth.token;
  let lastCart = store.getState().cart;
  store.subscribe(() => {
    const { auth, cart } = store.getState();
    if (auth.token !== lastToken) {
      lastToken = auth.token;
      tokenStorage.set(auth.token);
      if (!auth.token) store.dispatch(api.util.resetApiState()); // forget the old user's data
    }
    if (cart !== lastCart) {
      lastCart = cart;
      saveCart(cart);
    }
  });

  setUnauthorizedHandler(() => store.dispatch(logout()));
  return store;
}

export const store = makeStore();
