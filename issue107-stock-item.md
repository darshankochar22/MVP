# Issue #107 — Inventory Books: Stock Item
## Complete Implementation Reference (from 45 screenshots)

---

## 1. Entry Point & Navigation Flow

```
Gateway of Tally
  → Display More Reports
    → Inventory Books
      → Stock Item          ← ENTRY POINT FOR THIS ISSUE
          ↓
      [Select Stock Item Dialog]
          ↓ (user picks an item or types name)
      Stock Item Monthly Summary     ← DEFAULT VIEW
          │
          ├─ Enter on any month row
          │       ↓
          │   Stock Item Vouchers (for that month only)
          │       ↓ Enter on a voucher row
          │   Accounting Voucher Alteration (full voucher read-only)
          │
          ├─ F2: Change Period
          ├─ F3: Switch Company
          ├─ F4: Change Stock Item (re-opens Select dialog)
          ├─ F7: Toggle Show Profit / Hide Profit (adds columns)
          ├─ B  → Basis of Values popup → Scale Factor picker
          ├─ Change View popup
          │       ├─ Daily → Daily view (rows = calendar days)
          │       ├─ Weekly
          │       ├─ Fortnightly
          │       ├─ 4 Week Month
          │       ├─ Monthly (default)
          │       ├─ Quarterly
          │       ├─ Half Yearly
          │       ├─ Stock Query → Stock Query screen
          │       ├─ Movement Analysis
          │       │       ↓ Enter on a party row
          │       │   Item Voucher Analysis (for that party)
          │       │       ↓ Enter on a voucher row
          │       │   Accounting Voucher Alteration
          │       ├─ Vouchers Details → Stock Item Vouchers (full period)
          │       │       ↓ Enter on a voucher row
          │       │   Accounting Voucher Alteration
          │       └─ Cost Analysis → Stock Item Cost Analysis
          ├─ Exception Reports popup
          └─ Save View dialog
```

---

## 2. Inventory Books Menu (Gateway)

**What the menu shows** (right-side panel from Gateway of Tally):
```
Gateway of Tally
Display Move Reports
Inventory Books          ← heading

SUMMARY
  Stock Item             ← this issue
  Batches
  Godowns / Excise Units
  Stock Group Summary
  Stock Category Summary

  Stock Transfer Journal Register
  Physical Stock Register

  Quit
```

Stock Item is highlighted (gold row) as the active selection.

---

## 3. Select Stock Item Dialog

**Trigger**: clicking/selecting "Stock Item" from the menu above.

**Structure** (small center popup, not full-screen):
```
┌──────────────────────────────────┐
│         [Company name]           │
│  Name of Item                    │
│  ┌──────────────────────────┐   │
│  │ [type-ahead search field] │   │
│  └──────────────────────────┘   │
│  List of Stock Items    [Create] │
│  ──────────────────────────────  │
│  5 Star                          │
│  Apple                           │
│  Banana                          │
│  Biscuits                        │
│  Butter                          │
│  ButterScotch                    │
│  Chocolate Icecream              │
│  Computers          ← selectable │
│  Dark Choco                      │
│  Dark Fantasy                    │
│  Dreamlite                       │
│  Fan                             │
│  GoodDay                         │
│  Jlio                            │
│  Ki                              │
│  Laptops                         │
│  Mobile                          │
│  Mouse                           │
│  Onion                           │
│  Part                            │
│  Pc                              │
│  Potato                          │
│  Shirt                           │
│  Vanilla Icecream                │
└──────────────────────────────────┘
  [Quit]              [Accept]
```

**Behaviour**:
- List is alphabetically sorted
- Typing filters the list in real time (prefix match)
- Highlighted row (gold) = keyboard cursor position
- "Create" button opens Stock Item Creation form (secondary, lighter form)
- Accept / Enter confirms selection and opens Monthly Summary

---

## 4. Stock Item Monthly Summary (Default View)

This is the primary report screen. Every other view is reached from here.

### 4a. Layout Zones (top to bottom)

