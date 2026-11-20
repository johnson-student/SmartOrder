# SmartQR API reference

Base URL: `http://localhost:3000/api/v1` (development). All bodies are JSON.
A ready-made **Postman collection** is in `postman/SmartQR.postman_collection.json`.

## Response format

```jsonc
// success
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 3, "total_pages": 1 } }
// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [ … ] } }
```

| Status | Meaning |
|---|---|
| 400 | Validation error (`VALIDATION_ERROR`, `INVALID_CATEGORY`) |
| 401 | Not signed in / bad or expired token (`UNAUTHENTICATED`, `TOKEN_EXPIRED`, `INVALID_CREDENTIALS`, `ACCOUNT_INACTIVE`) |
| 403 | Signed in, but your role does not allow it (`FORBIDDEN`) |
| 404 | Not found, **or belongs to another restaurant** (`NOT_FOUND`, `QR_INVALID`, `ORDER_NOT_FOUND`) |
| 409 | Conflict (`EMAIL_TAKEN`, `CATEGORY_NAME_TAKEN`, `TABLE_NUMBER_TAKEN`, `INVALID_TRANSITION`, `TABLE_INACTIVE`) |
| 422 | Order contains unavailable items (`ITEM_UNAVAILABLE`) |
| 429 | Rate limit reached |

Money values are **text with 2 decimals** (`"12.50"`). Dates are ISO 8601 in UTC.
Protected endpoints need the header `Authorization: Bearer <token>`.

## Endpoints

Role levels: **Staff+** = Staff, Manager, Owner. **Manager+** = Manager, Owner.

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Create the owner account + restaurant |
| POST | `/auth/login` | Public | Sign in, returns `{ token, user, role, restaurant }` |
| GET | `/auth/me` | Signed in | Current user, restaurant, role |
| GET | `/public/menu/:qrToken` | Customer | Restaurant, table and available menu |
| POST | `/public/orders` | Customer | Place an order |
| GET | `/public/orders/:orderToken` | Customer | Status and items of one order |
| GET | `/orders` | Staff+ | List orders. Query: `active=true`, `status=A,B`, `from`, `to` (YYYY-MM-DD), `sort=asc\|desc`, `page`, `limit` |
| GET | `/orders/:id` | Staff+ | Order details + status history |
| PATCH | `/orders/:id/status` | Staff+ | `{ "status": "PREPARING" }`, or `{ "status": "CANCELLED", "reason": "…" }` |
| GET / PUT | `/restaurant` | Manager+ | View / update restaurant profile |
| GET / POST | `/categories` | Manager+ | List / create |
| PUT / DELETE | `/categories/:id` | Manager+ | Update / deactivate |
| GET / POST | `/menu-items` | Manager+ | List (`?category_id=`) / create |
| PUT / DELETE | `/menu-items/:id` | Manager+ | Update (incl. `is_available`) / deactivate |
| GET / POST | `/tables` | Manager+ | List / create |
| PUT / DELETE | `/tables/:id` | Manager+ | Update / deactivate |
| POST | `/tables/:id/qr` | Manager+ | Create or regenerate QR (revokes the old one) |
| GET | `/tables/:id/qr` | Manager+ | QR image (PNG data URL) and link |
| GET / POST | `/staff` | Manager+ | List / add. Owner adds Manager or Staff; Manager adds Staff only |
| PATCH | `/staff/:memberId` | Manager+ | Change role / deactivate (Manager: Staff accounts only) |
| GET | `/reports/summary` | Manager+ | `?from=&to=` → orders, sales, cancelled, by day, top items |
| GET | `/health` | Public | Server and database check |

## curl examples

```bash
# 1. Register an owner (a restaurant is created with it)
curl -X POST http://localhost:3000/api/v1/auth/register -H 'Content-Type: application/json' \
  -d '{"full_name":"Sokha","email":"sokha@example.com","password":"Password123!","restaurant_name":"Sokha Cafe"}'

# 2. Sign in and keep the token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"owner@demo.test","password":"Password123!"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.token')

# 3. Create a category, an item and a table with a QR code
curl -X POST http://localhost:3000/api/v1/categories -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"name":"Drinks"}'
curl -X POST http://localhost:3000/api/v1/menu-items -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"category_id":1,"name":"Latte","price":3.5}'
curl -X POST http://localhost:3000/api/v1/tables     -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"table_number":"1"}'
curl -X POST http://localhost:3000/api/v1/tables/1/qr -H "Authorization: Bearer $TOKEN"     # returns the link inside the QR

# 4. Customer places an order (no token needed). Only item ids and quantities are sent.
curl -X POST http://localhost:3000/api/v1/public/orders -H 'Content-Type: application/json' \
  -d '{"qr_token":"<64-char token from the QR link>","client_request_id":"<any new UUID>","items":[{"item_id":1,"quantity":2,"notes":"less sugar"}]}'

# 5. Staff update the status
curl -X PATCH http://localhost:3000/api/v1/orders/1/status -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"status":"PREPARING"}'
```

`client_request_id` must be a new UUID **per order**. If the same id is sent again (for example a double click or a retry after a bad connection) the API returns the first order with status `200` instead of creating a second one.

## Socket.IO

Connect to the API host (not `/api/v1`), for example `io("http://localhost:3000", { auth: { token } })`.

| Event | Direction | Who | Payload |
|---|---|---|---|
| `join:restaurant` | client → server | Staff (JWT in `auth.token`) | none. Acknowledgement: `{ ok: true }`. The restaurant comes from the database, not from the client. |
| `join:order` | client → server | Customer | `{ token: "<order token>" }`. Acknowledgement: `{ ok: true }` or `{ ok: false, error }` |
| `order:created` | server → staff | room `restaurant:{id}` | full order (number, table, items, total) |
| `order:updated` | server → staff | room `restaurant:{id}` | `{ order_id, order_number, old_status, status }` |
| `order:status_changed` | server → customer | room `order:{token}` | `{ status, changed_at }` |

Events are sent only after the database transaction has committed. After a reconnect the clients join again and reload the current state from the REST API.
