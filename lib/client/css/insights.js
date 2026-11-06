/**
 * Styles for the two aggregation surfaces.
 *
 * Two ideas drive this sheet:
 *
 * 1. **Aggregation is shown by containment, not by a heading.** A severity
 *    lane is a container with a colour rail down its left edge, so the lane's
 *    severity is legible from the shape of the block before any text is read.
 *    The lane header repeats the count and a share meter so the four lanes
 *    compare against each other at a glance, while the rows below stay
 *    individually scannable.
 * 2. **A stream is read down a spine.** The timeline cards hang off a
 *    continuous vertical line with one node per entry, tinted by recognition
 *    state. Month dividers break the spine with a rule, which is what makes
 *    "nothing happened in September" visible without counting cards.
 *
 * Both surfaces are inside `.wd-shell`, so every rule is scoped there and
 * nothing leaks into product DOM. Colour comes only from the shared `--wd-*`
 * palette and the `--dsw-alias-*` theme tokens: a lane is red/amber/green/slate
 * and nothing else, so the board can never introduce a sixth severity colour.
 *
 * Class prefixes: `.risk-*` for the board, `.tl-*` for the timeline. The
 * timeline also reuses the shared `.status-pill` for the recognition badge, and
 * the board reuses `.status-pill` for level pills — those are the shell's
 * primitives, so this sheet only adds layout around them.
 */