```
┌─────────────────────────────────────────────────────────────────────┬──────────┐
│  PageTitleBar: "Stock Item Monthly Summary"     [Company: Moly Jam] │  Sidebar │
├─────────────────────────────────────────────────────────────────────┤          │
│  Sub-header: [Item Name]  [Company]  [Period: 1-Apr-26 to 2-Mar-27] │  (right  │
│                   Inwards        Outwards       Closing Balance      │  action  │
│  Particulars    Qty   Value    Qty   Value    Qty   Value            │  panel)  │
├─────────────────────────────────────────────────────────────────────┤          │
│  Opening Balance                             90 nos  27,00,000.00   │          │
│  April         100  30,00,000  10  50,00,000  90    27,00,000.00   │          │
│  May                                          90    27,00,000.00   │          │
│  ...                                                                │          │
│  January        -   -         20  10,00,000  70    21,00,000.00   │          │
│  ► February     -   -         15   7,50,000  55    16,50,000.00   │ (selected)│
│  March                                        55    16,50,000.00   │          │
├─────────────────────────────────────────────────────────────────────┤          │
│  Grand Total   100  30,00,000  45  67,50,000  55    16,50,000.00   │          │
├─────────────────────────────────────────────────────────────────────┤          │
│  [Bar chart: monthly qty bars, one per period]                      │          │
├─────────────────────────────────────────────────────────────────────┴──────────┤
│  Quit  │ Space: Select  │ Remove Line  │ Passive Line  │  F12: Configure       │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 4b. Table columns (default / no Show Profit)

| Column Group | Sub-columns |
|---|---|
| Particulars | (single col, left-aligned text) |
| Inwards | Quantity · Value |
| Outwards | Quantity · Value |
| Closing Balance | Quantity · Value |

Numbers: right-aligned. Quantities show unit label (e.g., "100 nos", "55 nos").

### 4c. Table columns (Show Profit ON — F7 toggle)

| Column Group | Sub-columns |
|---|---|
| Particulars | (single col) |
| Inwards | Quantity · Value |
| Outwards | Quantity · Value |
| Consumption | Value (COGS for that period) |
| Gross Profit | Value |
| Perc % | percentage |
| Closing Balance | Quantity · Value |

Example (Computers, April): Inwards 100 nos 30,00,000 | Outwards 10 nos 50,00,000 | Consumption 3,00,000 | Gross Profit 47,00,000 | 94.0% | Closing 90 nos 27,00,000.

### 4d. Table rows

- **Opening Balance** — first row. Shows qty/value on the Closing side only (pre-period closing stock).
- **Month rows** (April through March) — one per month. Empty qty/value means no movement that month; Closing propagates from prior row.
- **Grand Total** — last row, bold font, 1px border-top. Totals Inwards qty+value, Outwards qty+value, and final Closing.
- **Selected row** — highlighted (gold/amber background in Tally; in our theme: gray-100 bg + bold text).

### 4e. Bar chart (bottom of screen)

- One bar per period (month labels on x-axis)
- Bar height proportional to Inwards quantity (or closing qty — matches the tall bar for April when 100 units came in)
- Negative closing values show as downward bars (Apple example: negative stock shows negative bars)
- No colors — use filled vs outline bars or different bar widths in our theme

### 4f. Right sidebar actions

Listed top to bottom exactly as seen:

```
F2  Period
F3  Company
F4  Stock Item
F5  (empty)
F6  Monthly
F7  Show Profit    (toggles to "Hide Profit" when active)
F8  (empty)
F9  (empty)
F10 (empty)
─────────────────
    Basis of Values
    Change View
    Exception Reports
    Save View
─────────────────
    Apply Filter
    Filter Details
─────────────────
    New Column
    Alter Column
    Delete Column
    Auto Column
```

---

## 5. Change View Popup

Triggered by clicking "Change View" in the sidebar or keyboard shortcut.

**Small overlay popup** (not full-screen):
```
┌────────────────────────────────┐
│  Change View                   │
│  [search field]                │
│  List of Views        Show More│
│  ─────────────────────────────  │
│  Views                         │
│  ► Daily         ← highlighted │
│    Weekly                      │
│    Fortnightly                 │
│    Quarterly                   │
│    Half Yearly                 │
│                                │
│  Related Reports               │
│    Stock Query                 │
│    Movement Analysis           │
│    Vouchers Details            │
│  ──────────────────────────── │
│                    [Accept]    │
└────────────────────────────────┘
```

**After "Show More" is clicked**:
```
  Views
    Daily
    Weekly
    Fortnightly
    4 Week Month        ← only visible after Show More
    Monthly
    Quarterly
    Half Yearly

  Related Reports
    Stock Query
    Movement Analysis
    Vouchers Details
    Cost Analysis       ← only visible after Show More

  [Show Less]  [Show Inactive]
