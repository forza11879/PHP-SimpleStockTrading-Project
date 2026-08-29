# Storage: SQLite behind a data-access seam, hosting deferred

The simulator keeps SQLite (node:sqlite) as its store. Because a public
deployment target isn't decided yet, database access is kept behind a thin
data-access seam so the storage engine can be swapped (e.g. to libSQL/Postgres)
if hosting turns out to be serverless with a read-only filesystem.

No storage decision is locked in; the seam is the hedge, and swapping storage
is expected to be a small, contained change rather than a rewrite.