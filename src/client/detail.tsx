/**
 * The project detail surface: a sticky identity rail and a layered reading pane.
 *
 * The old detail page was thirteen `label: value` rows stacked vertically, which
 * is field transcription rather than presentation: it showed that the data had
 * been parsed, not what the data meant. This redesign splits the page by the
 * question each half answers:
 *
 * - **The rail (left, sticky)** answers "what is this project". It is the file
 *   you keep in view: name, amount, stage position, the people, the four
 *   dimensions, the gaps, and prev/next. It never scrolls away, so every section
 *   on the right is read in the context of the project's identity.
 * - **The pane (right, scrolling)** answers "what happened, and what does it
 *   prove". The progress stream is the centrepiece — it is the v3 model's core —
 *   followed by the four dimensions, the G0 completeness meter, the plan, and
 *   the outcome.
 *
 * Each section uses the shape that fits its data rather than a shared row
 * component: a stream for history, a meter for completeness, a table for
 * criteria, a numbered list for scenarios, a callout for the next milestone. The
 * four dimensions stay four separate elements — the product invariant forbids
 * merging them — and each carries whether the ledger derived it or a human
 * typed it, because a derived conclusion and a written one are not equally
 * trustworthy.
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { DimensionKey, Gate0CheckItem, ProgressView, ProjectDetail } from '../types.js'
import { DIMENSIONS, STAGES } from '../types.js'
import { InlineMeter } from './charts.jsx'
import { Worklist } from './blockers.jsx'
import { formatDate, formatWan } from './format.js'
import { format, type Translate } from './text.js'
import type { DetailProps } from './view-contract.js'

/** The four dimension keys mapped onto their dictionary labels. */
const DIMENSION_TEXT: Record<DimensionKey, string> = {
  achievement: 'dimAchievement',
  evidence: 'dimEvidence',
  recognition: 'dimRecognition',
  nextMilestone: 'dimNextMilestone',
}

/**
 * Which dimensions the v3 ledger derives rather than asks for.
 *
 * `outcome.achievement` and `outcome.customer_recognition` are computed from the
 * newest progress entry; `our_proof` and `business.milestone` are typed by a
 * human. The tag matters: a derived value can be right without anyone having
 * looked at it, and a written one can be stale.
 */
const DIMENSION_ORIGIN: Record<DimensionKey, 'auto' | 'manual'> = {
  achievement: 'auto',
  evidence: 'manual',
  recognition: 'auto',
  nextMilestone: 'manual',
}

/** The G0 field → dictionary label map, in schema order. */
const G0_LABEL: Record<string, string> = {
  why_customer: 'whyCustomerTest',
  why_us: 'whyWeTest',
  decision_chain: 'decisionChain',
  post_poc_decision: 'postPocDecision',
  tech_owner: 'customerTechOwner',
}

/** The two G0 fields that carry narrative prose rather than a short answer. */
const G0_PROSE = new Set(['why_customer', 'why_us'])

/** The tone a recognition value earns. */
function recognitionTone(value: string): 'green' | 'amber' | 'red' | 'slate' {
  if (value === '认可') return 'green'
  if (value === '部分认可' || value === '待确认') return 'amber'
  if (value === '未认可') return 'red'
  return 'slate'
}

/** The tone a risk level earns. */
function riskTone(level: string): 'green' | 'amber' | 'red' | 'slate' {
  if (level === 'high') return 'red'
  if (level === 'medium') return 'amber'
  if (level === 'low') return 'green'
  return 'slate'
}

/**
 * The dictionary key for the ledger's derived `priority`.
 *
 * `priority` is a sort hint the ledger computes, not a decision, and it arrives
 * as an English enum. Mapping it here keeps "high" out of a Chinese page without
 * inventing a fourth tier the ledger does not have.
 */
function priorityLabelKey(priority: string): string {
  if (priority === 'strategic') return 'priorityStrategic'
  if (priority === 'high') return 'priorityHigh'
  if (priority === 'normal') return 'priorityNormal'
  return 'priorityUnknown'
}

/**
 * Resolve a `scn-NN` id to the scenario's name, for display.
 *
 * The ledger stores the id, which is what keeps the reference stable across a
 * rename. The reader still needs words, so the timeline resolves the id here and
 * falls back to the raw id when the plan no longer defines it — showing a stale
 * id is more honest than showing nothing.
 */
function scenarioNameOf(detail: ProjectDetail, id: string): string {
  const found = detail.plan.scenarios.find((item) => item.id === id)
  return found === undefined ? '' : found.name
}

/**
 * The tone a derived scenario status earns.
 *
 * The colour IS the finding on this page: 无证据 is the one state that means
 * "claimed, never backed", so it is the only red. 未开始 is grey rather than red
 * because a scenario nobody has reached is a plan not yet executed, not a defect.
 */
function scenarioTone(status: string): 'green' | 'amber' | 'red' | 'slate' {
  if (status === '已证明') return 'green'
  if (status === '待客户确认') return 'amber'
  if (status === '无证据') return 'red'
  return 'slate'
}

/** The marker glyph for a scenario status; the text label carries the meaning. */
function scenarioGlyph(status: string): string {
  if (status === '已证明') return '●'
  if (status === '待客户确认') return '◐'
  if (status === '无证据') return '○'
  return '—'
}

/** The tone a derived criterion status earns. */
function criterionTone(status: string): 'green' | 'amber' | 'red' | 'slate' {
  if (status === '已达成') return 'green'
  if (status === '部分达成') return 'amber'
  if (status === '未达成') return 'red'
  return 'slate'
}

/**
 * The dictionary suffix for each derived scenario status.
 *
 * Explicit rather than index-based: the ledger's enum values are Chinese prose,
 * and a lookup that silently falls back would render a raw ledger word into an
 * English page.
 */
const SCENARIO_STATUS_KEY: Record<string, string> = {
  已证明: 'Proven',
  待客户确认: 'Awaiting',
  无证据: 'NoEvidence',
  未开始: 'NotStarted',
}

/** The dictionary suffix for each derived criterion status. */
const CRITERION_STATUS_KEY: Record<string, string> = {
  已达成: 'Proven',
  部分达成: 'Partial',
  未达成: 'Failed',
  未验证: 'Unverified',
}