```

**Behaviour**:
- "Daily" selected → re-renders Monthly Summary as Daily view (rows = calendar days)
- "Stock Query" → navigates to Stock Query screen
- "Movement Analysis" → navigates to Item Movement Analysis
- "Vouchers Details" → navigates to Stock Item Vouchers (full period)
- "Cost Analysis" → navigates to Stock Item Cost Analysis

---

## 6. Daily View

Same layout as Monthly Summary. Only the row granularity changes.

- Rows: one per calendar day within the period (e.g., "31-Jan", "1-Feb", "2-Feb", …, "2-Mar")
- Days with no transactions: show same Closing Balance as the prior day (propagated)
- Days with transactions: show Inwards/Outwards quantities
- Bar chart x-axis: individual days (many thin bars; compress to dots if too many)
- The sidebar is identical to Monthly Summary

**Weekly / Fortnightly / Quarterly / Half Yearly**: same concept, just different period granularity for rows.

---

## 7. Stock Item Vouchers

Reached either by:
- **Drilling into a month row** (Enter on any month) → shows vouchers for that month only
- **Change View → Vouchers Details** → shows all vouchers for the full report period

### 7a. Layout

```
┌────────────────────────────────────────────────────────────────────────┬──────────┐
│  PageTitleBar: "Stock Item Vouchers"          [Company: Moly Jam]      │ Sidebar  │
├────────────────────────────────────────────────────────────────────────┤          │
│  Stock Item: Computers                1-Feb-27 to 28-Feb-27            │          │
│                                                                        │          │
│  Date  Particulars  Vch Type  Vch No  Inwards Qty  Val  Out Qty  Val  │ Closing  │
│  ──────────────────────────────────────────────────────────────────── │          │
│  1-Feb-27  Opening Balance                                  70 nos  21,00,000   │
│  2-Feb-27  Raha Traders  Sales  9           15 nos  7,50,000  55 nos  16,30,000 │
│                                                                        │          │
├────────────────────────────────────────────────────────────────────────┤          │
│  Totals as per 'Default' valuation:  70 nos  21,00,000 | 15 nos  7,50,000 | 55 nos 16,50,000 │
├────────────────────────────────────────────────────────────────────────┴──────────┤
│  Quit │ Enter: Alter │ Space: Select │ Add Vch │ Duplicate Vch │ Insert Vch │ Delete │ Cancel Vch │ Remove Line │ Passive Line │ F12 │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### 7b. Table columns

| Column | Alignment | Notes |
|---|---|---|
| Date | Left | dd-Mon-yy format |
| Particulars | Left | Party name, or "Opening Balance" |
| Vch Type | Left | Purchase / Sales / Debit Note / Credit Note etc. |
| Vch No | Right | voucher number |
| Inwards Quantity | Right | qty with unit |
| Inwards Value | Right | formatted |
| Outwards Quantity | Right | qty with unit |
| Outwards Value | Right | formatted |
| Closing Quantity | Right | running total |
| Closing Value | Right | running total |

### 7c. Special rows

- **Opening Balance row**: first row always. No Vch Type / No. Closing qty+value = stock at start of period.
- **Totals row**: "Totals as per 'Default' valuation" label. Shows total Inwards, total Outwards, final Closing.
- **Selected row**: highlighted.

### 7d. Right sidebar (Voucher screen specific)

```
F2  Period
F3  Company
F4  Stock Item
F5  (link back to Monthly if drilled in)
F6  Monthly
F7  Show Profit
─────────────────
    Basis of Values
    Change View
    Exception Reports
    Save View
─────────────────
    Apply Filter
    Filter Details
─────────────────
    Stock Alter     ← unique to this screen (alter stock item master)
```

### 7e. Voucher types seen in screenshots

- Purchase (inward, increases stock)
- Sales (outward, decreases stock)
- Debit Note (inward correction — shows as negative inward in Apple example; results in negative closing)

---

## 8. Accounting Voucher Alteration (Voucher Detail)

Reached by pressing Enter on any voucher row in Stock Item Vouchers.
This is an **existing screen** (shared with accounting module). Read-only from the stock item context.

### 8a. Sales Voucher example (Computers, Raha Traders, Feb 27)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  Accounting Voucher Alteration (Secondary)                   [Moly Jam]       │
│  Sales    No: 9                                              2-Feb-27 Tuesday  │
│                                                                                │
│  GST Registration: Tax Unit  Chhattisgarh Registration: Not Applicable        │
│                                                                                │
│  Party A/c name: Raha Traders                              Price Level:        │
│  Current balance: 13,51,300.00 Dr                                             │
│  Sales ledger:    Sales A/c                                                   │
│  Current balance: 73,26,000.00 Cr                                             │
│                                                                                │
│  Name of Item         Actual   Billed   Rate per    Disc%   Amount            │
│  Computers            15 nos   15 nos   50,000.00   nos     7,50,000.00       │
│                                                                                │
│  Provide GSTe-Way Bill details: No                                            │
│  Narration:                                                                   │
│  ──────────────────────────────────────────────────────────────────────────── │
│                               15 nos   15 nos               7,50,000.00       │
└────────────────────────────────────────────────────────────────────────────────┘
  [Quit] [Accept] [Delete] [Cancel Vch]
