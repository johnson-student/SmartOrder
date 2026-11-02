import http from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { openDatabase } from './database.js';
import { createUserRepository } from './repositories/users.js';
import { createSessions } from './sessions.js';
import { createAuthController } from './controllers/auth.js';
import { createUserController } from './controllers/users.js';
import { checkOrigin, sendJson, sendError, fail } from './http.js';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const staticFiles = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
};

export function createApp({
  dbPath = resolve(projectRoot, 'data/smartorder.sqlite'),
  secureCookie = false,
} = {}) {
  const db = openDatabase(dbPath);
  const users = createUserRepository(db);
  const sessions = createSessions(db, users, { secureCookie });
  const auth = createAuthController(users, sessions);
  const accounts = createUserController(users, sessions);

  const publicRoutes = {
    'GET /api/health': (request, response) => sendJson(response, 200, { status: 'ok' }),
    'GET /api/setup': auth.setupStatus,
    'POST /api/setup': auth.setup,
    'POST /api/auth/login': auth.login,
  };
  const protectedRoutes = {
    'POST /api/auth/logout': auth.logout,
    'GET /api/me': accounts.profile,
    'PATCH /api/me': accounts.updateProfile,
    'GET /api/users': accounts.list,
    'POST /api/users': accounts.create,
  };

  async function handleRequest(request, response) {
    try {
      checkOrigin(request);
      const path = new URL(request.url, 'http://localhost').pathname;
      const routeKey = `${request.method} ${path}`;
      const staticFile = staticFiles[path];
      if (request.method === 'GET' && staticFile) {
        const [filename, contentType] = staticFile;
        const content = readFileSync(resolve(projectRoot, 'public', filename));
        response.writeHead(200, {
          'Content-Type': contentType,
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none'",
        });
        return response.end(content);
      }
      if (publicRoutes[routeKey]) return await publicRoutes[routeKey](request, response);

      const session = sessions.authenticate(request);
      if (protectedRoutes[routeKey]) {
        return await protectedRoutes[routeKey](request, response, session);
      }
      const accountRoute = path.match(/^\/api\/users\/(\d+)$/);
      if (request.method === 'PATCH' && accountRoute) {
        return await accounts.update(request, response, session, Number(accountRoute[1]));
      }
      fail(404, 'Route not found.');
    } catch (error) {
      sendError(response, error);
    }
  }

  const server = http.createServer(handleRequest);
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return { server, close: () => db.close() };
}
