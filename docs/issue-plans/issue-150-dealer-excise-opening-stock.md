# Issue #150 — Dealer Excise Opening Stock

## 1. Title & entry point
- **Feature:** Dealer Excise Opening Stock — a Purchase-style inventory voucher used to record the opening stock a registered excise *dealer* is carrying, valued item-by-item, attributed to a supplier party. It is a one-off "opening" document (status = `Excise Opening Stock`, dated `1-Apr-<FY>`), not a recurring transaction.
- **Entry point (TallyPrime):** Gateway of Tally → Create (List of Masters) → **Statutory Details** group → **Dealer Excise Opening Stock**. (See img-00: it sits in the Statutory Details list alongside CENVAT Opening Balance, PLA Opening Balance, Excise Opening Balance, PAN/CIN Details, etc.)
- **Entry point (this app):** `Create` master menu page (`/master/create`) → Statutory Details section → "Dealer Excise Opening Stock" → navigates to a new route `/master/create/dealer-excise-opening-stock`.

## 2. TallyPrime reference (exact, screen by screen)

### Screen A — Master menu (img-00)
The "List of Masters" popup under **Statutory Details** contains, in order:
`Company GST Details, TDS Details, TCS Details, VAT Registration Details, Excise Registration Details, Service Tax Details, CENVAT Opening Balance, PLA Opening Balance, PAN/CIN Details, **Dealer Excise Opening Stock**, Excise Opening Balance`.
This issue implements only **Dealer Excise Opening Stock** (the highlighted row).

### Screen B — "Dealer Excise Opening Stock Creation" main voucher (img-01, blank → img-07/img-08 filled)
Header / title bar text: **"Dealer Excise Opening Stock Creation"**. Top-right: **As on  1-Apr-26** (the opening date; reflects active FY start). Voucher class label top-left: **Purchase   No. 12** (voucher type = Purchase, auto voucher number).

Field block (left column):
- **Supplier Invoice No.** : `____`  (text)
- **Party A/c name** : `____`  (ledger selector; img-04 shows the "List of Ledger Accounts" popup; selected = `Bharat Suppliers`)
- **Purchase ledger** : `____`  (ledger selector; selected = `Goods Purchase`)
- **Current balance** : shows party's running balance after selection, e.g. `5,26,490.00 Dr` (read-only, computed)
- **Name of Item** : section label for the item grid below

Right column (read-only context, mirrors Purchase voucher):
- **GST Registration** : `Chhattisgarh Registration`
- **Tax Unit** : `♦ Not Applicable`
- **Status** : `Excise Opening Stock`  (fixed literal — this is the marker that classifies the voucher)

Item grid columns (header row, two-line like Purchase voucher — img-07/08):
- **Name of Item** (left aligned, text)
- **Quantity** → split into **Actual** | **Billed** sub-columns
- **Rate** (right aligned)
- **per** (unit symbol, e.g. `nos`)
- **Disc %**
- **Amount** (right aligned, = qty × rate − disc)

Footer of grid: column totals row — total Actual qty, total Billed qty, and total **Amount** (e.g. `2 nos   2 nos   …   90,000.00`), and a grand-total amount line (`90,000.00`).
Bottom: **Narration:** free text.

### Screen C — Stock item selection popup (img-04)
Triggered when focusing "Name of Item". Title: **List of Stock Items**. Rows show item name + current closing balance (e.g. `Chocolate Icecream 10 nos`, `Computers 55 nos`, `Ms Office 1 nos`, `Vanilla Icecream 5 Box`, …) with **End of List** / **Create** affordances. Selecting `Ms Office` puts it on the row.

### Screen D — Party ledger selection popup (img-03 left "List of Ledger Accounts" + img-03 "Party Details" sub-panel)
Two parts:
1. **List of Ledger Accounts** (right side): ABC Customers, ABC Electronics, Abc Pvt Ltd, Aman Electronics, **Bharat Suppliers**, Durg Branch, … + **Create / New Party**. Side note: *Fetch Details Using GSTIN/UIN*.
2. After selecting, **Party Details** panel (centered popup) — read-only/edit fields:
   - **Supplier (Bill from)** : `Bharat Suppliers`
   - **Address Type** : `♦ Primary`
   - **Mailing Name** : `Bharat Suppliers`
   - **Address** : (blank)
   - **State** : `Chhattisgarh`
   - **Country** : `India`
   - **GST Registration type** : `Regular`
   - **GSTIN/UIN** : (blank)
   - **Place of Supply** : `Chhattisgarh`
   - Footer: **Accept**.

