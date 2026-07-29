// Client-side SQL engine for Coding Practice "Run" previews.
// Reuses the app's existing sql.js WASM (public/sql-wasm.wasm), but seeds a
// dataset-specific in-browser SQLite from the SAME .sql that the server grader
// uses — so a passing Run implies a passing Submit. Server remains authoritative.

import initSqlJs, { type Database } from "sql.js"

let sqlPromise: Promise<Awaited<ReturnType<typeof initSqlJs>>> | null = null
const dbCache = new Map<string, Promise<Database>>()

const MAX_ROWS = 200

function getSQL() {
  if (!sqlPromise) sqlPromise = initSqlJs({ locateFile: () => "/sql-wasm.wasm" })
  return sqlPromise
}

function getDb(dataset: string): Promise<Database> {
  let cached = dbCache.get(dataset)
  if (!cached) {
    cached = (async () => {
      const SQL = await getSQL()
      const res = await fetch(`/datasets/${dataset}.sql`)
      if (!res.ok) throw new Error(`Could not load the ${dataset} dataset.`)
      const seed = await res.text()
      const db = new SQL.Database()
      db.run(seed)
      return db
    })()
    dbCache.set(dataset, cached)
  }
  return cached
}

export interface RunResult {
  ok: boolean
  columns: string[]
  rows: (string | number | null)[][]
  rowCount: number
  timeMs: number
  truncated: boolean
  error?: string
}

/** Run a read-only SELECT locally against the dataset and return a capped preview. */
export async function runSql(dataset: string, query: string): Promise<RunResult> {
  const empty = { columns: [], rows: [], rowCount: 0, timeMs: 0, truncated: false }
  const firstKw = query.trim().replace(/^\(+/, "").split(/\s+/)[0]?.toUpperCase()
  if (firstKw && firstKw !== "SELECT" && firstKw !== "WITH") {
    return { ok: false, ...empty, error: "Only read-only SELECT queries can be run here." }
  }
  try {
    const db = await getDb(dataset)
    const start = performance.now()
    const res = db.exec(query)
    const timeMs = Math.round((performance.now() - start) * 10) / 10
    if (res.length === 0) return { ok: true, ...empty, timeMs }
    const last = res[res.length - 1]
    const values = last.values as (string | number | null)[][]
    return {
      ok: true,
      columns: last.columns,
      rows: values.slice(0, MAX_ROWS),
      rowCount: values.length,
      truncated: values.length > MAX_ROWS,
      timeMs,
    }
  } catch (e) {
    return { ok: false, ...empty, error: e instanceof Error ? e.message : String(e) }
  }
}
