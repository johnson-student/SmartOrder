# SmartQR frontend

React + Vite app. Customer pages (`/menu/:qrToken`, `/menu/:qrToken/cart`, `/order/:orderToken`, `/scan`)
and the staff/manager dashboard (`/dashboard/...`).

```bash
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:3000/api/v1
npm run dev            # http://localhost:5173
npm test               # Vitest
npm run build          # production files in dist/
```

Structure: `src/api` (Axios, RTK Query, Socket.IO) · `src/features` (auth, cart, toasts) ·
`src/pages` (customer, dashboard) · `src/components` (shared UI) · `src/hooks` · `src/utils`.
Full guide: see the repository root `README.md`.
