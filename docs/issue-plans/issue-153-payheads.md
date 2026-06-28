# Issue #153 — Pay Heads (Payroll Master)

## 1. Title & entry point
- **Issue:** #153 — PayHeads (67 screenshots, no body text).
- **Feature:** Pay Head master — Create / Alter, with full TallyPrime field set driven by **Pay Head Type**, **Calculation Type**, and three sub-popups (Income Tax Details, Gratuity slab rates, computation slab table).
- **Menu path:** Gateway of Tally → **Create** (or **Alter**) → under *Payroll Masters* group → **Pay Heads**.
  - Already wired in menu: `server/master/masterService.js` `getMenu` line ~34, payroll items array contains `"Pay Heads"`.
  - Routes already wired in `client/src/routes/masterRoutes.tsx`:
    - `/master/create/pay-head` → `PayHeadCreate`
    - `/master/alter/pay-head` → `PayHeadAlter`
    - `/master/coa/pay-head` → `PayHeadCOA`

## 2. TallyPrime reference (exact, screenshot-by-screenshot)
Header on every screen: `Pay Head Creation` / company `Moly Jain`. Right side has the standard Total Opening Balance box + button column. Bottom bar: `Q: Quit`, `A: Accept`, `D: Delete` (alter).

### 2.1 Top fixed fields (always present)
- **Name** (text)
- **(alias)** (text)

### 2.2 "Pay Head Information" block — field set is conditional on **Pay Head type**
`Pay head type` is a dropdown. **List of Pay Head Types** popup (img-01..07, 22, 58, 65) — exact order:
1. **Not Applicable**
2. **Bonus**
3. **Deductions From Employees** (note: Tally label here is "Deductions From Employees"; our code currently uses "Deductions for Employees")
4. **Earnings for Employees**
5. **Employees' Statutory Deductions**
6. **Employer's Other Charges**
7. **Employer's Statutory Contributions**
8. **Gratuity**
9. **Loans and Advances**
10. **Reimbursements to Employees**
11. **Tax paid by Employer on Perquisites**

Field set per type (observed):

**A. Earnings for Employees (img-00, 08, 09):**
- Pay head type: `Earnings for Employees`
- **Income type** dropdown — **Income Type** popup: `Fixed`, `Variable` (img-08)
- **Under** — group picker (List of Groups: Direct Expenses, Indirect Expenses, Misc. Expenses (ASSET), … create option) (img-05,06)
- **Affect net salary**: Yes/No
- **Name to be displayed in payslip**: text
- **Use for calculation of gratuity**: No/Yes
- **Set / Alter Income Tax Details**: No/Yes
- **Calculation type**: `As User Defined Value` (default for this example)
- (When Calculation type ≠ Computed) → goes to Opening Balance.

**B. Not Applicable (img-03,04):**
- Pay head type: `Not Applicable`
- **Under** only → group picker (Current Liabilities, Mngh, Moly Jain, Provisions). No other fields.

**C. Bonus (img-06,07):**
- Pay head type: `Bonus`
- Under: group picker
- Affect net salary: Yes
- Name to be displayed in payslip
- Use for calculation of gratuity: No
- Set / Alter Income Tax Details: No
- Calculation type: As User Defined Value

**D. Deductions From Employees (img-07):**
- Under, Affect net salary: Yes, Name to be displayed in payslip, Calculation type: As User Defined Value (no income type, no gratuity).

**E. Employees' Statutory Deductions (img-10..21):**
- **Statutory pay type** dropdown — **Employees' Statutory Deductions** popup (img-11) exact list:
  - `Employee State Insurance`
  - `Income Tax`
  - `National Pension Scheme (Tier - I)`
  - `National Pension Scheme (Tier - II)`
  - `PF Account (A/c No. 1)`
  - `Professional Tax`
  - `Voluntary PF (A/c No. 1)`
