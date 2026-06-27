# Issue #108 — Inventory Books: Batch
## Complete Implementation Reference (from 44 screenshots)

> Source: GitHub issue `darshankochar22/MVP#108` — "Inventory Books - Batch".
> 4 images in the issue body (the report skeleton) + 40 images in the comment (the
> full data-entry → report lifecycle). All 44 analysed one by one below.
> This file documents **structure and flow only** — not colours/skin (theme rules live in `UI.md`).

---

## 0. What "Batch" is

A **Batch** (a.k.a. Batch / Lot) is a sub-division of a stock item used to track a
specific lot of goods through its life — with an optional **Manufacturing Date** and
**Expiry Date**. One stock item can hold many batches. Every inward/outward movement of
that item is pinned to a specific batch, so stock can be reported **per batch**, not just
per item.

The Batch report (this issue) is the *viewer* for that data: pick an item → pick one of its
batches → see every voucher that touched that batch, with running closing balance.

Two halves to understand:
- **Producer side (masters + vouchers)** — how batches come into existence (images 5–32).
  This is context: the report only has data because items are "maintained in batches" and
  vouchers allocate quantities to batch numbers.
- **Consumer side (the report itself)** — Gateway → Inventory Books → Batch (images 1–4, 33–44).
  This is the deliverable for issue #108.

---

## 1. Entry Point & Navigation Flow

```
Gateway of Tally
  → Display More Reports
    → Inventory Books
      → Batch                         ← ENTRY POINT FOR THIS ISSUE
          ↓
      [Batch Items dialog — pick Name of Item]   (Level 1)
          ↓ pick item from "List of Items"
      [Batch Items dialog — pick Name of Batch]  (Level 2)
          ↓ pick batch from "List of Batches" (shows Name | Mfg Date | Expiry Date)
      Batch Vouchers report                       (Level 3 — DEFAULT VIEW)
          │   (one row per voucher that touched item+batch;
          │    Inwards / Outwards / running Closing columns)
          │
          └─ Enter on any voucher row
                 ↓
             Accounting Voucher Alteration (full voucher, read/alter)
```

The Inventory Books submenu (images 1, 33) contains, in order:
- **SUMMARY:** Stock Item · **Batch** · Godowns / Excise Units · Stock Group Summary · Stock Category Summary
- **REGISTERS:** BTrack Transfer Journal Register · Physical Stock Register
- Quit

"Batch" is the second item under SUMMARY.

---

## 2. The three-layer drill chain (the core of this report)

| Layer | Screen | Rows are | Enter drills to |
|-------|--------|----------|-----------------|
| 1 | **Batch Items** — "Name of Item" | stock items that maintain batches | sets the item, advances to Layer 2 |
| 2 | **Batch Items** — "Name of Batch" | batches belonging to chosen item | opens Batch Vouchers (Layer 3) |
| 3 | **Batch Vouchers** | each voucher affecting item+batch | Accounting Voucher Alteration |

Layers 1 and 2 are the **same dialog** ("Batch Items"), two fields filled in sequence;
each field has its own right-hand selection list popup.

---

## 3. Per-image breakdown (all 44)

### Part A — The report skeleton (issue body, images 1–4)

**img_01 — Gateway → Inventory Books → Batch menu**
Gateway of Tally. Right-side popup "Gateway of Tally / Display More Reports / Inventory Books".
Submenu open; **Batch** highlighted under SUMMARY. This is the entry click.

