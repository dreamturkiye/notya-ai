// ============================================================
// NOTYA AI - API Route: Not Koleksiyonu
// GET /api/notes?pending=true  -> onay bekleyen notlar
//
// Tek not işlemleri: /api/notes/[id] (GET/PUT)
// Onaylama: /api/notes/[id]/approve (POST)
// WhatsApp: /api/notes/whatsapp (POST)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const getSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

type SessionRel = { specialty?: string | null; patient_id?: string | null }

type NoteRow = {
  id: string
  created_at?: string | null
  content_subjektif?: string | null
  content_objektif?: string | null
  content_degerlendirme?: string | null
  content_plan?: string | null
  content_tani?: string | null
  content_ilaclar?: unknown
  icd10_codes?: unknown
  kritik_bulgular?: unknown
  hasta_ozeti?: string | null
  session_id?: string | null
  sessions?: SessionRel | SessionRel[] | null
}

function firstSession(rel: NoteRow['sessions']): SessionRel {
  if (Array.isArray(rel)) return rel[0] || {}
  return rel || {}
}

function maskPatient(patientId?: string | null): string {
  const id = String(patientId || '')
  if (!id) return 'Hasta'
  return `Hasta ${id.slice(0, 8)}`
}

function formatDate(createdAt?: string | null): string {
  if (!createdAt) return ''
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return ''
  try {
    return d.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' })
  } catch {
    return d.toISOString().slice(0, 10)
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  if (!token) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const supabase = getSupabase()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })
  }

  const pending = new URL(req.url).searchParams.get('pending')
  if (pending !== 'true') {
    return NextResponse.json({ error: 'pending=true gerekli' }, { status: 400 })
  }

  // sessions ilişkisi kurulamazsa (PostgREST embed hatası) düz seçime düş
  let rows: NoteRow[] = []

  const joined = await supabase
    .from('notes')
    .select('id, created_at, content_subjektif, content_objektif, content_degerlendirme, content_plan, content_tani, content_ilaclar, icd10_codes, kritik_bulgular, hasta_ozeti, session_id, sessions(specialty, patient_id)')
    .eq('doctor_id', user.id)
    .is('approved_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  if (joined.error) {
    const plain = await supabase
      .from('notes')
      .select('id, created_at, content_subjektif, content_objektif, content_degerlendirme, content_plan, content_tani, content_ilaclar, icd10_codes, kritik_bulgular, hasta_ozeti, session_id')
      .eq('doctor_id', user.id)
      .is('approved_at', null)
      .order('created_at', { ascending: false })
      .limit(50)

    if (plain.error) {
      return NextResponse.json({ error: plain.error.message }, { status: 500 })
    }
    rows = Array.isArray(plain.data) ? (plain.data as NoteRow[]) : []
  } else {
    rows = Array.isArray(joined.data) ? (joined.data as NoteRow[]) : []
  }

  const notes = rows.map((row) => {
    const session = firstSession(row.sessions)
    return {
      id: String(row.id),
      maskedPatient: maskPatient(session.patient_id),
      specialty: String(session.specialty || 'Genel'),
      date: formatDate(row.created_at),
      subjektif: String(row.content_subjektif || ''),
      objektif: String(row.content_objektif || ''),
      degerlendirme: String(row.content_degerlendirme || ''),
      plan: String(row.content_plan || ''),
      tani: String(row.content_tani || ''),
      ilaclar: Array.isArray(row.content_ilaclar) ? row.content_ilaclar : [],
      icdKodlari: Array.isArray(row.icd10_codes) ? row.icd10_codes : [],
      kritikBulgular: Array.isArray(row.kritik_bulgular) ? row.kritik_bulgular : [],
      hastaOzeti: String(row.hasta_ozeti || ''),
    }
  })

  return NextResponse.json(notes)
}
