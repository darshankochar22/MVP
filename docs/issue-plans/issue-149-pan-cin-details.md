# Issue #149 — PAN / CIN Details

## 1. Title & entry point
- **Issue:** #149 — PAN / CIN Details
- **Feature:** Company-level singleton statutory master holding two text fields: PAN/Income tax no. and Corporate Identity No. (CIN). One row per company.
- **Menu path (TallyPrime):** Gateway of Tally → Create (or Alter / Chart of Accounts) → under **Statutory Details** group → **PAN / CIN Details**.
- **App routes (already implemented):**
  - Create: `/master/create/pan-cin-details`
  - Alter: `/master/alter/pan-cin-details`
  - COA (display): `/master/coa/pan-cin-details`

## 2. TallyPrime reference (from screenshots)
Three sequential frames of the same flow:

- **img-00.png — List of Masters:** Master Creation menu. Under the **Statutory Details** group the items are: Company GST Details, TDS Details, TCS Details, VAT Registration Details, Excise Registration Details, Service Tax Details, CENVAT Opening Balance, PLA Opening Balance, **PAN/CIN Details** (highlighted/selected at bottom of list).
- **img-01.png — PAN/CIN Details popup (empty):** A small centered popup titled **"PAN/CIN Details"**. Two label/field rows:
  - `PAN/Income tax no.` — single-line text input (active/highlighted, empty).
  - `Corporate Identity No. (CIN)` — single-line text input (empty).
  - Bottom status bar shows `Quit` and `Accept`.
- **img-02.png — PAN/CIN Details popup (typing):** Same popup; cursor has moved to the `Corporate Identity No. (CIN)` field (a character is being entered), `PAN/Income tax no.` shows a value. Confirms two-field tab order: PAN first, then CIN, then Accept.

**Fields (complete inventory):** exactly two — `PAN/Income tax no.` (PAN) and `Corporate Identity No. (CIN)` (CIN). No columns, no drill-down, no popups beyond the Accept confirmation, no computed totals. It is a pure two-field singleton config form, one record per company.

## 3. Current state in codebase
**This feature is already fully implemented and wired end-to-end.** All layers are real (not mocked):

- **DB schema (sqlite):** `/Users/darshan/Startup/server/db/schema/sqlite/companyPanCinDetails.js` — table `company_pan_cin_details` with `company_id` (PK/FK), `pan`, `cin`, `created_at`, `updated_at`. Exported via `/Users/darshan/Startup/server/db/schema/sqlite/index.js:17`.
- **DB schema (pg):** `/Users/darshan/Startup/server/db/schema/pg/companyPanCinDetails.js`; exported via `/Users/darshan/Startup/server/db/schema/pg/index.js:17`.
- **Table init:** `/Users/darshan/Startup/server/companyPanCinDetails/companyPanCinDetails.js` (`init()` creates `company_pan_cin_details`), invoked at `/Users/darshan/Startup/server/db/index.js:102`.
- **Service:** `/Users/darshan/Startup/server/companyPanCinDetails/companyPanCinDetailsService.js` — `get(company_id)` (returns `{success, exists, data:{pan,cin}}`) and `save(data)` (upsert on `company_id`). Real.
- **Controller:** `/Users/darshan/Startup/server/companyPanCinDetails/companyPanCinDetailsController.js` — `get`, `save`.
- **IPC handlers:** `/Users/darshan/Startup/server/ipc/registerStatutoryHandlers.js:76-77` — `companyPanCinDetails:get`, `companyPanCinDetails:save`.
- **Preload bridge:** `/Users/darshan/Startup/preload.js:480-483` — `window.api.companyPanCinDetails.get/save`.
- **Frontend components:** `/Users/darshan/Startup/client/src/pages/master/statutory-details/PANDetails/` — `PANDetailsCreate.tsx`, `PANDetailsAlter.tsx`, `PANDetailsCOA.tsx`, plus `hooks/usePANDetails.ts` (real backend calls + localStorage fallback). All use shared `PageTitleBar`, `FormRow`, `RightActionPanel`.
- **Routes:** `/Users/darshan/Startup/client/src/routes/masterRoutes.tsx:113-115` (imports) and `:302-305` (route entries).
- **Menu entry:** `/Users/darshan/Startup/server/master/masterService.js:29` — `"PAN / CIN Details"` in the Statutory Details group.
- **Menu→route mapping:** `/Users/darshan/Startup/client/src/pages/menu/Create.tsx:61`, `Alter.tsx:50`, `coa.tsx:42` — all map `"PAN / CIN Details"` to the correct route.
- **Type:** `/Users/darshan/Startup/client/src/types/entities/CompanyPanCinDetails.ts` (`{pan, cin}`).

**Conclusion:** scope is **fix-existing** — functionally complete; the gap is theme compliance, not missing features.