- After statutory pay type chosen, layout splits into left **Pay Head Information** + right **Computation Information** table (`Compute: On Current Earnings Total` for ESI; header columns: **Effective From**, **Amount Greater Than**, **Amount Up To**, **Slab Type**, **Value**; default row `Effective From 1-Apr-26`, `Slab Type Percentage`, `Value 0 %`).
- Left fields for ESI (img-12): Under (group), Affect net salary: Yes, Name to be displayed in payslip, **Calculation type: As Computed Value**, **Calculation period: Months**, **Rounding Off Information → Rounding Method: Not Applicable**.
- **Income Tax** statutory pay type (img-13): Calculation type becomes **As Per Income Tax Slab**, Rounding Method **Upward Rounding**, **Limit 1** (no computation slab table editable by user).
- **NPS Tier-I / Tier-II** (img-14,15): Calculation type **As Per Income Tax Slab**, Rounding Upward, Limit 1.
- **PF Account (A/c No. 1)** (img-16): As Computed Value, Calculation period Months, computation table On Current Earnings Total.
- **Professional Tax** (img-17): adds **Registration Number** field; As Computed Value, computation table.
- **Voluntary PF (A/c No.1)** (img-18..21): As Computed Value, computation table On Current Earnings Total; **Type of Calculations** popup (img-19): `As Computed Value`, `As User Defined Value`, `Flat Rate`; **List of Rounding Methods** popup (img-20): `Not Applicable`, `Downward Rounding`, `Normal Rounding`, `Upward Rounding`.

**F. Employer's Other Charges (img-22..38):**
- **Statutory pay type** dropdown — **Employer's Other Charges** popup (img-23) list:
  - `Admin Charges (A/c No. 2)`
  - `EDLI Admin Charges (A/c No. 22)`
  - `EDLI Contribution (A/c No. 21)`
- Admin Charges (img-24..30): Under (Current Liabilities), Affect net salary: No, Name to be displayed in payslip, Calculation type **As Computed Value**, Calculation period Months. Computation table header **Compute: On PF Gross**, columns Effective From / Amount Greater Than / Amount Up To / Slab Type=Percentage / Value (example values: Effective From 1-Apr-26, Amount Up To 45,67,788.00, Value 9 %). User can add a second slab row (new Effective From line, img-29,30).
- EDLI Admin Charges (img-32..34): adds **Contribute minimum of Rs.2/employee** Yes/No field (img-33 popup No/Yes).
- EDLI Contribution (img-35..38): Under Current Liabilities, computation On PF Gross, Value 9 %.

**G. Employer's Statutory Contributions (img-39..50):**
- **Statutory pay type** dropdown — **Employer's Statutory Contributions** popup (img-40,41) list:
  - `Employee State Insurance`
  - `National Pension Scheme (Tier - I)`
  - `PF Account (A/c No. 1)`
  (img-41 shorter list: `EPS Account (A/c No. 10)`, `National Pension Scheme (Tier - I)`, `PF Account (A/c No. 1)` — popup variant depends on prior selection.)
- ESI (img-39): Under (group), Affect net salary: No, Calculation type **As Computed Value**, Calculation period Months, computation **On Current Earnings Total**, Value 9 %.
- NPS Tier-I (img-43): Affect net salary: No, As Computed Value, computation On Current Earnings Total.
- PF Account (img-44): As Computed Value, computation On Current Earnings Total.

**H. Gratuity (img-46..50) — special "Gratuity Period" popup:**
- Pay head type `Gratuity`, Under `Direct Expenses`, Set/Alter Income Tax Details: No.
- Opens **"Slab Rate details for Gratuity Calculation"** popup (centered modal, img-46..50):
  - **Gratuity Days of a Month**: number (example `3`)
  - Table: header group **Number of Months** with sub-columns **From:** / **To:**, and **Eligibility days for Gratuity Calculation per year**.
  - Editable multi-row slab (example rows: `1 → 23 = 45`, `24 → 67 = 89`, then `68 → …`). Auto-advances From = previous To + 1.

