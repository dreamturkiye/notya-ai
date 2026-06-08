#!/usr/bin/env node
/**
 * Run sandbox_schema.sql against Supabase Postgres.
 * Requires DATABASE_URL or SUPABASE_DB_URL in .env.local
 *
 * Manual fallback: paste lib/db/sandbox_schema.sql into Supabase SQL Editor.
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

  const sqlPath = resolve(root, 'lib/db/sandbox_schema.sql')
  const sql = readFileSync(sqlPath, 'utf8')

  if (!dbUrl) {
    console.log('No DATABASE_URL / SUPABASE_DB_URL in .env.local')
    console.log('Run manually in Supabase SQL Editor:')
    console.log('  lib/db/sandbox_schema.sql')
    process.exit(0)
  }

  try {
    const pg = await import('pg')
    const client = new pg.default.Client({ connectionString: dbUrl })
    await client.connect()
    await client.query(sql)
    await client.end()
    console.log('✓ sandbox_schema.sql applied successfully')
  } catch (e) {
    console.error('Migration failed:', e.message)
    console.log('\nManual fallback: paste lib/db/sandbox_schema.sql into Supabase SQL Editor')
    process.exit(1)
  }
}

main()
