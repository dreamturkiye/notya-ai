import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/security/encryption'

export const dynamic = 'force-dynamic'

type LabTest = {
  testName?: string
  ad?: string
  name?: string
  deger?: string | number
  value?: string | number
  birim?: string
  unit?: string
  referans?: string
  ref?: string
  anormal?: boolean
  abnormal?: boolean
  flag?: string
}

function firstNameFromEncrypted(nameEncrypted: string | null | undefined): string {
  if (!nameEncrypted) return 'Hasta'
  try {
    const raw = decrypt(nameEncrypted)
    const parsed = JSON.parse(raw) as { ad?: string }
    const full = (parsed.ad || raw || '').trim()
    if (!full) return 'Hasta'
    return full.split(/\s+/)[0] || 'Hasta'
  } catch {
    return 'Hasta'
  }
}

function flattenLabs(rows: Array<{ id: string; testler: unknown }> | null): Array<{
  id: string
  testName: string
  deger: string
  birim: string
  referans: string
  anormal: boolean
}> {
  const out: Array<{
    id: string
    testName: string
    deger: string
    birim: string
    referans: string
    anormal: boolean
  }> = []
  for (const row of rows || []) {
    const tests = Array.isArray(row.testler)
      ? (row.testler as LabTest[])
      : row.testler && typeof row.testler === 'object' && Array.isArray((row.testler as { tests?: unknown }).tests)
        ? ((row.testler as { tests: LabTest[] }).tests)
        : []
    tests.forEach((t, idx) => {
      const testName = String(t.testName || t.ad || t.name || `Test ${idx + 1}`)
      const deger = String(t.deger ?? t.value ?? '—')
      const birim = String(t.birim || t.unit || '')
      const referans = String(t.referans || t.ref || '')
      const anormal = Boolean(
        t.anormal ?? t.abnormal ?? (typeof t.flag === 'string' && /abnormal|yüksek|dusuk|düşük|h/i.test(t.flag))
      )
      out.push({ id: `${row.id}-${idx}`, testName, deger, birim, referans, anormal })
    })
  }
  return out
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token
  if (!token) {
    return NextResponse.json({ error: 'Token gerekli' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Portal yapılandırılmamış.' }, { status: 500 })
  }

  const sb = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  const { data: tokenData, error: tokenError } = await sb
    .from('hasta_portal_tokens')
    .select('patient_id, doctor_id, expires_at')
    .eq('token_hash', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (tokenError || !tokenData) {
    return NextResponse.json({ error: 'Token bulunamadı veya süresi dolmuş' }, { status: 404 })
  }

  const patientId = tokenData.patient_id as string

  const { data: patientRow } = await sb
    .from('patients')
    .select('id, name_encrypted, doctor_id')
    .eq('id', patientId)
    .maybeSingle()

  const firstName = firstNameFromEncrypted(patientRow?.name_encrypted)

  // Recent sessions (prefer approved when column exists / is set)
  const { data: sessionsRaw } = await sb
    .from('sessions')
    .select('id, created_at, specialty, approved_at')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(10)

  const sessionIds = (sessionsRaw || []).map((s) => s.id)
  let notesBySession = new Map<string, { degerlendirme: string; plan: string }>()
  if (sessionIds.length) {
    const { data: notes } = await sb
      .from('notes')
      .select('session_id, content_degerlendirme, content_plan, approved_at')
      .in('session_id', sessionIds)
    for (const n of notes || []) {
      const sid = String(n.session_id || '')
      if (!sid || notesBySession.has(sid)) continue
      notesBySession.set(sid, {
        degerlendirme: String(n.content_degerlendirme || '').trim(),
        plan: String(n.content_plan || '').trim(),
      })
    }
  }

  const sessions = (sessionsRaw || []).map((s) => {
    const note = notesBySession.get(s.id)
    return {
      id: s.id,
      date: s.created_at,
      specialty: String(s.specialty || 'Genel'),
      degerlendirme: note?.degerlendirme || note?.plan || 'Ziyaret kaydı',
    }
  })

  const { data: medsRaw } = await sb
    .from('hasta_ilaclar')
    .select('id, ilac_adi, doz, kullanim_sikli, notlar, aktif')
    .eq('patient_id', patientId)
    .eq('aktif', true)
    .limit(40)

  const medications = (medsRaw || []).map((m) => ({
    id: m.id,
    drugName: String(m.ilac_adi || 'İlaç'),
    dose: String(m.doz || '—'),
    frequency: String(m.kullanim_sikli || '—'),
    doctorNote: String(m.notlar || ''),
  }))

  const { data: labRaw } = await sb
    .from('hasta_lab_sonuclari')
    .select('id, testler, created_at')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(5)

  const labs = flattenLabs(labRaw)

  // Latest doctor note / follow-up from most recent note plan
  let doctorNote = {
    takipSuresi: '—',
    note: 'Doktorunuz henüz paylaşılmış bir takip notu eklemedi.',
    nextAppointment: undefined as string | undefined,
  }
  const latestNote = [...notesBySession.values()].find((n) => n.plan || n.degerlendirme)
  if (latestNote) {
    doctorNote = {
      takipSuresi: 'Kontrol planına göre',
      note: latestNote.plan || latestNote.degerlendirme,
      nextAppointment: undefined,
    }
  }

  // Shape matches app/portal/hasta/[token]/page.tsx
  return NextResponse.json({
    patient: { firstName },
    sessions,
    medications,
    labs,
    doctorNote,
  })
}
