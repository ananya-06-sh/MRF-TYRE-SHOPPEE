# Project Structure

Every `.ts` and `.tsx` file in this starter ZIP is an intentionally empty placeholder. The names show where each feature will be built.

## Frontend areas

- Authentication
- Staff dashboard and catalogue search
- Cart and billing
- Inventory and stock-in administration
- Wheel alignment and balancing jobs
- Tally integration status
- Staff administration

## Backend layers

- Routes receive HTTP requests
- Controllers validate request flow
- Services contain business rules
- Repositories access the database
- Models and DTOs define data shapes
- Middleware handles login, roles, errors, and validation
- Integrations handle TallyPrime and file imports

## Important rule

Stock must only change through the stock service. Staff-facing responses must never include cost, GST calculation, margin, or revenue fields.
