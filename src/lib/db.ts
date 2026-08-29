import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const dbPath =
  process.env.DB_PATH ?? path.join(dataDir, "trading.db");

export const db = new DatabaseSync(dbPath);

db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA journal_mode = WAL;");

export type Row = Record<string, unknown>;
export type Rows = Row[];

type Params = SQLInputValue[];

function normalizeParams(params: unknown[]): Params {
  return params.map((p) => (p === undefined ? null : (p as SQLInputValue)));
}

export function query(sql: string, ...params: unknown[]): Rows {
  return db.prepare(sql).all(...normalizeParams(params)) as Rows;
}

export function queryFirstRow(sql: string, ...params: unknown[]): Row | null {
  const row = db.prepare(sql).get(...normalizeParams(params));
  return (row as Row) ?? null;
}

export function insert(table: string, data: Record<string, unknown>): number {
  const cols = Object.keys(data);
  const placeholders = cols.map(() => "?").join(", ");
  const values = normalizeParams(cols.map((c) => data[c]));
  const result = db
    .prepare(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`)
    .run(...values);
  return Number(result.lastInsertRowid);
}

export function update(
  table: string,
  data: Record<string, unknown>,
  whereSql: string,
  ...whereParams: unknown[]
): number {
  const cols = Object.keys(data);
  const assignments = cols.map((c) => `${c} = ?`).join(", ");
  const values = normalizeParams(cols.map((c) => data[c]));
  const result = db
    .prepare(`UPDATE ${table} SET ${assignments} WHERE ${whereSql}`)
    .run(...values, ...normalizeParams(whereParams));
  return Number(result.changes);
}

export function del(
  table: string,
  whereSql: string,
  ...whereParams: unknown[]
): number {
  const result = db
    .prepare(`DELETE FROM ${table} WHERE ${whereSql}`)
    .run(...normalizeParams(whereParams));
  return Number(result.changes);
}

/**
 * Upsert (INSERT ... ON CONFLICT DO UPDATE) mirroring MeekroDB's insertUpdate.
 * `conflictColumns` names the unique columns that trigger the update.
 */
export function upsert(
  table: string,
  data: Record<string, unknown>,
  conflictColumns: string[],
): number {
  const cols = Object.keys(data);
  const conflict = conflictColumns.map((c) => `"${c}"`).join(", ");
  const placeholders = cols.map(() => "?").join(", ");
  const values = normalizeParams(cols.map((c) => data[c]));
  const assignments = cols.map((c) => `"${c}" = excluded."${c}"`).join(", ");
  db.prepare(
    `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${placeholders})
     ON CONFLICT(${conflict}) DO UPDATE SET ${assignments}`,
  ).run(...values);
  const row = db.prepare("SELECT changes() AS c").get() as { c: number };
  return Number(row.c);
}

export function count(table: string): number {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as {
    n: number;
  };
  return Number(row.n);
}