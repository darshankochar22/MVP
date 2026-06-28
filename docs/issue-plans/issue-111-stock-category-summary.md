# Issue #111 — Inventory Books · Stock Category Summary

## 1. Title & entry point
- **Feature:** Stock Category Summary (Inventory Books report).
- **Menu path (Tally):** Gateway of Tally → Display More Reports → Inventory Books → SUMMARY → **StoCk Category Summary**.
- **App route:** `/reports/inventory/stock-category-summary` (reached from the Inventory Books menu screen at `/reports/inventory-books` → "Stock Category Summary").

## 2. TallyPrime reference (from the 33 screenshots, in flow order)
The 33 frames cover two things: (a) the report flow itself (img-00…img-07, img-17, img-20) and (b) master/data setup used to populate it (Stock Category creation, Stock Item creation, godown allocations — img-08…img-16, img-21…img-32). The report feature to replicate is the flow below.

**Screen A — Inventory Books menu (img-00, img-17).**
- "Inventory Books" header, SUMMARY section lists: Stock Item, BAtch, Godowns / Excise Units, Stock Group Summary, **StoCk Category Summary**. REGISTERS: STock Transfer Journal Register, Physical Stock Register. Then Quit.

**Screen B — Select Stock Category popup (img-01, img-06).**
- Title bar: "Select Stock Category".
- Field "Name of Stock Category" (typeahead).
- List box "List of Stock Categories" with a "Create" affordance; sample entries: Primary, Asha, Fan, Machine.
- Bottom bar: "Quit" / "Accept".