**I. Loans and Advances (img-51..57):**
- Pay head type `Loans and Advances`, Under group picker (`Loans & Advances (Asset)`), Affect net salary: Yes, Name to be displayed in payslip.
- **Calculation type** — full **Type of Calculations** popup here (img-52) lists all 5: `As Computed Value`, `As User Defined Value`, `Flat Rate`, `On Attendance`, `On Production`.
- **Flat Rate** (img-53): shows **Calculation period** → **List of Periods** popup: `Days`, `Fortnights`, `Months`, `Weeks`. Rounding Method Not Applicable.
- **On Attendance** (img-54): shows **Leave without pay** → **List of Leave Types** popup (`Not Applicable`, …).
- **On Production** (img-56): shows **Production type** picker.
- **As User Defined Value** (img-57): shows **Opening Balance** field at bottom (`on 1-Apr-26`).

**J. Reimbursements to Employees (img-58..64):**
- Pay head type `Reimbursements to Employees`, **Income type** Fixed/Variable (img-59), Under `Loans & Advances (Asset)`, Affect net salary: Yes, Name to be displayed in payslip, **Set / Alter Income Tax Details**: No→Yes, Calculation type **As Computed Value**, Calculation period Months, Computation table **On Current Earnings Total**.
- When **Set / Alter Income Tax Details = Yes** (img-61→62..64): opens **"Income Tax Details"** popup:
  - **Income Tax Component** dropdown — **List of Income Tax Components** popup (img-61, long list) including: `Not Applicable`, `Allowance to Transport Employee`, `Basic Salary`, `Bonus`, `Children Education Allowance`, `Children Hostel Expenditure Allowance`, `Commission (Is Fixed Percentage of Turnover)`, `Conveyance / Transport Allowance`, `Daearness Allowance`, `Daearness Allowance (Considered for Retirement Benefits)`, `Employee Provident Fund (EPF)`, `Encashment of Leave Salary`, `Entertainment Allowance`, `Field Area Allowance`, `Gratuity`, `High Altitude Allowance`, `Hill Area Compensatory Allowance`, `House Rent Allowance`, `Leave Travel Allowance`, `Leave Encashment on Retirement`, `Leave Travel Assistance`, `Medical Allowance`, `Medical Reimbursement`, `Mining/Underground Allowance`, `Modified Field Area Allowance`, `Other Earnings/Allowances (Fully Exempt)`, `Other Earnings/Allowances (Fully Taxable)` (the selected example), `Other Earnings/Allowances (Partially Exempt)`, `Professional Tax (Tax on Employment)`, `Standard Deduction`, `Transport Allowance`, `Tribal Area Allowance`, `Voluntary Retirement Compensation`.
  - **Tax Calculation Basis** dropdown (img-62): `On Actual Value`, `On Projected Value`.
  - **Deduct TDS Across Periods**: Yes/No (img-63,64).

**K. Tax paid by Employer on Perquisites (img-65,66):**
- Under `Direct Expenses` (group picker), Calculation type **As Per Income Tax Slab**, Rounding Method Upward Rounding, Limit 1.

### 2.3 Rounding Off Information block (all computed types)
- **Rounding Method** popup (img-20): `Not Applicable`, `Downward Rounding`, `Normal Rounding`, `Upward Rounding`.
- **Limit** number shown only when method ≠ Not Applicable.

### 2.4 Opening Balance
- Footer line `Opening Balance ( on 1-Apr-26 ) :` editable number (img-57), appears for non-computed types.

