/**
 * Read-only ledger store (v3).
 *
 * The store turns the cloned `projects/*.yaml` files into the JSON shapes the
 * Client renders. It never writes: the repository is a read-only copy and the
 * real data source is GitHub.
 *
 * v3 is **progress-centred**: a project's state is its identity + gate0 + plan +
 * progress stream + outcome. The summary therefore reads `gate0` for the G0
 * verdict, `plan` for focus, `progress` for activity, and `outcome` for the four
 * dimensions — there is no separate `result` block to reconcile.
 *
 * Parsing uses `yaml`'s `parse`. One unreadable or unparsable file is reported
 * as a warning and skipped: a single bad hand-edit must not blank the whole
 * board.
 */
import type { RepoCache } from './repo.js';
import type { OrgRecord, PocRecord, ProjectDetail, Snapshot, StageId } from './types.js';
/** Injected clock so the store stays testable and the rules stay pure. */
export interface StoreOptions {
    now: () => Date;
    /** Days in one stage after which rule 12 fires. */
    stallDays: number;
}
/** The Host-side view model builder. */
export declare class PocStore {
    private readonly cache;
    private readonly options;
    constructor(cache: RepoCache, options: StoreOptions);
    /** Load every project file; one bad file becomes a warning, not a failure. */
    load(): Promise<{
        records: PocRecord[];
        warnings: string[];
    }>;
    /** The overview snapshot; never throws for a missing cache, it reports it. */
    snapshot(): Promise<Snapshot>;
    /** One project's full record; `null` when no file declares that id. */
    detail(pocId: string): Promise<ProjectDetail | null>;
}
/** Re-export the org type so the Client can name it. */
export type { OrgRecord, StageId };
