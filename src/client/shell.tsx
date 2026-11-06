/**
 * The console shell: page state, filtering, sorting, keyboard, and page chrome.
 *
 * The shell owns everything that decides *what is shown*; each view module owns
 * *how it is drawn*. That split is what makes the three overview modes honest:
 * the filter + sort pipeline runs once here, and the cards, the board and the
 * table all receive the same already-processed list. A mode switch therefore
 * cannot change which projects are visible, and the counts in the charts and the
 * counts in the list can never disagree.
 *
 * State policy:
 * - The snapshot comes from the Host and replaces itself in place on refresh.
 * - Filters, search and the keyboard cursor are session state: they are cleared
 *   when the page unmounts, because a stale filter is a trap.
 * - View mode and sort order are preferences and survive a reload.
 * - The detail page keeps its own record; the list stays in memory so prev/next
 *   navigation is instant and never refetches.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MutableRefObject } from 'react'
import {
  DIMENSIONS,
  STAGES,
  type GapItem,
  type GlobalTimeline,
  type PortfolioAnalysis,
  type ProjectDetail,
  type ProjectSummary,
  type RefreshInterval,
  type RiskBoard,
  type Snapshot,
  type SortKey,
  type ViewMode,
} from '../types.js'
import { CUSTOM_MINUTES_MAX, CUSTOM_MINUTES_MIN } from '../types.js'
import { ActionError } from './api.js'
import type { ClientApi } from './api.js'
import type { ClientLocaleLike } from './contracts.js'
import {
  DEFAULT_PREFERENCE,
  DEFAULT_VIEW_PREFERENCE,
  clampMinutes,
  intervalMs,
  readPreference,
  readViewPreference,
  writePreference,
  writeViewPreference,
  type RefreshPreference,
  type ViewPreference,
} from './preferences.js'
import { DetailPage } from './detail.jsx'
import { OverviewPage } from './overview.jsx'
import { RiskBoardPage, TimelinePage } from './insights.jsx'
import { CONSOLE_CSS } from './styles.js'
import { format, type Translate } from './text.js'
import {
  NO_FILTERS,
  activeFilterCount,
  filtersAreEmpty,
  type ActiveFilters,
  type FilterOption,
  type FilterOptions,
} from './view-contract.js'

/** Which surface the console shows. */
type Page =
  | { kind: 'overview' }
  | { kind: 'detail'; pocId: string }
  | { kind: 'risks' }
  | { kind: 'timeline' }

/** Props the `main` slot passes through; the console owns its own data. */
export interface WorkDashboardPageProps {
  api: ClientApi
  locale: ClientLocaleLike
  t: Translate
}

/** The sidebar glyph: a board of layered panels, sized by the sidebar slot. */
export function SidebarGlyph({ size = 18 }: { size?: number; active?: boolean }): JSX.Element {
  return (
    <svg className="wd-glyph" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="15" rx="3.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="6" y="8" width="5.4" height="3.6" rx="1.2" fill="currentColor" opacity="0.85" />
      <rect x="12.6" y="8" width="5.4" height="3.6" rx="1.2" fill="currentColor" opacity="0.35" />
      <rect x="6" y="13" width="12" height="3.4" rx="1.2" fill="currentColor" opacity="0.5" />
    </svg>
  )
}

/** A `date` (or ISO stamp) rendered for the active locale; `''` stays `''`. */
export function formatStamp(value: string | null, locale: string, withTime = false): string {
  if (value === null || value === '') return ''
  const stamp = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(stamp.getTime())) return value
  const zh = locale.toLowerCase().startsWith('zh')
  return stamp.toLocaleString(zh ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

/** A wall-clock `HH:MM` for the "refreshed at" status text. */
function clockOf(value: string | null, locale: string): string {
  if (value === null) return ''
  const stamp = new Date(value)
  if (Number.isNaN(stamp.getTime())) return ''
  return stamp.toLocaleTimeString(locale.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })
}

/** Format 万元 with thousands separators. */
export function formatWan(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return rounded.toLocaleString('zh-CN', { maximumFractionDigits: 1 })
}

/** Map a Host error onto a dictionary key, keeping the Host message as detail. */
export function errorText(t: Translate, error: unknown): string {
  if (error instanceof ActionError) {
    const key = `error.${error.code.replace(/^(skillre-)?work-dashboard\//, '')}`
    const translated = t(key)
    // `t` returns the key itself when a dictionary entry is missing, so an
    // unknown code falls back to the Host's own (already user-facing) message.
    return translated === key ? error.message : translated
  }
  if (error instanceof Error) return error.message
  return t('error.failed')
}

/** The stage label for a raw stage id, via the dictionary. */
function stageLabel(t: Translate, stage: string): string {
  if (stage === 'closed') return t('stageClosed')
  if (stage === 'unknown') return t('stageUnknown')
  if ((STAGES as readonly string[]).includes(stage)) return t(`stage${stage}`)
  return stage
}

