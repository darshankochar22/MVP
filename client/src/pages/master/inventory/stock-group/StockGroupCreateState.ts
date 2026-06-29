// let pendingCreatedGroupId: string | null = null;
// let pendingParentGroupId: string | null = null;
// let pendingStockGroupDraft: { name?: string } | null = null;

// export function setPendingCreatedGroupId(id: string) {
//   pendingCreatedGroupId = id;
// }

// export function consumePendingCreatedGroupId(): string | null {
//   const id = pendingCreatedGroupId;
//   pendingCreatedGroupId = null;
//   return id;
// }

// export function setPendingParentGroupId(id: string | null) {
//   pendingParentGroupId = id;
// }

// export function consumePendingParentGroupId(): string | null {
//   const id = pendingParentGroupId;
//   pendingParentGroupId = null;
//   return id;
// }

// export function setPendingStockGroupDraft(draft: { name?: string } | null) {
//   pendingStockGroupDraft = draft;
// }

// export function consumePendingStockGroupDraft() {
//   const draft = pendingStockGroupDraft;
//   pendingStockGroupDraft = null;
//   return draft;
// }






/**
 * StockGroupCreateState.ts
 *
 * Manages state across nested Stock Group creation pages.
 *
 * Flow example:
 *   Primary page (mouli) → clicks Create → Secondary page (mannu) → clicks Create → Secondary page (moly)
 *
 * When "Create" is clicked on any page:
 *   1. The current page pushes its form draft onto `draftStack`.
 *   2. A fresh secondary page opens (blank form).
 *
 * When a secondary page successfully creates a group and navigates back:
 *   1. It stores the new group's ID in `pendingCreatedGroupId`.
 *   2. The returning page pops its draft from `draftStack` and restores the form.
 *   3. It sets `parent_group_id` to `pendingCreatedGroupId`.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface StockGroupFormDraft {
  name: string;
  alias: string;
  parent_group_id: string;
  should_quantities_be_added: string;
  hsn_sac_details: string;
  hsn_sac_code: string;
  hsn_sac_description: string;
  gst_rate_details: string;
  taxability_type: string;
  gst_rate: string;
}

// ── Internal state ────────────────────────────────────────────────────────────

/** ID of the group just created on a secondary page, to be consumed by the returning page. */
let pendingCreatedGroupId: string | null = null;

/**
 * Stack of form drafts. Each time the user clicks "Create" inside the group
 * list panel, the current form is pushed here before navigating away.
 * When navigate(-1) brings us back, the top of the stack is popped and restored.
 */
const draftStack: StockGroupFormDraft[] = [];

// ── API ───────────────────────────────────────────────────────────────────────

/** Called by a page just before navigating to a new secondary page. */
export function pushDraft(draft: StockGroupFormDraft): void {
  draftStack.push({ ...draft });
}

/**
 * Called when a page mounts after returning from a secondary page.
 * Returns the saved draft, or null if there's nothing to restore.
 */
export function popDraft(): StockGroupFormDraft | null {
  if (draftStack.length === 0) return null;
  return draftStack.pop()!;
}

/** How deep we are in the nesting (0 = primary page, 1+ = secondary). */
export function draftStackDepth(): number {
  return draftStack.length;
}

// ── Created-ID handoff ────────────────────────────────────────────────────────

/** Called by a secondary page after it successfully creates a group. */
export function setPendingCreatedGroupId(id: string): void {
  pendingCreatedGroupId = id;
}

/**
 * Called by the page that just regained focus (after secondary navigated back).
 * Clears and returns the pending ID so it can be set as parent_group_id.
 */
export function consumePendingCreatedGroupId(): string | null {
  const id = pendingCreatedGroupId;
  pendingCreatedGroupId = null;
  return id;
}