/**
 * Blocker panel + worklist styles.
 *
 * Both surfaces live in the same module, so they share a sheet. The rules follow
 * the two constraints the rest of the console set:
 *
 * 1. **Scoped under `.wd-shell`.** Nothing here may leak into product DOM; the
 *    sheet is unmounted with the page.
 * 2. **Judgement tones only.** Red/amber mark severity, never chrome. A blocker
 *    group's left border is the only colour on the row, because the list is
 *    already dense and a second colour axis (per source) would make the severity
 *    unreadable.
 *
 * Body text is 11.5–12px rather than the 9.5px the older surfaces used: this is
 * the reading surface that is meant to be acted on, and CJK at 9.5px is a
 * legibility problem, not a density win.
 */

export const BLOCKERS_CSS = `
/* ---------- blocker chips ---------- */
.wd-shell .blocker-chips {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  padding: 0 0 10px;
}
.wd-shell .blocker-chip {
  display: inline-flex; align-items: center; gap: 6px;
  height: 26px; padding: 0 10px;
  border: 1px solid var(--wd-hairline); border-radius: 20px;
  background: var(--wd-surface); color: var(--dsw-alias-label-secondary);
  font-size: 11.5px; line-height: 16px; cursor: pointer; white-space: nowrap;
  transition: background .12s ease, border-color .12s ease, color .12s ease;
}
.wd-shell .blocker-chip:hover { background: var(--wd-inset); color: var(--wd-text); }
.wd-shell .blocker-chip[data-active="true"] {
  background: var(--wd-primary-soft); border-color: var(--wd-primary);
  color: var(--wd-primary); font-weight: 600;
}
.wd-shell .blocker-chip-count {
  font-size: 10.5px; font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-tertiary); font-weight: 500;
}
.wd-shell .blocker-chip[data-active="true"] .blocker-chip-count { color: var(--wd-primary); }

/* ---------- blocker groups ---------- */
.wd-shell .blocker-list { display: flex; flex-direction: column; gap: 10px; }
.wd-shell .blocker-group {
  border: 1px solid var(--wd-hairline); border-radius: 10px;
  background: var(--wd-surface); overflow: hidden;
}
.wd-shell .blocker-group[data-level="high"] { border-left: 3px solid var(--wd-red); }
.wd-shell .blocker-group[data-level="medium"] { border-left: 3px solid var(--wd-amber); }
.wd-shell .blocker-group-head {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 12px; border-bottom: 1px solid var(--wd-hairline);
  background: var(--wd-inset);
}
.wd-shell .blocker-project {
  display: inline-flex; align-items: baseline; gap: 7px;
  padding: 0; border: 0; background: none; cursor: pointer;
  font-size: 12.5px; line-height: 18px; font-weight: 650; color: var(--wd-text);
  text-align: left; min-width: 0; overflow-wrap: anywhere;
}
.wd-shell .blocker-project:hover { color: var(--wd-primary); }
.wd-shell .blocker-project-id {
  font-size: 10.5px; font-weight: 500; color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
}
.wd-shell .blocker-stage {
  flex: none; font-size: 10.5px; line-height: 16px;
  padding: 1px 7px; border-radius: 10px;
  background: var(--wd-primary-soft); color: var(--wd-primary);
}
.wd-shell .blocker-group-count {
  margin-left: auto; flex: none;
  font-size: 10.5px; font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-tertiary);
}
.wd-shell .blocker-rows { list-style: none; margin: 0; padding: 0; }
.wd-shell .blocker-row {
  display: flex; flex-direction: column; gap: 2px;
  padding: 8px 12px; border-bottom: 1px solid var(--wd-hairline);
}
.wd-shell .blocker-row:last-child { border-bottom: 0; }
.wd-shell .blocker-row-headline {
  font-size: 12px; line-height: 17px; font-weight: 600; color: var(--wd-text);
  overflow-wrap: anywhere;
}
.wd-shell .blocker-row[data-source="missing-amount"] .blocker-row-headline,
.wd-shell .blocker-row[data-source="no-stage-since"] .blocker-row-headline { color: var(--wd-amber); }
.wd-shell .blocker-row[data-source="stalled"] .blocker-row-headline,
.wd-shell .blocker-row[data-source="no-progress"] .blocker-row-headline { color: var(--wd-red); }
.wd-shell .blocker-row-copy {
  font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-secondary);
  overflow-wrap: anywhere;
}
.wd-shell .blocker-empty {
  margin: 0; padding: 22px 12px; text-align: center;
  font-size: 12px; color: var(--dsw-alias-label-tertiary);
}

/* ---------- worklist ---------- */
.wd-shell .worklist { display: flex; flex-direction: column; gap: 8px; }
.wd-shell .worklist-items {
  list-style: none; margin: 0; padding: 0;
  display: flex; flex-direction: column; gap: 6px;
}
.wd-shell .worklist-item {
  display: flex; align-items: flex-start; gap: 9px;
  padding: 9px 12px;
  border: 1px solid var(--wd-hairline); border-radius: 9px;
  background: var(--wd-inset);
}
.wd-shell .worklist-mark {
  flex: none; font-size: 13px; line-height: 17px;
  color: var(--wd-amber);
}
.wd-shell .worklist-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.wd-shell .worklist-label {
  font-size: 12px; line-height: 17px; font-weight: 600; color: var(--wd-text);
  overflow-wrap: anywhere;
}
.wd-shell .worklist-copy {
  font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-secondary);
  overflow-wrap: anywhere;
}
.wd-shell .worklist-action {
  font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-tertiary);
  overflow-wrap: anywhere;
}
.wd-shell .worklist-done {
  margin: 0; padding: 14px 12px; text-align: center;
  font-size: 12px; color: var(--wd-green);
}
.wd-shell .worklist[data-empty="true"] {
  border: 1px dashed var(--wd-hairline); border-radius: 9px;
  background: var(--wd-inset);
}

/* ---------- detail: worklist section ---------- */
.wd-shell .dt-worklist { margin-bottom: 14px; }
.wd-shell .dt-stage-context {
  display: flex; flex-direction: column; gap: 3px;
  padding: 12px 14px; margin-bottom: 14px;
  border: 1px solid var(--wd-hairline); border-left: 3px solid var(--wd-primary);
  border-radius: 10px; background: var(--wd-surface);
}
.wd-shell .dt-stage-context-head {
  display: flex; align-items: baseline; gap: 8px;
}
.wd-shell .dt-stage-context-title {
  margin: 0; font-size: 13px; line-height: 19px; font-weight: 650; color: var(--wd-text);
}
.wd-shell .dt-stage-context-kicker {
  font-size: 10.5px; line-height: 15px; letter-spacing: .04em;
  text-transform: uppercase; color: var(--dsw-alias-label-tertiary);
}
.wd-shell .dt-stage-context-copy {
  margin: 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary);
}
.wd-shell .dt-stage-context-next {
  margin: 0; font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-tertiary);
}
.wd-shell .dt-stage-context-state {
  align-self: flex-start; margin-top: 2px;
  font-size: 10.5px; line-height: 16px; padding: 1px 8px; border-radius: 10px;
}
.wd-shell .dt-stage-context[data-done="true"] .dt-stage-context-state {
  background: var(--wd-green-soft); color: var(--wd-green);
}
.wd-shell .dt-stage-context[data-done="false"] .dt-stage-context-state {
  background: var(--wd-amber-soft); color: var(--wd-amber);
}

/* ---------- detail: collapsed "other sections" ---------- */
.wd-shell .dt-fold {
  border: 1px solid var(--wd-hairline); border-radius: 10px;
  background: var(--wd-surface); margin-bottom: 14px; overflow: hidden;
}
.wd-shell .dt-fold-head {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; cursor: pointer;
  background: var(--wd-inset); border: 0; width: 100%; text-align: left;
}
.wd-shell .dt-fold-head:hover { background: var(--wd-canvas); }
.wd-shell .dt-fold-title {
  margin: 0; font-size: 12.5px; line-height: 18px; font-weight: 650; color: var(--wd-text);
}
.wd-shell .dt-fold-hint {
  font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-tertiary);
}
.wd-shell .dt-fold-arrow {
  margin-left: auto; font-size: 11px; color: var(--dsw-alias-label-tertiary);
}
.wd-shell .dt-fold[data-open="true"] .dt-fold-body { display: block; }
.wd-shell .dt-fold[data-open="false"] .dt-fold-body { display: none; }
.wd-shell .dt-fold-body { padding: 12px 14px; border-top: 1px solid var(--wd-hairline); }
`