**img_02 — Batch Items dialog, "Name of Item" field**
Centered dialog titled with company name. Two fields: **Name of Item** (active, empty) and
**Name of Batch** (empty). Right panel **"List of Items"** with a Create row + items
(Dark Choco, GoodDay, Jhu). User picks the item here. *(Note: this early list is the test
company's batch-capable items; before any batch data exists it is short.)*

**img_03 — Batch Items dialog, "Name of Batch" field**
Name of Item now = **Dark Choco**. Cursor on **Name of Batch**. Right panel **"List of Batches"**
(header "Name") showing **Primary Batch**. An item with no explicit batches still exposes a
default **"Primary Batch"**.

**img_04 — Batch Vouchers report (empty)**
Header block: `Stock Item: Dark Choco` · `Batch Name: Primary Batch`, period `1-Mar-27 to 31-Mar-27`
top-right. Column groups: **Date | Particulars | Vch Type | Vch No. | Inwards (Quantity, Value) |
Outwards (Quantity, Value) | Closing (Quantity, Value)**. Body empty (no txns for this batch).
Footer: `Totals as per 'Default' valuation :`. Right button rail: F2 Period, F3 Company, F4 Batch,
F6 Monthly, F7 Show Profit, F8 Batch-wise, Basis of Values, Change View, Exception Reports, Save View,
Apply Filter, Filter Details, Stock Alter. Bottom action bar: Quit, Enter:Alter, Space:Select,
A:Add Vch, 2:Duplicate Vch, I:Insert Vch, D:Delete, X:Cancel Vch, R:Remove Line, U:Restore Line, F12:Configure.
**This is the target layout of the report.**

### Part B — Producer side: master setup (images 5–10)

**img_05 — Stock Item Creation, top**
Creating item **Paracetamol**. Fields: Name, (alias), Under: Primary, Units: (empty),
Statutory Details (GST applicability, HSN/SAC, GST Rate, Type of Supply: Goods, Set/Alter other
Statutory details: No). Opening Balance row (Quantity | Rate | per | Value) at the bottom.

**img_06 — Units picker**
Units field active → "Units" popup list: Create, Not Applicable, Box, nos, P, Pc (Pieces).

**img_07 — Unit Creation (Secondary)**
Sub-screen: Type: Simple, Symbol: box, Formal name, UQC: Not Applicable, Number of decimal places: 0.

**img_08 — "Maintain in batches: Yes" (the trigger)**
Back in Stock Item Creation with Units = Box. A new **Additional Details** block appears:
**Maintain in batches: yes** · Set components (BOM): No · Enable cost tracking: No.
Setting **Maintain in batches = Yes is what makes an item appear in the Batch report.**

**img_09 — Batch sub-options appear (Mfg date)**
With Maintain in batches = Yes, two extra toggles appear: **Track date of manufacturing: Yes** ·
Use expiry dates: No.

**img_10 — Batch sub-options (Expiry)**
**Use expiry dates: Yes** as well. So Paracetamol now tracks: batches + mfg date + expiry date.

### Part C — Producer side: inward (Purchase) voucher allocating batches (images 11–25)

**img_11 — Purchase voucher, item entry**
Accounting Voucher Creation, **Purchase No. 11**, Party A/c name: Mohan, Date 1-Apr-26,
Purchase ledger: Purchase. Name of Item being typed ("Para") → "List of Stock Items" popup
with Paracetamol. Columns: Quantity (Actual | Billed) etc.

**img_12 — Stock Item Allocations popup (empty)**
After picking the item, a sub-popup **"Item Allocations for: Paracetamol"** opens.
Columns: **Batch/Lot No. | Mfg Dt. | Expiry Date | Quantity (Actual | Billed) | Rate | per | Disc % | Amount**.
A nested **"List of Active Batches"** (Name | Expiry | Balance) offers **New Number** (create a batch).

**img_13 — New Number popup**
Typing a new batch/lot number: **PL-10123**.

**img_14 — First batch allocation filled**
Row: `PL-10123` · Mfg Dt `Apr-2026` · Expiry (blank) · Actual 10 Box · Billed 10 Box · Rate 750.00 ·
per Box · Amount 7,500.00. Footer total 10 Box / 10 Box / 7,500.00.

**img_15 / img_16 / img_17 — Expiry entered as a period**
Expiry Date field accepts a duration: **"2 years"** (img_15), **"2 Month"** (img_16),
**"2 Days"** (img_17). Tally converts a typed period into an actual date.

**img_18 — Expiry resolves to a date**
Expiry Date for PL-10123 now shows the computed date **2-May-27**.

**img_19 / img_20 — Adding a second batch line**
A second allocation row opens; "List of Active Batches" popup again offers New Number / End of List.

**img_21 — Second New Number**
Typing batch **PL-12345**.

**img_22 — Two batch allocations**
Two rows for Paracetamol:
- `PL-10123` · Apr-2026 · 2-May-27 · 10 Box / 10 Box · 750.00 · 7,500.00
- `PL-12345` · Apr-2026 · 2-Jun-27 · 10 Box / 10 Box · 750.00 · 7,500.00
Footer total **20 Box / 20 Box / 15,000.00**.

**img_23 — Second row expiry editing** (Jun-27 being set).

**img_24 — Voucher line reflects the batch total**
Back on the Purchase voucher: Paracetamol line = 20 Box / 20 Box · 750.00 · 15,000.00
(the sum of the two batch allocations).

**img_25 — Bill-wise Details**
Purchase bill-wise popup for Mohan: New Ref `DL-101`, Amount 15,000.00 Cr. (Completes the purchase;
tangential to the batch report itself but explains the data.)

### Part D — Producer side: outward (Sales) voucher consuming batches (images 26–32)

**img_26 — Sales voucher, item entry**
Accounting Voucher Creation, **Sales No. 12**, Party: Kamal, Sales ledger: Sales A/c.
Name of Item: Paracetamol. "List of Stock Items" shows Paracetamol with on-hand **20 Box**.

**img_27 — Stock Item Allocations, pick an existing batch**
"Item Allocations for: Paracetamol" → "List of Active Batches" now lists the real batches with
**balances**: New Number · `PL-10123` Exp 2-May-27 Bal 10 Box · `PL-12345` Exp 2-Jun-27 Bal 10 Box.
On outward, you consume from existing batches.

**img_28 — Sell 5 Box from PL-10123**
Row: `PL-10123` · Apr-2026 · 2-May-27 · Actual 5 Box · Billed 5 Box · Rate 1,050.00 · 5,250.00.

**img_29 — (same, mfg-date cell focus)**

**img_30 — Add second consumption line**
"List of Active Batches" again (PL-10123 / PL-12345 each Bal 10 Box — balances shown are pre-voucher).

**img_31 — Two consumption rows**
- `PL-10123` · 2-May-27 · 5 Box / 5 Box · 1,050.00 · 5,250.00
- `PL-12345` · 2-Jun-27 · 10 Box / 10 Box · 1,050.00 · 10,500.00
Footer total **15 Box / 15 Box / 15,750.00**.

**img_32 — Sales line reflects batch total**
Sales voucher line: Paracetamol 15 Box / 15 Box · 1,050.00 · 15,750.00. Price Level: Not Applicable.

### Part E — Consumer side: the Batch report with real data (images 33–44)

**img_33 — Re-enter Gateway → Inventory Books → Batch**
Same menu as img_01, now on a later working date.

**img_34 — Batch Items, item list now includes Paracetamol**
"List of Items": Cream, Dark Choco, GoodDay, Jhu, **Paracetamol** (now present because it has batches).

**img_35 — List of Batches for Paracetamol (with dates)**
Name of Item = Paracetamol. Right panel **"List of Batches"** now has 3 columns:
**Name | Mfg Date | Expiry Date**:
- `PL-10123` · 1-Apr-26 · 2-May-27
- `PL-12345` · 1-Apr-26 · 2-Jun-27
**Key:** at this level the batch list shows Mfg Date and Expiry Date — not just names.

**img_36 — Batch Vouchers for PL-10123 (populated)**
Header: `Stock Item: Paracetamol` · `Batch Name: PL-10123` · **`Mfg Date: 1-Apr-26` `Expiry Date: 2-May-27`**.
Period 1-Mar-27 to 31-Mar-27. Rows:
- `1-Apr-26 · Mohan · Purchase · 11 · Inwards 10 Box / 7,500.00 · Closing 10 Box / 7,500.00`
- `1-Apr-26 · Kamal · Sales · 12 · Outwards 5 Box / 5,250.00 · Closing 5 Box / 3,750.00`
Totals: Inwards 10 Box / 7,500.00 · Outwards 5 Box / 5,250.00 · Closing 5 Box / 3,750.00.
**Closing is a running balance** (inwards − outwards, cumulative).

**img_37 — Drill into the Purchase row → Voucher Alteration**
Enter on the Purchase row opens **Accounting Voucher Alteration (Secondary)** for Purchase No. 11.
Shows the *whole* voucher (Paracetamol 20 Box / 15,000.00 — both batches), not just this batch's slice.

**img_38 — Batch Vouchers, Sales row selected** (same report as img_36, Kamal/Sales row highlighted).

**img_39 — Drill into the Sales row → Voucher Alteration**
Accounting Voucher Alteration for Sales No. 12 (Kamal): Paracetamol 15 Box / 15,750.00.

**img_40 — Re-pick batch, choose PL-12345**
Batch Items dialog, Name of Item = Paracetamol, "List of Batches" with **PL-12345 highlighted**.

**img_41 — Batch Vouchers for PL-12345**
Header `Batch Name: PL-12345` · Mfg 1-Apr-26 · Expiry 2-Jun-27. Rows:
- `1-Apr-26 · Mohan · Purchase · 11 · Inwards 10 Box / 7,500.00 · Closing 10 Box`
- `1-Apr-26 · Kamal · Sales · 12 · Outwards 10 Box / 10,500.00 · Closing 0 Box`
Totals: Inwards 10 Box / 7,500.00 · Outwards 10 Box / 10,500.00 · **Closing 0 Box** (fully consumed).

**img_42 — Drill Purchase row (PL-12345) → Voucher Alteration** (Purchase 11, same full voucher).

**img_43 — Batch Vouchers PL-12345, Sales row selected.**

**img_44 — Drill Sales row (PL-12345) → Voucher Alteration** (Sales 12, Paracetamol 15 Box / 15,750.00).

---

## 4. Data model — how each number is derived

**Layer 1 list (Name of Item):** distinct stock items that have at least one batch allocation
(items with `Maintain in batches = Yes` that have been transacted). An item with no explicit
batch still exposes **"Primary Batch"** (img_03).

**Layer 2 list (Name of Batch):** distinct batches for the chosen item, each with its
**Mfg Date** and **Expiry Date** (img_35). Source = the batch's first inward allocation.

**Layer 3 (Batch Vouchers):** one row per voucher touching (item, batch), within the period.
- **Inwards** (Qty, Value) when voucher type is an inward (Purchase, etc.).
- **Outwards** (Qty, Value) when outward (Sales, etc.).
- **Value** = Σ(qty × batch rate) for that voucher's lines in this batch.
- **Closing** = running cumulative (Σ inwards − Σ outwards) in both Qty and Value.
- **Totals row** = column sums (closing total = final running balance).
- Excludes cancelled / optional / post-dated vouchers.

**Header (Layer 3):** Stock Item, Batch Name, the batch's Mfg Date + Expiry Date, period.

**Drill (Layer 3 → voucher):** Enter opens the full Accounting Voucher Alteration for that
`voucher_id` — the entire voucher (all batches/items), read/alter mode.

---

## 5a. IMPLEMENTED (this change) ✅

The full screenshot flow is now built and covered by `server/tests/batchReport.test.js` (5 tests):

**Schema** — `voucher_batches` gained a `mfg_date` column (sqlite + pg schema, runtime
CREATE + ALTER in `server/voucher/voucher.js`).

**Persistence** — `server/voucher/voucherService.js` now writes `mfg_date` and accepts a
**multi-batch array** (`item.batches[]`) per stock line, not just one batch.

**Report services** (`server/report/stockSummaryReportService.js`):
- `batchItems(company_id)` — Level-1 list, only batch-maintaining items (NEW handler).
- `batchesForItem` — now returns `[{ name, mfg_date, expiry_date }]` (was names only).
- `batchVouchers` — closing stock valued at **weighted-average cost** (matches img_36: 5 Box → 3,750).
- `batchBalances(company_id, item_id)` — on-hand qty per batch for the allocation popup (NEW handler).
- Wired through `reportController.js`, `server/index.js`, `preload.js`.

**Report UI** (`client/src/pages/reports/inventory/BatchVouchers.tsx` + `SelectionPopup.tsx`):
- Level-1 uses `report.batchItems`; Level-2 list shows **Name | Mfg Date | Expiry Date**
  (SelectionPopup extended with optional `columns`); Level-3 header shows Mfg/Expiry; Enter drills
  to the voucher (`/transactions/voucher/:id`).

**Producer voucher popup** (`client/src/pages/transactions/components/popups/BatchAllocationPopup.tsx`):
the Stock Item Allocations sub-screen (img 12–23). Opens on rate-Enter for a batch-tracked item in
Sales/Purchase/Notes; splits the line across batches; "List of Active Batches" (name/expiry/balance)
+ New Number; mfg date; **expiry-as-period** parsing ("2 years" → date). Wired via the `batch`
variant of `ActiveAllocation` in `Vouchers.tsx`; emits `batches[]` in `useVoucherForm.ts`.

**Master flags** (Maintain in batches / Track mfg / Use expiry, img 08–10) already existed in
`stock_items` (`track_batches`, `track_date_of_manufacturing`, `track_expiry`) + StockItemCreate.

> Not done (out of scope, low risk): mapping an **existing** voucher's saved batches back into the
> edit form rows (re-editing a batch voucher starts the allocation fresh). Creation + report + drill
> all work end-to-end.

---

## 5. Implementation — original gap analysis (for reference)

> Verify each of the three layers (DB / IPC / Frontend) per `CLAUDE.md` before coding.

### Already present
- **Frontend:** `client/src/pages/reports/inventory/BatchVouchers.tsx` — a 3-level component
  (`step: "item" | "batch" | "vouchers"`) using shared `SelectionPopup`. Routed at
  `/reports/inventory/batch-vouchers` (`client/src/routes.tsx:277`).
- **IPC (`preload.js`):**
  - `report:batchesForItem(company_id, item_id)` → `preload.js:152`
  - `report:batchVouchers(company_id, fy_id, item_id, batch, from_date, to_date)` → `preload.js:153`
- **Backend handlers:** registered in `server/index.js:184-185`; implemented in
  `server/report/stockSummaryReportService.js` (`batchesForItem` ~L230, `batchVouchers` ~L253),
  thin wrappers in `server/report/reportController.js:122-127`.
  - `batchVouchers` already computes Inwards/Outwards split + running Closing and excludes
    cancelled/optional/post-dated. **This matches img_36/img_41.**
- **Schema:** `voucher_batches` table in `server/voucher/voucher.js:67` with
  `batch_number, expiry_date, quantity, rate` (+ links to voucher/stock_entry).
- **Masters flag:** `enableBatches` / `maintainExpiryDateForBatches` exist
  (`server/tallyFeatures/*`, seeds).

### Gaps to close (screenshot features not yet supported)
1. **Manufacturing Date is not stored.** `voucher_batches` has `expiry_date` but **no
   `manufacturing_date`** column, yet img_35/img_36/img_41 show Mfg Date prominently.
   → Add `manufacturing_date TEXT` to `voucher_batches` (via the same `ALTER TABLE … ADD COLUMN`
   pattern already used in `voucher.js`). Persist it from the allocation entry.
2. **`batchesForItem` returns only names** (`{ batches: string[] }`). The Layer-2 list needs
   **Name + Mfg Date + Expiry Date** (img_35).
   → Change it to return `{ batches: [{ name, mfg_date, expiry_date }] }` (earliest inward per batch).
3. **Batch Vouchers header lacks Mfg/Expiry.** img_36/img_41 show them next to Batch Name.
   → Have `batchVouchers` (or the Layer-2 selection) carry mfg/expiry into the header, and render it.
4. **Layer-1 item list must be filtered to batch-maintained items only** (img_34 shows just those).
   → Confirm the item picker source excludes non-batch items; if it lists all items, filter to
   those with ≥1 `voucher_batches` row (or `enableBatches = 1`).
5. **Verify the report opens via the full-screen panel pattern** (per `CLAUDE.md`), header shows
   period (F2), and Enter on a row drills to the existing Voucher Alteration route (img_37/39/42/44).
6. **Producer-side parity (only if in scope):** stock-item master must expose
   *Maintain in batches → Track date of manufacturing / Use expiry dates* (img_08–10), and
   voucher entry must show the **Stock Item Allocations** sub-screen with New Number + period→date
   expiry parsing (img_12–23). Much of this may already exist on the voucher side — verify before building.

### Build order (recommended)
1. Schema: add `manufacturing_date` to `voucher_batches`.
2. Service: extend `batchesForItem` (return dates) and ensure `batchVouchers` header carries mfg/expiry.
3. IPC: signatures already fit; only the return shapes change — no new channels needed.
4. Frontend `BatchVouchers.tsx`: Layer-2 popup shows Name | Mfg Date | Expiry Date; Layer-3 header
   shows Mfg/Expiry; confirm drill + full-screen panel + period filter.
5. Verify against img_35 (batch list), img_36/41 (vouchers + closing), img_37/39 (drill).

---

## 6. One-line summary
Batch report = **Item → Batch (with Mfg/Expiry) → Batch Vouchers (Inwards/Outwards/running Closing) →
Voucher Alteration**. Backend + a 3-level frontend already exist; the missing pieces are
**manufacturing-date storage** and **surfacing Mfg/Expiry dates** in the batch list and report header.
