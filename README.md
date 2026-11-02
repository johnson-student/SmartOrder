# SmartOrder local backend

Implements the backend scope of SCRUM-52 (view/edit profile) and SCRUM-54 (manage accounts). Includes a small browser interface for local demonstrations. This is a standalone implementation, not yet integrated with the team's repository or frontend.

## Run

Requires Node.js 22.18 or newer. No package installation is needed.

Double-click START.bat, or open a terminal in this folder and run `npm start`.
Visit http://127.0.0.1:3000. Create your first owner account, then log in. Keep the terminal open while using the app; press Ctrl+C to stop it.

The server binds to your computer's loopback address only. Nothing is deployed or published. Account data persists in `data/smartorder.sqlite`; do not commit or share that folder. There are no preset passwords. The first-run setup creates the initial owner and is disabled after that. To use another port, set the PORT environment variable before starting.

## Features and scope decisions

- Users can view and update their own name, email, and optional phone.
- Owners are administrators: list/create accounts, edit names/email/phone, change roles, activate/deactivate accounts.
- Roles match the proposal: owner, restaurant_staff, kitchen_staff. Only owner can manage accounts.
- Staff cannot edit roles or access other users through the API. Last active owner cannot be deactivated or demoted.
- Deactivation revokes sessions. Role changes revoke sessions, including your own if you change your role.
- Passwords use salted scrypt hashes. Random session tokens are stored hashed in SQLite; browser cookies are HttpOnly and SameSite=Strict, expiring after eight hours.
- Email addresses are unique ignoring case. Invalid fields, duplicate emails, and unauthorized actions return errors.

Account creation/deactivation and the permitted profile fields are implementation assumptions because the Jira stories do not specify them. Confirm these choices with your team. This version has no password reset/change workflow, email verification, audit trail, public registration, hard deletion, or restaurant tenant isolation. All accounts belong to one shared local restaurant workspace. It does not implement ordering, menus, payment, or kitchen workflows.

## API for the frontend teammate

JSON requests with `Content-Type: application/json`. Responses wrap accounts as `{ "user": ... }` or `{ "users": [...] }`; errors are `{ "error": "..." }`. Never returns password hashes. Auth uses cookies, not bearer tokens.

| Method | Path             | Purpose                                                                |
| ------ | ---------------- | ---------------------------------------------------------------------- |
| GET    | /api/health      | Health check                                                           |
| GET    | /api/setup       | Whether initial setup is needed                                        |
| POST   | /api/setup       | Create initial owner: name, email, password, optional phone            |
| POST   | /api/auth/login  | email, password; sets session cookie                                   |
| POST   | /api/auth/logout | Revoke current session                                                 |
| GET    | /api/me          | Current profile                                                        |
| PATCH  | /api/me          | Update name, email, phone (any subset)                                 |
| GET    | /api/users       | Owner-only account list                                                |
| POST   | /api/users       | Owner-only creation: name, email, password, optional phone/role/active |
| PATCH  | /api/users/:id   | Owner-only update: name/email/phone/role/active                        |

Passwords must be 10–128 characters. Names must be 2–100 characters. Roles: `owner`, `restaurant_staff`, `kitchen_staff`. `active` must be a JSON boolean. First-owner setup always creates an active owner.

The included page is served from the same origin as the API. Cross-origin writes are rejected. For integration, proxy `/api` through the team's frontend server or serve the frontend from this server; a frontend running on a different port will need that proxy. Do not disable origin checks to work around integration errors.

## Verification and demo

Run `npm test` for the integration test, which uses a temporary database. It checks login, profile validation, duplicate emails, owner permissions, role escalation rejection, deactivation, last-owner protection, cross-origin rejection, logout, and persistence across restart.

Demo: create owner → log in → create staff account → log out → log in as staff → edit profile → log out → log in as owner → deactivate staff. Explain that the profile story is shared with the frontend teammate; completing this backend alone does not complete the whole user story.

This is intended for a local course project. Deployment requires a separate review of HTTPS, secure cookies, recovery workflows, secrets, request throttling, monitoring, backups, and the team's hosting arrangement.

## Code map

Start with `src/app.js` to see the available routes, then follow the controller for the feature you want to change.

```text
src/
  server.js              Start the local server
  app.js                 Connect routes, controllers, and database
  database.js            Open SQLite and define tables
  http.js                JSON requests/responses, errors, origin checks
  security.js            Password hashing and token hashing
  sessions.js            Login cookies and session storage
  validation.js          Account input rules
  controllers/
    auth.js              First owner setup, login, logout
    users.js             Profile and owner account operations
  repositories/
    users.js             User SQL queries and public user fields
public/
  index.html             Demo page markup
  styles.css             Demo page appearance
  app.js                 Demo page interactions
test/
  backend.test.js        End-to-end API workflow checks
```

Formatting uses Prettier. Run `npm install` to install development tools, then `npm run format` to format changes or `npm run format:check` to check consistency. Starting the backend still needs no installed packages. SQL and password/session details are kept outside the feature controllers.