/** The leading percentage in a completion string, or `null`. */
function completionRatio(value: string): number | null {
  const match = value.match(/^(\d+(?:\.\d+)?)\s*%/u)
  if (match === null) return null
  const parsed = Number(match[1])
  if (!Number.isFinite(parsed)) return null
  return Math.min(1, Math.max(0, parsed / 100))
}

/**
 * The five section keys, and the order each gate puts them in.
 *
 * The order encodes one claim per gate: at G0 the reader's job is to justify the
 * project, so the G0 meter leads and the plan/progress follow. At G3 the job is
 * to prove a result, so the stream and the evidence lead. Anything not listed as
 * primary falls into the collapsed fold — never removed.
 */
type SectionKey = 'basic' | 'progress' | 'dimensions' | 'gate0' | 'plan' | 'outcome'

/** `G0`..`G4` plus the two sentinels; the key set the skeleton table uses. */
type SkeletonKey = 'G0' | 'G1' | 'G2' | 'G3' | 'G4' | 'closed' | 'unknown'

interface Skeleton {
  /** The sections shown in this order before the fold. */
  sections: SectionKey[]
  /** The dictionary keys for this gate's own explanation block. */
  title: string
  copy: string
  next: string
}

/**
 * Which sections lead at each gate.
 *
 * `unknown` deliberately keeps the historical full order: a ledger value the
 * parser cannot place is not evidence about where the project is, so the page
 * must not pretend to know which gate the reader is in.
 */
const SKELETON_FOR: Record<SkeletonKey, Skeleton> = {
  G0: { sections: ['basic', 'gate0', 'plan'], title: 'dtStageG0Title', copy: 'dtStageG0Copy', next: 'dtStageG0Next' },
  G1: { sections: ['basic', 'plan', 'progress'], title: 'dtStageG1Title', copy: 'dtStageG1Copy', next: 'dtStageG1Next' },
  G2: { sections: ['basic', 'plan', 'progress'], title: 'dtStageG2Title', copy: 'dtStageG2Copy', next: 'dtStageG2Next' },
  G3: { sections: ['progress', 'dimensions', 'basic'], title: 'dtStageG3Title', copy: 'dtStageG3Copy', next: 'dtStageG3Next' },
  G4: { sections: ['dimensions', 'outcome', 'basic'], title: 'dtStageG4Title', copy: 'dtStageG4Copy', next: 'dtStageG4Next' },
  closed: { sections: ['outcome', 'dimensions', 'basic'], title: 'dtStageClosedTitle', copy: 'dtStageClosedCopy', next: 'dtStageG4Next' },
  unknown: {
    sections: ['basic', 'progress', 'dimensions', 'gate0', 'plan', 'outcome'],
    title: 'dtStageUnknownTitle',
    copy: 'dtStageUnknownCopy',
    next: 'dtStageUnknownCopy',
  },
}

/**
 * Whether the current gate's own evidence is recorded.
 *
 * This is the honest version of "how far along is it": it reads the per-gate
 * `stageDone` flags the Host derives from each gate's own field, not the stage
 * position. A project sitting at G2 with a G0 that was never signed off reads as
 * "still pending", which is the finding, not a cosmetic detail.
 */
function stageStateOf(detail: ProjectDetail): { done: boolean; pending: boolean } {
  const stage = detail.summary.stage
  if (detail.summary.closed) return { done: true, pending: false }
  if (stage === null) return { done: false, pending: true }
  const index = STAGES.indexOf(stage)
  if (index === -1) return { done: false, pending: true }
  const done = detail.summary.stageDone[index] === true
  return { done, pending: !done }
}

/**
 * The block that says "you are here, and this is what it takes to leave".
 *
 * Without it the stage-aware order is invisible: the reader sees a different
 * first section and has no statement of why. With it, the page can also say the
 * honest negative — "this stage is not recorded as done" — which the five gates
 * elsewhere only imply.
 */
function StageContext({ stage, done, pending, t }: {
  stage: string | null
  done: boolean
  pending: boolean
  t: Translate
}): JSX.Element {
  const key = (stage ?? 'unknown') as SkeletonKey
  const skeleton = SKELETON_FOR[key] ?? SKELETON_FOR.unknown
  return (
    <section className="dt-stage-context" data-done={done} aria-label={t('dtStageSkeleton')}>
      <div className="dt-stage-context-head">
        <h2 className="dt-stage-context-title">{t(skeleton.title)}</h2>
        <span className="dt-stage-context-kicker">{t('dtStageSkeleton')}</span>
      </div>
      <p className="dt-stage-context-copy">{t(skeleton.copy)}</p>
      <p className="dt-stage-context-next">{t(skeleton.next)}</p>
      <span className="dt-stage-context-state">{pending ? t('dtStagePending') : t('dtStageDone')}</span>
    </section>
  )
}

/** A section frame: heading, optional kicker, and a body. */
function Section({ title, kicker, children }: { title: string; kicker?: string | undefined; children: ReactNode }): JSX.Element {
  return (
    <section className="dsec">
      <header className="dsec-head">
        <h2 className="dsec-title">{title}</h2>
        {kicker === undefined ? null : <span className="dsec-kicker">{kicker}</span>}
      </header>
      {children}
    </section>
  )
}

/** A dashed "nothing here yet" block. */
function Blank({ text }: { text: string }): JSX.Element {
  return <div className="dsec-blank">{text}</div>
}

/** One labelled prose block. */
function Prose({ label, value, t }: { label: string; value: string; t: Translate }): JSX.Element {
  return (
    <div className="dt-prose" data-empty={value === ''}>
      <span className="dt-prose-label">{label}</span>
      <p className="dt-prose-body prose">{value === '' ? t('emptyField') : value}</p>
    </div>
  )
}

/** One compact label/value pair for the rail's meta block. */
function RailMeta({ label, value, t }: { label: string; value: string; t: Translate }): JSX.Element {
  return (
    <div className="dt-rail-meta-row">
      <span className="dt-rail-meta-label">{label}</span>
      <span className="dt-rail-meta-value" data-empty={value === ''}>{value === '' ? t('dtUnset') : value}</span>
    </div>
  )
}

