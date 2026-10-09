# Inventory Disable and Enable Fix

Copy the `backend` and `frontend` folders from this ZIP into the project root and replace the four matching files.

No database migration is required.

## Build

```powershell
cd C:\Users\hp\OneDrive\Documents\Projects\MRF-TYRE-SHOPPEE
npm.cmd run build
```

## Test

1. Open **Admin Dashboard > Inventory Management**.
2. Confirm the page displays `Active`, `Disabled`, and `All` tabs with counts.
3. Disable one test tyre.
4. Open the `Disabled` tab and confirm the tyre is still visible.
5. Confirm the disabled tyre is absent from Staff search and Quick Stock-In.
6. Select `Enable` for the test tyre.
7. Confirm it returns to Staff search and Quick Stock-In.

Disabled tyres retain their stock, pricing, order history, and stock-movement history. They are only hidden from active selling and Stock-In screens.
