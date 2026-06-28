# Issue #143 — Voucher Type (numbering implementation)

> Source: GitHub issue `darshankochar22/MVP#143` — "Voucher type". The comment
> contrasts TallyPrime's Voucher Type Creation with our clone (4 comment images:
> cmt_01/02/04 = TallyPrime, cmt_03 = our clone).

## What the comment shows
- **cmt_01 (Tally):** Method of Voucher Numbering = **Automatic** → reveals
  `Numbering behaviour on insertion/deletion`, **`Set/Alter additional numbering details: Yes`**,
  `Show unused vch nos…`.
- **cmt_02 (Tally):** the sub-screen that `Set/Alter additional numbering details = Yes` opens —
  **Starting Number · Width of Numerical Part · Prefill with zero**, and three tables:
  **Restart Numbering** (Applicable From | Starting Number | Periodicity), **Prefix Details**,
  **Suffix Details** (Applicable From | Particulars).
- **cmt_03 (our clone):** the Voucher Type form — had the numbering-method dropdown and the
  conditional toggles, but **`Set/Alter additional numbering details` did nothing** (no sub-screen),
  and the configured numbering was **never applied to generated voucher numbers**.
- **cmt_04 (Tally):** Method = **Automatic (Manual Override)** → reveals
  `Prevent creating duplicate Voucher Nos.`.

## The two bugs fixed

### 1. Voucher numbering ignored the voucher type's config (the functional bug)
`server/voucher/voucherService.js` had the prefix/zero-pad numbering **commented out** and replaced
with `String(nextNum)` — so a Payment saved as `"1"` instead of `"PMT-00001"`. This was caught by
the committed-but-failing `crudSweep_voucher.test.js` (`expect(voucher_number).toMatch(/^PMT-\d{5}$/)`).

Rewrote `generateVoucherNumber` / `getNextVoucherNumber` to build the number from the voucher type's
numbering config:
- **prefix** = explicit `numbering_prefix` on the type, else the per-type code (`prefixMap`) + `-`.
- **body** = sequence padded to the configured **Width of Numerical Part** when **Prefill with zero**
  is on; otherwise the app default of 5-digit zero-pad (`PMT-00001`).
- **suffix** = `numbering_suffix`.
- **next sequence** = largest trailing digit-run across existing numbers + 1, or the configured
  **Starting Number** when none exist. Method `Manual`/`None` leaves the number to the user.

### 2. "Set/Alter additional numbering details" sub-screen was missing (the UI gap)
Implemented the sub-screen (cmt_02), mirroring the existing **Excise Book** master pattern:
- **Persistence** (`voucher_type_configs`): added `starting_number`, `width_of_numerical_part`,
  `prefill_with_zero`, and JSON columns `restart_numbering` / `prefix_details` / `suffix_details`
  (runtime `voucherType.js` + drizzle sqlite/pg schema). Service `create` / `updateConfig` persist
  them; `getConfig` / `getById` parse the JSON back to arrays.
- **UI:** new `AdditionalNumberingPopup.tsx` (Starting Number · Width · Prefill + Restart/Prefix/
  Suffix tables). `VoucherTypeFormBody` opens it when `Set/Alter additional numbering details = Yes`;
  `VoucherTypeCreate` / `VoucherTypeAlter` thread the new fields through create/updateConfig and load.

## Tests
- `server/tests/voucherTypeNumbering.test.js` (3) — additional-numbering details round-trip
  (create → getConfig → updateConfig; default empty arrays).
- `server/tests/crudSweep_voucher.test.js` (pre-existing) — now passes: `PMT-00001`, next `PMT-00002`.

> Out of scope: date-applicable Restart/Prefix/Suffix *switching* during numbering (rows are stored
> and editable; generation uses the type's base prefix/suffix + width). Pre-existing, unrelated GST
> classification seeding test failures were left untouched.