## 3. Current state in codebase (verified)
All paths exist and are REAL (not mocked):
- **Frontend create:** `client/src/pages/master/payroll/pay-head/PayHeadCreate.tsx` — real, calls `window.api.payHead.create/createSlab/createFormula`.
- **Frontend alter:** `client/src/pages/master/payroll/pay-head/PayHeadAlter.tsx` — real, list + edit + delete.
- **Frontend COA:** `client/src/pages/master/payroll/pay-head/PayHeadCOA.tsx` (exists; chart-of-accounts view).
- **Calculation panel (shared):** `client/src/components/payroll/PayHeadCalculationPanel.tsx` + `ComputationSlabTable.tsx` + `FormulaBuilder.tsx` — real.
- **Service:** `server/payHead/payHeadService.js` — full CRUD + slabs + formulas + `seedDefaultPayHeads`.
- **Controller:** `server/payHead/payHeadController.js` — real.
- **Init/DDL:** `server/payHead/payHead.js` (`init`) wired in `server/db/index.js` line ~111.
- **Drizzle schema:** `server/db/schema/sqlite/payHead.js` + `server/db/schema/pg/payHead.js` (3 tables: pay_heads, pay_head_slab_lines, pay_head_formula_lines).
- **IPC handlers:** `server/ipc/registerPayrollHandlers.js` lines 45–53+ (`payHead:create/getAll/getById/update/delete/getSlabs/createSlab/deleteSlab/getFormulas/createFormula/...`).
- **Preload:** `preload.js` lines 386–397 (`window.api.payHead.*`).
- **Routes:** `client/src/routes/masterRoutes.tsx` lines 138–140, 342–344.
- **Menu:** `server/master/masterService.js` getMenu payroll items includes `"Pay Heads"`.

## 4. Gap analysis (what's missing vs. TallyPrime)
The skeleton is complete; the FEATURE COVERAGE is partial. Missing/wrong:

1. **Pay Head Type list incomplete & mislabeled.** Code has 6 types (`Earnings for Employees`, `Deductions for Employees`, `Employer Statutory Contributions`, `Employer Statutory Deductions`, `Reimbursements`, `Gratuity`). Tally has 11 with different labels (`Not Applicable`, `Bonus`, `Deductions From Employees`, `Earnings for Employees`, `Employees' Statutory Deductions`, `Employer's Other Charges`, `Employer's Statutory Contributions`, `Gratuity`, `Loans and Advances`, `Reimbursements to Employees`, `Tax paid by Employer on Perquisites`). Missing: Not Applicable, Bonus, Employer's Other Charges, Loans and Advances, Tax paid by Employer on Perquisites.
2. **Statutory Pay Type field entirely missing.** No "Statutory pay type" dropdown for Employees' Statutory Deductions / Employer's Other Charges / Employer's Statutory Contributions. No `statutory_pay_type` column.
3. **No conditional field visibility by type.** Create/Alter always render the same fields; Tally hides Income Type/Gratuity/IT for several types and shows different left fields per statutory pay type.
4. **Income Tax Details popup missing.** `Set / Alter Income Tax Details = Yes` does nothing. Needs popup with Income Tax Component, Tax Calculation Basis, Deduct TDS Across Periods + persistence.
5. **Gratuity slab popup missing.** `Gratuity` type / Gratuity Period popup (Gratuity Days of a Month + From/To/Eligibility-days slab table) absent. No storage.
6. **Calculation Type extra options missing.** `As Per Income Tax Slab` not in the list (used by Income Tax / NPS / Tax on Perquisites). `On Attendance` (→ Leave without pay) and `On Production` (→ Production type) sub-fields not rendered.
7. **Calculation period list incomplete.** Code has Months/Days/Weeks; Tally adds `Fortnights`.
8. **Compute basis options incomplete.** Code: On Current Earnings Total / Deductions Total / SubTotal / Specified Formula. Tally observed adds `On PF Gross`, `On Specified Formula`. Need `On PF Gross`.
9. **Registration Number** (Professional Tax), **Contribute minimum of Rs.2/employee** (EDLI Admin), **Leave without pay**, **Production type** fields all missing.
10. **Group picker is a fixed `<select>`** of ~6 hardcoded groups, not the real ledger-group list. (Lower priority; acceptable to keep but ideally fed from groups master.)
11. **`pay_head_type` label mismatch** between predefined seed values (`'Earnings'`, `'Deductions'`) and UI list — cosmetic but should standardize on Tally labels.

