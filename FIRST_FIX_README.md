# MRF Tyre Shoppee — First Critical Fix

Copy the `backend` and `frontend` folders from this ZIP into the project root and allow Windows to replace the four matching files.

This batch fixes:

- Disabled users retaining access through an existing token.
- User-role changes not taking effect until the token expired.
- Inventory catalogue data being accessible without login.
- Staff being blocked from printing bills they created.
- The invoice back button sending Staff to an Admin-only page.

After copying the files, run:

```powershell
npm.cmd run build
```

Then test:

1. Log in as Staff and create a small service-only test bill.
2. Select **Print Customer Bill** and confirm that the invoice opens.
3. Return using **Home**.
4. Log in as Admin, disable that Staff account, and confirm the Staff session is rejected on its next action.

Do not deploy yet. Database migrations, bill cancellation/stock reversal, production login protection, tests, and deployment configuration remain to be completed.