```

### 8b. Purchase Voucher example (Cash, April 26)

```
  Purchase   No: 9
  Supplier Invoice No: 402   Date: 1-Apr-26   Wednesday

  Party A/c name: Cash
  Purchase ledger: Purchase A/c

  Name of Item   Actual   Billed   Rate         Amount
  Computers      100 nos  100 nos  30,000.00    30,00,000.00
  Mouse           50 nos   50 nos     300.00        15,000.00

  Narration: purchase goods
  Total:     150 nos  150 nos      30,15,000.00
```

### 8c. Debit Note example (Apple, Raha Traders)

```
  Debit Note  No: 1
  Party A/c name: Raha Traders   Status: Excise
  Ledger account: Local Purchase

  Name of Item   Actual   Billed   Rate per   Amount
  Apple          50 nos   50 nos   10.00 nos  500.00

  Total:         50 nos   50 nos   500.00
```

### 8d. Right sidebar in Voucher Alteration

```
F2  Date
    Company/Tax Registration
F4  Contra
F5  Payment
F6  Receipt
F7  Journal
F8  Sales (or blank)
F9  Purchase
F10 Other Vouchers
─────────────────
    AutoFill
    Change Mode
    More Details
    Related Reports
─────────────────
    Optional
    Post-Dated
```

---

## 9. Stock Query

Reached via Change View → Stock Query.

### 9a. Layout — two-section card

**Top section (two halves side by side)**:

Left half — Item Properties:
```
Name               Computers
Group              MicroComputers
Closing Balance    55 nos
Category           Not Applicable
Closing value      16,50,000.00
Standard selling price   (blank)
Market valuation method  Avg. Price
Costing method           Avg. Cost
Standard cost            30,90.00/nos
```

Right half — Recent Transactions:
```
Last purchased on: 1-Apr-26 | Cash | 100 nos @ 30,000 | Amount 30,00,000.00

                     Purchases    100 nos  @  30,000  =  30,00,000.00

Last sold on: 2-Feb-27  Raha Traders   15 nos  7,50,000.00
              3-Jan-27  Bharat Suppliers  20 nos  10,00,000.00
              1-Apr-26  Cash  10 nos  5,00,000.00
```

**Bottom section — Godown/Batch Details**:
```
Batch              Quantity
─────────────────────────────
Main Location
  Primary Batch      55 nos
─────────────────────────────
Total                55 nos
```

**Bottom section — Items of Same Category**:
```
Item Name    Quantity    Cost    Sale Price
(empty if no other items in the same category)
```

### 9b. Right sidebar

```
F2  Period
F3  Company
F4  Stock Item
─────────────────
    Show Registers
─────────────────
    Basis of Values
    Change View
    Exception Reports
    Save View
```

Bottom: Enter: Display Vch | Space: Select | Remove Line | Passive Line

---

## 10. Item Movement Analysis

Reached via Change View → Movement Analysis.

### 10a. Layout

```
┌────────────────────────────────────────────────────────────┬──────────┐
│  PageTitleBar: "Item Movement Analysis"  [Moly Jam]        │ Sidebar  │
├────────────────────────────────────────────────────────────┤          │
│       Computers                                            │          │
│       Moly Jam                                             │          │
│       1-Apr-26 to 2-Mar-27   Movement Values               │          │
│                              Quantity    Value             │          │
│  Particulars                                               │          │
│                                                            │          │
│  Movement Inward:                                          │          │
│  Suppliers                                                 │          │
│    Cash                      100 nos   30,00,000.00        │          │
│    ─────────────────────────────────────────────────────   │          │
│    Total                     100 nos   30,00,000.00        │          │
│                                                            │          │
│  Movement Outward:                                         │          │
│  Buyers                                                    │          │
│    Bharat Suppliers           20 nos   10,00,000.00        │          │
│    Cash                       10 nos   50,00,000.00        │          │
│    Raha Traders               15 nos    7,50,000.00        │          │
│    ─────────────────────────────────────────────────────   │          │
│    Total                      45 nos   67,50,000.00        │          │
└────────────────────────────────────────────────────────────┴──────────┘
  Quit │ Space: Select │ Remove Line │ F12: Configure