### Screen E — Receipt Details popup (img-02)
Title: **Receipt Details**. Fields:
- **Receipt Note No(s)** : `____`
- **Receipt Doc No.** : `____`
- **Dispatched through** : `____`
- **Destination** : `____`
- **Carrier Name/Agent** : `____`
- **Bill of Lading/LR-RR No.** : `____`   **Date:** `____`
- **Motor Vehicle No.** : `____`
- Footer: **Accept**.

### Screen F — Stock Item (Godown) Allocations popup (img-05 blank → img-06 filled)
Title: **Item Allocations for  <Item>** (e.g. `Ms Office`). Columns:
- **Godown** (e.g. `Burari`)
- **Quantity** → **Actual** | **Billed** (e.g. `2 nos` | `2 nos`)
- **Rate** (e.g. `45,000.00`)
- **per** (`nos`)
- **Disc %**
- **Amount** (e.g. `90,000.00`)
Footer total row: `2 nos   2 nos   90,000.00`. This is the per-item godown split; it opens after qty/rate entry on a stock row that has multiple godowns (or always, matching Tally).

### Computed values / totals
- Row **Amount** = Billed Qty × Rate − Disc%.
- Grid **column totals** (Actual, Billed, Amount).
- **Current balance** of the Party A/c after posting (running Dr/Cr).
- Voucher number auto-assigned (No. 12 in screenshots).

### Drill chain
Linear data-entry flow (no report drill): main voucher → (focus item) Stock Item popup → (focus party) Ledger list + Party Details popup → Receipt Details popup → (per item) Item/Godown Allocations popup → back to main grid → Accept (save).

## 3. Current state in codebase

| Concern | Path | State |
|---|---|---|
| Menu entry "Dealer Excise Opening Stock" | `server/master/masterService.js` (Statutory Details items, line 29) | **MISSING** — list lacks it (also lacks CENVAT/PLA/Excise Opening Balance, out of scope here). |
| Create-menu route mapping | `client/src/pages/menu/Create.tsx` `getRoute` map (lines 30-72) | **MISSING** — no key for this item (falls to "unavailable/greyed" branch). |
| Client route | `client/src/routes/masterRoutes.tsx` | **MISSING** — no `/master/create/dealer-excise-opening-stock`. |
| Frontend component | `client/src/pages/...` | **MISSING** — no Dealer Excise screen exists (grep for "Excise Opening Stock"/"DealerExcise" returns nothing). |
| Voucher persistence (header + stock + party + receipt + status) | `server/voucher/voucherCRUD.js` | **EXISTS / REAL.** `create()` inserts into `vouchers` (incl. `status`, `supplier_invoice_no`, `party_ledger_id`, `party_name`), `voucher_stock_entries` (item/godown/qty/rate/amount/disc), `voucher_receipt_details`, `voucher_party_details`. Lines ~138-330. |
| Voucher schema tables | `server/db/schema/sqlite/voucher.js` (+ pg mirror) | **EXISTS / REAL.** `vouchers`, `voucher_stock_entries`, `voucher_party_details`, `voucher_receipt_details` all present with every field the screenshots need. |
| IPC `voucher:create` etc. | `preload.js` lines 152-165 (`window.api.voucher.*`) + voucher controller/handlers wired in `server/index.js` | **EXISTS / REAL.** `voucher.create(data)`, `voucher.getNextNumber`, `voucher.searchLedgers`, `voucher.getLedgerBalance`, `voucher.getById`, `voucher.update`. |
| Stock item list IPC | `preload.js` `window.api.stockItem.getAll` / `getStockBalances` (lines 134-142) | **EXISTS / REAL.** Supplies the "List of Stock Items" popup with balances. |
| Ledger list + balance IPC | `preload.js` `window.api.ledger.getAll` (line 53), `voucher.getLedgerBalance` (163), `voucher.searchLedgers` (164) | **EXISTS / REAL.** Supplies party ledger list + Current balance. |
| Godown list IPC | `window.api` godown getAll (godown handlers registered) | **EXISTS / REAL.** For Item/Godown Allocations popup. |
| Reference voucher-entry UI (layout twin) | `client/src/pages/transactions/vouchers/PurchaseVoucher.tsx` | **EXISTS / REAL.** Renders the exact Supplier Invoice No / Party A/c name / Purchase ledger / item grid (Name of Item, Actual/Billed, Rate, per, Disc %, Amount, subtotal, grand total). This is the visual/interaction model to clone. |
| Reference entry popups | `client/src/pages/transactions/components/popups/` (`BatchAllocationPopup.tsx`, `InlineMasterPopup.tsx`), `InventoryParticularsTable.tsx`, `LedgerPanel.tsx`, `FieldRow.tsx` | **EXISTS / REAL.** Receipt-details, party-details, item-allocation, ledger-list popups already exist in the Vouchers entry system. |
| Shared UI primitives | `client/src/components/ui/` (`PageTitleBar`, `FormRow`, `RightActionPanel`, `MasterFormFooter`, `SideSelectionPanel`, `SearchInput`, `Input`, `DataTable`, `MasterSelectionPanel`) | **EXISTS / REAL.** Use these for chrome. |

