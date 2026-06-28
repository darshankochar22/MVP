# Issue #152 — Company GST Details

## 1. Title & entry point
- **Feature:** Company GST Details — the "GST Rate and Other Details" singleton config dialog (one row per company).
- **Menu path:** Gateway of Tally → **Create** (or **Alter**) → Statutory Masters group → **Company GST Details**.
  - In code: `Create.tsx` / `Alter.tsx` map the menu item `"Company GST Details"` to route type `"modal"` and open `CompanyGSTDetailsModal`.
  - Menu list source: `server/master/masterService.js` getMenu → Statutory group `items: ["Company GST Details", ...]`.
- It opens as a centered dialog overlay (TallyPrime sub-dialog style), NOT a `FullScreenPanel`. This matches Tally's actual behaviour for this screen (it is itself a sub-dialog launched from inside Company GST config).

## 2. TallyPrime reference (exhaustive, from the 24 screenshots)

Single dialog titled **"GST Rate and Other Details"**, two columns. Tally renders a yellow active-cell highlight and a right-side "List of …" dropdown panel for the focused field.

### Left column
**Section: HSN/SAC & Related Details**
- `HSN/SAC Details` — dropdown, default `Not Defined`. List of Actions options: **Not Defined**, **Specify Details Here**, **Use GST Classification**, **Specify in Voucher** (img-00, img-01 show the "List of Actions" popup).
- `HSN/SAC` — text input (shown/enabled only when type = Specify Details Here).
- `Description` — text input (shown/enabled only when type = Specify Details Here).

**Section: GST Rate & Related Details**
- `GST Rate Details` — dropdown, default `Not Defined`. Options: **Not Defined**, **Specify Details Here**, **Specify Slab-Based Rates**, **Use GST Classification**, **Specify in Voucher** (img-01 "List of Actions" with Specify Slab-Based Rates).
- `Taxability Type` — dropdown (`Taxable`/`Exempt`/`Nil Rated`), shown when Specify Details Here.
- `GST Rate` — `8 %` numeric input (shown when Taxable).

### Right column
**Section: e-Way Bill Details**
- `Interstate Threshold Limit` — numeric, default **50,000** (img-02, img-03 editing to `Yes`… actually limit value 50,000).
- `Set State-wise Threshold Limit` — Yes/No. Appears in place of Intrastate limit when company HAS GST registrations. Setting `Yes` (img-03) opens the **Intrastate Threshold Limit for e-Way Bill** popup (img-04–img-09):
  - Two-column grid: **State** | **Limit**.
  - State cell opens a right-side **List of States** popup (img-04, img-08): Any, Andaman & Nicobar Islands, Andhra Pradesh, Arunachal Pradesh, Assam, Bihar, Chandigarh, Chhattisgarh, Dadra & Nagar Haveli and Daman & Diu, Delhi, Goa, Gujarat, Haryana, Himachal Pradesh, Jammu & Kashmir, Jharkhand, Karnataka, Kerala, Ladakh, Lakshadweep, Madhya Pradesh, Maharashtra, Manipur, Meghalaya, Mizoram, Nagaland, Odisha, Puducherry, Punjab, Rajasthan, Sikkim, Tamil Nadu, Telangana, Tripura, Uttarakhand, Uttar Pradesh, West Bengal. List terminates with **End of List** (img-08).
  - Each row: pick state, type a limit (e.g. Andaman & Nicobar Islands 50,000; Andhra Pradesh 5,78,888 in img-06/07). Multiple rows accumulate; final blank row → "End of List".
- `Intrastate Threshold Limit` — numeric (shown instead of state-wise when NO registrations exist).
- `Threshold Limit includes` — dropdown. "List of values" (img-09): **Value of Invoice**, **Value of Taxable & Exempt Goods**, **Value of Taxable Goods**.

