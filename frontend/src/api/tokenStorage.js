// The sign-in token lives in memory and in localStorage (so a page refresh keeps you signed in).
const KEY = 'smartqr.token';
let current = null;

function read() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export const tokenStorage = {
  get() {
    if (current === null) current = read();
    return current;
  },
  set(token) {
    current = token || null;
    try {
      if (token) localStorage.setItem(KEY, token);
      else localStorage.removeItem(KEY);
    } catch {
      /* storage can be blocked (private mode): the token then lives in memory only */
    }
  },
};
