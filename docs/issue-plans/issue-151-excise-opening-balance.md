# Issue #151 — Excise Opening Balance

## 1. Title & entry point
- **Issue**: #151 — Excise Opening Balance
- **Feature**: A per-company "Excise Opening Balance" entry, listed in the **List of Masters** under **Statutory Details** (last item in that group in TallyPrime EDU).
- **Menu path**: `Gateway of Tally → Create → Statutory Details → Excise Opening Balance` (and the matching `Alter` path).
- In this app the "List of Masters (Create)" screen is `client/src/pages/menu/Create.tsx`, driven by `server/master/masterService.js` `getMenu()`. The new item appears in the **Statutory Details** section, after `Payroll Statutory Details`.

## 2. TallyPrime reference (from screenshots, in order)

### Screen A — List of Masters (img-00.png)
Statutory Details group lists (top → bottom):
`Company GST Details`, `TDS Details`, `TCS Details`, `VAT Registration Details`, `Excise Registration Details`, `Service Tax Details`, `CENVAT Opening Balance`, `PLA Opening Balance`, `PAN/CIN Details`, `Dealer Excise Opening Balance`, **`Excise Opening Balance`** (highlighted — the target item).
> Note: this app's current `Statutory Details` menu is a reduced subset and does NOT yet list the three "Opening Balance" items or `Dealer Excise Opening Balance`. Issue #151 is specifically the **`Excise Opening Balance`** item.

### Screen B — Excise Opening Balance Creation (img-01.png / img-02.png)
A voucher-style entry screen titled **"Excise Opening Balance Creation"**. Layout matches a TallyPrime Journal voucher:

Header / top band (left block):
- **Voucher class label**: `Journal` (voucher mode tag, left edge)
- **No.**: `3` (voucher number — auto)

Header (centre block, two label/value columns):
- `GST Registration` → value `Chhattisgarh Registration`
- `Tax Unit` → value `Default Tax Unit`
- `Status` → value `Excise Opening Balance` (read-only status of this voucher)

Header (right block):
- **Date**: `2-Mar-27` with weekday `Tuesday` (highlighted date field)
- `F2: Date`, `F3: Company` and `F4`–`F10` right-side function-key action panel.

Body — single ledger-entry table:
- Section heading row: **`Particulars`** (left) … **`Amount`** (right-aligned).
- Empty entry rows where the user picks ledgers/excise stock and enters opening amounts. (img-02 shows the first `Particulars` cell active/empty — no rows entered yet, so no specific column sub-structure is shown beyond Particulars + Amount.)

Footer:
- **`Narration:`** free-text field (bottom-left).
- Bottom action bar: `Q: Quit`, `A: Accept`.
- Right panel bottom: `F12: Configure`.

No totals/computed values are visible because the sample voucher has no lines entered. Functionally this is the opening-balance Journal: each line = a Particulars (ledger/excise item) + an Amount; the Amount column would total at accept time (standard Journal Dr/Cr balancing), but the screenshots do not show a populated total.

