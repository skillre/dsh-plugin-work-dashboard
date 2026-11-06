/**
 * The view contract between the shell and the three view modules.
 *
 * The shell owns every piece of page state — snapshot, filters, sort, view mode,
 * keyboard selection — and each view module owns exactly one rendering surface.
 * Both sides import these types, so a prop rename breaks the build instead of
 * silently rendering an empty card.
 *
 * The shell passes the project list ALREADY filtered and sorted. A view never
 * re-filters: if the cards say "12 projects" and the table says "12 projects",
 * that has to be the same twelve, computed once.
 */
import type { GapItem, PortfolioAnalysis, ProjectDetail, ProjectSummary, RiskBoard, GlobalTimeline, Snapshot, SortKey, StageId, ViewMode } from '../types.js';
import type { Translate } from './text.js';
/** The filter dimensions the toolbar exposes. `null` means "not filtered". */
export interface ActiveFilters {
    system: string | null;
    company: string | null;
    /** A `StageId`, or the sentinels `closed` / `unknown`. */
    stage: string | null;
    status: string | null;
    pocType: string | null;
}
/** The empty filter state: everything visible. */
export declare const NO_FILTERS: ActiveFilters;
/** How many filter dimensions are currently narrowing the list. */
export declare function activeFilterCount(filters: ActiveFilters): number;
/** `true` when no filter is set. */
export declare function filtersAreEmpty(filters: ActiveFilters): boolean;
/**
 * A value the toolbar can offer for one filter dimension.
 *
 * `value` is what goes into {@link ActiveFilters}; `label` is what the chip
 * shows; `count` is how many projects currently carry it, so an option that
 * would produce an empty list can be shown as such instead of disappearing.
 */
export interface FilterOption {
    value: string;
    label: string;
    count: number;
}
/** Every option the toolbar offers, derived once from the snapshot. */
export interface FilterOptions {
    system: FilterOption[];
    company: FilterOption[];
    stage: FilterOption[];
    status: FilterOption[];
    pocType: FilterOption[];
}
/** The props the shell hands to the overview surface. */
export interface OverviewProps {
    snapshot: Snapshot;
    /** Already filtered and sorted by the shell. */
    projects: ProjectSummary[];
    /** Gaps belonging to {@link projects}, in the shell's order. */
    gaps: GapItem[];
    analysis: PortfolioAnalysis;
    filters: ActiveFilters;
    viewMode: ViewMode;
    sortKey: SortKey;
    sortAsc: boolean;
    /** The keyboard-selected project id, or `null`. */
    selectedId: string | null;
    locale: string;
    t: Translate;
    /** True when the snapshot has projects but the filters hide all of them. */
    filteredOut: boolean;
    onOpen(pocId: string): void;
    /** Click a chart segment: apply that filter dimension, or clear it if equal. */
    onFilter(next: Partial<ActiveFilters>): void;
    onClearFilters(): void;
    onViewMode(next: ViewMode): void;
    onSort(next: SortKey): void;
}
/** The props the shell hands to the detail surface. */
export interface DetailProps {
    detail: ProjectDetail;
    /** Gaps of this project only. */
    gaps: GapItem[];
    locale: string;
    t: Translate;
    /** Position within the shell's current list, for the prev/next affordance. */
    position: {
        index: number;
        total: number;
    };
    /** `null` when the neighbour does not exist. */
    onPrev: (() => void) | null;
    onNext: (() => void) | null;
    onBack(): void;
    /** Jump to another project by id (used by the gap list cross-links). */
    onOpen(pocId: string): void;
}
/** The props the shell hands to the risk board. */
export interface RiskBoardProps {
    board: RiskBoard;
    t: Translate;
    onBack(): void;
    onOpenProject(pocId: string): void;
}
/** The props the shell hands to the global timeline. */
export interface TimelineProps {
    timeline: GlobalTimeline;
    locale: string;
    t: Translate;
    onBack(): void;
    onOpenProject(pocId: string): void;
}
/** Re-export the stage sentinels the board column uses. */
export type StageBucketKey = StageId | 'closed' | 'unknown';