**Section: Additional Configuration**
- `Create HSN/SAC summary for` — dropdown, default `All Sections`. "Types of Sections" (img-10): **None**, **All Sections**, **All Sections Except B2C**.
- `Minimum length of HSN/SAC` (sub-label *(based on annual turnover)*) — dropdown, default `4`. "List of Options" (img-11): **4**, **6**, **8**. Hidden/disabled when summary = None.
- `Show GST Advances for adjustments in transaction` — Yes/No (img-12 = Yes). Setting Yes reveals:
  - `Applicable from` — date (img-13 shows an Information popup *"You can provide any Unadjusted Advances by selecting GST Reports → GST Utilities → GST Advances - Opening Balance."*; img-14 value `1-Apr-26`). Sub-label *(Enter a Date after the period when you have reported your liabilities in Returns using Journal Vouchers)*.
- `Update GST Status of Vouchers after Master Alteration` (sub-label *(Set this to No, to update from GST Reports)*) — Yes/No, default Yes (img-14, img-15).
- `Set/Alter details for downloading GST Returns` — Yes/No (img-16 = Yes). Setting Yes opens **Download Settings** popup (img-17–img-23):
  - `GST Registration` — dropdown opening **GST Registrations** popup with columns **Registration Name** | **GSTIN/UIN**. Options seen: All Registrations, Chhattisgarh Registration, Gujarat Registration, Hg Registration, Kj Registration, Punjab Registration, Rajasthan Registration (img-17). Multiple registrations can be selected (img-18 shows Chhattisgarh + Gujarat).
  - `Return Type` — dropdown. **Types of Return** (img-18–img-23): **All Returns**, **GSTR-1**, **GSTR-2A**, **GSTR-2B**, **GSTR-3B**. Multiple can accumulate, list ends with **End of List**.

### Footer
- Action bar: **Q: Quit**, **A: Accept**. On Accept, Tally shows the **GST Details applicable from** date prompt (effective date, default `1-Apr-26`) then an **Accept? Yes/No** confirmation.

### Drill / popup chain summary
Main dialog → (per field) right-side list popup → 3 nested overlay popups: **State-wise Threshold Limit** (with State list), **Download Settings** (with GST Registrations list + Return Type list), **Effective Date prompt** → **Accept? prompt**. Plus **Slab-Based Rate Details** overlay and **GST Classification creation** secondary modal.

## 3. Current state in codebase — FULLY IMPLEMENTED (real, not mocked)

This feature already exists end-to-end and matches every screenshot. Concrete files:

**Schema (real):**
- `server/db/schema/sqlite/companyGstDetails.js` — table `company_gst_details`, PK `company_id` FK→companies, all 20+ columns incl. `state_wise_limits` (JSON TEXT), `download_gst_registration`, `download_return_type`, `gst_advances_applicable_from`, `effective_date`, `set_state_wise_threshold_limit`.
- `server/db/schema/pg/companyGstDetails.js` — pg mirror.
- Both registered in `server/db/schema/{sqlite,pg}/index.js`.

**Table init / migration (real):**
- `server/companyGstDetails/companyGstDetails.js` — `init()` creates the table and ALTERs in the newer columns (effective_date, download_*, set_state_wise_threshold_limit, state_wise_limits, gst_advances_applicable_from). Invoked in `server/db/index.js:99`.

**Service (real):**
- `server/companyGstDetails/companyGstDetailsService.js` — `get(company_id)` (returns defaults when no row) and `save(data)` (upsert). Handles state_wise_limits JSON round-trip.

**Controller + audit (real):**
- `server/companyGstDetails/companyGstDetailsController.js` — `get`/`save` with audit-trail recording.

**IPC (real):**
- `server/ipc/registerStatutoryHandlers.js:67-68` — `companyGstDetails:get`, `companyGstDetails:save`.
- `preload.js:452-454` — `window.api.companyGstDetails.{get,save}`.
- Also consumed: `window.api.gstClassification.getAll`, `window.api.gstRegistration.getAll` (both already exist).

