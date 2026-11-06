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

import type { ReactNode } from 'react'
import type { DimensionKey, Gate0CheckItem, ProgressView, ProjectDetail } from '../types.js'
import { DIMENSIONS, STAGES } from '../types.js'
import { InlineMeter } from './charts.jsx'
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

/** Format 万元 with thousands separators. */
function formatWan(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return rounded.toLocaleString('zh-CN', { maximumFractionDigits: 1 })
}

/** A `YYYY-MM-DD` date for the active locale. */
function formatDate(value: string | null, locale: string): string {
  if (value === null || value === '') return ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const stamp = new Date(`${value}T00:00:00`)
  if (Number.isNaN(stamp.getTime())) return value
  return stamp.toLocaleDateString(locale.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

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

/** The leading percentage in a completion string, or `null`. */
function completionRatio(value: string): number | null {
  const match = value.match(/^(\d+(?:\.\d+)?)\s*%/u)
  if (match === null) return null
  const parsed = Number(match[1])
  if (!Number.isFinite(parsed)) return null
  return Math.min(1, Math.max(0, parsed / 100))
}

/** A section frame: heading, optional kicker, and a body. */
function Section({ title, kicker, children }: { title: string; kicker?: string; children: ReactNode }): JSX.Element {
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
          {summary.priority === '' ? null : <span className="status-pill tone-amber">{summary.priority}</span>}
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
          <RailMeta label={t('dtOwnerLabel')} value={summary.owner} t={t} />
          <RailMeta label={t('dtTechOwnerLabel')} value={summary.techOwner} t={t} />
          <RailMeta label={t('dtSalesLabel')} value={detail.sales} t={t} />
          <RailMeta label={t('dtSponsorLabel')} value={detail.execSponsor} t={t} />
          <RailMeta label={t('type')} value={summary.pocType} t={t} />
          <RailMeta label={t('dtStageSinceLabel')} value={summary.stageSince === null ? '' : `${formatDate(summary.stageSince, locale)}${summary.daysInStage === null ? '' : ` · ${format(t('daysInStage'), { days: summary.daysInStage })}`}`} t={t} />
          <RailMeta label={t('dtPriorityLabel')} value={summary.priority} t={t} />
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
function ProgressItem({ entry, index, t, locale }: { entry: ProgressView; index: number; t: Translate; locale: string }): JSX.Element {
  const tone = recognitionTone(entry.customer.recognition)
  const ratio = completionRatio(entry.completion)
  const hasNext = entry.next.goal !== '' || entry.next.owner !== '' || entry.next.deadline !== ''
  return (
    <li className="prog-item" data-tone={tone} data-latest={index === 0}>
      <div className="prog-gutter" aria-hidden="true">
        <span className="prog-node" data-tone={tone} />
      </div>
      <article className="prog-card">
        <header className="prog-head">
          <time className="prog-date" dateTime={entry.date}>{formatDate(entry.date, locale) || '—'}</time>
          <span className="prog-type">{entry.type === '' ? t('progressTypeUnset') : entry.type}</span>
          {entry.seq === null ? null : <span className="prog-seq">{format(t('dtProgressSeq'), { seq: entry.seq })}</span>}
          {ratio === null ? (
            entry.completion === '' ? null : <span className="prog-chip">{t('dtProgressCompletion')} {entry.completion}</span>
          ) : (
            <span className="prog-meter">
              <span className="prog-meter-label">{t('dtProgressCompletion')}</span>
              <InlineMeter value={ratio} max={1} tone={ratio >= 1 ? 'green' : 'blue'} />
              <span className="prog-meter-value">{entry.completion}</span>
            </span>
          )}
        </header>

        {entry.goal === '' && entry.actual === '' ? null : (
          <div className="prog-pair">
            {entry.goal === '' ? null : (
              <div className="prog-goal">
                <span className="prog-pair-label">{t('dtProgressGoal')}</span>
                <span className="prog-pair-value">{entry.goal}</span>
              </div>
            )}
            {entry.actual === '' ? null : (
              <div className="prog-actual">
                <span className="prog-pair-label">{t('dtProgressActual')}</span>
                <span className="prog-pair-value">{entry.actual}</span>
              </div>
            )}
          </div>
        )}

        {entry.items.length === 0 ? null : (
          <div className="prog-scope">
            <span className="prog-scope-label">{t('dtProgressScope')}</span>
            <div className="chip-row">{entry.items.map((item, itemIndex) => <span key={`${item}:${itemIndex}`} className="chip">{item}</span>)}</div>
          </div>
        )}

        <div className="prog-evidence">
          <span className="prog-block-label">{t('dtProgressEvidence')}</span>
          {entry.evidence.length === 0 ? (
            <span className="prog-missing">{t('dtProgressEvidenceNone')}</span>
          ) : (
            <div className="chip-row">
              {entry.evidence.map((item, itemIndex) => {
                const label = `${item.type === '' ? '' : `${item.type} · `}${item.title === '' ? t('emptyField') : item.title}`
                return item.link === '' ? (
                  <span key={`${item.title}:${itemIndex}`} className="chip">{label}</span>
                ) : (
                  <a key={`${item.title}:${itemIndex}`} className="chip prog-evidence-link" href={item.link} target="_blank" rel="noreferrer" title={item.link}>
                    {label}
                    <span className="prog-external" aria-hidden="true">↗</span>
                  </a>
                )
              })}
            </div>
          )}
        </div>

        <div className="prog-customer">
          <span className="prog-block-label">{t('dtProgressCustomer')}</span>
          {entry.customer.syncedWith === '' ? (
            <span className="prog-missing">{t('dtProgressCustomerNone')}</span>
          ) : (
            <span className="chip">{entry.customer.syncedWith}</span>
          )}
          {entry.customer.recognition === '' ? null : (
            <span className={`status-pill tone-${tone}`}><span className="status-dot" />{entry.customer.recognition}</span>
          )}
          {entry.gate3_1 === '' ? null : <span className="chip">{t('gate3_1Label')}：{entry.gate3_1}</span>}
          {entry.gate3_2 === '' ? null : <span className="chip">{t('gate3_2Label')}：{entry.gate3_2}</span>}
        </div>

        {entry.customer.feedback === '' ? null : (
          <div className="prog-feedback">
            <span className="prog-block-label">{t('dtProgressFeedback')}</span>
            <span className="prog-feedback-copy prose">{entry.customer.feedback}</span>
          </div>
        )}

        {hasNext ? (
          <div className="prog-next">
            <span className="prog-next-label">{t('dtProgressNext')}</span>
            <div className="prog-next-body">
              {entry.next.goal === '' ? null : <span className="prog-next-goal">{entry.next.goal}</span>}
              {entry.next.owner === '' ? null : <span className="chip">@ {entry.next.owner}</span>}
              {entry.next.deadline === '' ? null : <span className="chip">{t('dtProgressDeadline')} {formatDate(entry.next.deadline, locale)}</span>}
            </div>
          </div>
        ) : (
          <div className="prog-next prog-next-empty">
            <span className="prog-missing">{t('dtProgressNextNone')}</span>
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
            <ProgressItem key={`${entry.date}:${entry.seq ?? index}`} entry={entry} index={index} t={t} locale={locale} />
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

/** The plan: criteria table, numbered scenarios, risks with severity, prose meta. */
function PlanPanels({ detail, t }: { detail: ProjectDetail; t: Translate }): JSX.Element {
  const plan = detail.plan
  return (
    <Section title={t('dtPlanTitle')}>
      <div className="plan-meta">
        <Prose label={t('dtPlanPain')} value={plan.customerPain} t={t} />
        <Prose label={t('dtPlanRecognition')} value={plan.expectedRecognition} t={t} />
        <Prose label={t('dtPlanEdge')} value={plan.ourEdge} t={t} />
      </div>

      <div className="plan-strip">
        <span className="plan-strip-item">
          <span className="plan-strip-label">{t('dtPlanWindow')}</span>
          <span className="plan-strip-value">{plan.timelineStart === '' && plan.timelineEnd === '' ? t('dtUnset') : `${plan.timelineStart === '' ? '—' : plan.timelineStart} → ${plan.timelineEnd === '' ? '—' : plan.timelineEnd}`}</span>
        </span>
        <span className="plan-strip-item">
          <span className="plan-strip-label">{t('dtPlanGate1')}</span>
          <span className={`status-pill tone-${plan.gate1Conclusion === '通过' ? 'green' : 'slate'}`}><span className="status-dot" />{plan.gate1Conclusion === '' ? t('dtUnset') : plan.gate1Conclusion}</span>
        </span>
        <span className="plan-strip-item">
          <span className="plan-strip-label">{t('dtPlanGate2')}</span>
          <span className={`status-pill tone-${plan.gate2Ready === 'Ready' ? 'green' : plan.gate2Ready === '' ? 'slate' : 'amber'}`}><span className="status-dot" />{plan.gate2Ready === '' ? t('dtUnset') : plan.gate2Ready}</span>
        </span>
        {plan.reportNodes.length === 0 ? null : (
          <span className="plan-strip-item">
            <span className="plan-strip-label">{t('dtPlanReportNodes')}</span>
            <span className="chip-row">{plan.reportNodes.map((node, index) => <span key={`${node}:${index}`} className="chip">{node}</span>)}</span>
          </span>
        )}
      </div>

      <div className="plan-block">
        <header className="plan-block-head">
          <h3 className="plan-block-title">{t('dtPlanCriteria')}</h3>
          <span className="plan-block-note">{plan.criteria.length === 0 ? t('dtPlanCriteriaNone') : format(t('dtPlanCriteriaCount'), { count: plan.criteria.length })}</span>
        </header>
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
              </tr>
            </thead>
            <tbody>
              {plan.criteria.map((criterion, index) => (
                <tr key={`${criterion.name}:${index}`}>
                  <td className="plan-criterion-name">{criterion.name === '' ? t('emptyField') : criterion.name}</td>
                  <td>{criterion.metric === '' ? t('emptyField') : criterion.metric}</td>
                  <td className="plan-criterion-num">{criterion.baseline === '' ? '—' : criterion.baseline}</td>
                  <td className="plan-criterion-target">{criterion.target === '' ? '—' : criterion.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="plan-block">
        <header className="plan-block-head">
          <h3 className="plan-block-title">{t('dtPlanScenarios')}</h3>
          <span className="plan-block-note">{plan.scenarios.length === 0 ? t('dtPlanScenariosNone') : format(t('dtPlanScenariosCount'), { count: plan.scenarios.length })}</span>
        </header>
        {plan.scenarios.length === 0 ? (
          <Blank text={t('dtPlanScenariosNone')} />
        ) : (
          <ol className="plan-scenarios">
            {plan.scenarios.map((scenario, index) => (
              <li key={`${scenario}:${index}`} className="plan-scenario">
                <span className="plan-scenario-no">{String(index + 1).padStart(2, '0')}</span>
                <span className="plan-scenario-text">{scenario}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="plan-block">
        <header className="plan-block-head">
          <h3 className="plan-block-title">{t('dtPlanRisks')}</h3>
          <span className="plan-block-note">{plan.risks.length === 0 ? t('dtPlanRisksNone') : format(t('dtPlanRisksCount'), { count: plan.risks.length })}</span>
        </header>
        {plan.risks.length === 0 ? (
          <Blank text={t('dtPlanRisksNone')} />
        ) : (
          <ul className="plan-risks">
            {plan.risks.map((risk, index) => (
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
      </div>
    </Section>
  )
}

/** The outcome: three prose columns, the milestone callout, and the meta row. */
function OutcomePanel({ detail, t }: { detail: ProjectDetail; t: Translate }): JSX.Element {
  const outcome = detail.outcome
  const hasMilestone = outcome.milestone !== ''
  return (
    <Section title={t('dtOutcomeTitle')}>
      <div className="out-triple">
        <Prose label={t('dtOutcomeProved')} value={outcome.proved} t={t} />
        <Prose label={t('dtOutcomeRecognized')} value={outcome.recognized} t={t} />
        <Prose label={t('dtOutcomeNext')} value={outcome.nextBusiness} t={t} />
      </div>

      <div className="out-milestone" data-present={hasMilestone}>
        <span className="out-milestone-label">{t('dtOutcomeMilestone')}</span>
        {hasMilestone ? (
          <span className="out-milestone-text">{outcome.milestone}</span>
        ) : (
          <span className="out-milestone-missing">{t('dtOutcomeMilestoneNone')}</span>
        )}
        {hasMilestone ? (
          <div className="out-milestone-meta">
            {outcome.businessOwner === '' ? null : <span className="chip">{format(t('dtOutcomeMilestoneOwner'), { owner: outcome.businessOwner })}</span>}
            {outcome.businessDeadline === '' ? null : <span className="chip">{format(t('dtOutcomeMilestoneDeadline'), { date: outcome.businessDeadline })}</span>}
            {outcome.businessStatus === '' ? null : <span className="chip">{format(t('dtOutcomeMilestoneStatus'), { status: outcome.businessStatus })}</span>}
          </div>
        ) : null}
      </div>

      <div className="out-meta">
        <Prose label={t('dtOutcomeProof')} value={outcome.ourProof} t={t} />
        <Prose label={t('dtOutcomeRemaining')} value={outcome.remainingRisks} t={t} />
        <Prose label={t('dtOutcomeOverall')} value={outcome.overall} t={t} />
        <Prose label={t('dtOutcomeReviewed')} value={outcome.reviewedAt} t={t} />
      </div>
    </Section>
  )
}

/** The detail page: the rail on the left, the reading pane on the right. */
export function DetailPage(props: DetailProps): JSX.Element {
  const { detail, t, locale } = props
  return (
    <div className="dt-page">
      <IdentityRail props={props} />
      <main className="dt-pane">
        <ProgressStream detail={detail} t={t} locale={locale} />
        <DimensionGrid detail={detail} t={t} />
        <Gate0Meter detail={detail} t={t} />
        <PlanPanels detail={detail} t={t} />
        <OutcomePanel detail={detail} t={t} />
      </main>
    </div>
  )
}
