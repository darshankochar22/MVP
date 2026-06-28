# Issue #85 — Inventory Books: Stock Item / Batch

## 1. Title & entry point
- **Feature:** Inventory Books → *Stock Item* summary report and *Batch* vouchers report.
- **Menu path (Tally):** Gateway of Tally → Display More Reports → INVENTORY → **Inventory Books** → SUMMARY → **Stock Item** (or **Batch**).
- **App entry:** `/reports/inventory-books` (component `client/src/pages/menu/reports/InventoryBooks.tsx`), then the "Stock Item" / "Batch" menu rows.

## 2. TallyPrime reference (every screen, in order)

The 10 screenshots show two flows that branch from the Inventory Books submenu.

**img-00 — Display More Reports (Gateway):** sections ACCOUNTING (Trial Balance, Day Book, Cash Flow, Funds Flow, Account Books, Statements of Accounts), INVENTORY (**Inventory Books** highlighted, Statements of Inventory, Job Work Reports), STATUTORY, PAYROLL, EXCEPTION, Quit.

**img-01 / img-05 — Inventory Books submenu:**
- Breadcrumb: *Gateway of Tally > Display More Reports*. Header band "Inventory Books".
- **SUMMARY:** Stock Item, BAtch, Godowns / Excise Units, Stock Group Summary, StoCk Category Summary.
- **REGISTERS:** STock Transfer Journal Register, Physical Stock Register.
- Quit.
- img-01 has "Stock Item" highlighted; img-05 has "BAtch" highlighted.

### Flow A — Stock Item (img-02 → img-03; img-04 is the Create branch)

**img-02 — Select Stock Item popup:** title bar "Select Stock Item" / company "Moly Jain". Floating field card "Name of Item" with an input. Dropdown "List of Stock Items" with a **Create** action at top-right, then the alphabetical item list (5 Star, Apple, Banana, Biscuits, Bisvuits, Butter, ButterScotch, Chocolate Icecream, Dark Choco, Dark Fantsay, Dreamlite, GoodDay, Jhu, Kj, Oninon, Potato, Vanilla Icecream). Footer keys: Q:Quit, A:Accept.

**img-03 — Stock Item Monthly Summary** (after picking "5 Star"):
- Title "Stock Item Monthly Summary"; sub-header "5 Star" + period "1-Apr-26 to 2-Apr-26".
- Columns: **Particulars** | **Inwards** (Quantity, Value) | **Outwards** (Quantity, Value) | **Closing Balance** (Quantity, Value).
- Rows: **Opening Balance**, then **April … March** (12 month rows), **Grand Total** (bold, top border). Each month carries running Closing Qty/Value.
- Bottom: **bar chart** of monthly values (Apr…Mar on X axis).
- Right action panel: F2 Period, F3 Company, F4 Stock Item, F6 Monthly, F7 Show Profit, F8 (blank), Basis of Values, Change View, Exception Reports, Save View, Apply Filter, Filter Details, New Column, Alter Column, Delete Column, Auto Column.
- Footer keys: Q:Quit, Space:Select, Remove Line, Restore Line, F12:Configure.
- **Drill chain:** Monthly Summary → (Enter on a month) → Stock Item Vouchers for that month → (Enter on a voucher) → Voucher alteration. F7 toggles a Profit column. Change View switches granularity (Daily/Weekly/…) and related reports (Stock Query / Movement Analysis / Cost Analysis / Vouchers).