**Screen C — Stock Category Summary report (img-02, img-03, img-20).**
- Header band: "Stock Category Summary" (left), company name e.g. "Moly Jain" (center).
- Right-side info block: category name (e.g. "Input Device"), company, period `1-Apr-26 to 2-Mar-27`, then **"Closing Balance"** spanning three numeric columns.
- Column headers: **Particulars** (left), **Quantity**, **Rate**, **Value** (all right-aligned). (img-02 shows a different company's data with category "5 Star" and many items; img-20 shows category "Input Device" with Keyboard 10 pcs @ 250.00 = 2,500.00 and Mouses 10 pcs @ 150.00 = 1,500.00.)
- Each row = one stock item in the selected category; quantity carries its unit (e.g. "10 pcs", "23 nos").
- Negative values appear parenthesised, e.g. "(-)30 nos", "(-)300.00".
- Footer: **Grand Total** row — summed Quantity (blank Rate) and summed Value (img-20: "20 pcs … 4,000.00"; img-02: "10,56,640.00").
- Right action panel (reference only, not all required): F2 Period, F3 Company, F4 Stock Category, F6 Monthly, F7 Show Profit, F8 Valuation, B Basis of Values, H Change View, J Exception Reports, L Save View, F Apply Filter, C/A/D New/Alter/Delete Column, N Auto Column, F12 Configure.

**Screen D — Stock Item Monthly Summary (img-04, img-28) — drill from a row.**
- Header: "Stock Item Monthly Summary", company, item name, period.
- Columns: Particulars | Inwards (Quantity, Value) | Outwards (Quantity, Value) | Closing Balance (Quantity, Value).
- First row "Opening Balance" (only closing populated), then 12 month rows April…March.
- Bar chart of monthly closing below the table.
- Grand Total row sums Inwards/Outwards and shows final closing.

**Screen E — Stock Item Vouchers (img-05) — drill from a month row.**
- Header: "Stock Item Vouchers", item, date range (e.g. "1-Mar-27 to 31-Mar-27").
- Columns: Date | Particulars | Vch Type | Vch No. | Inwards (Qty, Value) | Outwards (Qty, Value) | Closing (Qty, Value).
- "Opening Balance" row, then voucher rows.
- "Totals as per 'Default' valuation :" caption above the totals row.

**Drill chain:** Select Category → Category Summary (items) → Stock Item Monthly Summary → Stock Item Vouchers → (Enter on a voucher) Accounting Voucher Alteration (`/transactions/voucher/:id`). This matches the established "never skip monthly" stock-item drill convention.

**Setup screens (not part of the report, shown for data context):** Stock Category Creation (Secondary) under Primary (img-07); Stock Item Creation/Alteration with Category = a stock category, Units, GST/HSN block, Opening Balance qty/rate/value (img-08, img-12, img-30); Godown allocation popup "Allocations of : <item> for: N <unit>" with Godown/Quantity/Rate/per/Amount and List of Godowns (Burari, Main Location, Sant Nagar) (img-09…img-16, img-21…img-32).

## 3. Current state in codebase — ALREADY FULLY IMPLEMENTED
This issue is effectively complete end-to-end; every layer exists and uses real data (no mocks). Verified files:

- **Frontend component (REAL):** `/Users/darshan/Startup/client/src/pages/reports/inventory/StockCategorySummary.tsx` — full 4-level drill (category picker → summary → monthly → vouchers), strict zinc theme, keyboard nav, grand totals. Direct sibling/clone of `StockGroupSummary.tsx`.
- **Route (REAL):** `/Users/darshan/Startup/client/src/routes/reportRoutes.tsx` line 58 (import) and line 194 (`{ path: "/reports/inventory/stock-category-summary", element: <StockCategorySummary /> }`).
- **Menu entry (REAL):** `/Users/darshan/Startup/client/src/pages/menu/reports/InventoryBooks.tsx` lines 11 & 29 — "Stock Category Summary" → `/reports/inventory/stock-category-summary`. (Inventory Books menu is client-side here, NOT `server/master/masterService.js`.)
- **Preload bridge (REAL):** `/Users/darshan/Startup/preload.js` — line 196 `report.stockCategoryItems(company_id, fy_id, category_id) → invoke('report:stockCategoryItems', …)`; lines 127-133 `stockCategory.{create,getAll,getById,update,delete}`; line 186 `report.stockGroupItems`; plus `report.stockItemMonthly` / `report.stockItemVouchers` used by the deeper drills.
- **IPC handler (REAL):** `/Users/darshan/Startup/server/ipc/registerReportHandlers.js` line 39 `ipcMain.handle('report:stockCategoryItems', reportController.stockCategoryItems)`. Master: `/Users/darshan/Startup/server/ipc/registerInventoryHandlers.js` line 28 `stockCategory:getAll`.
- **Controller (REAL):** `/Users/darshan/Startup/server/report/reportController.js` lines 146-148.
- **Service (REAL Drizzle):** `/Users/darshan/Startup/server/report/stockSummaryReportService.js` `stockCategoryItems` (lines 91-150) — computes closing = opening + inwards − outwards per item, filters `si.category_id = category_id`, joins units, excludes cancelled/optional/post-dated vouchers; returns `{ success, items, totalClosingQty, totalClosingValue }`. `stockItemMonthly` (line 152+) and `stockItemVouchers` power the deeper drills.
- **Schema (REAL, both engines):** `/Users/darshan/Startup/server/db/schema/sqlite/stockCategory.js` and `/Users/darshan/Startup/server/db/schema/pg/stockCategory.js` (`stock_categories`, `sc_id`, `parent_category_id`); `/Users/darshan/Startup/server/db/schema/sqlite/stockItem.js` line 19 (`category_id`) and pg equivalent.
- **Tests:** `/Users/darshan/Startup/server/tests/stockGroupReport.test.js` covers the sibling `stockGroupItems`; no dedicated `stockCategoryItems` test.

Note: `/Users/darshan/Startup/client/src/pages/reports/definitions/inventory.ts` line 782 defines a generic ReportRunner `"stock-category-summary"` stub (apiMethod `stockCategorySummary`). It is **dead/unused** for this feature — the route maps straight to the real `StockCategorySummary.tsx` component, not the runner. Leave it or ignore it; do not wire the feature through it.

## 4. Gap analysis
Functionally there is **no missing layer** — DB ✓, backend/IPC ✓, preload ✓, frontend (real data, proper drill, FullScreenPanel-style full-view) ✓, route ✓, menu ✓. Remaining items are verification/cosmetic only:

1. **No automated test** for `stockCategoryItems` (the group sibling has one; category does not).
2. **Period label cosmetic:** component shows FY `start_date → end_date` (e.g. 1-Apr-26 to 31-Mar-27); Tally shows period up to last-entry/current date (1-Apr-26 to 2-Mar-27). Matches the existing group-summary behavior; treat as acceptable unless an exact match is required.
3. **Unused duplicate definition** (`definitions/inventory.ts:782`) — minor cleanup candidate, not a bug.
4. **Rate sign on negative closing:** `rate = closing_value / closing_qty`; when closing_qty is 0 rate is 0 (matches Tally blank). Confirm parenthesised-negative rendering for negative qty/value rows (the `fmtAmount`/`fmtQty` helpers already format en-IN; verify negatives display as Tally's "(-)" if exactness is demanded — currently standard minus).

## 5. DB schema
**None required.** `stock_categories` table, `stock_items.category_id`, `voucher_stock_entries`, `vouchers`, `units` all already exist in both sqlite and pg schemas. No reconcile column-add and no new `init()` needed.

## 6. Backend
**None required.** `stockSummaryReportService.stockCategoryItems`, `reportController.stockCategoryItems`, IPC `report:stockCategoryItems`, and preload `report.stockCategoryItems` all exist. Master `stockCategory:getAll` exists and is exposed as `stockCategory.getAll`.

(Optional) Add a unit test `/Users/darshan/Startup/server/tests/stockCategoryReport.test.js` mirroring `stockGroupReport.test.js`, asserting `stockCategoryItems` returns one row per item in the category with correct net closing and grand totals.

## 7. Frontend
**None required.** `StockCategorySummary.tsx` already composes `SelectionPopup` (Level 1) and renders the summary/monthly/vouchers tables with the strict black/white/zinc theme (`text-zinc-900`, `bg-[#f4f4f5]` header, `border-zinc-*`, no color), right-aligned numeric columns, bold top-bordered Grand Total — all per UI.md. Route and menu wiring present.

## 8. Step-by-step checklist (verification-first; this issue is a "complete/verify-existing")
1. Run the app; open `/reports/inventory-books` → click "Stock Category Summary". Confirm `SelectionPopup` "Select Stock Category" lists real categories via `stockCategory.getAll`.
2. Pick a category → confirm Stock Category Summary table renders real items (Particulars / Quantity+unit / Rate / Value) and a correct Grand Total (qty + value), values matching `stockCategoryItems` output.
3. Enter/double-click an item → confirm Stock Item Monthly Summary (Opening + 12 months, Inwards/Outwards/Closing, totals). Note: this screen has no bar chart in the category variant (group variant adds `StockBarChart`); add `StockBarChart` to the monthly level only if pixel-parity with img-04 is required (group component shows how at `StockGroupSummary.tsx` line 408).
4. Enter on a month → confirm Stock Item Vouchers (Date/Particulars/Vch Type/Vch No./Inwards/Outwards/Closing + "Totals as per 'Default' valuation :").
5. Enter on a voucher → confirm navigation to `/transactions/voucher/:id`.
6. Verify Escape/Backspace steps back one level at each stage and Escape at Level 1 leaves the report.
7. (Optional) Add `server/tests/stockCategoryReport.test.js` and run the server test suite.
8. (Optional) If parity demanded: align the period label and negative-number formatting with the screenshots, and/or add the monthly bar chart to the category variant.
9. Once confirmed working, per CLAUDE.md remove the #111 block from the project notes (no "done" marker — delete the text).

## 9. Validation & edge cases
- **Empty category:** items list empty → table shows "No records found.", Grand Total zero. Confirm popup still lists the category.
- **No categories at all:** popup shows "No stock categories found." with Create affordance → `/master/create/stock-category`.
- **Negative closing (returns > receipts):** screenshots show parenthesised negatives; verify `fmtQty`/`fmtAmount` render acceptably (standard minus vs Tally "(-)").
- **Item with no unit:** `unit_name` falls back to "" — qty shows number only.
- **Voucher filters:** cancelled / optional / post-dated excluded in the service — confirm a cancelled voucher does not affect closing.
- **Company/FY guards:** component no-ops if `companyId`/`fyId` missing (matches group sibling).
- **rate when closing_qty = 0:** service returns rate 0 → renders blank (matches Tally).