/**
 * Derive every filter option from the snapshot.
 *
 * Options are derived once and reused by every chip group, and each carries its
 * own count so an option that would empty the list can still be offered with an
 * honest "0". Derived from the raw snapshot, not the filtered list, so choosing
 * one filter never removes the option needed to undo it.
 */
function buildFilterOptions(snapshot: Snapshot | null): FilterOptions {
  const projects = snapshot?.projects ?? []
  const count = (pick: (project: ProjectSummary) => string, value: string): number =>
    projects.filter((project) => pick(project) === value).length

  const systems = new Map<string, FilterOption>()
  const companies = new Map<string, FilterOption>()
  const stages = new Map<string, FilterOption>()
  const statuses = new Map<string, FilterOption>()
  const types = new Map<string, FilterOption>()

  const bump = (map: Map<string, FilterOption>, value: string, label: string): void => {
    const existing = map.get(value)
    if (existing === undefined) map.set(value, { value, label, count: 1 })
    else existing.count += 1
  }

  for (const project of projects) {
    if (project.system !== '') bump(systems, project.system, project.system)
    if (project.company !== '') bump(companies, project.company, project.company)
    const stageKey = project.closed ? 'closed' : project.stage ?? 'unknown'
    bump(stages, stageKey, stageLabel(snapshotT, stageKey))
    if (project.status !== '') bump(statuses, project.status, project.status)
    if (project.pocType !== '') bump(types, project.pocType, project.pocType)
  }

  // The stage group always offers all five gates plus the sentinels, so the
  // funnel and the chips describe the same vocabulary.
  for (const stage of STAGES) {
    if (!stages.has(stage)) stages.set(stage, { value: stage, label: stageLabel(snapshotT, stage), count: count((project) => (project.closed ? 'closed' : project.stage ?? 'unknown'), stage) })
  }

  const sortOptions = (map: Map<string, FilterOption>): FilterOption[] =>
    [...map.values()].sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))

  return {
    system: sortOptions(systems),
    company: sortOptions(companies),
    stage: [...stages.values()],
    status: sortOptions(statuses),
    pocType: sortOptions(types),
  }
}

/**
 * The translate function the option builder needs.
 *
 * `buildFilterOptions` runs before `t` is in scope for some call paths, and the
 * stage labels are the only translated values; a module-level placeholder keeps
 * the pure function signature simple without threading `t` through it.
 */
let snapshotT: Translate = (key) => key

/** `true` when the project survives every active filter. */
function matchesFilters(project: ProjectSummary, filters: ActiveFilters): boolean {
  if (filters.system !== null && project.system !== filters.system) return false
  if (filters.company !== null && project.company !== filters.company) return false
  if (filters.status !== null && project.status !== filters.status) return false
  if (filters.pocType !== null && project.pocType !== filters.pocType) return false
  if (filters.stage !== null) {
    const key = project.closed ? 'closed' : project.stage ?? 'unknown'
    if (key !== filters.stage) return false
  }
  return true
}

/** The searchable text of one project, lowercased once. */
function searchHaystack(project: ProjectSummary): string {
  return [project.pocId, project.name, project.owner, project.system, project.company, project.department, project.pocType]
    .join('\u0000')
    .toLowerCase()
}

/** The stage order used by the "sort by stage" mode. */
const STAGE_RANK: Record<string, number> = { G0: 0, G1: 1, G2: 2, G3: 3, G4: 4, closed: 9, unknown: 10 }

/** Compare two projects for one sort key. */
function compareFor(sortKey: SortKey, left: ProjectSummary, right: ProjectSummary): number {
  switch (sortKey) {
    case 'amount':
      return left.amountWan - right.amountWan
    case 'progress': {
      // A project with no progress sorts last regardless of direction: "no
      // activity" is not the same as "old activity".
      if (left.lastProgressDate === null && right.lastProgressDate === null) return 0
      if (left.lastProgressDate === null) return -1
      if (right.lastProgressDate === null) return 1
      return left.lastProgressDate.localeCompare(right.lastProgressDate)
    }
    case 'stage': {
      const leftRank = STAGE_RANK[left.closed ? 'closed' : left.stage ?? 'unknown'] ?? 10
      const rightRank = STAGE_RANK[right.closed ? 'closed' : right.stage ?? 'unknown'] ?? 10
      return leftRank - rightRank
    }
    case 'attention':
    default:
      return left.gapCount - right.gapCount || left.highGapCount - right.highGapCount
  }
}

