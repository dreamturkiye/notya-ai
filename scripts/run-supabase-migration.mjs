#!/usr/bin/env node
/**
 * Run Postgres doctor profile migration against Supabase.
 * Requires DATABASE_URL or SUPABASE_DB_URL in .env.local
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnvLocal() {
  const envPath = resolve(root, '.env.local')
  if (!existsSync(envPath)) return {}
  const lines = readFileSync(envPath, 'utf8').split('\n')
  const env = {}
  for (const line of lines) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return env
}

async function main() {
  const env = { ...process.env, ...loadEnvLocal() }
  const dbUrl = env.DATABASE_URL || env.SUPABASE_DB_URL

  const sqlPath = resolve(root, 'lib/db/migrations/001_doctor_profile.sql')
  const sql = readFileSync(sqlPath, 'utf8')

  if (!dbUrl) {
    console.log('No DATABASE_URL / SUPABASE_DB_URL — run manually in Supabase SQL Editor:')
    console.log('  lib/db/migrations/001_doctor_profile.sql')
    process.exit(0)
  }

  try {
    const pg = await import('pg')
    const client = new pg.default.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
    await client.connect()
    await client.query(sql)
    await client.end()
    console.log('001_doctor_profile.sql applied successfully')
  } catch (e) {
    console.error('Migration failed:', e instanceof Error ? e.message : e)
    process.exit(1)
  }
}

main()