**Net:** The entire backend (schema + service + IPC) already supports this voucher with **zero changes**. The only gaps are the **menu wiring** and a **frontend entry screen** + **route**.

## 4. Gap analysis (precise)
1. `masterService.js` Statutory Details list does not include `"Dealer Excise Opening Stock"`.
2. `Create.tsx` `getRoute` map has no entry → menu item renders greyed/disabled.
3. No route `/master/create/dealer-excise-opening-stock` in `masterRoutes.tsx`.
4. No frontend component for the screen.
5. (Optional) `voucher.getById` returns `party_details` & `receipt_details` but there is currently no Alter/COA list specifically scoped to "Excise Opening Stock" vouchers. Tally treats this as a master under Statutory Details; **Create-only is sufficient for this issue** (the screenshots are all Creation frames). Alter/list is out of scope unless required.

**No DB work, no new service, no new IPC channel is required** — reuse `window.api.voucher.create` with `voucher_type: "Purchase"`, `status: "Excise Opening Stock"`, `is_invoice: 1`, `is_inventory_voucher: 1`.

## 5. DB schema
**None.** All needed tables/columns already exist:
- `vouchers` (`status`, `supplier_invoice_no`, `party_ledger_id`, `party_name`, `place_of_supply`, `is_invoice`, `is_inventory_voucher`).
- `voucher_stock_entries` (`stock_item_id`, `item_name`, `godown_id`, `unit_id`, `quantity`, `rate`, `amount`, `discount_amount`).
- `voucher_party_details` (`supplier_name`, `mailing_name`, `address`, `state`, `country`).
- `voucher_receipt_details` (`receipt_note_no`, `receipt_doc_no`, `dispatched_through`, `destination`, `carrier_name`, `bill_of_lading_no`, `bill_of_lading_date`, `motor_vehicle_no`).

No `reconcile.js` column-add and no new `init()` table are needed. (If, later, a separate persisted "is this a Dealer Excise opening doc" flag beyond `status` is wanted, that would be a single column add to `vouchers` handled by `reconcile.js` — **not needed now**, the `status` string is the discriminator.)

## 6. Backend
**No backend changes required** beyond the menu string. Reuse existing:
- Save: `window.api.voucher.create(data)` → `server/voucher/voucherCRUD.js` `create()`.
- Next voucher no.: `window.api.voucher.getNextNumber(company_id, fy_id, "Purchase")`.
- Party ledger list: `window.api.ledger.getAll(company_id)` (or `voucher.searchLedgers`).
- Party running balance: `window.api.voucher.getLedgerBalance(ledger_id, company_id, fy_id)`.
- Stock items + balances: `window.api.stockItem.getStockBalances(company_id)`.
- Godowns: existing godown `getAll`.