## 3. Current state in codebase
- **Menu entry**: MISSING. `server/master/masterService.js:29` Statutory Details list has no `Excise Opening Balance`.
- **Route**: MISSING. `client/src/routes/masterRoutes.tsx` has no `excise-opening-balance` route (only `excise-registration-details` at lines ~316–319).
- **Create.tsx route map**: MISSING. `client/src/pages/menu/Create.tsx` `getRoute()` map has no `"Excise Opening Balance"` key (so the item, even if added to the menu, would render disabled).
- **Frontend component**: MISSING. No folder under `client/src/pages/master/statutory-details/` for excise opening balance.
- **Service / controller / schema / IPC**: MISSING. There is no `server/exciseOpeningBalance/*`, no `excise_opening_balance` table, no `exciseOpeningBalance:*` IPC channel, no `window.api.exciseOpeningBalance` in `preload.js`.
- **Related but distinct (do NOT reuse as-is)**:
  - `server/exciseRegistrationDetails/*` — singleton statutory-details master (registration config). This is the **architectural template** to clone.
  - `server/exciseBook/*` — named "Excise Book" master (#141), unrelated.
  - `server/voucher/*` — the generic voucher engine; Excise Opening Balance is a Journal voucher in real Tally, but in this codebase the established convention for these `Statutory Details` items is the **singleton per-company form** (see MEMORY: "Service Tax Details singleton", "#146 Statutory Details singletons"). Build it as a singleton opening-balance record, NOT a new voucher type, to stay consistent with #145/#146/#147 work.

## 4. Gap analysis
Everything is missing. Need a full singleton stack cloned from `exciseRegistrationDetails`:
1. SQLite schema table + Drizzle schema file + barrel export.
2. PG mirror schema file + barrel export.
3. `init()` module wired into `server/db/index.js`.
4. Service (`get`/`save` singleton-by-company + child opening-balance line rows).
5. Controller (with audit trail, like `exciseRegistrationDetailsController`).
6. IPC handlers in `registerStatutoryHandlers.js`.
7. `preload.js` `window.api.exciseOpeningBalance`.
8. Frontend: hook + form + Create/Alter screens following `ExciseRegistrationDetails/*`.
9. Route entries in `masterRoutes.tsx`.
10. Menu item in `masterService.js` + route map in `Create.tsx` (and `Alter.tsx`).

## 5. DB schema (sqlite + pg)
A NEW table is needed → requires a new `init()` (reconcile only auto-adds missing *columns* to existing tables; it does not create new tables). Two tables: the singleton header (one row per company) + the opening-balance line items.

### SQLite — new file `server/exciseOpeningBalance/exciseOpeningBalance.js` (init module)
```sql
CREATE TABLE IF NOT EXISTS excise_opening_balance (
  company_id        INTEGER PRIMARY KEY REFERENCES companies(company_id) ON DELETE CASCADE,
  voucher_no        TEXT,
  voucher_date      TEXT,
  gst_registration  TEXT,
  tax_unit          TEXT DEFAULT 'Default Tax Unit',
  status            TEXT DEFAULT 'Excise Opening Balance',
  narration         TEXT,
  created_at        TEXT DEFAULT (datetime('now')),
  updated_at        TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS excise_opening_balance_lines (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id   INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  particulars  TEXT NOT NULL,
  amount       REAL DEFAULT 0,
  sort_order   INTEGER DEFAULT 0
);
```
Include the same `migrations = [...]` try/catch loop pattern as `exciseRegistrationDetails.js` (empty initially; present for future column adds).

### SQLite Drizzle schema — new file `server/db/schema/sqlite/exciseOpeningBalance.js`
Mirror the table with `sqliteTable('excise_opening_balance', {...})` and `sqliteTable('excise_opening_balance_lines', {...})`, exporting `exciseOpeningBalance` and `exciseOpeningBalanceLines`. Follow `server/db/schema/sqlite/exciseRegistrationDetails.js` exactly (column naming, `companyId` PK, `default(sql\`(datetime('now'))\`)`).

### PG mirror — new file `server/db/schema/pg/exciseOpeningBalance.js`
Mirror `server/db/schema/pg/exciseRegistrationDetails.js` shape (pgTable, same columns).

### Barrel exports
- `server/db/schema/sqlite/index.js` — add `...require('./exciseOpeningBalance'),` near line 26 (next to the excise lines).
- `server/db/schema/pg/index.js` — add the matching `...require('./exciseOpeningBalance'),`.

## 6. Backend
### Service — `server/exciseOpeningBalance/exciseOpeningBalanceService.js`
Clone `exciseRegistrationDetailsService.js`. Functions:
- `get(company_id)` → `{ success, exists, data }`. `data` = header fields (camelCase) + `lines: [{ particulars, amount }]`. When no row exists, return `exists:false` with `DEFAULTS` (`taxUnit:'Default Tax Unit'`, `status:'Excise Opening Balance'`, `lines:[]`).
- `save(data)` → upsert the singleton by `company_id` (insert if absent else update + bump `updated_at`), then atomically replace child `excise_opening_balance_lines` rows for that company (delete-then-insert, preserving `sort_order`), matching how `exciseRegistrationDetailsService` replaces `exciseTariffItems`.
- READS via `db.all(sql\`SELECT ...\`)` and map snake_case → camelCase; MUTATIONS via the Drizzle query builder, same as the reference service.

### Controller — `server/exciseOpeningBalance/exciseOpeningBalanceController.js`
Clone `exciseRegistrationDetailsController.js` verbatim, with `ENTITY_TYPE = 'excise_opening_balance'`, calling the new service and recording audit trail on save.

### IPC — `server/ipc/registerStatutoryHandlers.js`
- Add `const exciseOpeningBalanceController = require('../exciseOpeningBalance/exciseOpeningBalanceController');` (near line 14).
- Register handlers (near line 83):
  ```js
  ipcMain.handle('exciseOpeningBalance:get',  exciseOpeningBalanceController.get);
  ipcMain.handle('exciseOpeningBalance:save', exciseOpeningBalanceController.save);
  ```

### preload — `preload.js`
After the `exciseRegistrationDetails` block (lines 464–467), add:
```js
exciseOpeningBalance: {
    get:  (company_id) => invoke('exciseOpeningBalance:get', company_id),
    save: (data)       => invoke('exciseOpeningBalance:save', data),
},
```

### db init wiring — `server/db/index.js`
After line 114 (`exciseRegistrationDetails` init), add:
```js
await require("../exciseOpeningBalance/exciseOpeningBalance").init(rawDb);
```

## 7. Frontend
Clone the `ExciseRegistrationDetails` singleton screens. New folder:
`client/src/pages/master/statutory-details/ExciseOpeningBalance/`
- `useExciseOpeningBalance.ts` — hook (clone `useExciseRegistrationDetails.ts`): loads via `window.api.exciseOpeningBalance.get(companyId)`, holds `form` (header fields + `lines`), `setField`, `save()` → `window.api.exciseOpeningBalance.save({...form, company_id})`.
- `ExciseOpeningBalanceForm.tsx` — clone `ExciseRegistrationDetailsForm.tsx`. Render the voucher-style header using shared `FormRow` for the read-only/value fields: `GST Registration`, `Tax Unit` (default `Default Tax Unit`), `Status` (read-only `Excise Opening Balance`), `Date`, voucher `No.`. Below that, a `Particulars` / `Amount` line table (reuse `DataTable` from `client/src/components/ui`; numeric `Amount` column right-aligned per UI.md). Add an editable add-row affordance and a `Narration` text field at the bottom.
- `EOBCreate.tsx` — clone `ExciseRDCreate.tsx`: `PageTitleBar title="Excise Opening Balance"` + `RightActionPanel` (`Alt+A` Accept / `Esc` Quit) + `MasterFormFooter`. Navigates back to `/master/create`.
- `EOBAlter.tsx` — clone `ExciseRDAlter.tsx` (loads existing singleton for edit; back to `/master/alter`).
- (Optional, to match siblings) `EOBCOA.tsx` if the Alter flow expects a selection list; for a singleton the Alter screen loads directly — mirror exactly what `ExciseRegistrationDetails` does (it has a COA route at `masterRoutes.tsx`). Match the reference: include COA only if the reference Alter uses one.

**Theme/shared-component reuse (strict black/white/zinc, per UI.md)**: use only `PageTitleBar`, `FormRow`, `RightActionPanel`, `MasterFormFooter`, `DataTable` from `client/src/components/ui`. No color. The reference `ExciseRDCreate.tsx` currently uses `red-*`/`green-*` inline alert styling (lines 41–50) — do NOT copy that; use shared `AlertBanner` (`client/src/components/ui`) or zinc-only styling instead, consistent with the strict theme.

### Routes — `client/src/routes/masterRoutes.tsx`
After the Excise Registration block (~line 319), add and import the new components:
```tsx
// Statutory Details — Excise Opening Balance
{ path: "/master/create/excise-opening-balance", element: <EOBCreate /> },
{ path: "/master/alter/excise-opening-balance",  element: <EOBAlter /> },
```
(Add a COA route only if you create `EOBCOA`.)

### Menu wiring
- `server/master/masterService.js:29` — append `"Excise Opening Balance"` to the Statutory Details `items` array.
- `client/src/pages/menu/Create.tsx` `getRoute()` map — add `"Excise Opening Balance": "/master/create/excise-opening-balance",`.
- `client/src/pages/menu/Alter.tsx` map — add `"Excise Opening Balance": "/master/alter/excise-opening-balance",` (mirror the `Excise Registration Details` entry at `Alter.tsx:48`).

## 8. Step-by-step checklist (file-path precise)
1. Create `server/exciseOpeningBalance/exciseOpeningBalance.js` (init: two `CREATE TABLE IF NOT EXISTS` + migrations loop). Clone `server/exciseRegistrationDetails/exciseRegistrationDetails.js`.
2. Create `server/db/schema/sqlite/exciseOpeningBalance.js` (Drizzle sqlite tables `exciseOpeningBalance`, `exciseOpeningBalanceLines`).
3. Create `server/db/schema/pg/exciseOpeningBalance.js` (PG mirror).
4. Edit `server/db/schema/sqlite/index.js` — add `...require('./exciseOpeningBalance'),`.
5. Edit `server/db/schema/pg/index.js` — add `...require('./exciseOpeningBalance'),`.
6. Edit `server/db/index.js` — add `await require("../exciseOpeningBalance/exciseOpeningBalance").init(rawDb);` after line 114.
7. Create `server/exciseOpeningBalance/exciseOpeningBalanceService.js` (clone reg-details service; `get`/`save` singleton + lines).
8. Create `server/exciseOpeningBalance/exciseOpeningBalanceController.js` (clone reg-details controller; `ENTITY_TYPE='excise_opening_balance'`).
9. Edit `server/ipc/registerStatutoryHandlers.js` — require controller (~line 14) + register `exciseOpeningBalance:get` / `exciseOpeningBalance:save` (~line 83).
10. Edit `preload.js` — add `exciseOpeningBalance: { get, save }` block after line 467.
11. Edit `server/master/masterService.js:29` — append `"Excise Opening Balance"` to Statutory Details items.
12. Create `client/src/pages/master/statutory-details/ExciseOpeningBalance/useExciseOpeningBalance.ts`.
13. Create `.../ExciseOpeningBalance/ExciseOpeningBalanceForm.tsx` (header FormRows + DataTable Particulars/Amount + Narration).
14. Create `.../ExciseOpeningBalance/EOBCreate.tsx` and `.../EOBAlter.tsx` (clone `ExciseRDCreate`/`ExciseRDAlter`, AlertBanner not red/green).
15. Edit `client/src/routes/masterRoutes.tsx` — import the new screens + add create/alter routes after line ~319.
16. Edit `client/src/pages/menu/Create.tsx` `getRoute()` — add `"Excise Opening Balance"` → create route.
17. Edit `client/src/pages/menu/Alter.tsx` map — add `"Excise Opening Balance"` → alter route.
18. Boot the app: confirm tables created, item appears enabled in List of Masters → Statutory Details, screen opens full-screen, save persists (re-open shows saved header + lines), audit trail records.

## 9. Validation & edge cases
- **Singleton uniqueness**: one row per `company_id` (PK). `save` must upsert, never duplicate; child lines replaced atomically (delete-then-insert) so removed rows don't linger.
- **Defaults**: `tax_unit='Default Tax Unit'`, `status='Excise Opening Balance'` when not provided. `Status` is read-only in the UI.
- **No company selected**: hook must no-op `get`/`save` when `companyId` is falsy (match `ExciseRDCreate` guard).
- **Amount column**: numeric, right-aligned, allow blank → store 0; no currency color/red for negatives (UI.md — use weight/border, not hue).
- **Empty save**: allow saving header with zero lines (screenshots show an empty voucher); don't reject.
- **Theme compliance**: no color anywhere; replace the reference screens' red/green alert inline styles with shared `AlertBanner`/zinc tokens.
- **Reconcile**: new tables are created by `init()` (step 1/6), NOT by reconcile — confirm `init()` runs before first IPC call. Future column additions go through the `migrations` array in the init module.
- **PG parity**: keep sqlite and pg schema files column-identical so a future PG switch doesn't drift.