**Frontend (real, calls real handlers — no mock data):**
- `client/src/pages/master/statutory/company-gst-details/CompanyGSTDetailsModal.tsx` — orchestrator (keyboard nav, dropdown panel, all overlays).
- `components/GSTDetailsFormFields.tsx` — two-column field layout, all fields + conditional reveals.
- `components/GSTDetailsListPanel.tsx` — right-side list popup.
- `components/StateWiseThresholdLimitModal.tsx` — Intrastate Threshold Limit popup with State list.
- `components/DownloadSettingsModal.tsx` — Download Settings (GST Registration + Return Type).
- `components/GSTEffectiveDatePrompt.tsx` — effective-date prompt.
- `components/GSTDetailsAcceptPrompt.tsx` — Accept? Yes/No.
- `components/SlabBasedRateDetails.tsx`, `components/GSTClassificationSecondaryModal.tsx`.
- `config/dropdownConfig.ts` — all dropdown option lists (verified to match screenshots exactly).
- `hooks/useGSTDetails.ts` — load/save state.
- `client/src/types/entities/CompanyGSTDetails.ts` — type.
- Menu wiring: `client/src/pages/menu/Create.tsx` & `Alter.tsx` (`"Company GST Details": "modal"`).
- `server/tests/companyGstDetails.test.js` exists.

**No `masterRoutes.tsx` route is needed** — this is a `"modal"` opened directly from Create/Alter, not a routed page.

## 4. Gap analysis

Functionally the issue is **complete** — every screen, field, dropdown option, popup and the Accept/effective-date flow is implemented against real IPC + DB. The remaining defects are **theme violations** (UI.md: strict black/white/zinc, no colour, no shadows/blur/rounded/gradients):

1. `CompanyGSTDetailsModal.tsx` — error banner uses `border-red-200 bg-red-50 text-red-700`; success banner uses `border-green-200 bg-green-50 text-green-700`. **Colour is forbidden.** Convert to zinc + weight/border emphasis.
2. `CompanyGSTDetailsModal.tsx` — backdrop `bg-zinc-900/40 ... backdrop-blur-[1px]`, dialog `shadow-2xl`, footer buttons `rounded`, `shadow-sm`. UI.md forbids drop shadows, blur, rounded-pill buttons. Use sharp borders, solid black primary / white-bordered secondary.
3. `GSTDetailsFormFields.tsx` — active-cell highlight `bg-[#ffea5d] border-[#e6c300]` (hard-coded yellow hex). Replace with a non-colour active treatment (e.g. `bg-zinc-900 text-white` or `bg-zinc-200` + black border) — and ideally hoist to a shared token, since the same yellow appears across other statutory dialogs.
4. Audit other sub-popups (`StateWiseThresholdLimitModal.tsx`, `DownloadSettingsModal.tsx`, `GSTEffectiveDatePrompt.tsx`, `GSTDetailsAcceptPrompt.tsx`, `GSTDetailsListPanel.tsx`, `SlabBasedRateDetails.tsx`, `GSTClassificationSecondaryModal.tsx`) for the same yellow-hex / shadow / rounded / colour patterns and normalise identically.

Note: the yellow active-cell convention is used across **all** statutory dialogs in this app; fixing it only here would create inconsistency. Prefer extracting the active/inactive cell classes into a shared helper (e.g. under `client/src/components/ui/`) so the whole family flips together — but at minimum make #152's dialog theme-clean.

## 5. DB schema
**None.** `company_gst_details` (sqlite + pg) already has every column. `init()`/reconcile already handle existing installs. No new table, no new column.

## 6. Backend
**None.** Service (`get`/`save`), controller (with audit), IPC handlers (`companyGstDetails:get`/`:save`), and `preload.js` `window.api.companyGstDetails` all exist and are correct. No backend edits required for this issue.

## 7. Frontend
No new components, no new route, no menu change. **Edits only**, all UI/theme:
- `client/src/pages/master/statutory/company-gst-details/CompanyGSTDetailsModal.tsx`
- `client/src/pages/master/statutory/company-gst-details/components/GSTDetailsFormFields.tsx`
- Plus theme audit of the 7 sibling components listed in Gap #4.