**Save payload shape** (matches `create()`):
```
{
  company_id, fy_id,
  voucher_type: "Purchase",
  status: "Excise Opening Stock",
  date: <FY start, "YYYY-04-01">,
  supplier_invoice_no, narration,
  party_ledger_id, party_name, place_of_supply,
  is_invoice: 1, is_inventory_voucher: 1, is_accounting_voucher: 1,
  stock_entries: [ { stock_item_id, item_name, godown_id, unit_id, quantity, rate, discount_amount } ],
  entries: [ /* Dr Purchase ledger, Cr Party — double-entry, must balance */ ],
  party_details: { supplier_name, mailing_name, address, state, country },
  receipt_details: { receipt_note_no, receipt_doc_no, dispatched_through, destination,
                     carrier_name, bill_of_lading_no, bill_of_lading_date, motor_vehicle_no }
}
```
Note: `create()` calls `validateDoubleEntry(data.entries)` only when `is_accounting_voucher && entries.length>0`. Either pass a balanced Dr/Cr pair (Purchase ledger Dr = total amount, Party Cr = total amount) **or** omit `entries` to skip the check. For a faithful opening voucher, pass the balanced pair.

(Only if a dedicated alter list is later required: add `voucher:getByStatus` — **not in this issue**.)

## 7. Frontend
Create a self-contained Create screen (Create-only, no Alter/COA per scope). Reuse the Purchase-voucher layout and shared chrome — **do not duplicate the whole Vouchers.tsx engine**; build a focused screen.

**New component (single file):**
`client/src/pages/master/statutory-details/DealerExciseOpeningStock/DealerExciseOpeningStockCreate.tsx`

Structure (compose, theme-strict black/white/zinc — no color):
- `<PageTitleBar title="Dealer Excise Opening Stock Creation" subtitle="As on 1-Apr-<FY>" />` (from `components/ui`).
- Header field block using `FormRow`/`Input`:
  - **Supplier Invoice No.** (text input)
  - **Party A/c name** (ledger picker — reuse `SideSelectionPanel`/`MasterSelectionPanel` populated from `ledger.getAll`; on select show **Current balance** via `voucher.getLedgerBalance`; open the **Party Details** popup mirroring img-03 fields, prefilled from the chosen ledger).
  - **Purchase ledger** (ledger picker, default `Goods Purchase`).
- Right-side read-only context strip (use `RightActionPanel` or a plain column): **GST Registration**, **Tax Unit** (`Not Applicable`), **Status** (`Excise Opening Stock`, fixed).
- Item grid: clone the markup from `client/src/pages/transactions/vouchers/PurchaseVoucher.tsx` (lines 370-545) — header **Name of Item / Quantity(Actual|Billed) / Rate / per / Disc % / Amount**, body rows, subtotal + grand-total. Item selector uses `stockItem.getStockBalances`. On qty/rate entry, open the **Item Allocations** (godown) popup (img-05/06) — reuse the allocation-popup pattern from `client/src/pages/transactions/components/popups/` (model after `BatchAllocationPopup.tsx`; columns Godown / Actual / Billed / Rate / per / Disc % / Amount, with total row).
- **Receipt Details** popup (img-02) — a `Modal`/popup with the 8 fields listed in Screen E; reuse `components/ui/Modal.tsx` + `Input`.
- **Narration** textarea at the bottom.
- Footer: `MasterFormFooter` with **Accept** (saves via `voucher.create`) and a cancel/back action.

**Reuse, do not reinvent:** ledger-selection + party-details + receipt-details + item-allocation popups already exist inside `client/src/pages/transactions/components/popups/` and `LedgerPanel.tsx`/`FieldRow.tsx`. Prefer importing/adapting those over new markup. Theme tokens only (`zinc-900` title bar, black/white/zinc; numbers right-aligned, text left-aligned, totals = bold + top border, per CLAUDE.md UI guide).

**Route (add to `client/src/routes/masterRoutes.tsx`):**
```
import DealerExciseOpeningStockCreate from "../pages/master/statutory-details/DealerExciseOpeningStock/DealerExciseOpeningStockCreate.tsx";
...
{ path: "/master/create/dealer-excise-opening-stock", element: <DealerExciseOpeningStockCreate /> },
```
(Place near the other Statutory Details routes, ~line 309.)

