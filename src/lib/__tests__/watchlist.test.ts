import { beforeEach, describe, expect, it } from "vitest";
import { count, insert, query, queryFirstRow } from "@/src/lib/db";
import { freshDb } from "@/src/test/db";
import {
  addWatchlistSymbol,
  getWatchlist,
  normalizeSymbol,
  removeWatchlistSymbol,
  seedWatchlistForUser,
  validateQuoteRequest,
} from "@/src/lib/trading";
import { resolveGoogleUser } from "@/src/lib/google-auth";

beforeEach(() => freshDb());

describe("watchlist seeding", () => {
  it("seeds every seeded user with the full symbol list", () => {
    expect(count("watchlist")).toBe(3 * 12);
    expect(getWatchlist(1).map((s) => s.symbol)).toEqual([
      "AAPL",
      "ADSK",
      "EBAY",
      "F",
      "FAS",
      "GE",
      "GOOG",
      "JPM",
      "QQQ",
      "TSLA",
      "WFC",
      "XLF",
    ]);
  });

  it("seeds a newly created user idempotently", () => {
    const userId = insert("users", {
      email: "newbie@example.com",
      name: "Newbie",
      password: "x",
      cash: 50000,
      equity: 50000,
    });
    expect(getWatchlist(userId)).toHaveLength(0);
    seedWatchlistForUser(userId);
    seedWatchlistForUser(userId);
    expect(getWatchlist(userId)).toHaveLength(12);
    expect(count("watchlist")).toBe(3 * 12 + 12);
  });

  it("seeds users created via Google sign-in", () => {
    const result = resolveGoogleUser({
      sub: "google-sub-watcher",
      email: "watcher@example.com",
      emailVerified: true,
      name: "Watcher",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(getWatchlist(result.userId)).toHaveLength(12);
    }
  });
});

describe("removeWatchlistSymbol (ownership-scoped delete)", () => {
  it("removes the caller's own entry and persists it", () => {
    expect(removeWatchlistSymbol(1, "AAPL")).toBe(true);
    expect(getWatchlist(1).map((s) => s.symbol)).not.toContain("AAPL");
    expect(
      queryFirstRow(
        "SELECT * FROM watchlist WHERE userId = ? AND symbol = ?",
        1,
        "AAPL",
      ),
    ).toBeNull();
    // Other users and the shared symbol row are untouched.
    expect(getWatchlist(2).map((s) => s.symbol)).toContain("AAPL");
    expect(
      queryFirstRow("SELECT * FROM symbols WHERE symbol = ?", "AAPL"),
    ).not.toBeNull();
  });

  it("normalises the symbol key", () => {
    expect(removeWatchlistSymbol(1, "  aapl ")).toBe(true);
    expect(getWatchlist(1).map((s) => s.symbol)).not.toContain("AAPL");
  });

  it("cannot touch another user's entry even when the caller has none", () => {
    // The delete is scoped to the session user id, so there is no request
    // the attacker can craft that addresses the victim's row: with no
    // AAPL row of their own, the call matches zero rows and reports false.
    expect(removeWatchlistSymbol(1, "AAPL")).toBe(true); // own row
    expect(removeWatchlistSymbol(1, "AAPL")).toBe(false); // nothing left
    expect(
      queryFirstRow(
        "SELECT * FROM watchlist WHERE userId = ? AND symbol = ?",
        2,
        "AAPL",
      ),
    ).not.toBeNull();
    expect(getWatchlist(2)).toHaveLength(12);
  });

  it("one user's removal never affects another user's list", () => {
    expect(removeWatchlistSymbol(1, "GOOG")).toBe(true);
    expect(getWatchlist(1).map((s) => s.symbol)).not.toContain("GOOG");
    expect(getWatchlist(2).map((s) => s.symbol)).toContain("GOOG");
    expect(getWatchlist(3).map((s) => s.symbol)).toContain("GOOG");
  });

  it("reports false for missing, blank, or unknown symbols", () => {
    expect(removeWatchlistSymbol(1, "NOPE")).toBe(false);
    expect(removeWatchlistSymbol(1, "   ")).toBe(false);
    expect(removeWatchlistSymbol(9999, "AAPL")).toBe(false);
    expect(getWatchlist(1)).toHaveLength(12);
  });

  it("supports emptying the whole list", () => {
    for (const s of getWatchlist(1)) {
      expect(removeWatchlistSymbol(1, s.symbol)).toBe(true);
    }
    expect(getWatchlist(1)).toHaveLength(0);
    // Portfolios, transactions, and other users are unaffected.
    expect(query("SELECT * FROM portfolios WHERE userId = ?", 1).length).toBe(
      5,
    );
    expect(getWatchlist(2)).toHaveLength(12);
  });
});

describe("normalizeSymbol", () => {
  it("trims and uppercases tickers", () => {
    expect(normalizeSymbol("  aapl ")).toBe("AAPL");
    expect(normalizeSymbol("brk.b")).toBe("BRK.B");
    expect(normalizeSymbol("bf-b")).toBe("BF-B");
  });

  it("rejects implausible input", () => {
    expect(normalizeSymbol("")).toBeNull();
    expect(normalizeSymbol("   ")).toBeNull();
    expect(normalizeSymbol("AA PL")).toBeNull();
    expect(normalizeSymbol("AAPL!")).toBeNull();
    expect(normalizeSymbol("A".repeat(13))).toBeNull();
    expect(normalizeSymbol(null)).toBeNull();
    expect(normalizeSymbol(undefined)).toBeNull();
    expect(normalizeSymbol(123)).toBeNull();
  });
});

describe("validateQuoteRequest (auth + input seam)", () => {
  it("rejects unauthenticated callers before looking at input", () => {
    expect(validateQuoteRequest(null, "AAPL")).toEqual({
      ok: false,
      status: "unauthenticated",
    });
    expect(validateQuoteRequest(undefined as unknown as null, "")).toEqual({
      ok: false,
      status: "unauthenticated",
    });
  });

  it("rejects malformed symbols for authenticated users", () => {
    expect(validateQuoteRequest(1, "  ")).toEqual({
      ok: false,
      status: "invalid",
    });
    expect(validateQuoteRequest(1, "not a symbol")).toEqual({
      ok: false,
      status: "invalid",
    });
  });

  it("passes the session user id and normalized key through", () => {
    expect(validateQuoteRequest(2, "  aapl ")).toEqual({
      ok: true,
      userId: 2,
      key: "AAPL",
    });
  });
});

describe("addWatchlistSymbol (validated-quote add)", () => {
  it("adds a validated symbol and persists it for that user only", () => {
    expect(removeWatchlistSymbol(1, "AAPL")).toBe(true);
    const before = count("watchlist");
    expect(addWatchlistSymbol(1, "aapl")).toBe("added");
    expect(count("watchlist")).toBe(before + 1);
    expect(getWatchlist(1).map((s) => s.symbol)).toContain("AAPL");
    expect(getWatchlist(2)).toHaveLength(12);
  });

  it("reports exists without duplicating", () => {
    const before = count("watchlist");
    expect(addWatchlistSymbol(1, "AAPL")).toBe("exists");
    expect(count("watchlist")).toBe(before);
    expect(
      query("SELECT * FROM watchlist WHERE userId = ? AND symbol = ?", 1, "AAPL"),
    ).toHaveLength(1);
  });

  it("allows the same symbol for different users (per-user uniqueness)", () => {
    expect(removeWatchlistSymbol(1, "AAPL")).toBe(true);
    expect(removeWatchlistSymbol(2, "AAPL")).toBe(true);
    expect(addWatchlistSymbol(1, "AAPL")).toBe("added");
    expect(addWatchlistSymbol(2, "AAPL")).toBe("added");
    expect(addWatchlistSymbol(1, "AAPL")).toBe("exists");
  });

  it("rejects symbols with no validated quote (not in symbols table)", () => {
    const before = count("watchlist");
    expect(addWatchlistSymbol(1, "ZZZZ")).toBe("invalid");
    expect(count("watchlist")).toBe(before);
    expect(
      queryFirstRow(
        "SELECT * FROM watchlist WHERE userId = ? AND symbol = ?",
        1,
        "ZZZZ",
      ),
    ).toBeNull();
  });

  it("rejects malformed symbols and unknown users without writing", () => {
    const before = count("watchlist");
    expect(addWatchlistSymbol(1, "no good")).toBe("invalid");
    expect(addWatchlistSymbol(9999, "AAPL")).toBe("invalid");
    expect(count("watchlist")).toBe(before);
  });

  it("one user's add never leaks into another user's list", () => {
    expect(removeWatchlistSymbol(1, "GOOG")).toBe(true);
    expect(addWatchlistSymbol(1, "GOOG")).toBe("added");
    expect(getWatchlist(1).map((s) => s.symbol)).toContain("GOOG");
    // User 2's list is exactly as seeded — untouched by user 1's traffic.
    expect(getWatchlist(2)).toHaveLength(12);
  });
});