Theme target (UI.md): backdrop = `bg-black/40` (no blur); dialog = `border border-zinc-300` (no shadow); active cell = black bg / white text (or zinc-200 + black border), no hex; banners = zinc text + bold + top-border, no red/green; primary button = solid black bg/white text, secondary = white bg/black border, **not rounded-pill** (sharp corners). Use only zinc/black/white tokens.

Reuse note: if a shared active-cell or dialog-chrome helper exists under `client/src/components/ui/`, prefer it; otherwise extract the active/inactive cell classes into one shared constant rather than leaving the hex inline.

## 8. Step-by-step checklist (file-precise)
1. `GSTDetailsFormFields.tsx` lines 70-71: replace `activeClass = "bg-[#ffea5d] border-[#e6c300] text-zinc-950"` and `inactiveClass` with theme-only classes (e.g. active `bg-zinc-900 text-white border-zinc-900`, inactive `border-transparent bg-transparent text-zinc-900`). No hex.
2. `CompanyGSTDetailsModal.tsx` line 485: change backdrop `bg-zinc-900/40 ... backdrop-blur-[1px]` → `bg-black/40` (drop blur).
3. `CompanyGSTDetailsModal.tsx` line 492: drop `shadow-2xl`; keep `border border-zinc-300/400`.
4. `CompanyGSTDetailsModal.tsx` lines 514-531: rewrite error/success banners to zinc only — error = `border-t border-zinc-900 text-zinc-900 font-bold` (bold + top border, no fill); success = `border-t border-zinc-300 text-zinc-700`. Remove all red-*/green-* classes.
5. `CompanyGSTDetailsModal.tsx` lines 544-559: footer buttons → remove `rounded`/`shadow-sm`; Quit = `border border-black bg-white text-black`, Accept = `bg-black text-white` (sharp corners, disabled = `bg-zinc-100 text-zinc-300`).
6. Open each of: `components/GSTDetailsListPanel.tsx`, `StateWiseThresholdLimitModal.tsx`, `DownloadSettingsModal.tsx`, `GSTEffectiveDatePrompt.tsx`, `GSTDetailsAcceptPrompt.tsx`, `SlabBasedRateDetails.tsx`, `GSTClassificationSecondaryModal.tsx`. Grep each for `#ffea5d`, `bg-[#`, `red-`, `green-`, `blue-`, `shadow`, `blur`, `rounded`; replace with zinc/black/white + sharp corners, matching steps 1-5.
7. (Recommended) Extract the active/inactive cell class pair into one shared constant/helper so #152 and the other statutory dialogs stay consistent; reference it from `GSTDetailsFormFields.tsx`.
8. Verify no behaviour change: dropdown options in `config/dropdownConfig.ts` already match screenshots — do not touch logic, only classes.

## 9. Validation & edge cases
- Confirm `Set State-wise Threshold Limit` only appears when the company has ≥1 GST registration (`hasGSTRegistrations` from `useGSTDetails`); otherwise `Intrastate Threshold Limit` numeric shows — matches img-02 vs img-03 branch. Don't regress this.
- State-wise popup must persist multiple rows and serialize to `state_wise_limits` JSON (already wired); verify a saved company reloads its rows.
- `Applicable from` only renders when `Show GST Advances = Yes` (img-12→13); `Minimum length of HSN/SAC` hidden when summary = None.
- Download Settings: GST Registration list comes from `window.api.gstRegistration.getAll`; Return Type list = All Returns/GSTR-1/2A/2B/3B + End of List. Empty registration list still allows "All Registrations".
- Effective-date prompt (`1-Apr-26` default) fires before Accept? confirmation — keep that order.
- After theme edits, sanity-check one sibling statutory dialog (e.g. TDS Details) to ensure any shared-token change didn't break it (UI.md workflow step 3).
- Strict-theme acceptance: grep the whole `company-gst-details/` folder for `#`, `red-`, `green-`, `blue-`, `shadow`, `blur`, `rounded` → must return nothing after the fix.