## 5. DB schema
Add columns to **pay_heads** (both sqlite + pg). reconcile.js auto-adds new sqlite columns to the existing table on boot (reads `server/db/schema/sqlite`), so adding them to the drizzle schema is sufficient; also append them to the explicit ALTER loop in `server/payHead/payHead.js` for parity.

New columns on `pay_heads`:
- `statutory_pay_type` TEXT — selected statutory pay type (ESI / Income Tax / PF A/c No.1 / Admin Charges / etc.).
- `compute_method` TEXT DEFAULT 'On Current Earnings Total' — currently only held in React state, never persisted; promote to a real column.
- `registration_number` TEXT — Professional Tax registration number.
- `contribute_min_rs2` INTEGER DEFAULT 0 — EDLI Admin "Contribute minimum of Rs.2/employee".
- `leave_without_pay` TEXT — On Attendance leave type.
- `production_type` TEXT — On Production production type ref.
- `opening_balance` REAL DEFAULT 0 — opening balance value.
- `it_component` TEXT — Income Tax Details: Income Tax Component.
- `it_calculation_basis` TEXT — Income Tax Details: Tax Calculation Basis (On Actual Value / On Projected Value).
- `it_deduct_tds_across_periods` INTEGER DEFAULT 0 — Deduct TDS Across Periods.
- `gratuity_days_per_month` REAL DEFAULT 0 — Gratuity Days of a Month.

New table **pay_head_gratuity_slabs** (new table → needs creation in `init()`; reconcile only adds columns, never creates tables):
- `gratuity_slab_id` PK autoincrement
- `pay_head_id` INTEGER NOT NULL → pay_heads(pay_head_id) ON DELETE CASCADE
- `months_from` INTEGER
- `months_to` INTEGER
- `eligibility_days` REAL DEFAULT 0
- `created_at` TEXT DEFAULT (datetime('now'))

(The existing `pay_head_slab_lines` table already covers the computation slab table — reuse it for ESI/PF/Admin Charges slabs; no change needed there.)

Add the new table + columns to BOTH `server/db/schema/sqlite/payHead.js` and `server/db/schema/pg/payHead.js`, and create the new table in `server/payHead/payHead.js` `init()`.

## 6. Backend
File `server/payHead/payHeadService.js`:
- Extend `create` and `update` `.values({...})` / `.set({...})` to persist all new columns above (statutory_pay_type, compute_method, registration_number, contribute_min_rs2, leave_without_pay, production_type, opening_balance, it_component, it_calculation_basis, it_deduct_tds_across_periods, gratuity_days_per_month).
- Add gratuity-slab CRUD mirroring slab-line CRUD:
  - `getGratuitySlabs(pay_head_id)` → `SELECT * FROM pay_head_gratuity_slabs WHERE pay_head_id = ? ORDER BY months_from`
  - `createGratuitySlab(data)` → insert {pay_head_id, months_from, months_to, eligibility_days}
  - `deleteGratuitySlab(id)`

File `server/payHead/payHeadController.js`: add `getGratuitySlabs`, `createGratuitySlab`, `deleteGratuitySlab` wrappers.

File `server/ipc/registerPayrollHandlers.js` (after line 53): add channels:
- `ipcMain.handle('payHead:getGratuitySlabs', payHeadController.getGratuitySlabs);`
- `ipcMain.handle('payHead:createGratuitySlab', payHeadController.createGratuitySlab);`
- `ipcMain.handle('payHead:deleteGratuitySlab', payHeadController.deleteGratuitySlab);`