/** The vertical stage track: five rows, each with its own recorded state. */
function StageTrackVertical({ detail, t }: { detail: ProjectDetail; t: Translate }): JSX.Element {
  const currentIndex = detail.summary.stage === null ? -1 : STAGES.indexOf(detail.summary.stage)
  return (
    <ol className="dt-stages" aria-label={t('stageTrack')}>
      {STAGES.map((stage, index) => {
        const done = detail.summary.closed ? true : detail.summary.stageDone[index] === true
        const current = !detail.summary.closed && index === currentIndex
        const state = done ? t('stageDone') : current ? t('stageCurrent') : t('stagePending')
        return (
          <li key={stage} className="dt-stage" data-done={done} data-current={current} aria-current={current ? 'step' : undefined}>
            <span className="dt-stage-marker" aria-hidden="true">{done ? '✓' : current ? '◉' : index + 1}</span>
            <span className="dt-stage-text">
              <span className="dt-stage-label">{t(`stage${stage}`)}</span>
              <span className="dt-stage-state">{state}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** The left rail: identity, money, stage, people, dimensions, gaps, navigation. */
function IdentityRail({ props }: { props: DetailProps }): JSX.Element {
  const { detail, gaps, t, position, onPrev, onNext, onBack, locale } = props
  const summary = detail.summary
  const resolved: Record<DimensionKey, string> = {
    achievement: detail.outcome.achievement,
    evidence: detail.outcome.ourProof,
    recognition: detail.outcome.customerRecognition,
    nextMilestone: detail.outcome.milestone,
  }
  const present: Record<DimensionKey, boolean> = {
    achievement: detail.outcome.achievement !== '',
    evidence: detail.outcome.ourProof !== '',
    recognition: detail.outcome.customerRecognition !== '',
    nextMilestone: detail.outcome.milestone !== '',
  }

  return (
    <aside className="dt-rail" aria-label={t('dtRailTitle')}>
      <div className="dt-rail-head">
        <button type="button" className="btn btn-small dt-rail-back" onClick={onBack}>{t('back')}</button>
        <h1 className="dt-rail-title">{summary.name}</h1>
        <span className="dt-rail-id mono">{summary.pocId}</span>
        <div className="dt-rail-pills">
          <span className="status-pill tone-blue"><span className="status-dot" />{summary.closed ? t('stageClosed') : summary.stageLabel === '' ? t('stageUnknown') : summary.stageLabel}</span>
          {summary.status === '' ? null : <span className="status-pill tone-slate">{summary.status}</span>}
          {summary.priority === '' ? null : (
            <span className={`status-pill tone-${summary.priority === 'strategic' ? 'amber' : summary.priority === 'high' ? 'amber' : 'slate'}`}>
              {t(priorityLabelKey(summary.priority))}
            </span>
          )}
        </div>
      </div>

      <div className="dt-rail-amount">
        <span className="dt-rail-amount-label">{t('dtAmountLabel')}</span>
        {summary.amountWan === 0 ? (
          <span className="dt-rail-amount-value" data-empty="true">{t('dtUnset')}</span>
        ) : (
          <span className="dt-rail-amount-value">{formatWan(summary.amountWan)}<span className="dt-rail-amount-unit">{t('statAmountUnit')}</span></span>
        )}
      </div>

      <div className="dt-rail-block">
        <h2 className="dt-rail-block-title">{t('dtStageSection')}</h2>
        <StageTrackVertical detail={detail} t={t} />
      </div>

      <div className="dt-rail-block">
        <h2 className="dt-rail-block-title">{t('dtDimensionSection')}</h2>
        <div className="dt-rail-dims">
          {DIMENSIONS.map((key) => (
            <div key={key} className="dim-mini" data-present={present[key]} data-origin={DIMENSION_ORIGIN[key]} title={`${t(DIMENSION_TEXT[key])}: ${present[key] ? resolved[key] : t('dimMissing')}`}>
              <span className="dim-mini-mark" aria-hidden="true">{present[key] ? '✓' : '✗'}</span>
              <span className="dim-mini-label">{t(DIMENSION_TEXT[key])}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dt-rail-block">
        <h2 className="dt-rail-block-title">{t('dtGapSection')}</h2>
        {gaps.length === 0 ? (
          <p className="dt-rail-empty">{t('dtNoGaps')}</p>
        ) : (
          <ul className="dt-rail-gaps">
            {gaps.map((item) => (
              <li key={item.rule} className="dt-rail-gap" data-level={item.level}>
                <span className="dt-rail-gap-no">R{item.ruleNo}</span>
                <span className="dt-rail-gap-title">{format(t(`gap.${item.rule}.title`), { ...(item.params ?? {}) })}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="dt-rail-block">
        <h2 className="dt-rail-block-title">{t('sectionIdentity')}</h2>
        <div className="dt-rail-meta">
          {/* The customer's own name was being sent by the Host and never
              rendered: the page said "POC-2026-003" but never "人保财险". */}
          <RailMeta label={t('dtCustomerCompany')} value={orgText(detail.org.company)} t={t} />
          <RailMeta label={t('dtCustomerSystem')} value={orgText(detail.org.system)} t={t} />
          <RailMeta label={t('dtOwnerLabel')} value={summary.owner} t={t} />
          <RailMeta label={t('dtTechOwnerLabel')} value={summary.techOwner} t={t} />
          <RailMeta label={t('dtSalesLabel')} value={detail.sales} t={t} />
          <RailMeta label={t('dtSponsorLabel')} value={detail.execSponsor} t={t} />
          <RailMeta label={t('type')} value={summary.pocType} t={t} />
          <RailMeta label={t('dtStageSinceLabel')} value={summary.stageSince === null ? '' : `${formatDate(summary.stageSince, locale)}${summary.daysInStage === null ? '' : ` · ${format(t('daysInStage'), { days: summary.daysInStage })}`}`} t={t} />
          <RailMeta label={t('dtPriorityLabel')} value={summary.priority === '' ? '' : t(priorityLabelKey(summary.priority))} t={t} />
        </div>
      </div>

      <div className="dt-rail-nav">
        <button type="button" className="btn btn-small" disabled={onPrev === null} onClick={onPrev ?? undefined}>← {t('dtPrevProject')}</button>
        <span className="dt-rail-position">{format(t('dtPosition'), { index: position.index, total: position.total })}</span>
        <button type="button" className="btn btn-small" disabled={onNext === null} onClick={onNext ?? undefined}>{t('dtNextProject')} →</button>
      </div>
    </aside>
  )
}

/** One progress entry: the v3 core, as a card on a vertical stream. */
function ProgressItem({ entry, index, t, locale, detail }: { entry: ProgressView; index: number; t: Translate; locale: string; detail: ProjectDetail }): JSX.Element {
  const tone = recognitionTone(entry.customer.recognition)
  const ratio = completionRatio(entry.completion)
  /**
   * A compact timeline row, not a card.
   *
   * The design puts one line per round here — date, type, what changed, and the
   * result — because the timeline answers "did anything move?" and the proof
   * behind a round belongs to the scenario drill-down. Rendering the full card
   * (goal, evidence, customer, G3 verdict, next step) made the right column four
   * times taller than the left and buried the shape of the history.
   *
   * Everything omitted here is still reachable: the scenario detail lists the
   * evidence of every round that cites it, and the full entry stays in the
   * snapshot for the worklist and the gap scan.
   */
  return (
    <li className="prog-item" data-tone={tone} data-latest={index === 0}>
      <div className="prog-gutter" aria-hidden="true">
        <span className="prog-node" data-tone={tone} />
      </div>
      <article className="prog-card prog-card-compact">
        <header className="prog-head">
          <time className="prog-date" dateTime={entry.date}>{formatDate(entry.date, locale) || '—'}</time>
          <span className="prog-type">{entry.type === '' ? t('progressTypeUnset') : entry.type}</span>
          {entry.change === '' ? null : <span className="prog-change">{entry.change}</span>}
          {ratio === null ? (
            entry.completion === '' ? null : <span className="prog-chip">{entry.completion}</span>
          ) : (
            <span className="prog-meter">
              <InlineMeter value={ratio} max={1} tone={ratio >= 1 ? 'green' : 'blue'} />
              <span className="prog-meter-value">{entry.completion}</span>
            </span>
          )}
        </header>
        {entry.actual === '' ? (
          <p className="prog-actual-line" data-empty="true">{t('emptyField')}</p>
        ) : (
          <p className="prog-actual-line">{entry.actual}</p>
        )}
        {entry.scenarioIds.length === 0 ? null : (
          <div className="chip-row prog-scope-row">
            {entry.scenarioIds.map((id, itemIndex) => {
              const linked = scenarioNameOf(detail, id)
              return <span key={`${id}:${itemIndex}`} className="chip">{linked === '' ? id : linked}</span>
            })}
          </div>
        )}
      </article>
    </li>
  )
}

/** The progress stream, newest first. */
function ProgressStream({ detail, t, locale }: { detail: ProjectDetail; t: Translate; locale: string }): JSX.Element {
  const ordered = [...detail.progress].sort((left, right) => {
    if (left.date !== right.date) return right.date.localeCompare(left.date)
    return (right.seq ?? 0) - (left.seq ?? 0)
  })
  return (
    <Section title={t('dtProgressTitle')} kicker={format(t('dtProgressCount'), { count: ordered.length })}>
      {ordered.length === 0 ? (
        <div className="dsec-empty">
          <h3 className="dsec-empty-title">{t('dtProgressEmptyTitle')}</h3>
          <p className="dsec-empty-copy">{t('dtProgressEmptyCopy')}</p>
        </div>
      ) : (
        <ol className="prog-stream">
          {ordered.map((entry, index) => (
            <ProgressItem key={`${entry.date}:${entry.seq ?? index}`} entry={entry} index={index} t={t} locale={locale} detail={detail} />
          ))}
        </ol>
      )}
    </Section>
  )
}

/** The four dimensions as four cards with their origin tags. */
function DimensionGrid({ detail, t }: { detail: ProjectDetail; t: Translate }): JSX.Element {
  const values: Record<DimensionKey, string> = {
    achievement: detail.outcome.achievement,
    evidence: detail.outcome.ourProof,
    recognition: detail.outcome.customerRecognition,
    nextMilestone: detail.outcome.milestone,
  }
  return (
    <Section title={t('dtDimensionSection')} kicker={format(t('dimensionCount'), { count: detail.summary.dimensionCount })}>
      <div className="dim-grid-detail">
        {DIMENSIONS.map((key) => {
          const present = values[key] !== ''
          return (
            <div key={key} className="dim-card" data-present={present} data-origin={DIMENSION_ORIGIN[key]}>
              <span className="dim-card-label">{t(DIMENSION_TEXT[key])}</span>
              <span className="dim-card-mark" aria-hidden="true">{present ? '✓' : '✗'}</span>
              <span className="dim-card-value">{present ? values[key] : t('dimMissing')}</span>
              <span className="dim-card-origin">{DIMENSION_ORIGIN[key] === 'auto' ? t('dtDimensionAuto') : t('dtDimensionManual')}</span>
              {present ? null : <span className="dim-card-reason">{t('dtDimensionEmptyReason')}</span>}
            </div>
          )
        })}
      </div>
    </Section>
  )
}

/** The G0 completeness meter: five cells, then the fields themselves. */
function Gate0Meter({ detail, t }: { detail: ProjectDetail; t: Translate }): JSX.Element {
  const checklist: Gate0CheckItem[] = detail.gate0.checklist
  const presentCount = checklist.filter((item) => item.present).length
  const review = detail.gate0.conclusion === ''
    ? t('dtG0Unreviewed')
    : format(t('dtG0ReviewLine'), {
        reviewer: detail.gate0.reviewer === '' ? t('dtUnset') : detail.gate0.reviewer,
        date: detail.gate0.reviewedAt === '' ? t('dtUnset') : detail.gate0.reviewedAt,
        conclusion: detail.gate0.conclusion,
      })
  return (
    <Section title={t('dtG0Title')} kicker={format(t('dtG0FiveRequired'), { present: presentCount })}>
      <div className="g0-meter" role="group" aria-label={t('dtG0Title')}>
        {checklist.map((item) => (
          <div key={item.field} className="g0-cell" data-present={item.present} title={`${t(G0_LABEL[item.field] ?? item.field)}: ${item.present ? t('dtG0Present') : t('dtG0Missing')}`}>
            <span className="g0-cell-mark" aria-hidden="true">{item.present ? '✓' : '✗'}</span>
            <span className="g0-cell-label">{t(G0_LABEL[item.field] ?? item.field)}</span>
          </div>
        ))}
      </div>

      <div className="g0-fields">
        {checklist.map((item) => {
          const label = t(G0_LABEL[item.field] ?? item.field)
          const prose = G0_PROSE.has(item.field)
          return (
            <div key={item.field} className="g0-field" data-present={item.present} data-prose={prose}>
              <span className="g0-field-label">{label}</span>
              {item.present ? (
                <p className="g0-field-value prose">{item.value}</p>
              ) : (
                <p className="g0-field-missing">{t('dtG0Missing')}</p>
              )}
            </div>
          )
        })}
      </div>

      <div className="g0-foot">
        <span className="g0-review" data-empty={detail.gate0.conclusion === ''}>{review}</span>
        {detail.gate0.competitor === '' ? null : <span className="chip">{t('competitor')}：{detail.gate0.competitor}</span>}
      </div>
    </Section>
  )
}

/**
 * A `OrgRecord` field as a display string.
 *
 * `OrgRecord` is the raw wire shape, so every field is optional and nullable.
 * The detail page only ever needs "text or blank", and doing that coercion at
 * each call site is how a `null` reaches a React child and renders nothing.
 */
function orgText(value: string | null | undefined): string {
  return value === null || value === undefined ? '' : value
}

/**
 * Basic information: who the customer is, and how a decision gets made.
 *
 * The detail page used to spread these across three places — the customer's own
 * name was not shown at all, the decision chain sat as one of five G0 meter
 * cells, and the post-POC decision sat beside it. They belong together: "who is
 * this, and who signs off" is one question, and it is the first one a reader new
 * to the project asks.
 *
 * The two decision fields are shown even when empty, with an explicit "not
 * written down" line rather than a blank: an empty decision chain is the finding
 * the whole G0 gate exists to surface, so hiding it would be the one omission
 * this section must not make.
 */
function BasicInfo({ detail, t }: { detail: ProjectDetail; t: Translate }): JSX.Element {
  const summary = detail.summary
  const rows: Array<{ key: string; label: string; value: string }> = [
    { key: 'company', label: t('dtCustomerCompany'), value: orgText(detail.org.company) },
    { key: 'system', label: t('dtCustomerSystem'), value: orgText(detail.org.system) },
    { key: 'department', label: t('dtCustomerDepartment'), value: orgText(detail.org.department) },
    { key: 'owner', label: t('dtOwnerLabel'), value: summary.owner },
    { key: 'tech', label: t('dtCustomerTech'), value: summary.techOwner },
    { key: 'sales', label: t('dtSalesLabel'), value: detail.sales },
    { key: 'sponsor', label: t('dtCustomerSponsor'), value: detail.execSponsor },
    { key: 'amount', label: t('dtAmountLabel'), value: summary.amountWan === 0 ? '' : `${formatWan(summary.amountWan)} ${t('statAmountUnit')}` },
  ]
  return (
    <Section title={t('dtBasicTitle')}>
      <dl className="dt-basic-grid">
        {rows.map((row) => (
          <div key={row.key} className="dt-basic-row" data-empty={row.value === ''}>
            <dt className="dt-basic-label">{row.label}</dt>
            <dd className="dt-basic-value">{row.value === '' ? t('dtUnset') : row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="dt-basic-decisions">
        <Prose
          label={t('dtBasicDecisionChain')}
          value={detail.gate0.decisionChain === '' ? t('dtBasicDecisionChainNone') : detail.gate0.decisionChain}
          t={t}
        />
        <Prose
          label={t('dtBasicPostPoc')}
          value={detail.gate0.postPocDecision === '' ? t('dtBasicPostPocNone') : detail.gate0.postPocDecision}
          t={t}
        />
      </div>
    </Section>
  )
}

/**
 * The second layer: everything that proves one scenario.
 *
 * This is deliberately not on the first screen. The overview answers "which
 * scenarios are unproven"; the evidence, the customer's words and the G3 verdict
 * are what you open once that question has pointed at a row. Putting them all on
 * the overview was the design's original mistake: the page became a wall of proof
 * in which the one red scenario was invisible.
 *
 * The evidence list is assembled from the progress entries that cite this
 * scenario by id, so it can never disagree with the timeline above it.
 */
function ScenarioDetail({ detail, scenarioId, t }: { detail: ProjectDetail; scenarioId: string; t: Translate }): JSX.Element {
  const scenario = detail.plan.scenarios.find((item) => item.id === scenarioId)
  if (scenario === undefined) {
    return (
      <Section title={t('dtScenarioTitle')}>
        <Blank text={t('dtScenarioNotFound')} />
      </Section>
    )
  }
  const tone = scenarioTone(scenario.status)
  // Newest first, matching the timeline: the reader wants the current state of
  // this scenario, not its history.
  const entries = detail.progress
    .filter((entry) => entry.scenarioIds.includes(scenarioId))
    .slice()
    .sort((left, right) => (right.date === left.date ? (right.seq ?? 0) - (left.seq ?? 0) : right.date.localeCompare(left.date)))

  const evidence = entries.flatMap((entry) => entry.evidence.map((item) => ({ ...item, date: entry.date })))
  const latestWithCustomer = entries.find((entry) => entry.customer.syncedWith !== '' || entry.customer.feedback !== '' || entry.customer.recognition !== '')
  const latest = entries[0]

  return (
    <Section title={t('dtScenarioTitle')} kicker={scenario.name}>
      <div className="sd-head" data-tone={tone}>
        <span className="sd-head-no">{scenario.id}</span>
        <span className="sd-head-name">{scenario.name === '' ? t('emptyField') : scenario.name}</span>
        {scenario.status === '' ? null : (
          <span className={`status-pill tone-${tone}`}>
            <span className="status-dot" />
            {t(`dtStatus${SCENARIO_STATUS_KEY[scenario.status] ?? 'NoEvidence'}`)}
          </span>
        )}
      </div>

      <div className="dt-prose" data-empty={scenario.goal === ''}>
        <span className="dt-prose-label">{t('dtScenarioGoal')}</span>
        <p className="dt-prose-body prose">{scenario.goal === '' ? t('emptyField') : scenario.goal}</p>
      </div>

      <div className="plan-block">
        <header className="plan-block-head">
          <h3 className="plan-block-title">{t('dtScenarioEvidence')}</h3>
          <span className="plan-block-note">{format(t('dtPlanScenarioEvidence'), { count: evidence.length })}</span>
        </header>
        {evidence.length === 0 ? (
          <Blank text={t('dtScenarioEvidenceNone')} />
        ) : (
          <ul className="sd-evidence">
            {evidence.map((item, index) => (
              <li key={`${item.title}:${index}`} className="sd-evidence-row">
                <span className="sd-evidence-type">{item.type === '' ? t('dtUnset') : item.type}</span>
                <span className="sd-evidence-title">{item.title === '' ? t('emptyField') : item.title}</span>
                <span className="sd-evidence-date">{item.date}</span>
                {item.link === '' ? null : (
                  <a className="sd-evidence-link" href={item.link} target="_blank" rel="noreferrer noopener">{t('dtPlanScenarioDetail')}</a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="plan-block">
        <header className="plan-block-head">
          <h3 className="plan-block-title">{t('dtScenarioCustomer')}</h3>
        </header>
        {latestWithCustomer === undefined ? (
          <Blank text={t('dtScenarioFeedbackEmpty')} />
        ) : (
          <div className="sd-customer">
            <span className="sd-customer-sync">
              {t('dtScenarioSyncedWith')}：{latestWithCustomer.customer.syncedWith === '' ? t('dtUnset') : latestWithCustomer.customer.syncedWith}
              <span className="sd-customer-date">{latestWithCustomer.date}</span>
            </span>
            <p className="sd-customer-feedback prose">{latestWithCustomer.customer.feedback === '' ? t('dtUnset') : latestWithCustomer.customer.feedback}</p>
            <span className={`status-pill tone-${recognitionTone(latestWithCustomer.customer.recognition)}`}>
              <span className="status-dot" />
              {latestWithCustomer.customer.recognition === '' ? t('dtUnset') : latestWithCustomer.customer.recognition}
            </span>
          </div>
        )}
      </div>

      {latest === undefined ? null : (
        <div className="plan-block">
          <header className="plan-block-head">
            <h3 className="plan-block-title">{t('dtScenarioGate3')}</h3>
          </header>
          <div className="sd-gate3">
            <span className={`status-pill tone-${latest.gate3_1 === '可证明' ? 'green' : 'amber'}`}>
              <span className="status-dot" />G3-1 {latest.gate3_1 === '' ? t('dtUnset') : latest.gate3_1}
            </span>
            <span className={`status-pill tone-${latest.gate3_2 === '已确认' ? 'green' : 'amber'}`}>
              <span className="status-dot" />G3-2 {latest.gate3_2 === '' ? t('dtUnset') : latest.gate3_2}
            </span>
            {/* The pair only means something together: provable but unconfirmed is
                exactly rule 10, so it is named here instead of left to inference. */}
            {latest.gate3_1 === '可证明' && latest.gate3_2 !== '已确认' ? <span className="sd-gate3-note">R10</span> : null}
          </div>
        </div>
      )}

      <div className="plan-block">
        <header className="plan-block-head">
          <h3 className="plan-block-title">{t('dtScenarioLinked')}</h3>
          <span className="plan-block-note">{format(t('dtProgressCountLabel'), { count: entries.length })}</span>
        </header>
        {entries.length === 0 ? (
          <Blank text={t('dtScenarioLinkedNone')} />
        ) : (
          <ul className="sd-linked">
            {entries.map((entry) => (
              <li key={entry.seq ?? entry.date} className="sd-linked-row">
                <span className="sd-linked-date">{entry.date}</span>
                <span className="sd-linked-seq">#{entry.seq ?? '—'}</span>
                <span className="sd-linked-change">{entry.change === '' ? t('dtUnset') : entry.change}</span>
                <span className="sd-linked-actual">{entry.actual === '' ? t('emptyField') : entry.actual}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  )
}

/** The plan: criteria table, numbered scenarios, risks with severity, prose meta. */
/**
 * The page banner: what this project is, with the two numbers that decide how
 * much attention it deserves.
 *
 * The design puts identity in a banner rather than a persistent rail: the body
 * below is a fixed two-column contract, and a 316px rail would take that width
 * away from the commitments column at every gate.
 */
function PageHeader({ props }: { props: DetailProps }): JSX.Element {
  const { detail, t, position, onPrev, onNext, onBack } = props
  const summary = detail.summary
  const org = [orgText(detail.org.system), orgText(detail.org.company), summary.pocType].filter((part) => part !== '')
  const owner = summary.owner === '' ? '' : `${t('dtOwnerLabel')} ${summary.owner}`

  return (
    <header className="dt-header">
      <div className="dt-header-main">
        <button type="button" className="btn btn-small dt-header-back" onClick={onBack}>{t('back')}</button>
        <h1 className="dt-header-title">{summary.name}</h1>
        <div className="dt-header-meta">
          <span className="dt-header-id mono">{summary.pocId}</span>
          {org.length === 0 ? null : <span className="dt-header-org">{org.join(' · ')}</span>}
          {owner === '' ? null : <span className="dt-header-org">{owner}</span>}
        </div>
      </div>
      <div className="dt-header-side">
        <div className="dt-header-pills">
          <span className="status-pill tone-blue">
            <span className="status-dot" />
            {summary.closed ? t('stageClosed') : summary.stageLabel === '' ? t('stageUnknown') : summary.stageLabel}
          </span>
          {summary.status === '' ? null : <span className="status-pill tone-slate">{summary.status}</span>}
          {summary.priority === '' ? null : (
            <span className={`status-pill tone-${summary.priority === 'normal' ? 'slate' : 'amber'}`}>{t(priorityLabelKey(summary.priority))}</span>
          )}
        </div>
        <div className="dt-header-amount">
          <span className="dt-header-amount-label">{t('dtAmountLabel')}</span>
          {summary.amountWan === 0 ? (
            <span className="dt-header-amount-value" data-empty="true">{t('dtUnset')}</span>
          ) : (
            <span className="dt-header-amount-value">
              {formatWan(summary.amountWan)}
              <span className="dt-header-amount-unit">{t('statAmountUnit')}</span>
            </span>
          )}
        </div>
      </div>
      <nav className="dt-header-nav" aria-label={t('dtRailTitle')}>
        <button type="button" className="btn btn-small" disabled={onPrev === null} onClick={onPrev ?? undefined}>← {t('dtPrevProject')}</button>
        <span className="dt-header-position">{format(t('dtPosition'), { index: position.index, total: position.total })}</span>
        <button type="button" className="btn btn-small" disabled={onNext === null} onClick={onNext ?? undefined}>{t('dtNextProject')} →</button>
      </nav>
    </header>
  )
}

/**
 * Gate 0 as a 2×3 card grid: the six questions that decide whether the project
 * is worth doing, each answered in its own cell.
 *
 * A five-cell meter could say *how many* answers were missing but not *which
 * question* — and "no decision chain" and "no competitor" are different problems
 * with different fixes. The design is explicit that this block is a grid.
 */
function Gate0Grid({ detail, t }: { detail: ProjectDetail; t: Translate }): JSX.Element {
  const gate0 = detail.gate0
  const answered = gate0.checklist.filter((item) => item.present).length
  const cards: Array<{ key: string; label: string; value: string; present: boolean; prose: boolean }> = [
    { key: 'why_customer', label: t('whyCustomerTest'), value: gate0.whyCustomer, present: gate0.whyCustomer !== '', prose: true },
    { key: 'why_us', label: t('whyWeTest'), value: gate0.whyUs, present: gate0.whyUs !== '', prose: true },
    { key: 'post_poc_decision', label: t('postPocDecision'), value: gate0.postPocDecision, present: gate0.postPocDecision !== '', prose: false },
    { key: 'decision_chain', label: t('decisionChain'), value: gate0.decisionChain, present: gate0.decisionChain !== '', prose: false },
    { key: 'competitor', label: t('competitor'), value: gate0.competitor, present: gate0.competitor !== '', prose: false },
    {
      key: 'review',
      label: t('dtG0ReviewTitle'),
      value: gate0.conclusion === '' ? '' : [gate0.conclusion, gate0.reviewer, gate0.reviewedAt].filter((part) => part !== '').join(' · '),
      present: gate0.conclusion !== '',
      prose: false,
    },
  ]
  return (
    <Section title={t('dtG0GridTitle')} kicker={format(t('dtG0Answered'), { answered, total: gate0.checklist.length })}>
      <div className="g0-grid">
        {cards.map((card) => (
          <div key={card.key} className="g0-card" data-present={card.present} data-prose={card.prose}>
            <div className="g0-card-head">
              <span className="g0-card-label">{card.label}</span>
              {card.present ? null : <span className="g0-card-missing">{t('dtG0Missing')}</span>}
            </div>
            <p className="g0-card-body" data-empty={!card.present}>{card.present ? card.value : t('emptyField')}</p>
          </div>
        ))}
      </div>
      {gate0.missing.length === 0 ? null : (
        <p className="g0-grid-note">{format(t('dtG0MissingNote'), { count: gate0.missing.length })}</p>
      )}
    </Section>
  )
}

/** The success criteria, as a table with the ledger's derived status. */
function CriteriaPanel({ detail, t }: { detail: ProjectDetail; t: Translate }): JSX.Element {
  const plan = detail.plan
  return (
    <Section title={t('dtPlanCriteria')} kicker={plan.criteria.length === 0 ? undefined : format(t('dtPlanCriteriaCount'), { count: plan.criteria.length })}>
        {plan.criteria.length === 0 ? (
          <Blank text={t('dtPlanCriteriaNone')} />
        ) : (
          <table className="plan-criteria">
            <thead>
              <tr>
                <th>{t('dtPlanCriteria')}</th>
                <th>{t('dtPlanMetric')}</th>
                <th>{t('dtPlanBaseline')}</th>
                <th>{t('dtPlanTarget')}</th>
                <th>{t('dtPlanCriteriaStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {plan.criteria.map((criterion, index) => {
                // An unset status reads as 未验证 rather than as blank: for a
                // criterion, "nobody has shown this" is the accurate default, and
                // an empty cell would be read as "fine".
                const status = criterion.status
                const tone = criterionTone(status)
                return (
                  <tr key={criterion.id === '' ? `${criterion.name}:${index}` : criterion.id}>
                    <td className="plan-criterion-name">{criterion.name === '' ? t('emptyField') : criterion.name}</td>
                    <td>{criterion.metric === '' ? t('emptyField') : criterion.metric}</td>
                    <td className="plan-criterion-num">{criterion.baseline === '' ? '—' : criterion.baseline}</td>
                    <td className="plan-criterion-target">{criterion.target === '' ? '—' : criterion.target}</td>
                    <td className="plan-criterion-status">
                      <span className={`status-pill tone-${tone}`}>
                        <span className="status-dot" />
                        {t(`dtCrit${CRITERION_STATUS_KEY[status] ?? 'Unverified'}`)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
    </Section>
  )
}

/**
 * The test scenarios, each row carrying its derived state and a way in.
 *
 * The left edge colour IS the finding: 无证据 is the only red, because it means
 * "claimed, never backed". The entry point matters as much — without a visible
 * "详情" the second layer exists but nobody knows to look for it.
 */
function ScenarioPanel({ detail, t, onOpenScenario }: { detail: ProjectDetail; t: Translate; onOpenScenario: (id: string) => void }): JSX.Element {
  const plan = detail.plan
  return (
    <Section title={t('dtPlanScenarios')} kicker={plan.scenarios.length === 0 ? undefined : format(t('dtPlanScenariosCount'), { count: plan.scenarios.length })}>
        {plan.scenarios.length === 0 ? (
          <Blank text={t('dtPlanScenariosNone')} />
        ) : (
          <ol className="plan-scenarios">
            {plan.scenarios.map((scenario, index) => {
              const tone = scenarioTone(scenario.status)
              // The derived status decides the row's colour, and it is also the
              // only thing on this row that can be acted on: a red row is a
              // scenario someone claimed and never backed.
              return (
                <li key={scenario.id === '' ? `${scenario.name}:${index}` : scenario.id} className="plan-scenario" data-tone={tone}>
                  <span className="plan-scenario-no">{String(index + 1).padStart(2, '0')}</span>
                  <span className="plan-scenario-body">
                    <span className="plan-scenario-name">{scenario.name === '' ? t('emptyField') : scenario.name}</span>
                    {scenario.goal === '' ? null : (
                      <span className="plan-scenario-goal">
                        <span className="plan-scenario-goal-label">{t('dtPlanScenarioGoal')}</span>
                        {scenario.goal}
                      </span>
                    )}
                  </span>
                  <span className="plan-scenario-tail">
                    {scenario.status === '' ? null : (
                      <>
                        <span className="plan-scenario-glyph" aria-hidden="true">{scenarioGlyph(scenario.status)}</span>
                        <span className={`status-pill tone-${tone}`}>
                          <span className="status-dot" />
                          {t(`dtStatus${SCENARIO_STATUS_KEY[scenario.status] ?? 'NoEvidence'}`)}
                        </span>
                        {scenario.evidenceCount === 0 ? null : (
                          <span className="plan-scenario-evidence">{format(t('dtPlanScenarioEvidence'), { count: scenario.evidenceCount })}</span>
                        )}
                      </>
                    )}
                    {/* The entry point to layer two. Without it the detail view
                        exists but nobody knows to look for it. */}
                    {scenario.id === '' ? null : (
                      <button
                        type="button"
                        className="plan-scenario-open"
                        onClick={() => onOpenScenario(scenario.id)}
                        aria-label={`${t('dtPlanScenarioDetail')}: ${scenario.name}`}
                      >
                        {t('dtPlanScenarioDetail')} ›
                      </button>
                    )}
                  </span>
                </li>
              )
            })}
          </ol>
        )}
    </Section>
  )
}

/** The tracked risks, with the severity the ledger records. */
function RiskPanel({ detail, t }: { detail: ProjectDetail; t: Translate }): JSX.Element {
  const risks = detail.plan.risks
  return (
    <Section title={t('dtPlanRisks')} kicker={risks.length === 0 ? undefined : format(t('dtPlanRisksCount'), { count: risks.length })}>
      {risks.length === 0 ? (
        <Blank text={t('dtPlanRisksNone')} />
      ) : (
        <ul className="plan-risks">
          {risks.map((risk, index) => (
            <li key={`${risk.name}:${index}`} className="plan-risk" data-tone={riskTone(risk.level)}>
              <span className="plan-risk-dot" aria-hidden="true" />
              <span className="plan-risk-text">
                <span className="plan-risk-name">{risk.name === '' ? t('emptyField') : risk.name}</span>
                {risk.level === '' ? null : <span className="plan-risk-level">{risk.level}</span>}
                {risk.mitigation === '' ? null : <span className="plan-risk-mitigation">{t('dtPlanMitigation')}：{risk.mitigation}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

/**
 * The closing block: what happens next, who owns it, and by when.
 *
 * Rule 11 is "achieved, nothing followed" — the ledger's highest-value gap — so
 * the page ends by asking for exactly that rather than trailing off into prose.
 */
function NextActionsPanel({ detail, t }: { detail: ProjectDetail; t: Translate }): JSX.Element {
  const outcome = detail.outcome
  const newestNext = detail.progress.find((entry) => entry.next.goal !== '' || entry.next.owner !== '' || entry.next.deadline !== '')
  const rows: Array<{ goal: string; owner: string; deadline: string; status: string; tone: string }> = []
  if (outcome.milestone !== '' || outcome.businessOwner !== '' || outcome.businessDeadline !== '') {
    rows.push({
      goal: outcome.milestone,
      owner: outcome.businessOwner,
      deadline: outcome.businessDeadline,
      status: outcome.businessStatus,
      tone: outcome.businessStatus === '已进入下一里程碑' ? 'green' : outcome.businessStatus === '' ? 'slate' : 'amber',
    })
  }
  if (newestNext !== undefined) {
    // The entry's own next step is a plan, not a tracked milestone: say so rather
    // than smuggling the entry's date into a status column.
    rows.push({
      goal: newestNext.next.goal,
      owner: newestNext.next.owner,
      deadline: newestNext.next.deadline,
      status: t('dtStatusNotStarted'),
      tone: 'slate',
    })
  }
  return (
    <Section title={t('dtNextActionsTitle')} kicker={t('dtNextActionsKicker')}>
      {rows.length === 0 ? (
        <Blank text={t('dtNextActionsNone')} />
      ) : (
        <table className="next-table">
          <thead>
            <tr>
              <th>{t('dtNextGoal')}</th>
              <th>{t('dtNextOwner')}</th>
              <th>{t('dtNextDeadline')}</th>
              <th>{t('dtNextStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.goal}:${index}`}>
                <td className="next-goal">{row.goal === '' ? t('emptyField') : row.goal}</td>
                <td>{row.owner === '' ? '—' : row.owner}</td>
                <td className="next-deadline">{row.deadline === '' ? '—' : row.deadline}</td>
                <td>
                  <span className={`status-pill tone-${row.tone}`}>
                    <span className="status-dot" />
                    {row.status === '' ? t('dtUnset') : row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  )
}

export function DetailPage(props: DetailProps): JSX.Element {
  const { detail, t, locale } = props
  /**
   * Which scenario is open, or `null` for the overview.
   *
   * Deliberately local state rather than a route: opening a scenario is a
   * question asked of the current project ("why is this row red?"), and making
   * it a URL would let a refresh land on a scenario of a project that has since
   * been closed or renamed.
   */
  const [scenarioId, setScenarioId] = useState<string | null>(null)

  // A scenario drill-down replaces the body. The banner stays, because the
  // identity of the project is the context the evidence is read in.
  if (scenarioId !== null) {
    return (
      <div className="dt-shell">
        <PageHeader props={props} />
        <main className="dt-body">
          <button type="button" className="sd-back" onClick={() => setScenarioId(null)}>{t('dtScenarioBack')}</button>
          <ScenarioDetail detail={detail} scenarioId={scenarioId} t={t} />
        </main>
      </div>
    )
  }

  return (
    <div className="dt-shell">
      <PageHeader props={props} />
      <main className="dt-body">
        {/*
         * A FIXED two-column contract at every gate: commitments left, the record
         * right, next actions closing across both. Only the content changes with
         * the gate, never the position.
         *
         * An earlier version reordered and collapsed sections per gate, which put
         * the scenario status — the one thing a G3/G4 reader opens the page for —
         * inside a folded "other sections" block.
         */}
        <div className="dt-columns">
          <div className="dt-col-main">
            <Gate0Grid detail={detail} t={t} />
            <CriteriaPanel detail={detail} t={t} />
            <ScenarioPanel detail={detail} t={t} onOpenScenario={setScenarioId} />
          </div>
          <div className="dt-col-side">
            <BasicInfo detail={detail} t={t} />
            <ProgressStream detail={detail} t={t} locale={locale} />
            <RiskPanel detail={detail} t={t} />
          </div>
        </div>
        <NextActionsPanel detail={detail} t={t} />
      </main>
    </div>
  )
}
