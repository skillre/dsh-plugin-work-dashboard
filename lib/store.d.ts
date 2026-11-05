/**
 * Read-only ledger store.
 *
 * The store turns the cloned `projects/*.yaml` files into the JSON shapes the
 * Client renders. It never writes: the repository is a read-only copy and the
 * real data source is GitHub (writes arrive in milestone 2, through a PR).
 *
 * Parsing uses `yaml`'s `parseDocument`, not `parse` + `stringify`: comments and
 * key order survive, which milestone 2 needs when it edits a record in place.
 * One unreadable or unparsable file is reported as a warning and skipped — a
 * single bad hand-edit must not blank the whole board.
 */
import type { RepoCache } from './repo.js';
import type { PocRecord, ProjectDetail, Snapshot } from './types.js';
/** Injected clock so the store stays testable and the rules stay pure. */
export interface StoreOptions {
    now: () => Date;
    staleDays: number;
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
    /** `owner/name` as configured; the Client shows it as the data-source label. */
    private repositoryLabel;
}
