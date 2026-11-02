import { digest, createToken } from './security.js';
import { fail } from './http.js';

const COOKIE_NAME = 'smartorder_session';
const SESSION_SECONDS = 8 * 60 * 60;

export function createSessions(db, users, { secureCookie = false } = {}) {
  function cookie(token, maxAge) {
    const secure = secureCookie ? '; Secure' : '';
    return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`;
  }
  return {
    authenticate(request) {
      const prefix = `${COOKIE_NAME}=`;
      const token = (request.headers.cookie || '')
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(prefix))
        ?.slice(prefix.length);
      const session =
        token &&
        db
          .prepare('SELECT user_id FROM sessions WHERE token_hash = ? AND expires > ?')
          .get(digest(token), Date.now());
      const user = session && users.findById(session.user_id);
      if (!user?.active) fail(401, 'Please log in.');
      return { user, token };
    },
    create(userId) {
      const now = Date.now();
      const token = createToken();
      db.prepare('DELETE FROM sessions WHERE expires <= ?').run(now);
      db.prepare('INSERT INTO sessions (token_hash, user_id, expires) VALUES (?, ?, ?)').run(
        digest(token),
        userId,
        now + SESSION_SECONDS * 1000,
      );
      return cookie(token, SESSION_SECONDS);
    },
    revoke(token) {
      db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(digest(token));
      return cookie('', 0);
    },
    revokeForUser(userId) {
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
    },
  };
}
