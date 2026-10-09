# MRF Tyre Shoppee

A mobile-friendly inventory, billing, service-job and owner-monitoring application for a tyre shop.

## Included features

- Admin and Staff logins with role-based access
- Live tyre search, cart and billing
- Tyre-only, service-only and combined bills
- Database-managed service catalogue
- Atomic stock deduction during billing
- Stock-In with supplier and invoice reference
- Manual stock correction with a permanent movement history
- Product activation/deactivation with recovery of disabled products
- Service-job assignment and completion
- Sales and bill history with inline details
- Safe bill cancellation with idempotent stock restoration
- Printable invoices
- CSV/XLSX inventory import
- Tally XML download
- Owner dashboard with daily sales, tyres sold, service revenue and stock alerts
- Date-range sales CSV export
- Login attempt throttling and production security headers

## Local setup (Windows PowerShell)

Requirements: Node.js 24+, npm 11+, PostgreSQL.

```powershell
Copy-Item backend/.env.example backend/.env
```

Edit `backend/.env` and set `DATABASE_URL` and a private `JWT_SECRET` containing at least 64 characters.

```powershell
npm.cmd install
npm.cmd run db:generate
npm.cmd run db:deploy
npm.cmd run db:seed-admin
npm.cmd run dev
```

Open `http://localhost:5173`.

## Production build

The backend serves the compiled frontend in production, so only one public web service is required.

```powershell
$env:NODE_ENV="production"
npm.cmd ci
npm.cmd run db:generate
npm.cmd run build
npm.cmd run db:deploy
npm.cmd start
```

Production environment variables:

- `NODE_ENV=production`
- `PORT` (normally supplied by the host)
- `DATABASE_URL` (hosted PostgreSQL connection string)
- `JWT_SECRET` (64+ random characters)
- `FRONTEND_URL` (the deployed HTTPS URL)
- Optional Tally ledger names shown in `backend/.env.example`

## Remote use

Do not expose the office computer directly to the internet. Deploy this project to a reputable HTTPS application host with hosted PostgreSQL. Then the owner and staff can use the same URL from computers or phones, including outside office Wi-Fi.

Before entering real data, follow [HANDOVER_CHECKLIST.md](HANDOVER_CHECKLIST.md).

## Important limits

- Tally support currently downloads XML; it does not automatically push data into TallyPrime.
- Bill cancellation is a full cancellation. Partial item returns are not part of this release.
- The app records billed totals but does not yet maintain customer credit/outstanding balances.
