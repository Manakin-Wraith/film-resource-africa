# PayFast ITN — Incident Log & Backfill Procedure

## What this doc is

A running log of cases where the PayFast Instant Transaction Notification (ITN) didn't reach `/api/payfast/itn` (or reached it and failed silently) and the member had to be hand-backfilled.

Same place we record what we did, so the next backfill is faster than the last one.

## Suspected root cause (open)

The ITN does **not** fire reliably for the **subscription-button payment links** generated from PayFast dashboard (`https://payf.st/...`). Pattern:

| Member email subject                                | ITN fired? | Notes                                     |
|-----------------------------------------------------|-----------|-------------------------------------------|
| `received R … from {Sender Name}`                   | yes (mostly) | PayFast logged-in user, name on file       |
| `received R … (ID: FRA - Membership - … (Name))`    | **no**    | Custom subscription button — guest checkout |

Confirmed cases of "(ID: …)"-style emails NOT producing an ITN-driven `members` row:

- Akande Ezekiah (Indie monthly, 2026-05-04) — backfilled
- Seun "Sheffy" Sonoiki (Individual annual, 2026-05-02) — backfilled
- Vanessa Sinden (Individual annual, 2026-05-07) — backfilled
- **Dumi Gumbi / The Ergo Company (Business monthly, 2026-05-07) — backfilled**

### Most likely fix (do this first)

Open PayFast dashboard → Recurring → Subscription Products → for **each** of:

1. FRA - Membership - Individual (Monthly) — `payf.st/h2gx5`
2. FRA - Membership - Individual (Annual)  — `payf.st/p32et`
3. FRA - Membership - Business (Monthly)   — `payf.st/43vi6`
4. FRA - Membership - Business (Annual)    — `payf.st/0nqp7`

and verify the **Notify URL** field on each product is set to:

```
https://film-resource-africa.com/api/payfast/itn
```

PayFast does **not** inherit a global notify URL for hosted subscription buttons — it must be set per-product. Strong suspicion: at least the Business p/m and Indie monthly buttons have this field empty.

### Secondary check

Vercel logs for `/api/payfast/itn` over the same window will tell us whether PayFast is hitting the endpoint at all. If we see `400 Invalid signature` for these payments, the dashboard fix above is wrong and the issue is signature/passphrase. If we see no hits at all, it's the dashboard config.

## Backfill procedure (the steps used for Dumi, 2026-05-07)

For any future case where we get a PayFast email but no `members` row appears within ~5 minutes:

1. **Pull the PayFast email**. Capture: email address, name (if any), amount, payment ID, item name → derive tier/billing.
2. **Confirm absence in DB**:
   ```sql
   SELECT id, email, status, joined_at FROM members WHERE email = '<email>';
   ```
3. **Run** `backfill_dumi.mjs` (use as a template — it's parameterised at the top).
   - Creates the `auth.users` entry (`email_confirm: true` → first login is a magic link).
   - Inserts the `members` row (status `active`, founding_member_lock true, tier/billing derived).
   - Inserts a `member_payments` row with `payfast_subscription` method.
   - Logs the resulting `onboarding_token`.
4. **Draft the welcome email** with the onboarding URL:
   ```
   https://film-resource-africa.com/members/onboarding?token=<onboarding_token>
   ```
   Pre-populate any directory-listing data we already have (logo, country, city, company description) to make their first onboarding step quick.
5. **Send** (Gerhard reviews + sends from Gmail; we don't auto-fire on a backfill).
6. **Append a row to the table above** in this doc.

## Specific incident — Dumi Gumbi (2026-05-07)

- **PayFast email:** `r 19e030611938a358` — R225, ID: `FRA - Membership - Business p/m( Dumi)`
- **Member ID:** `538dacea-3114-411d-90da-50ccaa37c23c`
- **Auth user ID:** `bf4e584e-6b28-4d95-b441-10a628ce450d`
- **Payment ID:** `44498212-6973-48a9-8934-b463e90f80a8`
- **Onboarding URL:** `https://film-resource-africa.com/members/onboarding?token=c01ce82a-501d-4ccb-b4a2-1a5ededb66d9`
- **Welcome draft:** Gmail draft id `19e0355b3734c278` (clean version) — older corrupted draft `19e0355060055e91` should be deleted manually.
- **Pre-loaded directory data:** country=South Africa, city=Johannesburg, company_name=The Ergo Company. Logo + bio already on `directory_listings#70` ("The Ergo Company") — onboarding flow can pull these.

## Bug fix shipped in same incident

In `src/app/api/payfast/itn/route.ts`, the **renewal** path (existing-member update) had:

```ts
payfast_subscription_token: token ?? existing,
```

`existing` is `{id, status}` — falling back to the row object instead of a string would have caused a Postgres column-type error if `token` were ever null on a renewal. Changed to keep the existing token (re-fetched with the column included in the select):

```ts
payfast_subscription_token: token ?? existing.payfast_subscription_token,
```

This hasn't bitten us yet only because no renewals have come through with a missing token. Filed for the `Dumi` incident even though it didn't cause Dumi's failure — caught while reviewing the handler.