```

### 10b. Drill from Movement Analysis → Item Voucher Analysis

Pressing Enter on any supplier or buyer row opens **Item Voucher Analysis** for that party.

---

## 11. Item Voucher Analysis

Reached by Enter on a party in Movement Analysis.

### 11a. Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│  "Item Voucher Analysis"                                 [Moly Jam]        │
│  Stock Item: Computers   Inwards/Under Ledger: Cash   1-Apr-26 to 2-Mar-27│
│                                                                            │
│  Date      Particulars   Actual Qty  Billed Qty  Basic Rate  Basic Value  Add Cost  Total Value  Eff. Rate │
│  ─────────────────────────────────────────────────────────────────────────│
│  Purchases                                                                 │
│  1-Apr-26  Cash  100 nos  100 nos  30,000.00 nos  30,00,000.00    30,00,000.00  30,000.00/nos  │
│  ─────────────────────────────────────────────────────────────────────────│
│  Total     100 nos  100 nos  30,000.00 nos  30,00,000.00    30,00,000.00  30,000.00/nos  │
└────────────────────────────────────────────────────────────────────────────┘
```

Expanded row (after pressing Enter on the Total row or a group row):
```
  1-Apr-26  Cash
    1-Apr-26  Purchase 8   100 nos  100 nos  30,000.00 nos  30,00,000.00  30,00,000.00  30,000.00/nos
```

### 11b. Columns

| Column | Notes |
|---|---|
| Date | Transaction date |
| Particulars | Party/voucher ref |
| Actual Qty | Qty as per actual |
| Billed Qty | Qty as per bill |
| Basic Rate | Rate per unit |
| Basic Value | Actual Qty × Rate |
| Add Cost | Additional costs (0 here) |
| Total Value | Basic Value + Add Cost |
| Eff. Rate | Total Value / Actual Qty |

---

## 12. Stock Item Cost Analysis

Reached via Change View → Cost Analysis.

### 12a. Layout

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  "Stock Item Cost Analysis"                                       [Moly Jam]     │
│       Computers · Moly Jam · 1-Apr-26 to 2-Mar-27                               │
│                                                                                  │
│  Particulars  │ A. Cost (Expense)       │ B. Revenue (Income)  │ C. Balance at Cost │ Profit/(Loss) │
│               │ Inward: Qty    Value    │ Outward: Qty  Value  │ Net: Qty  Value    │ Value   Rate  │
│  ─────────────────────────────────────────────────────────────────────────────── │
│  (rows by voucher type or period)                                                │
│  ─────────────────────────────────────────────────────────────────────────────── │
│  Grand Total  │                         │                      │                  │               │
└──────────────────────────────────────────────────────────────────────────────────┘
  Quit │ Space: Select │ Remove Line │ F12: Configure
```

The formula: **C = A - B** (balance at cost), **Profit = B.Value - A.Value**.

### 12b. Right sidebar unique item

- "Close Cost Track" — closes cost tracking mode

---

## 13. Basis of Values Popup (Scale Factor)

Triggered by sidebar "Basis of Values" or keyboard B.

**Two-step popup flow**:

Step 1:
```
┌──────────────────────────────┐
│  Basis of Values             │
│  List of Configurations      │
│  ────────────────────────    │
│  Scale Factor    Default     │  ← highlighted
└──────────────────────────────┘
  [Accept]
```

Step 2 (after selecting Scale Factor):
```
┌──────────────────────────────────────────────────┐
│  Report Details          List of Scale Factors   │
│  Scale Factor: [Default] ────────────────────    │
│                          New Number              │
│                          Crores                  │
│                        ► Default     ← selected  │
│                          Hundreds               │
│                          Lakhs                  │
│                          Millions               │
│                          Ten Lakhs              │
│                          Ten Millions           │
│                          Ten Thousands          │
│                          Thousands              │
└──────────────────────────────────────────────────┘
  [Accept]
```

---

## 14. Exception Reports Popup

Triggered by sidebar "Exception Reports".

```
┌──────────────────────────────────┐
│  Exception Reports               │
│  List of Exception Reports       │
│  ──────────────────────────────  │
│                    [Show More]   │
└──────────────────────────────────┘
  [Accept]
```

No standard exception reports were visible in the screenshots (list appeared empty for this item/period).

---

## 15. Save View Dialog

Triggered by sidebar "Save View".

**Basic form (Show additional configuration = No)**:
```
┌────────────────────────────────────────────────────┐
│  Save View                                         │
│                                                    │
│  Name: [Stock Item Monthly Summary - My View]      │
│  Set this as default view for the report:   No     │
│  Show additional configuration:             No     │
└────────────────────────────────────────────────────┘
  [Accept]
