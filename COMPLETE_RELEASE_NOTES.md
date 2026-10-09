# Consolidated completion release

## Added or repaired in this release

- Cancelled bills now restore only missing stock quantities.
- Already-cancelled bills have a **Verify / Repair Restored Stock** action.
- Cancellation uses a database row lock to prevent two simultaneous requests from double-restoring stock.
- Disabled tyres remain visible to Admin and can be enabled again.
- Stock-In continues to show active tyres only.
- Owner dashboard shows today's sales, bill count, tyres sold, service revenue, low/out-of-stock counts and pending service jobs.
- Date-range sales reports download as CSV for Excel.
- Stock Control page shows recent movement history.
- Admin can correct stock after a physical count, with a mandatory reason and audit movement.
- Login attempts are throttled.
- Basic security headers are enabled.
- Production/database scripts and a safe `.env.example` are included.
- README and handover checklist now describe real setup, deployment, backups and device testing.
- Official TYRE SHOPPEE business, proprietor, GST and contact details are shown on printable invoices.

## Database migration

This release does not change the Prisma schema, so it needs no new migration. Existing migrations must still be deployed in production:

```powershell
npm.cmd run db:generate
npm.cmd run db:deploy
```

## Verify on Windows

```powershell
npm.cmd install
npm.cmd run db:generate
npm.cmd run build
```

Then run the app and test the checklist in `HANDOVER_CHECKLIST.md`.

## Work intentionally left for a later release

These are not required for the first operational handover, but remain useful enhancements:

1. Payment method and customer-credit/outstanding balance tracking.
2. Partial returns (the current release supports safe full-bill cancellation).
3. Direct live TallyPrime sync (the current release exports Tally XML).
4. Flexible mapping for arbitrary supplier Excel layouts.
5. Automated integration/end-to-end tests.
6. Native mobile push notifications and advanced charts.

Cloud deployment cannot be completed inside source code alone because it requires the owner's hosting and database accounts.
