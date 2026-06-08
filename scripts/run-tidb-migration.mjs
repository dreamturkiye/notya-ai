#!/usr/bin/env node
// ============================================================
// Run TiDB migration for doctor profile columns
// Usage: DATABASE_URL=mysql://... node scripts/run-tidb-migration.mjs
// ============================================================

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationPath = join(__dirname, '../lib/db/migrations/001_doctor_profile_tidb.sql')

async function main() {
  const databaseUrl = process.env.DATABASE_URL || process.env.TIDB_DATABASE_URL
  if (!databaseUrl) {
    console.error('DATABASE_URL or TIDB_DATABASE_URL required')
    process.exit(1)
  }

  let mysql
  try {
    mysql = await import('mysql2/promise')
  } catch {
    console.error('mysql2 not installed. Run: npm install mysql2')
    process.exit(1)
  }

  const sql = readFileSync(migrationPath, 'utf8')
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'))

  const conn = await mysql.createConnection(databaseUrl)
  console.log('Connected to TiDB')

  for (const stmt of statements) {
    try {
      await conn.query(stmt)
      console.log('OK:', stmt.slice(0, 60).replace(/\s+/g, ' ') + '...')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('Duplicate column') || msg.includes('already exists')) {
        console.log('SKIP (already applied):', stmt.slice(0, 40))
      } else {
        console.error('FAIL:', msg)
        await conn.end()
        process.exit(1)
      }
    }
  }

  await conn.end()
  console.log('TiDB migration complete')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