```

**Expanded form (Show additional configuration = Yes)**:
```
┌────────────────────────────────────────────────────────────────────┐
│  Save View                                                         │
│                                                                    │
│  Name: [Stock Item Monthly Summary - My View]                      │
│  Set this as default view for the report:          Yes             │
│  Show additional configuration:                    Yes             │
│  Save for:                     [All Companies ▼]                   │
│                                   All Companies - (On This Computer)│
│                                   This Company                     │
│  Save with the master selected to open the report: No              │
│  Save with the selected period:                    No              │
└────────────────────────────────────────────────────────────────────┘
  [Accept]
```

"Save for" options:
- All Companies - (On This Computer)
- This Company

---

## 16. Negative Stock Handling

Seen in the "Apple" item screenshots (imgs 16–19).

Apple had **Opening Balance of 20 nos, 200.00** then a **Debit Note of 50 nos returned** which exceeded the opening balance. Result: **negative closing stock** of -30 nos, -1,000.00.

Display rules for negative values:
- Show with parentheses: `(-) 30 nos` and `(-) 1,000.00`
- In our theme: use bold text (not red). Optionally add a thin left border on the row.
- The bar chart shows a downward/negative bar for April in the Apple view.

---

## 17. Data Layer Requirements

### 17a. Drizzle schema tables needed

```
stock_items
  id, name, alias, under_group_id, units, gst_applicability,
  hsn_sac, taxability_type, gst_rate, type_of_supply,
  category_id, standard_cost, market_valuation_method

stock_groups
  id, name, parent_id

stock_categories
  id, name

vouchers
  id, type (Purchase|Sales|DebitNote|CreditNote|...), number,
  date, party_ledger_id, company_id, narration, is_optional, is_post_dated

voucher_items
  id, voucher_id, stock_item_id, actual_qty, billed_qty,
  rate, discount_pct, amount, godown_id, batch_id

godowns
  id, name, parent_id, company_id

batches
  id, name, godown_id, stock_item_id
```

### 17b. IPC handlers to expose

| Handler | Arguments | Returns |
|---|---|---|
| `getStockItems` | `companyId` | `{ id, name, alias, group, units }[]` |
| `getStockItemMonthlySummary` | `itemId, from, to, companyId` | months array with inwards/outwards/closing |
| `getStockItemDailySummary` | `itemId, from, to, companyId` | days array |
| `getStockItemWeeklySummary` | `itemId, from, to, companyId` | weeks array |
| `getStockItemVouchers` | `itemId, from, to, companyId` | voucher rows + opening balance |
| `getStockQuery` | `itemId, companyId` | properties, recent purchases, recent sales, batches, category items |
| `getItemMovementAnalysis` | `itemId, from, to, companyId` | inward by supplier, outward by buyer |
| `getItemVoucherAnalysis` | `itemId, partyId, direction, from, to, companyId` | voucher rows grouped by type |
| `getStockItemCostAnalysis` | `itemId, from, to, companyId` | A/B/C/Profit columns |
| `getVoucherDetail` | `voucherId` | full voucher including all line items |

### 17c. Key SQL patterns

**Monthly summary** (SQLite):
```sql
SELECT
  strftime('%Y-%m', v.date) AS month,
  SUM(CASE WHEN v.type IN ('Purchase','CreditNote') THEN vi.actual_qty ELSE 0 END) AS inward_qty,
  SUM(CASE WHEN v.type IN ('Purchase','CreditNote') THEN vi.amount ELSE 0 END) AS inward_val,
  SUM(CASE WHEN v.type IN ('Sales','DebitNote') THEN vi.actual_qty ELSE 0 END) AS outward_qty,
  SUM(CASE WHEN v.type IN ('Sales','DebitNote') THEN vi.amount ELSE 0 END) AS outward_val
FROM voucher_items vi
JOIN vouchers v ON v.id = vi.voucher_id
WHERE vi.stock_item_id = ? AND v.date BETWEEN ? AND ? AND v.company_id = ?
GROUP BY strftime('%Y-%m', v.date)
ORDER BY v.date;
```

**Opening balance** (before period start):
```sql
SELECT
  SUM(CASE WHEN v.type IN ('Purchase','CreditNote') THEN vi.actual_qty ELSE -vi.actual_qty END) AS opening_qty,
  SUM(CASE WHEN v.type IN ('Purchase','CreditNote') THEN vi.amount ELSE -vi.amount END) AS opening_val
