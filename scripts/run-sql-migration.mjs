#!/usr/bin/env node
/**
 * Apply one SQL migration from lib/db/migrations against Supabase.
 * Usage: node scripts/run-sql-migration.mjs 002_pabau_connections.sql
 * Requires DATABASE_URL or SUPABASE_DB_URL in .env.local (same contract as run-supabase-migration.mjs).
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnvLocal() {
  const envPath = resolve(root, '.env.local')
  if (!existsSync(envPath)) return {}
  const env = {}
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return env
}

const file = process.argv[2]
if (!file) { console.error('Usage: node scripts/run-sql-migration.mjs <file.sql>'); process.exit(1) }
const sqlPath = resolve(root, 'lib/db/migrations', file)
const sql = readFileSync(sqlPath, 'utf8')

const env = { ...process.env, ...loadEnvLocal() }
const dbUrl = env.DATABASE_URL || env.SUPABASE_DB_URL
if (!dbUrl) {
  console.log(`No DATABASE_URL / SUPABASE_DB_URL — run manually in Supabase SQL Editor: lib/db/migrations/${file}`)
  process.exit(0)
}

const pg = await import('pg')
const client = new pg.default.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
await client.connect()
try {
  await client.query(sql)
  console.log(`${file} applied successfully`)
} finally {
  await client.end()
}
