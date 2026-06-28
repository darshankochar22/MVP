# Issue #147 — CENVAT Opening Balance

## 1. Title & entry point
- **Feature:** CENVAT Opening Balance (Statutory Details master).
- **Menu path (TallyPrime EDU):** Gateway of Tally → Create (List of Masters) → **Statutory Details** group → **CENVAT Opening Balance**.
- **Menu path (this app):** Gateway → Masters → Create → "Statutory Details" section → **CENVAT Opening Balance**.
- **Route to add:** `/master/create/cenvat-opening-balance`.

Note: In the screenshots the Statutory Details group also lists **PLA Opening Balance, PAN/CIN Details, Dealer Excise Opening Stock, Excise Opening Balance** — those are sibling issues (#148/#149/#151/#152). This plan covers ONLY CENVAT Opening Balance.

## 2. TallyPrime reference (exhaustive, from the 3 screenshots)

### Screen A — img-00.png: List of Masters menu
Confirms placement. Under the **Statutory Details** sub-heading, the highlighted item is **"CENVAT Opening Balance"**, sitting after "Service Tax Details" and before "PLA Opening Balance / PAN/CIN Details / Dealer Excise Opening Stock / Excise Opening Balance". Group order shown: Company GST Details, TDS Details, TCS Details, VAT Registration Details, Excise Registration Details, Service Tax Details, **CENVAT Opening Balance**, PLA Opening Balance, PAN/CIN Details, Dealer Excise Opening Stock, Excise Opening Balance.

### Screen B — img-01.png: "CENVAT Opening Balance Creation" (the main entry screen)
This is a **voucher-style entry screen** (a Journal voucher), NOT a multi-field config form. Title bar reads **"CENVAT Opening Balance Creation"**. Layout, top to bottom:

Header band (left column):
- **Voucher class label:** `Journal` (the voucher is a Journal type) with **`No.` = 3** (Tally auto-numbers; the number is the next voucher no. — display only / auto).
- **`CENVAT credit of`** — a selection field. Default value shown: **`Inputs`**. (See Screen C for its options.)

Header band (right column, two stacked label/value pairs):
- **`GST Registration`** : **`Chhattisgarh Registration`** (the company's tax-unit / registration; display value from the active registration).
- **`Tax Unit`** : **`◦ Not Applicable`** (a selectable tax unit; default "Not Applicable").
- **`Status`** : **`CENVAT Opening Balance`** (static status text identifying the voucher purpose).

Top-right date field:
- **Date** : **`2-Mar-27`** with weekday **`Tuesday`** beneath it (the voucher date; defaults to books-begin / current date, editable; F2 changes date).

Body grid (the voucher lines):
- Single column header **`Particulars`** on the left and **`Amount`** on the right (right-aligned numeric).
- The grid is empty in the screenshot (no lines entered yet). Each line = a ledger/duty head in Particulars + an Amount. This is where the opening CENVAT credit amounts are entered.

Footer:
- **`Narration:`** — free-text multi-line field at the bottom.

Bottom action bar: **`Q: Quit`** and **`A: Accept`** (Ctrl/Alt+A to accept, Esc to quit). Right rail shows `F2: Date`, `F3: Company`, `F4`–`F10` (standard voucher function keys; only F2/F3 are active/labelled).

### Screen C — img-02.png: "Excise Adjustments" popup on the `CENVAT credit of` field
Activating the **`CENVAT credit of`** field opens a small selection popup titled **`Excise Adjustments`** with three options:
- **`Both`**
- **`Capital Goods`**
- **`Inputs`** (highlighted/default)

So `CENVAT credit of` is a single-select with values **Both | Capital Goods | Inputs**.

### Drill chain / computed values
- No drill-down beyond this screen. No totals row is computed in the screenshots (grid empty). On Accept, the voucher is saved as one CENVAT opening-balance record per company (per tax unit). The Amount column would total the entered duty lines, but the captures show an empty grid, so treat the line grid as the persisted payload with no derived total beyond a sum of lines.

## 3. Current state in codebase
CENVAT Opening Balance does **not exist** anywhere. Confirmed by `grep -rln "CENVAT\|cenvat"` — only unrelated hits:
- `client/src/pages/master/ledger/components/LedgerTaxPanel.tsx:200` — "CENVAT" is one option in a ledger duty/tax-type dropdown. Unrelated to this master.
- `server/exciseDutyClassification/...` and `exciseDutyOptions.ts` — excise duty classification, unrelated.

Master-menu / routing / backend status for THIS feature:
- **Menu entry:** MISSING. `server/master/masterService.js:29` "Statutory Details" `items` array does **not** include "CENVAT Opening Balance".
- **Menu→route map:** MISSING. `client/src/pages/menu/Create.tsx` `getRoute` map (lines 30–72) has no "CENVAT Opening Balance" key.
- **Route:** MISSING from `client/src/routes/masterRoutes.tsx` (Statutory Details block ~lines 307–316).
- **Frontend component:** MISSING (no folder under `client/src/pages/master/statutory-details/`).
- **Entity type:** MISSING from `client/src/types/entities/`.
- **Backend service/controller/init:** MISSING (no `server/cenvatOpeningBalance/`).
- **Schema:** MISSING (no `server/db/schema/sqlite/cenvatOpeningBalance.js` / pg).
- **IPC handler:** MISSING from `server/ipc/registerStatutoryHandlers.js`.
- **preload bridge:** MISSING from `preload.js` (no `window.api.cenvatOpeningBalance`).

Everything must be built. The closest, fully-working reference stack to clone is **Service Tax Details (#146)** — a singleton-per-company "Statutory Details" master:
- Frontend: `client/src/pages/master/statutory-details/ServiceTaxDetails/{ServiceTaxDetailsCreate,ServiceTaxDetailsForm}.tsx`, `useServiceTaxDetails.ts`.
- Type: `client/src/types/entities/ServiceTaxDetails.ts`.
- Server: `server/serviceTaxDetails/{serviceTaxDetails.js (init/DDL),serviceTaxDetailsService.js,serviceTaxDetailsController.js}`.
- Schema: `server/db/schema/sqlite/serviceTaxDetails.js` + `server/db/schema/pg/serviceTaxDetails.js`, both spread in `server/db/schema/{sqlite,pg}/index.js`.
- Wiring: init in `server/db/index.js:113`; IPC in `server/ipc/registerStatutoryHandlers.js:13,79-80`; preload in `preload.js:460-463`; route in `masterRoutes.tsx:309`; menu in `masterService.js:29`; route-map in `Create.tsx:63`.

## 4. Gap analysis
The entire vertical slice is missing. One nuance vs. the Service Tax reference: CENVAT Opening Balance is **voucher-shaped** (header fields + a Particulars/Amount line grid + narration + date), not a flat field form. Implement it as a **singleton-per-company record** (one CENVAT opening-balance voucher per company, matching Tally's single auto-numbered No. 3 entry) using the same get/save singleton contract as Service Tax, but with:
- A small set of header columns (cenvat_credit_of, tax_unit, gst_registration, voucher_date, voucher_no, narration).
- A child table for the Particulars/Amount lines.

This keeps the proven singleton get/save/upsert + child-row-replace pattern from `serviceTaxDetailsService.js` (`replaceCategories`).

## 5. DB schema
New tables (reconcile.js only ADDS missing COLUMNS to existing tables — a NEW table needs an `init()` registered in `server/db/index.js`). Add BOTH sqlite and pg.

### Table `cenvat_opening_balance` (singleton, one row per company)
| column | type | notes |
|---|---|---|
| company_id | INTEGER PRIMARY KEY → companies(company_id) ON DELETE CASCADE | singleton key (mirrors service_tax_details) |
| voucher_no | INTEGER DEFAULT 1 | auto voucher number (display) |
| voucher_date | TEXT | yyyy-mm-dd |
| cenvat_credit_of | TEXT DEFAULT 'Inputs' | one of Both / Capital Goods / Inputs |
| tax_unit | TEXT DEFAULT 'Not Applicable' | |
| gst_registration | TEXT | display registration name |
| narration | TEXT | |
| created_at | TEXT DEFAULT (datetime('now')) | |
| updated_at | TEXT DEFAULT (datetime('now')) | |

### Table `cenvat_opening_balance_lines` (Particulars/Amount grid)
| column | type | notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| company_id | INTEGER NOT NULL → companies(company_id) ON DELETE CASCADE | |
| particulars | TEXT NOT NULL | ledger/duty head |
| amount | REAL DEFAULT 0 | |
| sort_order | INTEGER DEFAULT 0 | |

pg variants: use `pgTable`, `serial`/`integer`, `text`, `numeric`/`real`, same column names. Mirror `server/db/schema/pg/serviceTaxDetails.js`.

## 6. Backend
Create `server/cenvatOpeningBalance/`:

### `server/cenvatOpeningBalance/cenvatOpeningBalance.js` (init/DDL)
- Export `init(db)` running the two `CREATE TABLE IF NOT EXISTS` above (clone `server/serviceTaxDetails/serviceTaxDetails.js`).

### `server/cenvatOpeningBalance/cenvatOpeningBalanceService.js`
- `const { db } = require('../db/index')`, `const { sql, eq } = require('drizzle-orm')`, import `{ cenvatOpeningBalance, cenvatOpeningBalanceLines }` from `../db/schema`.
- `DEFAULTS` object: `{ voucherNo: 1, voucherDate: '', cenvatCreditOf: 'Inputs', taxUnit: 'Not Applicable', gstRegistration: '', narration: '', lines: [] }`.
- `loadLines(company_id)` — SELECT lines ordered by sort_order, map snake→camel `{ particulars, amount }`.
- `get(company_id)` → `{ success, exists, data }` (clone serviceTax `get`; map header columns + lines).
- `toColumns(data)` → header column object.
- `replaceLines(company_id, lines)` — delete then insert non-empty (`particulars` trimmed non-blank) lines with sort_order index (clone `replaceCategories`).
- `save(data)` — require `company_id`; upsert header by company_id (update if exists else insert), then `replaceLines`. Return `{ success }`.
- `module.exports = { get, save }`.

### `server/cenvatOpeningBalance/cenvatOpeningBalanceController.js`
- Clone `serviceTaxDetailsController.js`: `ENTITY_TYPE = 'cenvat_opening_balance'`, `get(event, company_id)` and `save(event, data)` wrapping the service and `auditTrailService.record(...)` with before/after snapshots.

### IPC — `server/ipc/registerStatutoryHandlers.js`
- Add require near line 13: `const cenvatOpeningBalanceController = require('../cenvatOpeningBalance/cenvatOpeningBalanceController');`
- Add handlers near line 80:
  - `ipcMain.handle('cenvatOpeningBalance:get', cenvatOpeningBalanceController.get);`
  - `ipcMain.handle('cenvatOpeningBalance:save', cenvatOpeningBalanceController.save);`

### preload — `preload.js` (after the `serviceTaxDetails` block ~line 463)
```
cenvatOpeningBalance: {
    get:  (company_id) => invoke('cenvatOpeningBalance:get', company_id),
    save: (data)       => invoke('cenvatOpeningBalance:save', data),
},
```

### init wiring — `server/db/index.js` (after line 113, the serviceTaxDetails init line)
`await require("../cenvatOpeningBalance/cenvatOpeningBalance").init(rawDb);`

### schema index — `server/db/schema/sqlite/index.js` and `pg/index.js`
Add `...require('./cenvatOpeningBalance'),` next to the serviceTaxDetails spread (line ~52 sqlite / ~51 pg).

## 7. Frontend
Theme: strict black/white/zinc, reuse shared UI — NO color. Match the Service Tax screen chrome exactly.

### Entity type — `client/src/types/entities/CenvatOpeningBalance.ts`
- `export const CENVAT_CREDIT_OF = ["Both", "Capital Goods", "Inputs"] as const;` + type.
- `interface CenvatOpeningBalanceLine { particulars: string; amount: number; }`
- `interface CenvatOpeningBalance { voucherNo: number; voucherDate: string; cenvatCreditOf: CenvatCreditOf; taxUnit: string; gstRegistration: string; narration: string; lines: CenvatOpeningBalanceLine[]; }`
- `DEFAULT_CENVAT_OPENING_BALANCE` + `DEFAULT_CENVAT_LINE` consts.

### Component folder — `client/src/pages/master/statutory-details/CenvatOpeningBalance/`
- **`useCenvatOpeningBalance.ts`** — clone `useServiceTaxDetails.ts`; call `window.api.cenvatOpeningBalance.get/save`; `form`/`setField`/`load`/`save`/loading/error/success.
- **`CenvatOpeningBalanceForm.tsx`** — voucher-style body using shared `FormRow`. Top region: `Journal No.` (read-only display), date input (right), `GST Registration` (display), `Tax Unit` select (default "Not Applicable"), `Status` static text "CENVAT Opening Balance". `CENVAT credit of` field rendered as a select / popup with options Both / Capital Goods / Inputs (popup titled "Excise Adjustments" — reuse the popup pattern from `ServiceTaxDetailsForm.tsx` lines 163-207, or a plain `<select>` styled with the shared `selectCls` zinc tokens). Particulars/Amount line grid: reuse shared `DataTable` (`@/components/ui`) with two columns — Particulars (left), Amount (right-aligned numeric) — plus an add-row affordance; or a lightweight editable table matching `serviceTax` rate-popup input styling. Narration textarea at the bottom. Use only zinc/black/white tokens, `min-h-[26px]` rows, `LABEL_W` width convention from the Service Tax form.
- **`CenvatOpeningBalanceCreate.tsx`** — clone `ServiceTaxDetailsCreate.tsx`: `PageTitleBar title="CENVAT Opening Balance" subtitle={company.name}`, `RightActionPanel` actions `[Alt+A Accept, Esc Quit]`, `MasterFormFooter`, Esc/Alt+A keydown handlers, `quit → navigate("/master/create")`. Default export.

### Route — `client/src/routes/masterRoutes.tsx`
- Import: `import CenvatOpeningBalanceCreate from "../pages/master/statutory-details/CenvatOpeningBalance/CenvatOpeningBalanceCreate.tsx";` (near line 117 with the other statutory-details imports).
- Add in the Statutory Details block (~line 309): `{ path: "/master/create/cenvat-opening-balance", element: <CenvatOpeningBalanceCreate /> },`

### Menu wiring
- `server/master/masterService.js:29` — add `"CENVAT Opening Balance"` into the "Statutory Details" `items` array, immediately after `"Service Tax Details"` (preserving Tally order: ...Service Tax Details, CENVAT Opening Balance, PAN / CIN Details, Payroll Statutory Details).
- `client/src/pages/menu/Create.tsx` `getRoute` map (~line 63, by the `"Service Tax Details"` entry) — add `"CENVAT Opening Balance": "/master/create/cenvat-opening-balance",`.

## 8. Step-by-step checklist (file-precise, in order)
1. `server/db/schema/sqlite/cenvatOpeningBalance.js` — define `cenvatOpeningBalance` + `cenvatOpeningBalanceLines` drizzle tables (clone sqlite/serviceTaxDetails.js). Export both.
2. `server/db/schema/pg/cenvatOpeningBalance.js` — pg equivalents (clone pg/serviceTaxDetails.js).
3. `server/db/schema/sqlite/index.js` (~line 52) and `server/db/schema/pg/index.js` (~line 51) — add `...require('./cenvatOpeningBalance'),`.
4. `server/cenvatOpeningBalance/cenvatOpeningBalance.js` — `init(db)` with the two CREATE TABLE statements.
5. `server/cenvatOpeningBalance/cenvatOpeningBalanceService.js` — `get` + `save` + `loadLines` + `replaceLines` + `toColumns` + `DEFAULTS` (clone serviceTaxDetailsService.js).
6. `server/cenvatOpeningBalance/cenvatOpeningBalanceController.js` — `get`/`save` with audit (clone serviceTaxDetailsController.js, `ENTITY_TYPE='cenvat_opening_balance'`).
7. `server/db/index.js` (after line 113) — `await require("../cenvatOpeningBalance/cenvatOpeningBalance").init(rawDb);`.
8. `server/ipc/registerStatutoryHandlers.js` — add controller require (~line 13) + two `ipcMain.handle('cenvatOpeningBalance:get'|'save', ...)` (~line 80).
9. `preload.js` (after line 463) — add `cenvatOpeningBalance: { get, save }` block.
10. `client/src/types/entities/CenvatOpeningBalance.ts` — type + consts.
11. `client/src/pages/master/statutory-details/CenvatOpeningBalance/useCenvatOpeningBalance.ts`.
12. `client/src/pages/master/statutory-details/CenvatOpeningBalance/CenvatOpeningBalanceForm.tsx`.
13. `client/src/pages/master/statutory-details/CenvatOpeningBalance/CenvatOpeningBalanceCreate.tsx`.
14. `client/src/routes/masterRoutes.tsx` — import (~line 117) + route (~line 309).
15. `server/master/masterService.js:29` — add `"CENVAT Opening Balance"` to Statutory Details items.
16. `client/src/pages/menu/Create.tsx` (~line 63) — add getRoute map entry.
17. Rebuild/restart Electron so `initDB()` creates the new tables; verify menu item navigates and Accept persists + reloads.

## 9. Validation & edge cases
- **No company selected** → save returns `{ success:false, error:'Company ID is required' }`; show in AlertBanner (Service Tax pattern).
- **Singleton:** re-opening must load the existing record (get → exists:true → populate form, including lines). Second save updates (upsert), never duplicates.
- **`cenvat_credit_of`** constrained to Both / Capital Goods / Inputs; default `Inputs`. `tax_unit` default `Not Applicable`.
- **Line grid:** drop empty Particulars rows before insert (`replaceLines` filters blank `particulars`); Amount right-aligned, numeric (`Number(x)||0`), no color even for negatives — use bold/border per UI.md.
- **Voucher no.:** display-only / auto (default 1); not user-editable in v1.
- **Date:** default to books-begin / today; persisted as yyyy-mm-dd.
- **reconcile.js** does NOT create the new tables — the new `init()` (step 7) is mandatory; if skipped, `get`/`save` throw "no such table".
- **Theme check:** confirm no hex/color tokens introduced; reuse PageTitleBar/FormRow/RightActionPanel/MasterFormFooter/DataTable and the zinc input/select classes from `ServiceTaxDetailsForm.tsx`. Verify one sibling statutory-details screen (Service Tax) still renders after touching shared components (none should change).
- **Excise Adjustments popup** (img-02) is optional polish — a styled `<select>` is acceptable for v1 if the three values are present.
