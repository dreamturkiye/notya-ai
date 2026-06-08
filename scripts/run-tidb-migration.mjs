#!/usr/bin/env node
/**
 * Run TiDB/MySQL migrations for Notya.
 * Reads DATABASE_URL from env or ~/HQ/.env.render
 */

import { readFileSync, existsSync } from 'fs'
import { homedir } from 'os'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import mysql from 'mysql2/promise'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL

  const renderEnv = join(homedir(), 'HQ', '.env.render')
  if (!existsSync(renderEnv)) return null

  const content = readFileSync(renderEnv, 'utf8')
  const match = content.match(/^DATABASE_URL=(.+)$/m)
  return match?.[1]?.trim().replace(/^["']|["']$/g, '') ?? null
}

async function run() {
  const databaseUrl = loadDatabaseUrl()
  if (!databaseUrl) {
    console.error('DATABASE_URL not found in env or ~/HQ/.env.render')
    process.exit(1)
  }

  if (!databaseUrl.startsWith('mysql://')) {
    console.error('DATABASE_URL is not a mysql:// connection string')
    process.exit(1)
  }

  const migrationPath = join(__dirname, '../lib/db/migrations/001_doctor_profile_tidb.sql')
  const sql = readFileSync(migrationPath, 'utf8')
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'))

  const conn = await mysql.createConnection(databaseUrl)
  console.log('Connected to TiDB')

  for (const statement of statements) {
    try {
      await conn.query(statement)
      console.log('OK:', statement.split('\n')[0].slice(0, 80))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('Duplicate column')) {
        console.log('SKIP (already exists):', statement.split('\n')[0].slice(0, 60))
        continue
      }
      console.error('FAIL:', msg)
      await conn.end()
      process.exit(1)
    }
  }

  await conn.end()
  console.log('TiDB migration 001_doctor_profile complete')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
