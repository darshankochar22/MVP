# Issue #148 — PLA Opening Balance

## 1. Title & entry point
- **Issue:** #148 — PLA Opening Balance.
- **Menu path (TallyPrime ref):** Gateway of Tally → Create → **List of Masters** → **Statutory Details** section → **PLA Opening Balance** (the last item, directly under **CENVAT Opening Balance**, both below **Service Tax Details**).
- **In this app:** Gateway → Create (`/master/create`) → Statutory Details group → **PLA Opening Balance** → route `/master/create/pla-opening-balance`.
- **Form title bar:** `PLA Opening Balance Creation`.
- **Nature:** A singleton-per-company voucher-style entry (Tally renders it as a **Journal** voucher whose Status is fixed to `PLA Opening Balance`). Model it as one row per company (same singleton pattern as Service Tax Details), NOT a list master with Create/Alter/COA.

## 2. TallyPrime reference (exact, from the 3 screenshots)

### Screen A — img-00.png — List of Masters menu (context only)
The "Statutory Details" section lists, in order:
`Company GST Details`, `TDS Details`, `TCS Details`, `VAT Registration Details`, `Payroll Statutory Details`, `Excise Registration Details`, `Service Tax Details`, **`CENVAT Opening Balance`**, **`PLA Opening Balance`** (highlighted).
→ Confirms PLA Opening Balance is a Statutory Details menu item. (CENVAT Opening Balance is issue #147's sibling — out of scope here but noted.)

### Screen B — img-01.png & img-02.png — PLA Opening Balance Creation form
Full-screen voucher-style entry. Layout top-to-bottom:

**Title bar:** `PLA Opening Balance Creation`. Company name shown centered (`Moly Jain` in capture).

**Voucher header (two-column band under the title):**
- Left edge: voucher class pill **`Journal`** then **`No.`** label with voucher number field (value `3` in capture). The number is auto/sequential like a voucher number.
- Right edge: **Date** field — shows `2-Mar-27` with weekday `Tuesday` beneath it (single voucher date, top-right, same position as a Tally voucher date).
- Center column, stacked rows:
  - **`GST Registration`** : `Chhattisgarh Registration` (value selected from the company's GST registrations).
  - **`Tax Unit`** : `♦ Not Applicable` (selectable from defined Tax Units; default `Not Applicable`).
  - **`Status`** : `PLA Opening Balance` (read-only fixed label — identifies the entry type).

**Body — ledger entry grid (the voucher lines):**
- Column header row: **`Particulars`** (left, wide) … **`Amount`** (far right, right-aligned).
- One editable entry line is active (img-02 shows the first Particulars cell focused/highlighted, empty). User picks a ledger under Particulars and types the opening Amount. Multiple lines allowed (standard voucher grid); rows stack downward.
- No Dr/Cr split column is shown in the captures — a single Amount column per line (opening balances).

**Footer band:**
- **`Narration:`** free-text field spanning the bottom-left (empty in capture).
- Bottom action bar: **`Q: Quit`** and **`A: Accept`** (standard Tally voucher accept/quit).

**Right action panel (F-key buttons, greyed in capture):** F2 Date, F3 Company, F4–F10 (standard voucher button set; not individually labelled/active in the captures).

**Computed values / totals:** none beyond the per-line Amount column. No running total row is shown in the captures (opening-balance lines; total is implicit). Treat the sum of line Amounts as the PLA opening balance total but do not invent a totals row Tally doesn't show.

**Drill chain:** none — single-screen create/alter of one entry per company. Re-opening the menu item shows the saved entry for editing (singleton).

## 3. Current state in codebase
**Nothing for PLA exists.** Verified by grep across `client/src`, `server`, `preload.js` — no `PLA`, no `pla-opening-balance`, no `plaOpeningBalance`. Concretely:
- **Menu (server):** `server/master/masterService.js` line 27-30 — "Statutory Details" items array does NOT include `PLA Opening Balance` (nor `CENVAT Opening Balance`). Also note: current order differs from the screenshot (e.g. Payroll Statutory Details / Service Tax positions) — only the addition matters here. → **missing**.
- **Menu→route map (client):** `client/src/pages/menu/Create.tsx` lines 30-72 `getRoute()` — no `"PLA Opening Balance"` key. → **missing**.
- **Route (client):** `client/src/routes/masterRoutes.tsx` — no import/route for a PLA component. → **missing**.
- **Frontend component:** none under `client/src/pages/master/statutory-details/`. → **missing**.
- **Entity type:** none under `client/src/types/entities/`. → **missing**.
- **Server service/controller/init:** none (`server/plaOpeningBalance/` does not exist). → **missing**.
- **Drizzle schema:** no `pla_opening_balance` table in `server/db/schema/sqlite/` or `.../pg/`. → **missing**.
- **IPC handlers:** none in `server/ipc/registerStatutoryHandlers.js`. → **missing**.
- **preload bridge:** no `plaOpeningBalance` in `preload.js`. → **missing**.

**Reusable scaffolding that DOES exist (use as the template):** the **Service Tax Details** singleton stack (issue #146) is the closest, complete reference:
- `client/src/pages/master/statutory-details/ServiceTaxDetails/{ServiceTaxDetailsCreate.tsx, ServiceTaxDetailsForm.tsx, useServiceTaxDetails.ts}`
- `client/src/types/entities/ServiceTaxDetails.ts`
- `server/serviceTaxDetails/{serviceTaxDetails.js (init), serviceTaxDetailsService.js, serviceTaxDetailsController.js}`
- `server/db/schema/sqlite/serviceTaxDetails.js` + `server/db/schema/pg/serviceTaxDetails.js` (parent + child-rows table — directly applicable since PLA has a child "lines" table).
- IPC pattern: `registerStatutoryHandlers.js` lines 13/79-80; preload lines 460-462.
- Shared UI primitives available: `PageTitleBar`, `FormRow`, `RightActionPanel`, `MasterFormFooter`, `DataTable`, `SideSelectionPanel`, `MasterSelectionPanel`, `SearchInput` (from `@/components/ui`).
- Data sources for header dropdowns already exist: GST registrations via `window.api.gstRegistration.getAll(companyId)` (preload ~308); Tax Units via `window.api.taxUnits.getAll(companyId)` (preload ~19).

## 4. Gap analysis
Build the entire vertical slice for a new singleton "statutory details" entity with a child line-items table:
1. New Drizzle schema (sqlite + pg): a parent `pla_opening_balance` (one row per company, voucher header) + a child `pla_opening_balance_lines` (Particulars ledger + Amount). reconcile.js only auto-adds **columns to existing tables**, so a NEW table needs an `init()` registered in `server/db/index.js`.
2. New server folder `server/plaOpeningBalance/` (init + service get/save + controller with audit-trail like ServiceTax).
3. Schema barrels: add to `server/db/schema/sqlite/index.js` and `.../pg/index.js`.
4. IPC: 2 handlers (`plaOpeningBalance:get`, `plaOpeningBalance:save`) in `registerStatutoryHandlers.js` + preload `plaOpeningBalance` bridge.
5. Frontend: entity type, `usePlaOpeningBalance` hook, `PlaOpeningBalanceForm`, `PlaOpeningBalanceCreate`, route, and menu wiring (both server array + client `getRoute` map).
6. Header dropdowns must pull live GST registrations + Tax Units; Status is a fixed read-only label.

## 5. DB schema (NEW tables — reconcile will NOT create these)
Add **`server/db/schema/sqlite/plaOpeningBalance.js`**:
```
pla_opening_balance (
  company_id        INTEGER PRIMARY KEY REFERENCES companies(company_id) ON DELETE CASCADE,
  voucher_no        TEXT,                 -- "No." (e.g. "3")
  voucher_date      TEXT,                 -- entry date (yyyy-mm-dd)
  gst_registration  TEXT,                 -- selected GST registration name
  tax_unit          TEXT DEFAULT 'Not Applicable',
  status            TEXT DEFAULT 'PLA Opening Balance',  -- fixed label
  narration         TEXT,
  created_at        TEXT DEFAULT (datetime('now')),
  updated_at        TEXT DEFAULT (datetime('now'))
)
pla_opening_balance_lines (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id   INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  particulars  TEXT NOT NULL,             -- ledger name
  amount       REAL DEFAULT 0,
  sort_order   INTEGER DEFAULT 0
)
```
Add matching **`server/db/schema/pg/plaOpeningBalance.js`** using `pgTable/bigint/bigserial/text/real/timestamp` exactly like `pg/serviceTaxDetails.js` (company_id = `bigint(...).primaryKey().references(...)` for parent; child id = `bigserial`; created/updated = `timestamp(..).notNull().defaultNow()`).

Mirror the same DDL verbatim inside the server `init()` (raw libsql `CREATE TABLE IF NOT EXISTS`), since `init()` is the source of truth and the Drizzle file is the typed mirror.

## 6. Backend
**New folder `server/plaOpeningBalance/`:**
- `plaOpeningBalance.js` — `init(db)` running the two `CREATE TABLE IF NOT EXISTS` above. Export `{ init }`. (Clone `server/serviceTaxDetails/serviceTaxDetails.js`.)
- `plaOpeningBalanceService.js` — clone `serviceTaxDetailsService.js`:
  - `get(company_id)` → `{ success, exists, data }` where data = `{ voucherNo, voucherDate, gstRegistration, taxUnit, status:'PLA Opening Balance', narration, lines:[{particulars, amount}] }`. Reads parent via `db.all(sql\`SELECT * FROM pla_opening_balance WHERE company_id = ...\`)`, loads child lines ordered by `sort_order, id`, maps snake→camel. Returns DEFAULTS (empty lines) when no row.
  - `save(data)` → upsert parent by `company_id` (update if exists else insert, set `updatedAt: sql\`datetime('now')\``); then `replaceLines(company_id, lines)` = delete-all-then-insert non-empty lines (filter `particulars` non-blank, `amount` numeric), same atomic-replace pattern as `replaceCategories`. Force `status = 'PLA Opening Balance'`.
  - Export `{ get, save }`.
- `plaOpeningBalanceController.js` — clone `serviceTaxDetailsController.js`: `get(event, company_id)` and `save(event, data)` with `auditTrailService.record({ entity_type:'pla_opening_balance', entity_id: company_id, action: before?'update':'create', before, after })`.

**Schema barrels:**
- `server/db/schema/sqlite/index.js` — add `...require('./plaOpeningBalance'),` (alphabetical: near `payrollUnit`/`physicalStock`).
- `server/db/schema/pg/index.js` — add `...require('./plaOpeningBalance'),`.

**DB init:** `server/db/index.js` — add `await require("../plaOpeningBalance/plaOpeningBalance").init(rawDb);` alongside the other statutory inits (after the `serviceTaxDetails` init line ~113).

**IPC:** `server/ipc/registerStatutoryHandlers.js`:
- require: `const plaOpeningBalanceController = require('../plaOpeningBalance/plaOpeningBalanceController');` (near line 13).
- handlers inside `register()`:
  - `ipcMain.handle('plaOpeningBalance:get', plaOpeningBalanceController.get);`
  - `ipcMain.handle('plaOpeningBalance:save', plaOpeningBalanceController.save);`

**preload.js:** add a bridge block (mirror serviceTaxDetails at lines 460-462):
```
plaOpeningBalance: {
    get:  (company_id) => invoke('plaOpeningBalance:get', company_id),
    save: (data)       => invoke('plaOpeningBalance:save', data),
},
```

## 7. Frontend
**Entity type — NEW `client/src/types/entities/PlaOpeningBalance.ts`:**
```
export interface PlaOpeningBalanceLine { particulars: string; amount: number; }
export interface PlaOpeningBalance {
  voucherNo: string;
  voucherDate: string;        // yyyy-mm-dd
  gstRegistration: string;
  taxUnit: string;            // default "Not Applicable"
  status: string;             // always "PLA Opening Balance"
  narration: string;
  lines: PlaOpeningBalanceLine[];
}
export const DEFAULT_PLA_LINE: PlaOpeningBalanceLine = { particulars: "", amount: 0 };
export const DEFAULT_PLA_OPENING_BALANCE: PlaOpeningBalance = {
  voucherNo: "", voucherDate: "", gstRegistration: "", taxUnit: "Not Applicable",
  status: "PLA Opening Balance", narration: "", lines: [],
};
```

**Hook — NEW `client/src/pages/master/statutory-details/PlaOpeningBalance/usePlaOpeningBalance.ts`:** clone `useServiceTaxDetails.ts` — `form/setField/load/save`, calling `window.api.plaOpeningBalance.get(companyId)` and `.save({ ...form, company_id })`. Also fetch GST registrations (`window.api.gstRegistration.getAll`) and Tax Units (`window.api.taxUnits.getAll`) for the header dropdown option lists.

**Form — NEW `client/src/pages/master/statutory-details/PlaOpeningBalance/PlaOpeningBalanceForm.tsx`:** voucher-style layout, strict black/white/zinc theme, reuse `FormRow` + the shared input/select token classes from ServiceTaxDetailsForm (do NOT invent new font sizes/spacing):
- Header band: `Journal` static pill + `No.` input (`voucherNo`); `Date` input (`voucherDate`, top-right); `GST Registration` select (options from gstRegistration list); `Tax Unit` select (options from taxUnits list, default `Not Applicable`); `Status` shown as a read-only label `PLA Opening Balance` (plain text, not an input).
- Body grid: a two-column entry table — `Particulars` (left, ledger select/text, left-aligned) and `Amount` (right-aligned numeric). Reuse `DataTable` for column alignment/row-height, OR render `FormRow`-style editable rows; numbers right-aligned per UI rules. Allow add/remove of lines (blank trailing row to add). No coloured totals row — if a sum is shown, use bold + 1px black top border only.
- Footer: `Narration` text input spanning bottom width.
- All borders zinc, no colour, no shadow, no rounded-pill.

**Screen — NEW `client/src/pages/master/statutory-details/PlaOpeningBalance/PlaOpeningBalanceCreate.tsx`:** clone `ServiceTaxDetailsCreate.tsx` — `PageTitleBar title="PLA Opening Balance" subtitle={company.name}`, Esc=Quit (→ `/master/create`), Alt+A=Accept (`save`), `RightActionPanel` with Accept/Quit, `MasterFormFooter`. Reuse the existing error/success banner pattern (note: per project memory, prefer black/white styling — the ServiceTax sample uses red/green banners; keep banners monochrome per UI.md, e.g. swap to `AlertBanner` if available, otherwise zinc-bordered text).

**Route — `client/src/routes/masterRoutes.tsx`:**
- import: `import PlaOpeningBalanceCreate from "../pages/master/statutory-details/PlaOpeningBalance/PlaOpeningBalanceCreate.tsx";` (near line 117 with the other statutory-details imports).
- route (near line 309): `{ path: "/master/create/pla-opening-balance", element: <PlaOpeningBalanceCreate /> },`.

**Menu wiring (both sides):**
- Server: `server/master/masterService.js` line 29 — append `"PLA Opening Balance"` to the "Statutory Details" items array (place it last, after `"Payroll Statutory Details"`). (Optionally also add `"CENVAT Opening Balance"` if #147 lands; out of scope here.)
- Client: `client/src/pages/menu/Create.tsx` `getRoute()` map (around line 63) — add `"PLA Opening Balance": "/master/create/pla-opening-balance",`.

## 8. Step-by-step checklist (file-precise, in order)
1. `server/db/schema/sqlite/plaOpeningBalance.js` — create (parent + lines tables, clone sqlite/serviceTaxDetails.js).
2. `server/db/schema/pg/plaOpeningBalance.js` — create (clone pg/serviceTaxDetails.js).
3. `server/db/schema/sqlite/index.js` — add `...require('./plaOpeningBalance'),`.
4. `server/db/schema/pg/index.js` — add `...require('./plaOpeningBalance'),`.
5. `server/plaOpeningBalance/plaOpeningBalance.js` — create `init(db)` with the two CREATE TABLEs.
6. `server/plaOpeningBalance/plaOpeningBalanceService.js` — create `get`/`save` (clone serviceTaxDetailsService.js, lines child table).
7. `server/plaOpeningBalance/plaOpeningBalanceController.js` — create (clone serviceTaxDetailsController.js, entity `pla_opening_balance`).
8. `server/db/index.js` — add `await require("../plaOpeningBalance/plaOpeningBalance").init(rawDb);` after the serviceTaxDetails init (~line 113).
9. `server/ipc/registerStatutoryHandlers.js` — add controller require (~line 13) + two `ipcMain.handle` lines (~line 80).
10. `preload.js` — add `plaOpeningBalance: { get, save }` bridge block (~after line 462).
11. `client/src/types/entities/PlaOpeningBalance.ts` — create types + defaults.
12. `client/src/pages/master/statutory-details/PlaOpeningBalance/usePlaOpeningBalance.ts` — create hook (+ load gst regs & tax units).
13. `client/src/pages/master/statutory-details/PlaOpeningBalance/PlaOpeningBalanceForm.tsx` — create voucher-style form (theme tokens, shared FormRow/DataTable).
14. `client/src/pages/master/statutory-details/PlaOpeningBalance/PlaOpeningBalanceCreate.tsx` — create screen (PageTitleBar/RightActionPanel/MasterFormFooter, Esc/Alt+A).
15. `client/src/routes/masterRoutes.tsx` — add import + route `/master/create/pla-opening-balance`.
16. `server/master/masterService.js` — append `"PLA Opening Balance"` to Statutory Details items.
17. `client/src/pages/menu/Create.tsx` — add getRoute map entry.
18. Boot once so `init()` creates the tables; verify menu item appears and form opens, saves, and reloads the saved singleton.

## 9. Validation & edge cases
- **Singleton:** `save` must upsert by `company_id` (one PLA entry per company), never insert duplicates; reopening the menu loads the saved entry for edit.
- **Lines atomic replace:** delete-then-insert child rows on every save; drop blank `particulars` rows; coerce `amount` to a number (default 0).
- **Status fixed:** persist `status = 'PLA Opening Balance'` server-side regardless of client payload; render read-only in UI.
- **Header dropdowns:** GST Registration options come from the company's GST registrations; Tax Unit default `Not Applicable` and from defined Tax Units — both empty lists are valid (allow free/empty selection).
- **No company selected:** hook returns early / `save` errors with "No company selected" (mirror useServiceTaxDetails / serviceTaxDetailsService guards).
- **reconcile caveat:** because these are NEW tables, they are created ONLY by `init()` — confirm step 8 is wired or get/save will fail with "no such table".
- **pg parity:** keep sqlite + pg schema column names identical; pg `company_id` must be plain `bigint().primaryKey().references(...)` (NOT identity), matching pg/serviceTaxDetails.js.
- **Theme:** strict black/white/zinc only — no red/green banners, no coloured totals, numbers right-aligned, one type scale (reuse ServiceTaxDetailsForm token classes).
- **Audit trail:** record create vs update via before-snapshot (clone controller); failures in audit must not block the save.