**Create-menu mapping (`client/src/pages/menu/Create.tsx`):** add to `getRoute` map:
```
"Dealer Excise Opening Stock": "/master/create/dealer-excise-opening-stock",
```

**Menu list (`server/master/masterService.js`):** add `"Dealer Excise Opening Stock"` to the Statutory Details `items` array (line 29), positioned after `"PAN / CIN Details"` (matching Tally order in img-00; place per existing ordering).

## 8. Step-by-step checklist (file-precise, ordered)
1. `server/master/masterService.js` line 29 — add `"Dealer Excise Opening Stock"` to the Statutory Details `items` array.
2. `client/src/pages/menu/Create.tsx` `getRoute` map (after line 61 `"PAN / CIN Details"`) — add `"Dealer Excise Opening Stock": "/master/create/dealer-excise-opening-stock",`.
3. Create file `client/src/pages/master/statutory-details/DealerExciseOpeningStock/DealerExciseOpeningStockCreate.tsx`:
   - Pull `selectedCompany`/`fy` from `CompanyContext`.
   - On mount: `voucher.getNextNumber(company_id, fy_id, "Purchase")`, `stockItem.getStockBalances(company_id)`, `ledger.getAll(company_id)`, godown `getAll`.
   - Render `PageTitleBar` ("Dealer Excise Opening Stock Creation", subtitle "As on 1-Apr-<FY>").
   - Header fields: Supplier Invoice No., Party A/c name (ledger picker → Party Details popup + Current balance via `voucher.getLedgerBalance`), Purchase ledger (default `Goods Purchase`).
   - Right strip: GST Registration, Tax Unit "Not Applicable", Status "Excise Opening Stock" (read-only).
   - Item grid cloned from `PurchaseVoucher.tsx` (Name of Item / Actual|Billed / Rate / per / Disc % / Amount + subtotal + grand total); item picker from stock balances; Item/Godown Allocations popup on row.
   - Receipt Details popup (8 fields).
   - Narration textarea.
   - `MasterFormFooter` Accept → build payload (§6) → `window.api.voucher.create(payload)` → on success navigate back to `/master/create`.
4. `client/src/routes/masterRoutes.tsx` — add the import (near line 117-123) and the route object (near line 309) for `/master/create/dealer-excise-opening-stock`.
5. Verify `window.api.voucher.create` is reachable (already in `preload.js` line 153) — no preload edit needed.
6. Manual run: Gateway → Create → Statutory Details → Dealer Excise Opening Stock → enter Supplier Invoice No., pick Bharat Suppliers (Party Details + Current balance show), pick Goods Purchase, add item Ms Office 2 nos @ 45,000 (Amount 90,000), set godown via Item Allocations, fill Receipt Details, Accept → confirm a `vouchers` row with `status='Excise Opening Stock'`, `voucher_type='Purchase'`, plus `voucher_stock_entries` / `voucher_party_details` / `voucher_receipt_details` rows.

## 9. Validation & edge cases
- **Date:** force `date` = FY start (`<startYear>-04-01`) to match Tally's "As on 1-Apr-…"; do not let user pick arbitrary date for an opening doc.
- **Double-entry:** if passing `entries`, Dr Purchase ledger total must equal Cr Party total or `create()` returns `"Debit and Credit amounts must be equal"`; otherwise omit `entries`. Use Billed-qty × Rate − Disc for the amount basis.
- **Amount math:** `create()` server-side recomputes `amount = quantity * rate` for stock lines (ignores any client `amount`); ensure `discount_amount` is sent separately. Client display total should mirror this.
- **Empty grid:** block Accept if no stock rows / total = 0.
- **Party balance display:** read-only; refresh after party selection via `voucher.getLedgerBalance`.
- **Godown allocation:** if only one godown exists, default-allocate full qty (skip popup) like Tally; if multiple, the sum of godown Actual/Billed must equal the row qty.
- **Theme:** strict black/white/zinc only — totals bold + top border, numbers right-aligned, no color, `zinc-900` title bar (PageTitleBar) only; bottom footers/headers stay white per project memory.
- **Out of scope (do not build now):** Alter/COA list for these vouchers; the sibling Statutory Details rows CENVAT Opening Balance / PLA Opening Balance / Excise Opening Balance (separate issues).