FROM voucher_items vi
JOIN vouchers v ON v.id = vi.voucher_id
WHERE vi.stock_item_id = ? AND v.date < ? AND v.company_id = ?;
```

**Closing balance per row** = running cumulative sum of (opening + inwards - outwards).

**Show Profit — Consumption (COGS)**:
```
Consumption per period = outward_qty × average_cost_at_time_of_sale
Average cost (avg method) = total_value_in_stock / total_qty_in_stock at time of transaction
Gross Profit = outward_value - consumption
Perc % = (gross_profit / outward_value) × 100
```

**Movement Analysis** (inward by supplier):
```sql
SELECT l.name AS party, SUM(vi.actual_qty) AS qty, SUM(vi.amount) AS val
FROM voucher_items vi
JOIN vouchers v ON v.id = vi.voucher_id
JOIN ledgers l ON l.id = v.party_ledger_id
WHERE vi.stock_item_id = ? AND v.type IN ('Purchase','CreditNote') AND v.date BETWEEN ? AND ?
GROUP BY v.party_ledger_id;
```

---

## 18. Frontend Component Map

```
StockItemReport/
  index.tsx               ← top-level: holds selected item, period, view state
  SelectStockItemDialog   ← search + list popup (reuse/extend existing SelectionPopup pattern)
  StockItemMonthlySummary ← default view
    ReportHeaderBand      ← item name / company / period sub-header
    StockItemTable        ← table with period rows (reuses DataTable)
    StockBarChart         ← bar chart at bottom (new; lightweight canvas/svg)
    ReportSidebar         ← right sidebar with all action keys
  StockItemVouchers       ← voucher drill-down screen
    StockItemTable        ← same table component, different columns
    ReportSidebar
  StockQuery/             ← stock query screen
  MovementAnalysis/       ← movement analysis screen
    ItemVoucherAnalysis   ← sub-screen (drill into party)
  CostAnalysis/           ← cost analysis screen
  ChangeViewPopup         ← dropdown overlay (Views + Related Reports)
  BasisOfValuesPopup      ← scale factor picker
  ExceptionReportsPopup   ← (mostly empty, Show More)
  SaveViewDialog          ← save view form
```

All top-level screens open inside the existing `FullScreenPanel` component.

---

## 19. State Management

The report has internal state that drives which sub-view is shown:

```typescript
type StockItemView =
  | { type: 'monthly' }
  | { type: 'daily' }
  | { type: 'weekly' }
  | { type: 'fortnightly' }
  | { type: '4weekmonth' }
  | { type: 'quarterly' }
  | { type: 'halfyearly' }
  | { type: 'stockQuery' }
  | { type: 'movementAnalysis' }
  | { type: 'itemVoucherAnalysis'; partyId: string; direction: 'inward' | 'outward' }
  | { type: 'vouchersDetail' }
  | { type: 'costAnalysis' }
  | { type: 'vouchers'; from: string; to: string }  // from drill on monthly row

