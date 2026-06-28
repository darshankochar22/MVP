# Issue #89 — Fund Flow (implementation spec)

Entry: Gateway → Display More Reports → **Fund Flow**. Route `/reports/accounts/funds-flow` → dedicated page `client/src/pages/reports/accounts/FundsFlowStatement.tsx` (NOT the ReportRunner layout path).
Reference: 8 TallyPrime EDU screenshots (company "Moly Jain").

## What the screenshots show
1. **Fund Flow (default, monthly)** — table: `Particulars (month) | Working Capital [Opening | Closing] | Funds Flow`, one row per month (Apr…Mar), Grand Total, monthly bar chart. Funds Flow = the net change in working capital that month.
2. **Funds Flow Summary** (drill a month) — two-column T: `Sources | Applications`, plus a working-capital reconciliation footer: `Current Assets / Current Liabilities / Working Capital` each with `Opening Balance | Closing Balance | Wkg Cap Increase`. Columns balance via a "Net Increase/Decrease in Working Capital" balancing row.
3. **Profit & Loss A/c** (drill "Nett Loss") — issue #87.
4. Stock chain (drill Current Assets → … → Stock Summary → Group → Item Monthly → Vouchers) — already exists (#107–110).

## Funds-flow model (the correctness fix)
Working Capital = **Current Assets − Current Liabilities** (current = the `Current Assets` / `Current Liabilities` group subtrees). Sources/Applications come ONLY from **non-current** items + operations; current items are the working capital being reconciled, never listed as sources/applications.

For a period `(from, to]`, per ledger compute opening balance (entries `< from`) and closing (entries `<= to`), classify by walking the group tree to its root:
- under **Current Assets** subtree → CA · under **Current Liabilities** subtree → CL
- root nature Assets → non-current asset · Liabilities → non-current liability · Income / Expenses → operations

Then:
- `Funds from operations` = period income − period expenses → **Nett Profit** (source) or **Nett Loss** (application; drills to P&L).
- Non-current **asset** increase → application, decrease → source. Non-current **liability** increase → source, decrease → application.
- `Working Capital Opening/Closing` = CA − CL at each boundary; `workingCapitalChange = WC_close − WC_open`.
- Identity (balanced books): `workingCapitalChange === totalSources − totalApplications`. The balancing column row is "Net Increase/Decrease in Working Capital".

Note: CA/CL are computed from **ledger balances** (consistent with our Balance Sheet, which likewise excludes the inventory-engine stock valuation). Numbers won't match Tally's sample (which folds in Stock-in-Hand) but are internally consistent with this app.

## Gaps fixed over the prior code
**Before:** `fundsFlowReportService` listed *current* assets/liabilities in sources/applications and returned no CA/CL/WC breakdown; the page computed the footer client-side using **FY‑start** `opening_balance` for every month and dumped the whole WC change onto CA *or* CL — wrong for any non‑first month and not matching the screenshots.

| Layer | File | Change |
|---|---|---|
| Service | `server/report/fundsFlowReportService.js` | classify ledgers via group tree; exclude current items from sources/applications; label Nett Profit/Loss; return CA/CL/WC opening·closing·change + group ids |
| Page | `client/src/pages/reports/accounts/FundsFlowStatement.tsx` | monthly view uses server `workingCapital{Opening,Closing,Change}` per month (no client WC math); detail footer + balancing row use server fields; drop ledger/group fetch + `isCurrentGroup` |
| Test | `server/tests/fundsFlowReport.test.js` | seed non-current + current + P&L movements; assert WC reconciliation + sources/applications identity |

IPC unchanged: `report:fundsFlow(company_id, fy_id, from_date, to_date)` (preload + controller already wired).

## Drill chain
month → Funds Flow Summary → { Nett Profit/Loss → P&L (#87); Current Assets/Liabilities → Group Summary; source/application ledger line → Ledger Monthly Summary }.

## Verification (3-check)
- **DB**: standard group tree present (Current Assets/Liabilities subtrees, Fixed Assets/Capital/Loans non-current). ✔
- **Backend/IPC**: `report:fundsFlow` returns sources/applications + WC reconciliation. ✔
- **Frontend**: monthly table + Funds Flow Summary + WC footer render from real API, full-screen `TallyReportLayout`, drill to P&L/Group/Ledger. ✔
