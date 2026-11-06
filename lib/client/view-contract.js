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
/** The empty filter state: everything visible. */
export const NO_FILTERS = Object.freeze({
    system: null,
    company: null,
    stage: null,
    status: null,
    pocType: null,
});
/** How many filter dimensions are currently narrowing the list. */
export function activeFilterCount(filters) {
    return Object.values(filters).filter((value) => value !== null).length;
}
/** `true` when no filter is set. */
export function filtersAreEmpty(filters) {
    return activeFilterCount(filters) === 0;
}
