# Decisions, changes to the report, and known limits

Report v2.0 is the source of truth. This file lists every place where the build **adds to** or
**interprets** the report, so your team can confirm it or change it. Nothing in the report's
database design was removed or simplified.

## Additions to the database design (new migrations files, no removed constraints)

| Change | Why |
|---|---|
| `orders.client_request_id CHAR(36)` + `UNIQUE (restaurant_id, client_request_id)` | The build requirements ask for protection against duplicate order submissions. The report has no column for it. The browser creates a UUID per cart; sending it twice returns the first order. |
| `restaurants.timezone VARCHAR(50)` (default `Asia/Phnom_Penh`) | The database stores UTC. Without a time zone, "sales per day" and date filters would be wrong near midnight. |

## Interpretations of unclear report points

| Topic | Decision |
|---|---|
| Who manages staff | Follows the permission table (section 7): the **Owner** manages Managers and Staff; a **Manager** can only add and manage **Staff-role** accounts. Nobody can edit the Owner or their own account through the staff screen. |
| Users and restaurants | The ERD keeps the many-to-many table, but the MVP uses **one active restaurant per user** (login picks the first active membership). |
| New staff accounts | The Owner/Manager enters name, email and a temporary password. An email that already exists returns `409 EMAIL_TAKEN`. There is no invite email or password reset in the MVP. |
| Instant deactivation (US-11) | The JWT only carries the user id. Role and restaurant are read from the database on **every** request, and live sockets of a deactivated member are closed. |
| What counts as sales | Every order that is **not cancelled** (Pending, Preparing, Ready, Completed). |
| Order tracking link | Valid as long as the order exists (no expiry). |
| Menu photos | `image_url` accepts an `http(s)` link only. File upload is not part of the MVP. |
| Tables | A table may place many orders. A deactivated table keeps its QR row but customers get "invalid QR". |
| Sign-in token | One JWT, `8h` by default (`JWT_EXPIRES_IN`), kept in `localStorage`. No refresh tokens. |
| Password rules | 8 to 72 characters (72 is bcrypt's limit). |
| Prices in the API | Text with 2 decimals (`"12.50"`). All maths is done in whole cents. |

## Extra libraries (beyond the report's list) and why

`zod` (input validation), `helmet` (safe HTTP headers), `cors`, `express-rate-limit`, `dotenv`,
`sequelize-cli` (migrations), `qrcode` (named in the report), `html5-qrcode` (named in the report),
`jest` + `supertest` (testing), `vitest` + Testing Library (frontend tests), `cross-env`,
`prettier`, `eslint` (backend), `oxlint` (frontend, comes with the Vite template).

## Known limits (honest list)

- **One server process.** Socket.IO rooms are in memory. Running several instances needs the Socket.IO Redis adapter or sticky sessions (report section 15).
- **Orders of one restaurant are created one at a time** (the restaurant row is locked to hand out sequential order numbers). This is fine for a restaurant, not for thousands of orders per second.
- **Socket tokens are checked when connecting and joining.** A JWT that expires while a socket stays open does not close the socket. Deactivation does.
- **No browser end-to-end tests yet** (Playwright/Cypress). The backend test `realtime.test.js` covers the full flow scan → order → staff → status → customer through the real API and Socket.IO.
- **No performance (k6/Artillery) test yet.** The report's targets (menu < 3 s, API < 500 ms, order to dashboard ≈ 2 s) are not measured.
- **Deployment files are written but were not run against real AWS/Vercel** (see `docs/DEPLOYMENT.md`).
