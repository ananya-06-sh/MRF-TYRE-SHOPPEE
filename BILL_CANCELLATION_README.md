# Bill Cancellation and Stock Restoration

Copy the `backend` and `frontend` folders from this ZIP into the project root and replace the matching files.

No database schema change is required for this batch.

## Build

```powershell
cd C:\Users\hp\OneDrive\Documents\Projects\MRF-TYRE-SHOPPEE
npm.cmd run build
```

## Test safely

1. Note the current stock of one test tyre.
2. Create a bill containing one unit of that tyre.
3. Confirm that its stock decreases by one.
4. Open **Admin Dashboard > Sales & Bill History**.
5. Expand the test bill and select **Cancel Bill & Restore Stock**.
6. Confirm the bill status becomes `CANCELLED`.
7. Confirm the tyre stock increases by one.
8. Expand the same bill again and verify there is no second cancellation button.
9. Print the bill and verify the invoice visibly displays `CANCELLED`.
10. If the bill created a service job, confirm it no longer appears in the active Service Jobs list.

## Safety rules

- Only Admin users can cancel bills.
- Stock restoration and order cancellation occur in one database transaction.
- Repeated cancellation requests do not restore stock twice.
- A Tally-synced bill cannot be cancelled directly.
- Cancelled bills cannot be exported to Tally.
