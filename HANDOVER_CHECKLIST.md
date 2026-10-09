# Handover checklist

Complete these items before the shop starts using the app with real money and stock.

## Required

- [x] Official shop name, address, phones, GSTIN, proprietor and email added from the shop card.
- [ ] Use a hosted PostgreSQL database and keep its automatic backups enabled.
- [ ] Set a unique production `JWT_SECRET` of at least 64 random characters.
- [ ] Run `npm run db:deploy` against the production database.
- [ ] Run `npm run db:seed-admin` once and immediately change the initial Admin password.
- [ ] Import the real inventory and physically verify at least ten products.
- [ ] Create individual Staff accounts; never share the Admin login.
- [ ] Test one tyre bill, one service-only bill, one combined bill and one cancellation.
- [ ] Confirm that cancellation restores stock in **Stock Control & History**.
- [ ] Test the app on the owner computer, staff computer and the owner's phone using mobile data.
- [ ] Download a sales CSV and open it in Excel.
- [ ] Print a sample invoice and verify GST/shop details.

## Daily operating rule

Use **Quick Stock-In** for supplier receipts. Use **Stock Control & History** only when a physical count differs from the app. Always enter a clear correction reason.

## Backups

Use the database provider's automated daily backup. Once per week, also make a manual PostgreSQL dump and store it outside the shop computer.

```powershell
pg_dump $env:DATABASE_URL --format=custom --file=mrf-backup.dump
```

Restore drills should be tested before launch and then every three months.