**img-04 / img-09 — Stock Item Creation (Secondary)** (reached via **Create** in img-02's list):
- Left: **Name**, **(alias)**, **Under** (Primary), **Units** (Not Applicable).
- Right "Statutory Details": **GST applicability** (Applicable); **HSN/SAC & Related Details** → HSN/SAC Details (As per Company/Stock Group), Source of details (Not Available), HSN/SAC, Description; **GST Rate & Related Details** → GST Rate Details (As per Company/Stock Group), Source of details (Not Available), Taxability Type, GST Rate (0 %); **Type of Supply** (Goods); **Set/Alter other Statutory details** (No).
- Right action panel: F3 Company, F10 Other Masters, More Details, Get HSN/SAC Info. Footer: Q:Quit, A:Accept, D:Delete, F12:Configure.

### Flow B — Batch (img-06 → img-07 → img-08)

**img-06 — Batch Items, "Name of Item" step:** title "Batch Items" / "Moly Jain". Two stacked fields **Name of Item** (active) and **Name of Batch**. Right dropdown "List of Items" with **Create** and only **batch-tracked items** (Dark Choco, GoodDay, Jhu). Footer: Q:Quit, A:Accept.

**img-07 — Batch Items, "Name of Batch" step** (item = Dark Choco): "Name of Item : Dark Choco" fixed; "Name of Batch" active. Right dropdown "List of Batches" with column header **Name** and the batch **Primary Batch**.

**img-08 — Batch Vouchers** (Stock Item: Dark Choco, Batch Name: Primary Batch, period 1-Apr-26 to 30-Apr-26):
- Columns: **Date** | **Particulars** | **Vch Type** | **Vch No.** | **Inwards** (Quantity, Value) | **Outwards** (Quantity, Value) | **Closing** (Quantity, Value).
- Footer label "Totals as per 'Default' valuation :" then a totals row.
- Right action panel: F2 Period, F3 Company, F4 Batch, F6 Monthly, F7 Show Profit, F8 Batch-wise, Basis of Values, Change View, Exception Reports, Save View, Apply Filter, Filter Details, Stock Alter.
- Bottom action bar: Q:Quit, Enter:Alter, Space:Select, A:Add Vch, 2:Duplicate Vch, I:Insert Vch, D:Delete, X:Cancel Vch, R:Remove Line, U:Restore Line, F12:Configure.
- **Drill chain:** Batch Vouchers → (Enter on a voucher) → Voucher alteration.

## 3. Current state in codebase — ALREADY BUILT (this issue is essentially complete)

| Concern | Path | State |
|---|---|---|
| Inventory Books menu | `client/src/pages/menu/reports/InventoryBooks.tsx` | Real. SUMMARY + REGISTERS sections match screenshots exactly. |
| Stock Item report (3-level: select → monthly summary → vouchers, F7 profit, Change View, bar chart, Save View) | `client/src/pages/reports/inventory/StockItemReport.tsx` | Real, complete, calls real IPC. |
| Monthly summary table | `client/src/pages/reports/inventory/StockItemMonthlyTable.tsx` | Real. |
| Item vouchers table | `client/src/pages/reports/inventory/StockItemVouchersTable.tsx` | Real. |
| Bar chart | `client/src/pages/reports/inventory/StockBarChart.tsx` | Real. |
| Selection popup (Name of Item / List, Create) | `client/src/pages/reports/inventory/SelectionPopup.tsx` | Real, shared. |
| Change View / Basis / Save View overlays | `ChangeViewPopup.tsx`, `ScaleFactorPopup.tsx`, `SaveViewDialog.tsx` | Real. |
| Batch report (3-level: item → batch → vouchers) | `client/src/pages/reports/inventory/BatchVouchers.tsx` | Real, complete; Inwards/Outwards/Closing cols + totals + "Totals as per 'Default' valuation". |
| Stock Item Create form | `client/src/pages/master/inventory/stock-item/StockItemCreate.tsx` (route `/master/create/stock-item`) | Real; `SelectionPopup.onCreate` navigates to it. |
| Report routes | `client/src/routes/reportRoutes.tsx` | `/reports/inventory-books` (105), `/reports/inventory/stock-item` (187), `/reports/inventory/batch-vouchers` (191). |
| IPC bridge | `preload.js` lines 187–195: `stockItemMonthly`, `batchItems`, `batchesForItem`, `batchVouchers`, `stockItemVouchers` | Real. |
| IPC handlers | `server/ipc/registerReportHandlers.js` lines 30–38 | Real (`report:*`). |
| Controller | `server/report/reportController.js` lines 119–144 | Real, delegates to service. |
| Service (DB-backed, Drizzle) | `server/report/stockSummaryReportService.js` — `stockItemMonthly` (152), `batchItems` (233), `batchesForItem` (316), `batchVouchers` (363) | Real DB queries, not mocked. |
| Schema | `server/db/schema/sqlite/voucher.js`, `.../stockItem.js` (+ pg mirrors) — `voucher_batches` table incl. `mfg_date` | Real. |

## 4. Gap analysis — ONE real bug

**Broken menu link.** `InventoryBooks.tsx` line 25 routes "Stock Item" to **`/reports/inventory-books/stock-item`**, but that path is **never registered** in `client/src/routes/reportRoutes.tsx`. The actual StockItemReport route is `/reports/inventory/stock-item` (line 187). Result: clicking **Stock Item** in the Inventory Books menu lands on an unmatched route (blank/dead screen). The **Batch** entry is correct (`/reports/inventory/batch-vouchers` exists). The two registered `/reports/inventory-books/*` paths are only the two REGISTERS screens.

Nothing else is missing: DB ✓, IPC ✓, preload ✓, frontend real-data ✓, Create path ✓, screenshots' columns/flows all already implemented.

## 5. DB schema
**None.** All required tables/columns exist (`stock_items`, `voucher_batches` with `mfg_date`/`expiry_date`, voucher inventory entries). No reconcile column-add and no new `init()` needed.

## 6. Backend
**No changes.** Service functions, controller methods, IPC handler registrations, and `preload.js` `window.api.report.*` entries all already exist and are correct (see table in §3).

## 7. Frontend
Single one-line fix — make the menu link point at the existing route. Two equivalent options; pick **Option A** (smallest, no route churn):

- **Option A (preferred):** In `client/src/pages/menu/reports/InventoryBooks.tsx` line 25, change the "Stock Item" target from `/reports/inventory-books/stock-item` to **`/reports/inventory/stock-item`** (the route already registered at `reportRoutes.tsx:187`). Matches how "Batch" already points at `/reports/inventory/batch-vouchers`.
- **Option B (only if a canonical `inventory-books/` path is wanted):** add a route alias in `client/src/routes/reportRoutes.tsx` near line 187: `{ path: "/reports/inventory-books/stock-item", element: <StockItemReport /> }` (StockItemReport already imported at line 51). Leave the menu as-is. Do **not** do both.

No new components, no theme work. Existing screens already use the strict black/white/zinc theme (`bg-white`, `border-zinc-*`, `bg-[#f4f4f5]` header, no colour). Do not restyle.

## 8. Step-by-step checklist
1. Open `client/src/pages/menu/reports/InventoryBooks.tsx`.
2. Line 25, in the `routes` map, change `"Stock Item":"/reports/inventory-books/stock-item",` → `"Stock Item": "/reports/inventory/stock-item",`.
3. Save. (No backend, schema, preload, or IPC edits.)
4. Manually verify both flows in the running app (§9).

## 9. Validation & edge cases
- **Stock Item:** Inventory Books → Stock Item now opens the Select Stock Item popup (no longer blank). Pick an item → Monthly Summary renders with Opening Balance, 12 months, Grand Total, bar chart; F7 toggles Profit; Enter on a month drills to Stock Item Vouchers; Enter on a voucher opens the voucher; Change View / Basis of Values / Save View overlays open. **Create** in the list navigates to `/master/create/stock-item`.
- **Batch:** Inventory Books → Batch opens "Name of Item" picker listing **only batch-tracked items** (verify a non-batch item is absent). Pick item → "List of Batches" (e.g. Primary Batch). Pick batch → Batch Vouchers with Inwards/Outwards/Closing columns, totals row, "Totals as per 'Default' valuation". Esc/Backspace steps back one level at each stage.
- **Edge cases already handled by existing code:** empty item list (`emptyText`), item with no batches (batch popup shows empty text), batch with no vouchers ("No records found."), company/FY not selected (guards in the report components return early). No regression risk — the fix only redirects a menu link to an existing, working route.