export const INSIGHTS_CSS = `
/* =========================================================================
   Risk board — severity lanes
   ========================================================================= */

.wd-shell .risk-board {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px 20px 24px;
}

/* ---------- page header (this surface owns it; the shell does not) ---------- */
.wd-shell .risk-head,
.wd-shell .tl-head {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
}
.wd-shell .risk-head-text,
.wd-shell .tl-head-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1 1 auto;
}
.wd-shell .risk-head-title,
.wd-shell .tl-head-title {
  margin: 0;
  font-size: 17px;
  line-height: 24px;
  font-weight: 650;
  letter-spacing: -.01em;
  color: var(--dsw-alias-label-primary);
}
.wd-shell .risk-head-subtitle,
.wd-shell .tl-head-subtitle {
  margin: 0;
  font-size: 11.5px;
  line-height: 17px;
  color: var(--dsw-alias-label-secondary);
}
.wd-shell .risk-back,
.wd-shell .tl-back {
  flex: none;
  height: 28px;
  padding: 0 12px;
  border-radius: 7px;
  border: 1px solid var(--wd-border);
  background: var(--wd-surface);
  color: var(--dsw-alias-label-secondary);
  font-family: inherit;
  font-size: 11.5px;
  cursor: pointer;
  transition: background .12s ease, border-color .12s ease, color .12s ease;
}
.wd-shell .risk-back:hover,
.wd-shell .tl-back:hover {
  background: var(--wd-inset);
  border-color: var(--wd-primary-ring);
  color: var(--wd-primary);
}
.wd-shell .risk-back:focus-visible,
.wd-shell .tl-back:focus-visible {
  outline: 2px solid var(--wd-primary);
  outline-offset: 1px;
}

/* ---------- severity distribution figure ---------- */
.wd-shell .risk-figure,
.wd-shell .risk-projects {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 13px 15px 14px;
  border-radius: 11px;
  background: var(--wd-surface);
  border: 1px solid var(--wd-hairline);
  box-shadow: var(--wd-shadow-1);
}
.wd-shell .risk-figure-head {
  display: flex;
  align-items: baseline;
  gap: 9px;
  min-width: 0;
}
.wd-shell .risk-figure-title {
  margin: 0;
  font-size: 11.5px;
  line-height: 16px;
  font-weight: 650;
  letter-spacing: .01em;
  color: var(--dsw-alias-label-primary);
}
.wd-shell .risk-figure-note {
  margin-left: auto;
  font-size: 10.5px;
  line-height: 15px;
  color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
  text-align: right;
}
.wd-shell .risk-caption {
  margin: 0;
  font-size: 10.5px;
  line-height: 15px;
  color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
}

/* ---------- lane stack ---------- */
.wd-shell .risk-lanes {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.wd-shell .risk-lane {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  background: var(--wd-surface);
  border: 1px solid var(--wd-hairline);
  box-shadow: var(--wd-shadow-1);
  overflow: hidden;
  /* The rail: severity as the left edge of the whole lane, not as a badge. */
  border-left-width: 3px;
  border-left-style: solid;
  border-left-color: var(--wd-slate);
}
.wd-shell .risk-lane[data-level="high"] { border-left-color: var(--wd-red); }
.wd-shell .risk-lane[data-level="medium"] { border-left-color: var(--wd-amber); }
.wd-shell .risk-lane[data-level="low"] { border-left-color: var(--wd-green); }
.wd-shell .risk-lane[data-level="unset"] { border-left-color: var(--wd-slate); }

.wd-shell .risk-lane-head {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 12px 7px;
  background: var(--wd-inset);
  border-bottom: 1px solid var(--wd-hairline);
}
.wd-shell .risk-lane-count {
  font-size: 12px;
  line-height: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-primary);
}
.wd-shell .risk-lane[data-level="high"] .risk-lane-count { color: var(--wd-red); }
.wd-shell .risk-lane[data-level="medium"] .risk-lane-count { color: var(--wd-amber); }
.wd-shell .risk-lane[data-level="low"] .risk-lane-count { color: var(--wd-green); }
.wd-shell .risk-lane[data-level="unset"] .risk-lane-count { color: var(--wd-slate); }
/* The share meter compares lanes; it is deliberately thin and unfilled-chrome. */
.wd-shell .risk-lane-meter {
  flex: 1 1 auto;
  min-width: 40px;
  max-width: 180px;
  display: block;
}
.wd-shell .risk-lane-share {
  margin-left: auto;
  font-size: 10px;
  line-height: 14px;
  color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
}

/* ---------- rows ---------- */
.wd-shell .risk-rows {
  list-style: none;
  margin: 0;
  padding: 0;
}
.wd-shell .risk-row-item + .risk-row-item { border-top: 1px solid var(--wd-hairline); }
.wd-shell .risk-row {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 14px;
  align-items: start;
  padding: 10px 13px 10px 12px;
  color: inherit;
  /* A severity tint on the row's own left edge, one step quieter than the rail. */
  box-shadow: inset 3px 0 0 var(--wd-slate-soft);
  transition: background .12s ease;
}
.wd-shell .risk-row[data-level="high"] { box-shadow: inset 3px 0 0 var(--wd-red-soft); }
.wd-shell .risk-row[data-level="medium"] { box-shadow: inset 3px 0 0 var(--wd-amber-soft); }
.wd-shell .risk-row[data-level="low"] { box-shadow: inset 3px 0 0 var(--wd-green-soft); }
.wd-shell .risk-row:hover { background: var(--wd-inset); }
/* The row itself is not focusable; the stretched project button is. Ring the
   row so the keyboard user sees which whole row is about to open. */
.wd-shell .risk-row:focus-within {
  background: var(--wd-inset);
  box-shadow: inset 3px 0 0 var(--wd-primary), inset 0 0 0 1px var(--wd-primary-ring);
}

.wd-shell .risk-row-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.wd-shell .risk-name {
  font-size: 12.5px;
  line-height: 18px;
  font-weight: 650;
  color: var(--dsw-alias-label-primary);
  overflow-wrap: anywhere;
}
.wd-shell .risk-mitigation {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  font-size: 11px;
  line-height: 16px;
  color: var(--dsw-alias-label-secondary);
  overflow-wrap: anywhere;
}
.wd-shell .risk-mitigation-label {
  flex: none;
  font-size: 10px;
  line-height: 15px;
  padding: 0 5px;
  border-radius: 4px;
  background: var(--wd-slate-soft);
  color: var(--dsw-alias-label-tertiary);
}

.wd-shell .risk-row-side {
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: flex-end;
  min-width: 0;
}
/* Stretched link: the button is the row's only control, and its overlay makes
   the whole row clickable. The overlay sits above the row's own background but
   below the gap note, so the note stays selectable. */
.wd-shell .risk-project {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  font-family: inherit;
  font-size: 11px;
  line-height: 16px;
  color: var(--wd-primary);
  cursor: pointer;
  text-align: right;
}
.wd-shell .risk-project::after {
  content: '';
  position: absolute;
  inset: 0;
}
.wd-shell .risk-project:hover { text-decoration: underline; }
.wd-shell .risk-project:focus-visible { outline: none; }
.wd-shell .risk-project-arrow {
  flex: none;
  opacity: .65;
  transition: transform .12s ease, opacity .12s ease;
}
.wd-shell .risk-row:hover .risk-project-arrow { transform: translateX(2px); opacity: 1; }
.wd-shell .risk-gap {
  position: relative;
  z-index: 1;
  pointer-events: none;
  font-size: 10.5px;
  line-height: 15px;
  color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

/* ---------- empty state ---------- */
.wd-shell .risk-empty,
.wd-shell .tl-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 34px 20px;
  border-radius: 11px;
  border: 1px dashed var(--wd-hairline);
  background: var(--wd-surface);
}
.wd-shell .risk-empty-mark,
.wd-shell .tl-empty-mark {
  font-size: 18px;
  line-height: 22px;
  color: var(--dsw-alias-label-tertiary);
}
.wd-shell .risk-empty-copy,
.wd-shell .tl-empty-copy {
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary);
  text-align: center;
  max-width: 42ch;
}

/* =========================================================================
   Timeline — distribution, silent projects, stream
   ========================================================================= */

.wd-shell .tl-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px 20px 24px;
}

.wd-shell .tl-figure,
.wd-shell .tl-silent {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 13px 15px 14px;
  border-radius: 11px;
  background: var(--wd-surface);
  border: 1px solid var(--wd-hairline);
  box-shadow: var(--wd-shadow-1);
}
.wd-shell .tl-figure-head,
.wd-shell .tl-silent-head {
  display: flex;
  align-items: baseline;
  gap: 9px;
  min-width: 0;
}
.wd-shell .tl-figure-title,
.wd-shell .tl-silent-title {
  margin: 0;
  font-size: 11.5px;
  line-height: 16px;
  font-weight: 650;
  letter-spacing: .01em;
  color: var(--dsw-alias-label-primary);
}
.wd-shell .tl-figure-note,
.wd-shell .tl-silent-note {
  margin-left: auto;
  font-size: 10.5px;
  line-height: 15px;
  color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
  text-align: right;
}
.wd-shell .tl-caption {
  margin: 0;
  font-size: 10.5px;
  line-height: 15px;
  color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
}

/* ---------- silent projects ---------- */
.wd-shell .tl-silent {
  border-left: 3px solid var(--wd-amber);
}
.wd-shell .tl-silent-title { color: var(--wd-amber); }
.wd-shell .tl-silent-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.wd-shell .tl-chip-button {
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid var(--wd-hairline);
  background: var(--wd-inset);
  color: var(--dsw-alias-label-secondary);
  font-family: inherit;
  font-size: 11.5px;
  line-height: 17px;
  cursor: pointer;
  transition: background .12s ease, color .12s ease, border-color .12s ease;
}
.wd-shell .tl-chip-button:hover {
  background: var(--wd-primary-soft);
  border-color: var(--wd-primary-ring);
  color: var(--wd-primary);
}
.wd-shell .tl-chip-button:focus-visible {
  outline: 2px solid var(--wd-primary);
  outline-offset: 1px;
}
.wd-shell .tl-silent-hint {
  margin: 0;
  font-size: 10.5px;
  line-height: 15px;
  color: var(--dsw-alias-label-tertiary);
}

/* ---------- the stream ---------- */
.wd-shell .tl-stream {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
/* One month section = divider + its cards. The group is the spacing unit, so
   the stream never relies on a margin collapsing between sections. */
.wd-shell .tl-month-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* A month divider is a plain row, never sticky: the whole stream is one
   scroll flow owned by the shell, and a sticky row inside it would fight that
   scroll container instead of helping. */
.wd-shell .tl-month {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 2px 2px 0;
}
.wd-shell .tl-month-label {
  font-size: 12px;
  line-height: 16px;
  font-weight: 700;
  letter-spacing: .02em;
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-primary);
}
.wd-shell .tl-month-count {
  font-size: 10.5px;
  line-height: 15px;
  color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
}
.wd-shell .tl-month-rule {
  flex: 1 1 auto;
  height: 1px;
  background: var(--wd-hairline);
}

.wd-shell .tl-entries {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

/* Each entry is a two-column row: the gutter owns the spine, the card owns
   the content. The spine is drawn by the gutter's ::before and the node by
   ::after, so no extra DOM node is needed for the connector. */
.wd-shell .tl-entry {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: 10px;
  padding-bottom: 10px;
}
.wd-shell .tl-entry:last-child { padding-bottom: 0; }

.wd-shell .tl-gutter {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 11px;
}
.wd-shell .tl-gutter::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: -10px;
  left: 50%;
  width: 1px;
  margin-left: -.5px;
  background: var(--wd-hairline);
}
.wd-shell .tl-entry:last-child .tl-gutter::before { bottom: 50%; }
.wd-shell .tl-node {
  position: relative;
  z-index: 1;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--wd-slate);
  box-shadow: 0 0 0 2px var(--wd-surface);
}
.wd-shell .tl-node[data-tone="green"] { background: var(--wd-green); }
.wd-shell .tl-node[data-tone="amber"] { background: var(--wd-amber); }
.wd-shell .tl-node[data-tone="red"] { background: var(--wd-red); }

.wd-shell .tl-card {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
  padding: 10px 13px 11px;
  border-radius: 10px;
  background: var(--wd-surface);
  border: 1px solid var(--wd-hairline);
  box-shadow: var(--wd-shadow-1);
}
.wd-shell .tl-card-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}
.wd-shell .tl-date {
  font-size: 11.5px;
  line-height: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-primary);
}
.wd-shell .tl-type {
  font-size: 10px;
  line-height: 15px;
  padding: 0 6px;
  border-radius: 4px;
  background: var(--wd-slate-soft);
  color: var(--dsw-alias-label-secondary);
  white-space: nowrap;
}
.wd-shell .tl-project {
  padding: 0;
  border: 0;
  background: transparent;
  font-family: inherit;
  font-size: 11px;
  line-height: 16px;
  color: var(--wd-primary);
  cursor: pointer;
  text-align: left;
  overflow-wrap: anywhere;
}
.wd-shell .tl-project:hover { text-decoration: underline; }
.wd-shell .tl-project:focus-visible {
  outline: 2px solid var(--wd-primary);
  outline-offset: 1px;
  border-radius: 3px;
}
.wd-shell .tl-recog {
  margin-left: auto;
  font-size: 10.5px;
}

/* The body is a definition list: label above value, so a long goal wraps
   under its own label instead of shoving the next field to the right. */
.wd-shell .tl-fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 4px;
  margin: 0;
}
.wd-shell .tl-field {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  gap: 9px;
  align-items: baseline;
  min-width: 0;
}
.wd-shell .tl-field-label {
  font-size: 10.5px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary);
  white-space: nowrap;
}
.wd-shell .tl-field-value {
  margin: 0;
  font-size: 12px;
  line-height: 17px;
  color: var(--dsw-alias-label-secondary);
  overflow-wrap: anywhere;
}
.wd-shell .tl-field-value[data-emphasis="strong"] {
  color: var(--dsw-alias-label-primary);
  font-weight: 600;
}
.wd-shell .tl-field-value[data-emphasis="muted"] { color: var(--dsw-alias-label-secondary); }
.wd-shell .tl-field-value[data-emphasis="missing"] {
  color: var(--dsw-alias-label-tertiary);
  font-style: italic;
}

/* ---------- footer chips ---------- */
.wd-shell .tl-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding-top: 7px;
  border-top: 1px solid var(--wd-hairline);
  margin-top: 1px;
}
.wd-shell .tl-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  padding: 1px 8px;
  border-radius: 20px;
  background: var(--wd-inset);
  border: 1px solid var(--wd-hairline);
  font-size: 10.5px;
  line-height: 16px;
  color: var(--dsw-alias-label-secondary);
  font-variant-numeric: tabular-nums;
}
.wd-shell .tl-chip-label {
  font-size: 9.5px;
  color: var(--dsw-alias-label-tertiary);
}

/* ---------- narrow widths ---------- */
@media (max-width: 720px) {
  .wd-shell .risk-row { grid-template-columns: minmax(0, 1fr); gap: 6px; }
  .wd-shell .risk-row-side { align-items: flex-start; }
  .wd-shell .risk-gap { text-align: left; }
  .wd-shell .risk-lane-meter { display: none; }
  .wd-shell .tl-field { grid-template-columns: minmax(0, 1fr); gap: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .wd-shell .risk-row,
  .wd-shell .tl-chip-button,
  .wd-shell .risk-project-arrow { transition: none; }
}
`;
