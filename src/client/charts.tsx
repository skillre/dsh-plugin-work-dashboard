/**
 * Hand-built chart primitives.
 *
 * The client bundle may only externalise `react`, so a charting library is not
 * an option: every figure here is SVG or plain flex boxes built from numbers the
 * Host already computed. That keeps the bundle small, keeps light/dark working
 * through CSS variables instead of a library's theme layer, and means a chart
 * can never disagree with the list it sits beside — the numbers are passed in,
 * never re-derived.
 *
 * Accessibility rules, applied to every figure:
 * - the drawing is `aria-hidden`, and a visually-hidden text summary carries the
 *   meaning for screen readers (`role="img"` + `aria-label`);
 * - a chart with no data renders an explicit "no data" affordance rather than an
 *   empty frame, because an empty frame reads as a rendering bug;
 * - `prefers-reduced-motion` is honoured in CSS, not here (these are static).
 */

import type { CSSProperties, ReactNode } from 'react'
import type { DimensionKey, StageId } from '../types.js'

/** One segment of a stacked bar. */
export interface Segment {
  key: string
  label: string
  /** Value that decides the segment's width. */
  value: number
  /** Secondary value shown in the legend, e.g. the amount. */
  secondary?: number
  /** Palette slot; `slate` is the neutral default. */
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'slate'
}

/** One column of a vertical column chart. */
export interface Column {
  key: string
  label: string
  value: number
  secondary?: number
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'slate'
  /** Marks the bucket the user is currently filtering on. */
  active?: boolean
}

/** One slice of a donut. */
export interface Slice {
  key: string
  label: string
  value: number
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'slate'
}

/** One row of a horizontal bar list. */
export interface BarRow {
  key: string
  label: string
  value: number
  /** Rendered at the right of the row; defaults to the raw value. */
  display?: string
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'slate'
  /** Secondary line under the label. */
  note?: string
}

/** The palette rotation used when a caller supplies no tone. */
const TONES = ['blue', 'green', 'amber', 'red', 'slate'] as const

/** Tone for index `index`, so adjacent slices never repeat a colour. */
export function toneAt(index: number): (typeof TONES)[number] {
  return TONES[index % TONES.length]!
}

/** A text summary a screen reader can read instead of the drawing. */
function Summary({ text }: { text: string }): JSX.Element {
  return <span className="chart-sr">{text}</span>
}

/**
 * A single horizontal stacked bar.
 *
 * Used for stage distribution and severity distribution: the same geometry
 * answers "what share of the portfolio sits in each bucket", which a list of
 * numbers cannot show at a glance. Segments are buttons when `onSelect` is given
 * so a chart doubles as a filter.
 */