File `preload.js` (inside `payHead: {...}` block, after line 397): add:
- `getGratuitySlabs: (pay_head_id) => invoke('payHead:getGratuitySlabs', pay_head_id),`
- `createGratuitySlab: (data) => invoke('payHead:createGratuitySlab', data),`
- `deleteGratuitySlab: (id) => invoke('payHead:deleteGratuitySlab', id),`

No new register file needed — payHead lives in `registerPayrollHandlers.js`.

## 7. Frontend
Reuse existing shared components only (strict black/white/zinc theme, no color). All new dropdown popups should use existing `Modal`/`MasterSelectionPanel`/`Select` patterns; sub-detail popups use the same centered `Modal` (`client/src/components/ui/Modal.tsx`) styled black/white like the existing "Salary Details" popup.

**Edit (no new route/menu needed — both already wired):**

1. `client/src/pages/master/payroll/pay-head/PayHeadCreate.tsx` and `PayHeadAlter.tsx`:
   - Replace `PAY_HEAD_TYPES` with the 11 Tally labels (section 2.2).
   - Add `statutory_pay_type` state + a **Statutory Pay Type** `<select>`/popup shown only for `Employees' Statutory Deductions`, `Employer's Other Charges`, `Employer's Statutory Contributions` (lists per section 2.2 E/F/G).
   - Add conditional field rendering driven by `pay_head_type` + `statutory_pay_type`:
     - Income Type select only for Earnings / Reimbursements.
     - Use-for-gratuity + Set/Alter IT only for the types that show them (Earnings, Bonus, Reimbursements per screenshots).
     - Registration Number field when statutory_pay_type === `Professional Tax`.
     - "Contribute minimum of Rs.2/employee" Yes/No when statutory_pay_type === `EDLI Admin Charges (A/c No. 22)`.
   - Extend `CALCULATION_TYPES` to include `As Per Income Tax Slab` and keep `On Attendance`/`On Production`; auto-set calculation_type for statutory types (Income Tax/NPS/Tax-on-Perquisites → `As Per Income Tax Slab`, default Rounding `Upward Rounding`, Limit 1).
   - Pass `opening_balance` field (bottom) for non-computed types.
   - Send all new fields in `create`/`update` payloads.

2. `client/src/components/payroll/PayHeadCalculationPanel.tsx`:
   - Add `Fortnights` to Calculation Period options.
   - Add `On PF Gross` to the Compute options.
   - Add **On Attendance** branch → `Leave without pay` select (Not Applicable + leave types).
   - Add **On Production** branch → `Production type` select.
   - For computation slab table reuse existing `ComputationSlabTable.tsx` (columns Effective From / Amount Greater Than / Amount Up To / Slab Type / Value).

3. **New component** `client/src/components/payroll/IncomeTaxDetailsPopup.tsx`:
   - Centered `Modal` titled "Income Tax Details". Fields: Income Tax Component (select, list in section 2.2 J), Tax Calculation Basis (On Actual Value / On Projected Value), Deduct TDS Across Periods (Yes/No). Returns values to parent state; persisted via the new pay_heads columns. Opened when `Set / Alter Income Tax Details = Yes`.

4. **New component** `client/src/components/payroll/GratuitySlabPopup.tsx`:
   - Centered `Modal` titled "Slab Rate details for Gratuity Calculation". Field `Gratuity Days of a Month` (number) + editable slab grid (Number of Months From / To, Eligibility days for Gratuity Calculation per year). From auto = prev To + 1. Opened when `pay_head_type === 'Gratuity'`. Saves via `payHead.createGratuitySlab` after the head is created (mirror existing slab-save loop in `PayHeadCreate.handleSubmit`).

5. `client/src/types/entities/Payroll.ts` (verify path): extend `PayHeadType` and add `PayHeadGratuitySlabType { months_from; months_to; eligibility_days }`, plus IT-detail fields, statutory_pay_type, etc.

Theme: all selects/inputs use the existing `inputCls`/`selectCls` (zinc borders, white bg, black focus). Popups: white bg, 1px zinc border, no color, no shadow beyond existing convention; totals/headers bold + border, never hue.