interface StockItemReportState {
  itemId: string | null        // null = show selection dialog
  from: string                 // period start
  to: string                   // period end
  view: StockItemView
  showProfit: boolean          // F7 toggle
  scaleFactor: ScaleFactor     // from Basis of Values
  selectedRow: number | null   // keyboard cursor row
}
```

---

## 20. Implementation Order

1. **IPC**: `getStockItems` + `getStockItemMonthlySummary` + `getStockItemVouchers` + `getVoucherDetail`
2. **UI**: SelectStockItemDialog → StockItemMonthlySummary → StockItemVouchers → Voucher drill (read-only)
3. **F7 Show Profit**: extend monthly query with COGS calculation
4. **Change View — Daily**: `getStockItemDailySummary` + DailyView component
5. **Change View — Vouchers Details**: same StockItemVouchers component, full period
6. **Change View — Stock Query**: `getStockQuery` + StockQuery component
7. **Change View — Movement Analysis**: `getItemMovementAnalysis` + `getItemVoucherAnalysis`
8. **Change View — Cost Analysis**: `getStockItemCostAnalysis` + CostAnalysis component
9. **Basis of Values popup** (scale factor — cosmetic, affects number display)
10. **Save View dialog** (saves named view config — can be persisted in localStorage or DB)
11. **Bar chart** at bottom of summary screens
12. **Weekly / Fortnightly / Quarterly / Half Yearly** view variants (same query with different GROUP BY)

---

## 21. Edge Cases to Handle

- **Negative stock** (Apple example): closing qty goes negative when outwards exceed inwards + opening. Display as `(-) 30 nos` and bold/left-border the row. Value also goes negative.
- **No transactions in a month**: row still appears with propagated Closing from previous month (all months always shown April through March).
- **Opening Balance row**: always present as first row; may have 0/0 for a brand-new item.
- **Debit Note as inward correction**: appears in vouchers as negative inward, reducing closing stock.
- **Multiple items in one voucher**: Voucher Alteration shows all items; Stock Item Vouchers shows only the qty/value for the specific item being viewed.
- **Grand Total**: sum of all inwards and outwards (not average); Closing in Grand Total = final closing stock.

---

## Image Reference Map

| Image | Screen | Key Detail |
|---|---|---|
| img_01 | Gateway → Inventory Books menu | Menu structure, Stock Item entry point |
| img_02 | Select Stock Item dialog | Full item list (25 items), search field layout |
| img_03 | Stock Item Creation (Secondary) | Creation form fields, statutory details |
| img_04 | Gateway with different company | Shows multiple companies in the list |
| img_05 | Select Stock Item dialog | Same as img_02, different timestamp |
| img_06 | Select Stock Item, "Computers" highlighted | Shows keyboard selection |
| img_07 | Stock Item Monthly Summary — Computers | Default view, March selected, bar chart |
| img_08 | Stock Item Vouchers — Feb only | Feb drill, Raha Traders Sales, voucher columns |
| img_09 | Voucher Alteration — Sales No.9 | Line items, qty/rate/amount format |
| img_10 | Monthly Summary — April selected | April highlighted |
| img_11 | Stock Item Vouchers — April only | Purchase + Sales in April |
| img_12 | Voucher Alteration — Purchase No.9 | Multiple items (Computers + Mouse) |
| img_13 | Stock Item Vouchers — April (both rows visible) | Two transactions in April |
| img_14 | Voucher Alteration — Sales No.7 | Three items (Computers + Mouse + Fan) |
| img_15 | Select dialog — "Banana" typed | Type-ahead search in action |
| img_16 | Monthly Summary — Apple | Negative stock example, negative closing |
| img_17 | Monthly Summary — Apple, April selected | April highlighted in Apple view |
| img_18 | Stock Item Vouchers — Apple, April | Debit Note voucher (negative inward) |
| img_19 | Voucher Alteration — Debit Note No.1 | Debit Note form: Status Excise, Local Purchase |
| img_20 | Monthly Summary — Computers, Feb selected | February highlighted |
| img_21 | Monthly Summary — Show Profit ON | Extra cols: Consumption, Gross Profit, Perc% |
| img_22 | Monthly Summary — Show Profit, Feb selected | Same but Feb highlighted |
| img_23 | Basis of Values popup — step 1 | "Scale Factor / Default" list |
| img_24 | Scale Factor picker | Full dropdown: Crores, Lakhs, Millions etc. |
| img_25 | Monthly Summary — Show Profit, Feb | Same state |
| img_26 | Change View popup — compact | Daily/Weekly/Fortnightly/Quarterly/HalfYearly + Related Reports |
| img_27 | Change View popup — expanded (Show More) | 4 Week Month + Cost Analysis visible |
| img_28 | Change View popup — Daily highlighted | Keyboard cursor on Daily |
| img_29 | Daily View — Computers | Day-by-day rows (31-Jan through 2-Mar), 2-Mar highlighted |
| img_30 | Change View popup — Stock Query highlighted | Stock Query in Related Reports |
| img_31 | Stock Query screen | Properties + recent transactions + Godown/Batch + Category Items |
| img_32 | Change View popup — Movement Analysis highlighted | Movement Analysis in Related Reports |
| img_33 | Item Movement Analysis | Inward by Supplier / Outward by Buyer sections |
| img_34 | Item Voucher Analysis (Cash, collapsed) | Total row only visible |
| img_35 | Item Voucher Analysis (Cash, expanded) | Purchase No.8 row expanded |
| img_36 | Change View — Vouchers Details highlighted | Vouchers Details in Related Reports |
| img_37 | Stock Item Vouchers — full period | All 4 vouchers: Purchase + 3 Sales |
| img_38 | Voucher Alteration — Purchase No.9 (again) | Same as img_12 |
| img_39 | Change View — Cost Analysis highlighted | Cost Analysis + Show Less visible |
| img_40 | Stock Item Cost Analysis | A/B/C/Profit column layout (empty data) |
| img_41 | Daily View — Computers (same as img_29) | Confirms daily view layout |
| img_42 | Exception Reports popup | Empty list + Show More button |
| img_43 | Daily View — Computers (same again) | Confirms state persistence |
| img_44 | Save View dialog — basic | Name field + default No options |
| img_45 | Save View dialog — expanded | Save for dropdown: All Companies / This Company |
