// app/api/admin/migrate/route.ts
// One-time migration endpoint - run once then disable
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const results: string[] = []
  const sqls = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS profession_type TEXT DEFAULT 'doktor'",
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS unvan TEXT',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS büro_adi TEXT',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS sehir TEXT',
    'ALTER TABLE notes ADD COLUMN IF NOT EXISTS raw_note TEXT',
    'ALTER TABLE notes ADD COLUMN IF NOT EXISTS vergi_risk_skoru INTEGER',
    'ALTER TABLE notes ADD COLUMN IF NOT EXISTS görüşme_turu TEXT',
    "ALTER TABLE notes ADD COLUMN IF NOT EXISTS profession_type TEXT DEFAULT 'doktor'",
    'ALTER TABLE sessions ADD COLUMN IF NOT EXISTS görüşme_turu TEXT',
    'CREATE TABLE IF NOT EXISTS clients (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, musavir_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, şirket_adi TEXT NOT NULL, vergi_no TEXT, faaliyet_alani TEXT, şirket_turu TEXT, yetkili_kisi TEXT, telefon TEXT, email TEXT, is_active BOOLEAN DEFAULT TRUE, notlar TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())',
    'CREATE TABLE IF NOT EXISTS beyan_takvimi (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, musavir_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, client_id UUID REFERENCES clients(id) ON DELETE CASCADE, beyan_turu TEXT NOT NULL, son_gun DATE NOT NULL, tamamlandi BOOLEAN DEFAULT FALSE, hatırlatma_gönderildi BOOLEAN DEFAULT FALSE, notlar TEXT, created_at TIMESTAMPTZ DEFAULT NOW())',
  ]
  for (const sql of sqls) {
    const { error } = await getSupabase().rpc('exec_sql' as never, { query: sql } as never)
    if (error) {
      // Try direct SQL via from().insert approach - won't work for DDL
      // Instead use the Postgres connection directly
      results.push('SKIP (use dashboard): ' + sql.slice(0,40))
    } else {
      results.push('OK: ' + sql.slice(0,40))
    }
  }
  return NextResponse.json({ results, sql_file: 'Run supabase_migration.sql in Supabase SQL Editor' })
}
