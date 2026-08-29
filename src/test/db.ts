import { resetDb } from "@/src/lib/schema";

/**
 * Test seam convention.
 *
 * Unit tests exercise the framework-free domain modules in `src/lib/`
 * (`db`, `schema`, `trading`, `orders`, `quotes`, `history`) — not the
 * `"use server"` actions or the page/component layer, which are thin glue
 * over these modules and touch Next request context. The database is an
 * in-memory SQLite seeded like production (see `setup.ts`); the Yahoo HTTP
 * boundary is stubbed (injected fetch or raw response fixtures) rather than
 * hit for real.
 *
 * Call `freshDb()` in `beforeEach` for a clean, fully-seeded database.
 */
export function freshDb(): void {
  resetDb();
}