export function SegmentBar({
  segments,
  ariaLabel,
  summary,
  onSelect,
  activeKey,
  unit = '',
}: {
  segments: Segment[]
  ariaLabel: string
  summary: string
  onSelect?(key: string): void
  activeKey?: string | null
  unit?: string
}): JSX.Element {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  if (total <= 0) {
    return <div className="chart-empty" role="img" aria-label={ariaLabel}><span>—</span></div>
  }
  return (
    <div className="segbar" role="group" aria-label={ariaLabel}>
      <Summary text={summary} />
      <div className="segbar-track">
        {segments.map((segment, index) => {
          const share = segment.value / total
          if (segment.value <= 0) return null
          const tone = segment.tone ?? toneAt(index)
          const content = (
            <>
              <span className="segbar-label">{segment.label}</span>
              <span className="segbar-value">{segment.value}{unit}</span>
            </>
          )
          return onSelect === undefined ? (
            <span key={segment.key} className="segbar-seg" data-tone={tone} style={{ flexGrow: share }} title={`${segment.label} · ${segment.value}${unit}`}>
              {content}
            </span>
          ) : (
            <button
              key={segment.key}
              type="button"
              className="segbar-seg segbar-button"
              data-tone={tone}
              data-active={activeKey === segment.key}
              style={{ flexGrow: share }}
              title={`${segment.label} · ${segment.value}${unit}`}
              onClick={() => onSelect(segment.key)}
            >
              {content}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * A vertical column chart.
 *
 * The stage funnel uses this: column height is the count, and the column is
 * tinted by whether that stage carries high-severity gaps, so "where the work
 * sits" and "where it is broken" are one figure instead of two.
 */
export function ColumnChart({
  columns,
  ariaLabel,
  summary,
  onSelect,
  activeKey,
  height = 96,
}: {
  columns: Column[]
  ariaLabel: string
  summary: string
  onSelect?(key: string): void
  activeKey?: string | null
  height?: number
}): JSX.Element {
  const max = columns.reduce((peak, column) => Math.max(peak, column.value), 0)
  if (max <= 0) {
    return <div className="chart-empty" role="img" aria-label={ariaLabel}><span>—</span></div>
  }
  return (
    <div className="columns" role="group" aria-label={ariaLabel}>
      <Summary text={summary} />
      {columns.map((column, index) => {
        const ratio = column.value / max
        const tone = column.tone ?? toneAt(index)
        const body = (
          <>
            <span className="columns-value">{column.value}</span>
            <span className="columns-fill" data-tone={tone} style={{ height: `${Math.max(ratio * 100, 3)}%` }} />
          </>
        )
        const shared = {
          className: 'columns-cell',
          'data-active': activeKey === column.key,
          'data-empty': column.value === 0,
          title: column.secondary === undefined ? `${column.label} · ${column.value}` : `${column.label} · ${column.value} · ${column.secondary}`,
        }
        return onSelect === undefined ? (
          <div key={column.key} {...shared} style={{ height }}>
            {body}
            <span className="columns-label">{column.label}</span>
          </div>
        ) : (
          <button key={column.key} type="button" {...shared} style={{ height }} onClick={() => onSelect(column.key)}>
            {body}
            <span className="columns-label">{column.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * A donut.
 *
 * Used for `poc_type` composition. A donut beats a pie because the hole carries
 * the total, so the figure answers both "how many types" and "how many projects"
 * without a second number next to it.
 */
export function Donut({
  slices,
  ariaLabel,
  summary,
  centerValue,
  centerLabel,
  onSelect,
  activeKey,
}: {
  slices: Slice[]
  ariaLabel: string
  summary: string
  centerValue: string
  centerLabel: string
  onSelect?(key: string): void
  activeKey?: string | null
}): JSX.Element {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const radius = 34
  const circumference = 2 * Math.PI * radius
  if (total <= 0) {
    return <div className="chart-empty" role="img" aria-label={ariaLabel}><span>—</span></div>
  }
  let offset = 0
  return (
    <div className="donut" role="group" aria-label={ariaLabel}>
      <Summary text={summary} />
      <div className="donut-figure">
        <svg viewBox="0 0 96 96" className="donut-svg" aria-hidden="true">
          <circle cx="48" cy="48" r={radius} className="donut-ring" />
          {slices.map((slice, index) => {
            const length = (slice.value / total) * circumference
            const dash = `${length} ${circumference - length}`
            const rotation = (offset / circumference) * 360
            offset += length
            return (
              <circle
                key={slice.key}
                cx="48"
                cy="48"
                r={radius}
                className="donut-slice"
                data-tone={slice.tone ?? toneAt(index)}
                strokeDasharray={dash}
                transform={`rotate(${rotation - 90} 48 48)`}
              />
            )
          })}
        </svg>
        <div className="donut-center">
          <span className="donut-center-value">{centerValue}</span>
          <span className="donut-center-label">{centerLabel}</span>
        </div>
      </div>
      <ul className="donut-legend">
        {slices.map((slice, index) => {
          const tone = slice.tone ?? toneAt(index)
          const label = (
            <>
              <span className="donut-dot" data-tone={tone} />
              <span className="donut-legend-label">{slice.label}</span>
              <span className="donut-legend-value">{slice.value}</span>
            </>
          )
          return (
            <li key={slice.key}>
              {onSelect === undefined ? (
                <span className="donut-legend-row" data-active={activeKey === slice.key}>{label}</span>
              ) : (
                <button type="button" className="donut-legend-row donut-legend-button" data-active={activeKey === slice.key} onClick={() => onSelect(slice.key)}>
                  {label}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * A horizontal bar list.
 *
 * Used for the org breakdown and the amount-concentration list: labels are
 * text-heavy and variable-width, so bars share one left-aligned column and
 * values line up in a tabular right column.
 */
export function BarList({
  rows,
  ariaLabel,
  summary,
  onSelect,
  activeKey,
  max,
}: {
  rows: BarRow[]
  ariaLabel: string
  summary: string
  onSelect?(key: string): void
  activeKey?: string | null
  max?: number
}): JSX.Element {
  const peak = max ?? rows.reduce((highest, row) => Math.max(highest, row.value), 0)
  if (rows.length === 0 || peak <= 0) {
    return <div className="chart-empty" role="img" aria-label={ariaLabel}><span>—</span></div>
  }
  return (
    <div className="barlist" role="group" aria-label={ariaLabel}>
      <Summary text={summary} />
      {rows.map((row, index) => {
        const tone = row.tone ?? toneAt(index)
        const content = (
          <>
            <span className="barlist-text">
              <span className="barlist-label">{row.label}</span>
              {row.note === undefined ? null : <span className="barlist-note">{row.note}</span>}
            </span>
            <span className="barlist-track">
              <span className="barlist-fill" data-tone={tone} style={{ width: `${Math.max((row.value / peak) * 100, 2)}%` }} />
            </span>
            <span className="barlist-value">{row.display ?? row.value}</span>
          </>
        )
        return onSelect === undefined ? (
          <div key={row.key} className="barlist-row" data-active={activeKey === row.key}>{content}</div>
        ) : (
          <button key={row.key} type="button" className="barlist-row barlist-button" data-active={activeKey === row.key} onClick={() => onSelect(row.key)}>
            {content}
          </button>
        )
      })}
    </div>
  )
}

/**
 * A radial coverage meter.
 *
 * Used for the four dimensions: coverage is a ratio, and a ring encodes "how
 * much of the portfolio has this" in a shape that survives being repeated four
 * times in a row, which a bar of the same width would not.
 */
export function RadialMeter({
  ratio,
  label,
  value,
  note,
  tone = 'blue',
  ariaLabel,
}: {
  ratio: number
  label: string
  value: string
  note?: string
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'slate'
  ariaLabel: string
}): JSX.Element {
  const clamped = Number.isFinite(ratio) ? Math.min(1, Math.max(0, ratio)) : 0
  const radius = 26
  const circumference = 2 * Math.PI * radius
  return (
    <div className="radial" role="img" aria-label={ariaLabel}>
      <div className="radial-figure">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r={radius} className="radial-track" />
          <circle
            cx="32"
            cy="32"
            r={radius}
            className="radial-fill"
            data-tone={tone}
            strokeDasharray={`${clamped * circumference} ${circumference}`}
            transform="rotate(-90 32 32)"
          />
        </svg>
        <span className="radial-value">{value}</span>
      </div>
      <span className="radial-label">{label}</span>
      {note === undefined ? null : <span className="radial-note">{note}</span>}
    </div>
  )
}

/**
 * A monthly activity sparkline.
 *
 * Bars rather than a line: the underlying series is a count per month, and a
 * line would imply a continuous quantity between two months that does not exist.
 */
export function Sparkbars({
  points,
  ariaLabel,
  summary,
}: {
  points: Array<{ month: string; count: number }>
  ariaLabel: string
  summary: string
}): JSX.Element {
  const max = points.reduce((peak, point) => Math.max(peak, point.count), 0)
  if (points.length === 0 || max <= 0) {
    return <div className="chart-empty" role="img" aria-label={ariaLabel}><span>—</span></div>
  }
  return (
    <div className="spark" role="group" aria-label={ariaLabel}>
      <Summary text={summary} />
      {points.map((point) => (
        <span key={point.month} className="spark-cell" title={`${point.month} · ${point.count}`}>
          <span className="spark-bar" style={{ height: `${Math.max((point.count / max) * 100, 4)}%` }} data-empty={point.count === 0} />
          <span className="spark-month">{point.month.slice(5)}</span>
        </span>
      ))}
    </div>
  )
}

/** One severity lane of a stacked severity bar. */
export function SeverityBar({
  lanes,
  ariaLabel,
  summary,
}: {
  lanes: Array<{ key: string; label: string; value: number; tone: 'green' | 'amber' | 'red' | 'slate' }>
  ariaLabel: string
  summary: string
}): JSX.Element {
  const total = lanes.reduce((sum, lane) => sum + lane.value, 0)
  if (total <= 0) {
    return <div className="chart-empty" role="img" aria-label={ariaLabel}><span>—</span></div>
  }
  return (
    <div className="segbar" role="group" aria-label={ariaLabel}>
      <Summary text={summary} />
      <div className="segbar-track">
        {lanes.map((lane) =>
          lane.value <= 0 ? null : (
            <span key={lane.key} className="segbar-seg" data-tone={lane.tone} style={{ flexGrow: lane.value / total }} title={`${lane.label} · ${lane.value}`}>
              <span className="segbar-label">{lane.label}</span>
              <span className="segbar-value">{lane.value}</span>
            </span>
          ),
        )}
      </div>
    </div>
  )
}

/** The five stage ids in order, for the mini rail. */
const STAGE_IDS: readonly StageId[] = ['G0', 'G1', 'G2', 'G3', 'G4']

/**
 * The compact G0→G4 rail used inside a project card.
 *
 * Five ticks, not a progress bar: the ledger records per-gate completion, so
 * "done, done, current, not started" is four states per tick and a continuous
 * bar would flatten that into one number that is not in the data.
 */
export function StageRailMini({
  done,
  current,
  closed,
  ariaLabel,
}: {
  done: readonly [boolean, boolean, boolean, boolean, boolean]
  current: StageId | null
  closed: boolean
  ariaLabel: string
}): JSX.Element {
  const currentIndex = current === null ? -1 : STAGE_IDS.indexOf(current)
  return (
    <div className="rail-mini" role="img" aria-label={ariaLabel}>
      {STAGE_IDS.map((stage, index) => (
        <span
          key={stage}
          className="rail-mini-tick"
          data-done={closed ? true : done[index] === true}
          data-current={!closed && index === currentIndex}
        />
      ))}
    </div>
  )
}

/** A tiny inline "n of m" progress strip, used in list headers. */
export function InlineMeter({ value, max, tone = 'blue' }: { value: number; max: number; tone?: 'blue' | 'green' | 'amber' | 'red' | 'slate' }): JSX.Element {
  const ratio = max <= 0 ? 0 : Math.min(1, Math.max(0, value / max))
  const style: CSSProperties = { width: `${ratio * 100}%` }
  return (
    <span className="inline-meter" aria-hidden="true">
      <span className="inline-meter-fill" data-tone={tone} style={style} />
    </span>
  )
}

/** A legend row shared by the band's figures. */
export function Legend({ items }: { items: Array<{ key: string; label: string; tone: string; value?: ReactNode }> }): JSX.Element {
  return (
    <div className="legend">
      {items.map((item) => (
        <span key={item.key} className="legend-item">
          <span className="legend-dot" data-tone={item.tone} />
          <span className="legend-label">{item.label}</span>
          {item.value === undefined ? null : <span className="legend-value">{item.value}</span>}
        </span>
      ))}
    </div>
  )
}

/** The dimension key → tone mapping used by the coverage meters. */
export function dimensionTone(key: DimensionKey): 'blue' | 'green' | 'amber' | 'red' | 'slate' {
  switch (key) {
    case 'achievement':
      return 'blue'
    case 'evidence':
      return 'green'
    case 'recognition':
      return 'amber'
    case 'nextMilestone':
      return 'red'
  }
}
