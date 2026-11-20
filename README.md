# SmartQR

A QR-code ordering system for restaurants. Guests scan the code on their table, browse the menu on
their phone, and send an order without installing an app or creating an account. Staff see orders
live and update their status; the guest's phone updates by itself.

Built from **SmartQR Project Report v2.0** (Software Project Management course).

| | |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4, Redux Toolkit + RTK Query, React Router, Axios, Socket.IO client |
| Backend | Node.js, Express 5, Sequelize 6, MySQL 8, Socket.IO, JWT, bcrypt, Zod |
| Tests | Jest + Supertest (backend, real MySQL), Vitest + Testing Library (frontend) |
| Deployment | Vercel, AWS EC2 + RDS, Nginx, PM2, GitHub Actions (files in `deploy/`, `.github/`) |

## Folders

```
smartqr/
├── backend/      Express API, Socket.IO, migrations, seeders, tests
├── frontend/     React app (customer pages + staff/manager dashboard)
├── docs/         API.md · DEPLOYMENT.md · DECISIONS.md
├── deploy/       Nginx and PM2 configuration
├── postman/      Postman collection (35 requests)
└── .github/      CI and deploy workflows
```

## Run it on your computer

To run the **frontend, backend, and MySQL together**, install Docker and run:

```bash
docker compose up --build
```

Open `http://localhost:5173`; the API is at `http://localhost:3000`. The backend applies database
migrations on startup. To load the demo restaurant and accounts, run `docker compose exec backend npm run db:seed`.
The Compose credentials and JWT secret are development-only defaults; set `DB_PASSWORD`,
`MYSQL_ROOT_PASSWORD`, and `JWT_SECRET` in a local `.env` file before using anything beyond local development.

To run the apps directly on your computer instead, you need **Node.js 20+** and **MySQL 8**. Start only
the database with `docker compose up -d mysql`, or install MySQL yourself. If using your own MySQL instance,
create the database and user:

```sql
CREATE DATABASE smartqr CHARACTER SET utf8mb4;
CREATE DATABASE smartqr_test CHARACTER SET utf8mb4;   -- used only by the tests
CREATE USER 'smartqr_user'@'%' IDENTIFIED BY 'change_me';
GRANT ALL ON smartqr.* TO 'smartqr_user'@'%';
GRANT ALL ON smartqr_test.* TO 'smartqr_user'@'%';
```

**1. Backend**

```bash
cd backend
npm install
cp .env.example .env          # then open .env and set DB_PASSWORD and JWT_SECRET
npm run db:migrate            # creates the 10 tables
npm run db:seed               # demo restaurant, users, menu and 3 tables (development only)
npm run dev                   # http://localhost:3000   (check: /api/v1/health)
```

`JWT_SECRET` must be at least 32 characters. Generate one:
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

**2. Frontend** (second terminal)

```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:3000/api/v1
npm run dev                   # http://localhost:5173
```

**3. Try it**

- Sign in at `http://localhost:5173/staff/login` with **owner@demo.test**, **manager@demo.test** or **staff@demo.test** (password `Password123!`).
- Dashboard → **Tables & QR codes** → *View QR* for a table. Open the link under the QR on your phone or in a second browser window (the seeder also prints the table links).
- Add dishes to the cart, place the order, and keep the tracking page open. Then update the order in **Live orders** and watch the customer page change.
- Or register your own restaurant at `/register`.

> To open the customer page on a real phone, the phone and computer must be on the same network, and `FRONTEND_URL` / `VITE_API_URL` must use the computer's address instead of `localhost`
> (start Vite with `npm run dev -- --host`).

## Commands

| Where | Command | Does |
|---|---|---|
| backend | `npm run dev` / `npm start` | Start the API (with / without auto-restart) |
| backend | `npm test` | Rebuilds the **test database** from the migrations and runs all tests |
| backend | `npm run lint` · `npm run format` | ESLint · Prettier |
| backend | `npm run db:migrate` · `db:migrate:undo` · `db:migrate:reset` · `db:seed` | Database schema and demo data |
| frontend | `npm run dev` · `npm run build` · `npm run preview` | Develop, build, preview the build |
| frontend | `npm test` · `npm run lint` · `npm run format` | Vitest · oxlint · Prettier |

## Who can do what (enforced by the backend)

| | Customer | Staff | Manager | Owner |
|---|:-:|:-:|:-:|:-:|
| Scan QR, view menu, order, track own order | ✓ | | | |
| View and update orders, order history | | ✓ | ✓ | ✓ |
| Menu, tables, QR codes, reports, restaurant info | | | ✓ | ✓ |
| Staff accounts | | | Staff only | ✓ |

## Security in short

bcrypt password hashes · JWT with the role re-checked in the database on every request (deactivation is immediate) ·
restaurant isolation by taking the restaurant from the user's membership or the QR token, never from the request ·
random 256-bit QR tokens, revoked when regenerated · private 128-bit order tracking tokens ·
server-side prices, totals and order numbers · duplicate-submit protection · rate limiting · CORS limited to the frontend ·
Helmet headers · Zod validation · parameterized queries through Sequelize · tokens hidden in request logs ·
secrets only in environment variables.

## What has been tested

- **Backend: 87 automated tests** against a real MySQL 8 database: authentication, roles, restaurant isolation, QR lifecycle, checkout (price recalculation, rollback, double submit, 8 simultaneous orders), status rules, snapshots, reports, **database constraints checked directly in SQL**, and **Socket.IO rooms** (events reach only the right clients; the full flow scan → order → staff → status → customer).
- **Frontend: 20 automated tests** (cart logic, money helpers, role-based route guard, cart page) plus a production build.
- **Live check:** server + seeded database + HTTP calls (CORS, login, public menu, order, status change, tracking).

## Not done yet

See `docs/DECISIONS.md` → *Known limits*. In short: browser end-to-end tests (Playwright/Cypress), a load test, and running the deployment files on real AWS/Vercel. The screens were built and unit-tested but not yet clicked through in a real browser during this build, so expect small visual fixes.