/** The settings sheet: four cadences, persisted to localStorage on save. */
function RefreshSettings({
  preference,
  t,
  onSave,
  onCancel,
}: {
  preference: RefreshPreference
  t: Translate
  onSave(next: RefreshPreference): void
  onCancel(): void
}): JSX.Element {
  const [interval, setIntervalValue] = useState<RefreshInterval>(preference.interval)
  const [minutes, setMinutes] = useState<string>(String(preference.customMinutes))
  const parsedMinutes = Number(minutes)
  const minutesValid = Number.isFinite(parsedMinutes) && parsedMinutes >= CUSTOM_MINUTES_MIN && parsedMinutes <= CUSTOM_MINUTES_MAX
  const rows: Array<{ value: RefreshInterval; label: string }> = [
    { value: 'off', label: t('intervalOff') },
    { value: '10m', label: t('interval10m') },
    { value: '1h', label: t('interval1h') },
    { value: 'custom', label: t('intervalCustom') },
  ]
  return (
    <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={t('refreshSettings')}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onCancel()
        }}>
        <div className="modal-header">
          <h2 className="modal-title">{t('refreshSettings')}</h2>
        </div>
        <div className="modal-content">
          {rows.map((row) => (
            <label key={row.value} className="checkbox-row" data-selected={interval === row.value}>
              <input type="radio" name="work-dashboard-refresh-interval" value={row.value} checked={interval === row.value} onChange={() => setIntervalValue(row.value)} />
              <span>{row.label}</span>
            </label>
          ))}
          {interval === 'custom' ? (
            <div className="inline-field">
              <input
                className="input"
                type="number"
                min={CUSTOM_MINUTES_MIN}
                max={CUSTOM_MINUTES_MAX}
                step={1}
                value={minutes}
                aria-label={t('customMinutes')}
                onChange={(event) => setMinutes(event.target.value)}
              />
              <span>{t('customMinutes')}</span>
            </div>
          ) : null}
          {interval === 'custom' && !minutesValid ? (
            <p className="form-error">{format(t('customMinutesError'), { min: CUSTOM_MINUTES_MIN, max: CUSTOM_MINUTES_MAX })}</p>
          ) : null}
          <div className="helper-box">
            {interval === 'off'
              ? t('autoRefreshOff')
              : format(t('autoRefreshOn'), {
                  minutes: interval === '10m' ? 10 : interval === '1h' ? 60 : minutesValid ? clampMinutes(parsedMinutes) : 0,
                })}
          </div>
        </div>
        <div className="modal-footer">
          <span className="spacer" />
          <button type="button" className="btn" onClick={onCancel}>{t('cancel')}</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={interval === 'custom' && !minutesValid}
            onClick={() => onSave({ interval, customMinutes: minutesValid ? clampMinutes(parsedMinutes) : preference.customMinutes })}
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}

/** The empty state: the cache is wiped, so this is what a cold start shows. */
function EmptyState({ snapshot, t, busy, onRefresh }: { snapshot: Snapshot | null; t: Translate; busy: boolean; onRefresh(): void }): JSX.Element {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
          <path d="M3.5 7.2l8.5-4.2 8.5 4.2v9.6L12 21l-8.5-4.2V7.2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M3.5 7.2L12 11.6l8.5-4.4M12 11.6V21" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="empty-title">{t('emptyTitle')}</h2>
      <p className="empty-copy">{t('emptyCopy')}</p>
      <button type="button" className="btn btn-primary" disabled={busy} onClick={onRefresh}>
        {busy ? <><span className="spinner" /> {t('refreshing')}</> : t('emptyRefresh')}
      </button>
      {busy ? <p className="empty-copy" style={{ marginTop: 6 }}>{t('refreshingHint')}</p> : null}
      <p className="empty-meta">
        {t('dataSource')}：github.com/{snapshot?.repository ?? ''} · {t('emptyPath')}：{snapshot?.cachePath ?? ''}
      </p>
    </div>
  )
}

/** The failure banner: a clear reason plus a retry button. */
function FailureBanner({ message, t, onRetry, busy }: { message: string; t: Translate; onRetry(): void; busy: boolean }): JSX.Element {
  return (
    <div className="failure" role="alert">
      <div className="failure-text">
        <div className="failure-title">⚠ {t('failureTitle')}</div>
        <div className="failure-reason">{t('failureReason')}：{message}</div>
      </div>
      <button type="button" className="btn btn-small" disabled={busy} onClick={onRetry}>{t('failureRetry')}</button>
    </div>
  )
}