## 4. Gap analysis
Functionally nothing is missing. The only defects are violations of the strict black/white/zinc theme in the three PANDetails components:
1. **Colored alert banners** — `PANDetailsCreate.tsx` and `PANDetailsAlter.tsx` use `border-red-200 bg-red-50 text-red-700` (error) and `border-green-200 bg-green-50 text-green-700` (success). UI.md forbids any hue. Replace with the shared `AlertBanner` (or a zinc-only banner), or drop in favour of the inline footer-bar message style used by sibling statutory forms.
2. **Yellow/Tally-skin input styling** — `activeClass` uses `bg-[#ffea5d] border-[#e6c300]` (Tally yellow) and arbitrary hex. UI.md forbids copying Tally's visual skin and inline hex. Use the same active-field convention the other statutory-details forms use (zinc tokens). NOTE: if every statutory-details form in the repo currently uses this same yellow active-field convention, this is a repo-wide inconsistency, not a #149-only fix — in that case do NOT diverge here; flag it and keep #149 visually consistent with its siblings.
3. **Modal-card layout** — the form renders a centered `bg-white border rounded shadow-sm` card on `bg-zinc-50` with a drop shadow. UI.md forbids drop shadows and rounded decoration; sibling forms (e.g. ServiceTaxDetails, TDSDetails) should be the reference for the inline full-panel layout. Match whichever layout the other statutory-details singletons use so #149 is consistent with them.
4. **Accept popup border** — uses `border-[#4c90e2]` (blue hex). Same pattern appears across sibling forms; only change if siblings are also being normalized.

These are all small, presentational, and must be applied **consistently with the other statutory-details forms** (do not make #149 a one-off). If the siblings already share these same violations, the correct action is to leave #149 matching them and (optionally) flag a separate theme-normalization task rather than diverging.

## 5. DB schema
**None.** Table `company_pan_cin_details` already exists in both sqlite and pg schemas with `company_id` (PK/FK), `pan`, `cin`, timestamps, and is created by `init()` at boot. No new columns; reconcile not needed.

## 6. Backend
**None.** Service (`get`/`save` upsert), controller, IPC handlers (`companyPanCinDetails:get`/`save` in `registerStatutoryHandlers.js`), and preload bridge (`window.api.companyPanCinDetails`) all exist and are functional. No channels or preload entries to add.

## 7. Frontend
No new components, routes, or menu wiring needed — all exist. Only theme fixes inside:
- `/Users/darshan/Startup/client/src/pages/master/statutory-details/PANDetails/PANDetailsCreate.tsx`
- `/Users/darshan/Startup/client/src/pages/master/statutory-details/PANDetails/PANDetailsAlter.tsx`
- `/Users/darshan/Startup/client/src/pages/master/statutory-details/PANDetails/PANDetailsCOA.tsx`

Reuse shared components from `/Users/darshan/Startup/client/src/components/ui` (`PageTitleBar`, `FormRow`, `RightActionPanel`, `AlertBanner`, `MasterFormFooter`). Reference a sibling statutory-details form (`ServiceTaxDetails/ServiceTaxDetailsForm.tsx` or `TDSDetails/TDSDetailsCreate.tsx`) for the canonical inline layout, active-field styling, and banner pattern, and bring PANDetails in line with it.

## 8. Step-by-step checklist
1. Open a sibling statutory-details form to fix as the style reference, e.g. `/Users/darshan/Startup/client/src/pages/master/statutory-details/ServiceTaxDetails/ServiceTaxDetailsForm.tsx` (and `TDSDetails/TDSDetailsCreate.tsx`). Record its: (a) active/inactive input class names, (b) alert/error display approach, (c) overall panel/layout wrapper, (d) Accept-popup styling.
2. If the siblings use zinc-only tokens and the shared `AlertBanner`/`MasterFormFooter`, refactor PANDetails to match. If the siblings themselves use the yellow/blue/red-green skin, STOP — do not diverge; #149 is already consistent. Optionally flag a separate repo-wide theme-normalization task and skip steps 3–6.
3. In `PANDetailsCreate.tsx`: replace the red error banner and green success banner with the shared `AlertBanner` (zinc-only) or the sibling pattern; remove `border-red-*/bg-red-*/text-red-*` and `border-green-*/bg-green-*/text-green-*`.
4. In `PANDetailsCreate.tsx`: replace `activeClass` (`bg-[#ffea5d] border-[#e6c300]`) and any inline hex with the sibling's zinc-token active-field classes; remove the centered `rounded shadow-sm` card wrapper in favour of the sibling's inline full-panel layout; replace `border-[#4c90e2]` on the Accept popup with the sibling's class.
5. Apply the identical changes to `PANDetailsAlter.tsx` (it duplicates the same banner/input/card markup).
6. In `PANDetailsCOA.tsx`: confirm it has no color/hex violations; align its display chrome with the sibling COA screens if it diverges.
7. Verify two-field tab order (PAN → CIN → Accept) and Alt+A accept still work after the refactor (logic untouched).
8. Smoke-test against one sibling statutory form to confirm the shared-component changes (if any shared component was edited) did not break it.

## 9. Validation & edge cases
- **No company selected:** `usePANDetails.validate()` returns "No company selected." and `get`/`save` short-circuit on missing `companyId`. Keep this.
- **Singleton upsert:** `save()` updates if a row for `company_id` exists, else inserts — preserves one-row-per-company. Do not change.
- **Empty values allowed:** PAN/CIN are optional (saved as `null` when blank); validation intentionally permissive. Keep.
- **PAN/CIN uppercasing & maxLength:** inputs uppercase on change; PAN `maxLength=10`, CIN `maxLength=21`. Preserve these during theme refactor.
- **localStorage fallback:** hook reads/writes `company_pan_cin_details_<companyId>` when IPC is unavailable — keep for parity with siblings.
- **Theme regression check:** after edits, grep the three files for any `#`, `red-`, `green-`, `blue-`, `ffea5d`, `4c90e2` to confirm no color/hex remains (unless intentionally matching siblings).