## 8. Step-by-step checklist (file-precise, in order)
1. **Schema (sqlite):** edit `server/db/schema/sqlite/payHead.js` — add the 11 new columns to `payHeads` and add a new `payHeadGratuitySlabs` sqliteTable; export it.
2. **Schema (pg):** mirror the same in `server/db/schema/pg/payHead.js`; export it.
3. **Init/DDL:** edit `server/payHead/payHead.js` `init()` — append new columns to the ALTER loop (use correct types: REAL for gratuity_days_per_month/opening_balance, INTEGER for the boolean-ish ones) and add `CREATE TABLE IF NOT EXISTS pay_head_gratuity_slabs (...)`.
4. **Service:** edit `server/payHead/payHeadService.js` — extend `create`/`update` values; add `getGratuitySlabs`/`createGratuitySlab`/`deleteGratuitySlab`; import `payHeadGratuitySlabs` from `../db/schema`. Update `db/schema/index` re-export if needed so `require('../db/schema')` exposes the new table.
5. **Controller:** edit `server/payHead/payHeadController.js` — add 3 gratuity-slab wrappers.
6. **IPC:** edit `server/ipc/registerPayrollHandlers.js` — register the 3 new channels.
7. **Preload:** edit `preload.js` `payHead` block — add the 3 new `window.api.payHead.*` methods.
8. **Types:** edit `client/src/types/entities/Payroll.ts` — extend `PayHeadType`; add `PayHeadGratuitySlabType`.
9. **Calc panel:** edit `client/src/components/payroll/PayHeadCalculationPanel.tsx` — add Fortnights, On PF Gross, On Attendance (Leave without pay), On Production (Production type).
10. **New popups:** create `client/src/components/payroll/IncomeTaxDetailsPopup.tsx` and `client/src/components/payroll/GratuitySlabPopup.tsx` (reuse `Modal`).
11. **Create screen:** edit `PayHeadCreate.tsx` — new pay-head-type list, statutory_pay_type select, conditional fields, As Per Income Tax Slab handling, opening balance, IT + gratuity popups, extended create payload + gratuity-slab save loop.
12. **Alter screen:** edit `PayHeadAlter.tsx` — same field additions + load existing statutory_pay_type / IT fields / gratuity slabs on select, extended update payload.
13. **Labels parity (optional):** align `seedDefaultPayHeads` type strings to Tally labels in `payHeadService.js`.
14. Restart app → reconcile auto-adds the new sqlite columns; `init()` creates the gratuity-slab table. Verify in Create.

## 9. Validation & edge cases
- **Duplicate name** already guarded in `service.create`.
- **Predefined heads** must stay read-only (Alter already enforces; keep new fields disabled when `is_predefined`).
- **Statutory pay type required** when pay_head_type ∈ {Employees' Statutory Deductions, Employer's Other Charges, Employer's Statutory Contributions} — validate before submit.
- **Gratuity slabs:** From must auto-chain (next From = prev To + 1); To ≥ From; reject overlapping ranges; allow empty (Gratuity Days only).
- **IT details only saved when Set/Alter IT = Yes**; clearing back to No should null the IT columns.
- **Calculation type ↔ fields:** As Per Income Tax Slab hides Value + computation slab table and forces Upward Rounding/Limit 1; On Attendance shows Leave without pay; On Production shows Production type; Flat Rate/As User Defined show Value.
- **reconcile** only adds columns — the new `pay_head_gratuity_slabs` table MUST be created in `init()`, not relied on via reconcile.
- **pg parity:** keep pg schema in sync so a future Postgres backend matches (use boolean for the *_tds/contribute_min flags, numeric for amounts, integer for months).
- **Opening balance** persists per head; appears only for non-computed types (matches Tally).
- Theme: verify no color introduced; all popups black/white/zinc, sharp borders, no rounded-pill buttons.