/** A chip group: one filter dimension. */
function FilterChips({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string
  options: FilterOption[]
  selected: string | null
  onSelect(value: string | null): void
}): JSX.Element | null {
  if (options.length === 0) return null
  return (
    <div className="toolbar-group" role="group" aria-label={label}>
      <span className="toolbar-group-label">{label}</span>
      <div className="chip-scroll">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="filter-chip"
            data-active={selected === option.value}
            disabled={option.count === 0 && selected !== option.value}
            onClick={() => onSelect(selected === option.value ? null : option.value)}
            title={`${option.label} · ${option.count}`}
          >
            {option.label}
            <span className="filter-chip-count">{option.count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * The toolbar: search, filters, view mode, sort.
 *
 * It sits under the page header rather than inside it: the header is identity
 * and global actions, the toolbar is "what am I looking at", and mixing the two
 * is what made the old page read as a bare table with four buttons.
 */
function Toolbar({
  filters,
  options,
  viewMode,
  sortKey,
  sortAsc,
  shown,
  total,
  search,
  searchRef,
  t,
  onFilters,
  onSearch,
  onClearFilters,
  onViewMode,
  onSort,
  onSortDirection,
}: {
  filters: ActiveFilters
  options: FilterOptions
  viewMode: ViewMode
  sortKey: SortKey
  sortAsc: boolean
  shown: number
  total: number
  search: string
  searchRef: MutableRefObject<HTMLInputElement | null>
  t: Translate
  onFilters(next: ActiveFilters): void
  onSearch(next: string): void
  onClearFilters(): void
  onViewMode(next: ViewMode): void
  onSort(next: SortKey): void
  onSortDirection(): void
}): JSX.Element {
  const activeCount = activeFilterCount(filters)
  const viewOptions: Array<{ value: ViewMode; label: string; hint: string }> = [
    { value: 'cards', label: t('viewCards'), hint: t('viewCardsHint') },
    { value: 'board', label: t('viewBoard'), hint: t('viewBoardHint') },
    { value: 'table', label: t('viewTable'), hint: t('viewTableHint') },
  ]
  const sortOptions: Array<{ value: SortKey; label: string }> = [
    { value: 'attention', label: t('sortAttention') },
    { value: 'amount', label: t('sortAmount') },
    { value: 'progress', label: t('sortProgress') },
    { value: 'stage', label: t('sortStage') },
  ]
  return (
    <div className="toolbar" role="toolbar" aria-label={t('filterLabel')}>
      <div className="toolbar-row">
        <label className="search-box">
          <span className="search-glyph" aria-hidden="true">⌕</span>
          <input
            ref={searchRef}
            className="search-input"
            type="search"
            value={search}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchLabel')}
            onChange={(event) => onSearch(event.target.value)}
          />
          {search === '' ? null : (
            <button type="button" className="search-clear" aria-label={t('searchClear')} title={t('searchClear')} onClick={() => onSearch('')}>×</button>
          )}
        </label>
        <div className="view-switch" role="group" aria-label={t('viewLabel')}>
          {viewOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className="view-switch-btn"
              data-active={viewMode === option.value}
              title={option.hint}
              onClick={() => onViewMode(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="sort-switch" role="group" aria-label={t('sortLabel')}>
          <select className="sort-select" value={sortKey} aria-label={t('sortLabel')} onChange={(event) => onSort(event.target.value as SortKey)}>
            {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <button type="button" className="btn btn-icon btn-small" title={t('sortDirection')} aria-label={t('sortDirection')} onClick={onSortDirection}>
            {sortAsc ? '↑' : '↓'}
          </button>
        </div>
        <span className="toolbar-result">{format(t('filterResult'), { shown, total })}</span>
        {activeCount > 0 ? (
          <button type="button" className="btn btn-small btn-ghost" onClick={onClearFilters}>
            {t('filterClear')} · {format(t('filterActiveNote'), { count: activeCount })}
          </button>
        ) : null}
      </div>
      <div className="toolbar-row toolbar-row-filters">
        <FilterChips label={t('filterSystem')} options={options.system} selected={filters.system} onSelect={(value) => onFilters({ ...filters, system: value })} />
        <FilterChips label={t('filterStage')} options={options.stage} selected={filters.stage} onSelect={(value) => onFilters({ ...filters, stage: value })} />
        <FilterChips label={t('filterStatus')} options={options.status} selected={filters.status} onSelect={(value) => onFilters({ ...filters, status: value })} />
        <FilterChips label={t('filterType')} options={options.pocType} selected={filters.pocType} onSelect={(value) => onFilters({ ...filters, pocType: value })} />
      </div>
    </div>
  )
}

/** The console page: owns the snapshot, the page, and the refresh cadence. */
export function WorkDashboardPage({ api, locale, t }: WorkDashboardPageProps): JSX.Element {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [page, setPage] = useState<Page>({ kind: 'overview' })
  const [detail, setDetail] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [statusNote, setStatusNote] = useState<string | null>(null)
  const [preference, setPreference] = useState<RefreshPreference>(DEFAULT_PREFERENCE)
  const [viewPreference, setViewPreference] = useState<ViewPreference>(DEFAULT_VIEW_PREFERENCE)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Session-only state: cleared on unmount by construction, not persisted.
  const [filters, setFilters] = useState<ActiveFilters>(NO_FILTERS)
  const [search, setSearch] = useState('')
  const [sortAsc, setSortAsc] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Cross-surface data for the two aggregation pages. They are fetched on
  // demand and cached for the lifetime of the mount.
  const [riskBoard, setRiskBoard] = useState<RiskBoard | null>(null)
  const [timeline, setTimeline] = useState<GlobalTimeline | null>(null)

  const searchRef = useRef<HTMLInputElement | null>(null)
  /** The in-flight refresh, so a second press reuses it instead of stacking. */
  const inFlight = useRef<Promise<void> | null>(null)
  /** Whether the page is mounted; a scheduled tick after unmount must not paint. */
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  // Load the stored preferences once, after mount (never during SSR/first paint).
  useEffect(() => {
    setPreference(readPreference())
    setViewPreference(readViewPreference())
  }, [])

  /** Pull the snapshot without refreshing the cache. */
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const next = await api.list()
      if (mounted.current) {
        setSnapshot(next)
        setFailure(null)
      }
    } catch (error) {
      if (mounted.current) setFailure(errorText(t, error))
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [api, t])

  useEffect(() => {
    void load()
  }, [load])

  /**
   * Refresh: clone or fast-forward, then adopt the new snapshot.
   *
   * `manual` distinguishes a user press from a timer tick. A manual press owns
   * the visible error banner and the retry affordance; a timer tick only
   * annotates the status bar, so a flaky network cannot repaint the page.
   */
  const refresh = useCallback(async (manual: boolean) => {
    if (inFlight.current !== null) return inFlight.current
    const job = (async () => {
      setBusy(true)
      if (manual) setFailure(null)
      setStatusNote(null)
      try {
        const { snapshot: next } = await api.refresh()
        if (!mounted.current) return
        setSnapshot(next)
        setFailure(null)
        // A refresh invalidates the aggregation caches: they were computed from
        // the previous snapshot and would otherwise show stale counts.
        setRiskBoard(null)
        setTimeline(null)
      } catch (error) {
        if (!mounted.current) return
        const message = errorText(t, error)
        if (manual) setFailure(message)
        else setStatusNote(`${t('autoRefreshFailed')}：${message}`)
      } finally {
        if (mounted.current) setBusy(false)
      }
    })()
    inFlight.current = job.finally(() => { inFlight.current = null })
    return inFlight.current
  }, [api, t])

  // Scheduled refresh: exists only while this page is mounted and not `off`.
  const period = intervalMs(preference)
  useEffect(() => {
    if (period === null) return
    const timer = setInterval(() => { void refresh(false) }, period)
    return () => { clearInterval(timer) }
  }, [period, refresh])

  // The dictionary is needed by the pure option builder for stage labels.
  snapshotT = t

  const filterOptions = useMemo(() => buildFilterOptions(snapshot), [snapshot, t])

  /** The filtered + sorted list every overview mode renders. */
  const visibleProjects = useMemo(() => {
    const projects = snapshot?.projects ?? []
    const needle = search.trim().toLowerCase()
    const filtered = projects.filter((project) => {
      if (!matchesFilters(project, filters)) return false
      if (needle === '') return true
      return searchHaystack(project).includes(needle)
    })
    const sorted = [...filtered].sort((left, right) => {
      const base = compareFor(viewPreference.sortKey, left, right)
      return sortAsc ? base : -base
    })
    return sorted
  }, [snapshot, filters, search, viewPreference.sortKey, sortAsc])

  /** Gaps belonging to the visible projects, in the visible order. */
  const visibleGaps = useMemo(() => {
    const order = new Map(visibleProjects.map((project, index) => [project.pocId, index]))
    return (snapshot?.gaps ?? [])
      .filter((item) => order.has(item.pocId))
      .sort((left, right) => (order.get(left.pocId)! - order.get(right.pocId)!) || right.priority - left.priority)
  }, [snapshot, visibleProjects])

  /** The analysis re-derived for the filtered list, so charts follow the filter. */
  const visibleAnalysis = useMemo<PortfolioAnalysis | null>(() => {
    if (snapshot === null) return null
    if (visibleProjects.length === snapshot.projects.length) return snapshot.analysis
    // A filtered subset needs its own aggregation; reuse the Host's own
    // function shape by asking for a recomputed snapshot is not possible over
    // RPC, so the Client recomputes only the figures the band shows.
    return recomputeAnalysis(visibleProjects, visibleGaps)
  }, [snapshot, visibleProjects, visibleGaps])

  const openDetail = useCallback(async (pocId: string) => {
    setPage({ kind: 'detail', pocId })
    setSelectedId(pocId)
    setDetail(null)
    try {
      const next = await api.detail(pocId)
      if (mounted.current) setDetail(next)
    } catch (error) {
      if (mounted.current) setFailure(errorText(t, error))
    }
  }, [api, t])

  const backToOverview = useCallback(() => {
    setPage({ kind: 'overview' })
    setDetail(null)
    setFailure(null)
  }, [])

  const openRisks = useCallback(() => {
    setPage({ kind: 'risks' })
    if (riskBoard !== null) return
    void (async () => {
      try {
        const next = await api.risks()
        if (mounted.current) setRiskBoard(next)
      } catch (error) {
        if (mounted.current) setFailure(errorText(t, error))
      }
    })()
  }, [api, riskBoard, t])

  const openTimeline = useCallback(() => {
    setPage({ kind: 'timeline' })
    if (timeline !== null) return
    void (async () => {
      try {
        const next = await api.timeline()
        if (mounted.current) setTimeline(next)
      } catch (error) {
        if (mounted.current) setFailure(errorText(t, error))
      }
    })()
  }, [api, timeline, t])

  const savePreference = useCallback((next: RefreshPreference) => {
    setPreference(next)
    writePreference(next)
    setSettingsOpen(false)
  }, [])

  const saveViewMode = useCallback((next: ViewMode) => {
    const updated = { ...viewPreference, viewMode: next }
    setViewPreference(updated)
    writeViewPreference(updated)
  }, [viewPreference])

  const saveSortKey = useCallback((next: SortKey) => {
    const updated = { ...viewPreference, sortKey: next }
    setViewPreference(updated)
    writeViewPreference(updated)
  }, [viewPreference])

  /** Apply one filter dimension; a chart segment sets its own dimension. */
  const applyFilter = useCallback((next: Partial<ActiveFilters>) => {
    setFilters((current) => ({ ...current, ...next }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(NO_FILTERS)
    setSearch('')
  }, [])

  /**
   * Keyboard navigation over the current list.
   *
   * Bound on the page root rather than on each row so it works regardless of
   * which surface is active; typing inside the search box is exempted so `/`
   * and arrows keep their normal text-editing meaning.
   */
  const onKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null
    if (target !== null && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
      if (event.key === 'Escape') target.blur()
      return
    }
    if (event.key === '/' && page.kind === 'overview') {
      event.preventDefault()
      searchRef.current?.focus()
      return
    }
    if (page.kind === 'detail') {
      if (event.key === 'Escape') {
        event.preventDefault()
        backToOverview()
      }
      return
    }
    if (page.kind !== 'overview' || visibleProjects.length === 0) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const currentIndex = selectedId === null ? -1 : visibleProjects.findIndex((project) => project.pocId === selectedId)
      const delta = event.key === 'ArrowDown' ? 1 : -1
      const nextIndex = currentIndex === -1 ? 0 : Math.min(visibleProjects.length - 1, Math.max(0, currentIndex + delta))
      setSelectedId(visibleProjects[nextIndex]?.pocId ?? null)
      return
    }
    if (event.key === 'Enter' && selectedId !== null) {
      event.preventDefault()
      void openDetail(selectedId)
    }
  }, [page.kind, visibleProjects, selectedId, backToOverview, openDetail])

  /** Prev/next within the list the detail page was opened from. */
  const detailNeighbours = useMemo(() => {
    if (page.kind !== 'detail') return { prev: null as string | null, next: null as string | null, index: 0, total: visibleProjects.length }
    const index = visibleProjects.findIndex((project) => project.pocId === page.pocId)
    if (index === -1) return { prev: null, next: null, index: 0, total: visibleProjects.length }
    return {
      prev: index > 0 ? visibleProjects[index - 1]!.pocId : null,
      next: index < visibleProjects.length - 1 ? visibleProjects[index + 1]!.pocId : null,
      index,
      total: visibleProjects.length,
    }
  }, [page, visibleProjects])

  const activeLocale = locale.getSnapshot().active
  const refreshed = useMemo(() => {
    if (snapshot?.fetchedAt === null || snapshot?.fetchedAt === undefined) return t('neverRefreshed')
    return format(t('refreshedAt'), { time: clockOf(snapshot.fetchedAt, activeLocale) })
  }, [snapshot, t, activeLocale])

  const autoNote = period === null
    ? t('autoRefreshOff')
    : format(t('autoRefreshOn'), { minutes: Math.round(period / 60_000) })

  const overviewReady = snapshot !== null && snapshot.cacheReady
  const filteredOut = overviewReady && visibleProjects.length === 0

  return (
    <>
      <style>{CONSOLE_CSS}</style>
      <div className="wd-shell" onKeyDown={onKeyDown} tabIndex={-1}>
        <div className="page">
          {page.kind === 'overview' ? (
            <>
              <div className="module-rail">
                <button type="button" className="module-tab" data-active="true" title={t('modulePocHint')}>
                  <span className="module-tab-dot" />
                  {t('modulePoc')}
                </button>
                <span className="module-rail-hint">{t('moduleMore')}</span>
              </div>
              <div className="page-header">
                <div className="page-header-text">
                  <p className="page-eyebrow">{t('eyebrow')}</p>
                  <h1 className="page-title">{t('modulePoc')}</h1>
                  <p className="page-subtitle">{t('subtitle')}</p>
                  <p className="page-source">
                    {t('dataSource')}：<code>github.com/{snapshot?.repository ?? ''}</code>
                    <span>·</span>
                    <span>{refreshed}</span>
                  </p>
                </div>
                <div className="header-actions">
                  <button type="button" className="btn btn-primary" disabled={busy} onClick={() => { void refresh(true) }}>
                    {busy ? <><span className="spinner" /> {t('refreshing')}</> : t('refresh')}
                  </button>
                  <button type="button" className="btn" onClick={openRisks} disabled={!overviewReady}>
                    {t('risksNav')}
                  </button>
                  <button type="button" className="btn" onClick={openTimeline} disabled={!overviewReady}>
                    {t('timelineNav')}
                  </button>
                  <button type="button" className="btn" onClick={() => setSettingsOpen(true)} title={autoNote}>
                    {t('refreshSettings')}
                  </button>
                </div>
              </div>
              {overviewReady ? (
                <Toolbar
                  filters={filters}
                  options={filterOptions}
                  viewMode={viewPreference.viewMode}
                  sortKey={viewPreference.sortKey}
                  sortAsc={sortAsc}
                  shown={visibleProjects.length}
                  total={snapshot.projects.length}
                  search={search}
                  searchRef={searchRef}
                  t={t}
                  onFilters={setFilters}
                  onSearch={setSearch}
                  onClearFilters={clearFilters}
                  onViewMode={saveViewMode}
                  onSort={saveSortKey}
                  onSortDirection={() => setSortAsc((value) => !value)}
                />
              ) : null}
            </>
          ) : null}

          {page.kind === 'risks' ? (
            riskBoard === null
              ? <PageLoading t={t} onBack={backToOverview} />
              : <RiskBoardPage board={riskBoard} t={t} onBack={backToOverview} onOpenProject={(pocId) => { void openDetail(pocId) }} />
          ) : page.kind === 'timeline' ? (
            timeline === null
              ? <PageLoading t={t} onBack={backToOverview} />
              : <TimelinePage timeline={timeline} locale={activeLocale} t={t} onBack={backToOverview} onOpenProject={(pocId) => { void openDetail(pocId) }} />
          ) : null}

          {page.kind === 'risks' || page.kind === 'timeline' ? null : (
            <div className={page.kind === 'overview' ? 'page-body' : 'detail-body'}>
              {failure !== null ? (
                <div style={{ marginBottom: 16 }}>
                  <FailureBanner message={failure} t={t} busy={busy} onRetry={() => { void refresh(true) }} />
                </div>
              ) : null}

              {loading ? (
                <div className="empty-state"><span className="spinner" /> <p className="empty-copy">{t('loading')}</p></div>
              ) : page.kind === 'detail' ? (
                detail === null ? (
                  <div className="empty-state">
                    <h2 className="empty-title">{t('detailMissing')}</h2>
                    <p className="empty-copy">{format(t('detailMissingCopy'), { pocId: page.pocId })}</p>
                    <button type="button" className="btn" onClick={backToOverview}>{t('back')}</button>
                  </div>
                ) : (
                  <DetailPage
                    detail={detail}
                    gaps={detail.gaps}
                    locale={activeLocale}
                    t={t}
                    position={{ index: detailNeighbours.index + 1, total: detailNeighbours.total }}
                    onPrev={detailNeighbours.prev === null ? null : () => { void openDetail(detailNeighbours.prev!) }}
                    onNext={detailNeighbours.next === null ? null : () => { void openDetail(detailNeighbours.next!) }}
                    onBack={backToOverview}
                    onOpen={(pocId) => { void openDetail(pocId) }}
                  />
                )
              ) : !overviewReady ? (
                <EmptyState snapshot={snapshot} t={t} busy={busy} onRefresh={() => { void refresh(true) }} />
              ) : snapshot === null || visibleAnalysis === null ? null : (
                <OverviewPage
                  snapshot={snapshot}
                  projects={visibleProjects}
                  gaps={visibleGaps}
                  analysis={visibleAnalysis}
                  filters={filters}
                  viewMode={viewPreference.viewMode}
                  sortKey={viewPreference.sortKey}
                  sortAsc={sortAsc}
                  selectedId={selectedId}
                  locale={activeLocale}
                  t={t}
                  filteredOut={filteredOut}
                  onOpen={(pocId) => { void openDetail(pocId) }}
                  onFilter={applyFilter}
                  onClearFilters={clearFilters}
                  onViewMode={saveViewMode}
                  onSort={saveSortKey}
                />
              )}
            </div>
          )}

          <div className="page-footer">
            <span>{autoNote}</span>
            <span className="footer-hint">{t('keyboardHint')}</span>
            {statusNote === null ? null : <><span>·</span><span>{statusNote}</span></>}
            {overviewReady ? <><span className="spacer" /><span>{format(t('filterResult'), { shown: visibleProjects.length, total: snapshot.projects.length })}</span></> : null}
          </div>
        </div>
      </div>
      {settingsOpen ? (
        <RefreshSettings
          preference={preference}
          t={t}
          onSave={savePreference}
          onCancel={() => setSettingsOpen(false)}
        />
      ) : null}
    </>
  )
}

/** A loading surface that keeps the back affordance available. */
function PageLoading({ t, onBack }: { t: Translate; onBack(): void }): JSX.Element {
  return (
    <>
      <div className="page-header">
        <div className="page-header-text"><h1 className="page-title">{t('loading')}</h1></div>
        <div className="header-actions"><button type="button" className="btn" onClick={onBack}>{t('back')}</button></div>
      </div>
      <div className="page-body"><div className="empty-state"><span className="spinner" /> <p className="empty-copy">{t('loading')}</p></div></div>
    </>
  )
}

/**
 * Recompute the portfolio figures for a filtered subset.
 *
 * The Host computes the full-portfolio analysis, but once the user narrows the
 * list the band must describe *that* subset — otherwise a chart would contradict
 * the list right below it. This mirrors `analyse` in `src/store.ts`; the Host
 * version stays authoritative for the unfiltered case, and both produce the same
 * bucket order so a filtered band does not reorder itself.
 */
function recomputeAnalysis(projects: ProjectSummary[], gaps: GapItem[]): PortfolioAnalysis {
  const STAGE_ORDER: ReadonlyArray<string> = ['G0', 'G1', 'G2', 'G3', 'G4', 'closed', 'unknown']
  const totalAmount = projects.reduce((sum, project) => sum + project.amountWan, 0)
  const stages = STAGE_ORDER.map((key) => {
    const bucket = projects.filter((project) => (project.closed ? 'closed' : project.stage ?? 'unknown') === key)
    return {
      key: key as PortfolioAnalysis['stages'][number]['key'],
      count: bucket.length,
      amountWan: bucket.reduce((sum, project) => sum + project.amountWan, 0),
      highGapCount: bucket.filter((project) => project.highGapCount > 0).length,
    }
  })
  const orgMap = new Map<string, { system: string; company: string; count: number; amountWan: number; highGapCount: number }>()
  for (const project of projects) {
    const key = `${project.system}\u0000${project.company}`
    const existing = orgMap.get(key)
    if (existing === undefined) orgMap.set(key, { system: project.system, company: project.company, count: 1, amountWan: project.amountWan, highGapCount: project.highGapCount > 0 ? 1 : 0 })
    else {
      existing.count += 1
      existing.amountWan += project.amountWan
      if (project.highGapCount > 0) existing.highGapCount += 1
    }
  }
  const typeMap = new Map<string, { pocType: string; count: number; amountWan: number }>()
  for (const project of projects) {
    const existing = typeMap.get(project.pocType)
    if (existing === undefined) typeMap.set(project.pocType, { pocType: project.pocType, count: 1, amountWan: project.amountWan })
    else {
      existing.count += 1
      existing.amountWan += project.amountWan
    }
  }
  const gapRuleMap = new Map<GapItem['rule'], { rule: GapItem['rule']; ruleNo: number; level: GapItem['level']; count: number }>()
  for (const item of gaps) {
    const existing = gapRuleMap.get(item.rule)
    if (existing === undefined) gapRuleMap.set(item.rule, { rule: item.rule, ruleNo: item.ruleNo, level: item.level, count: 1 })
    else existing.count += 1
  }
  const topAmounts = [...projects]
    .filter((project) => project.amountWan > 0)
    .sort((left, right) => right.amountWan - left.amountWan || left.pocId.localeCompare(right.pocId))
    .slice(0, 5)
    .map((project) => ({
      pocId: project.pocId,
      pocName: project.name,
      amountWan: project.amountWan,
      share: totalAmount === 0 ? 0 : project.amountWan / totalAmount,
      stage: project.stage,
      closed: project.closed,
    }))
  const dimensions = DIMENSIONS.map((key) => {
    const present = projects.filter((project) => project.dimensions[key]).length
    return { key, present, missing: projects.length - present, ratio: projects.length === 0 ? 0 : present / projects.length }
  })
  let lastActivity: string | null = null
  for (const project of projects) {
    const date = project.lastProgressDate
    if (date === null) continue
    if (lastActivity === null || date > lastActivity) lastActivity = date
  }
  return {
    stages,
    orgs: [...orgMap.values()].sort((left, right) => right.amountWan - left.amountWan || left.system.localeCompare(right.system) || left.company.localeCompare(right.company)),
    types: [...typeMap.values()].sort((left, right) => right.count - left.count || right.amountWan - left.amountWan || left.pocType.localeCompare(right.pocType)),
    topAmounts,
    dimensions,
    gapRules: [...gapRuleMap.values()].sort((left, right) => right.count - left.count || left.ruleNo - right.ruleNo),
    concentration: totalAmount === 0 || topAmounts.length === 0 ? 0 : topAmounts[0]!.amountWan / totalAmount,
    amountMissing: projects.filter((project) => project.amountWan === 0).length,
    withProgress: projects.filter((project) => project.progressCount > 0).length,
    lastActivity,
  }
}

/** Re-export the glyph and the page for the module entry point. */
export { WorkDashboardPage as default }
