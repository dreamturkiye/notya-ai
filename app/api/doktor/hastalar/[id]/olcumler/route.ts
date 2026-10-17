/**
 * MOBIL-PERSONEL-01 — manually entered measurements / vital signs for a patient's file, added by the clinical
 * assistant (asistan) or the doctor. Stored in cihaz_olcumleri (migration 024) with kaynak 'manuel',
 * note_id NULL ("dosyaya alındı, nota bağlanmadı") and onaylandi false: a measurement entered by staff is NOT
 * part of the signed record until the doctor takes it into a note ("not onayı = ölçüm onayı").
 *
 * Roles: doktor + asistan (personelYetki 'olcum.ekle'). The unchanged secretary is refused (sekreterKapali).
 * HASTA-IZOLASYON: the patient is resolved with doctor_id = doktorId BEFORE anything is read or written;
 * a foreign / unknown id is a 404; every row carries doctor_id = doktorId (the practice, not the staff user).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'

export const dynamic = 'force-dynamic'

/** What a staff member may enter by hand. Units are fixed per type so the file stays comparable. */
const OLCUM_TURLERI = {
  ates: { ad: 'Ateş', birim: '°C', min: 30, max: 45 },
  nabiz: { ad: 'Nabız', birim: '/dk', min: 20, max: 300 },
  spo2: { ad: 'SpO₂', birim: '%', min: 40, max: 100 },
  kilo: { ad: 'Kilo', birim: 'kg', min: 0.3, max: 400 },
  boy: { ad: 'Boy', birim: 'cm', min: 20, max: 250 },
  bas_cevresi: { ad: 'Baş çevresi', birim: 'cm', min: 20, max: 80 },
  glukoz: { ad: 'Kan şekeri', birim: 'mg/dL', min: 10, max: 1000 },
  tansiyon: { ad: 'Tansiyon', birim: 'mmHg', min: 0, max: 0 },
} as const
export type OlcumTuru = keyof typeof OLCUM_TURLERI

/** Pure validation, exported for tests. Returns the stored `deger` string and `ayrinti`, or an error message. */
function olcumDogrula(tur: unknown, deger: unknown, ikinci?: unknown): { deger: string; ayrinti: Record<string, unknown> } | { hata: string } {
  if (typeof tur !== 'string' || !(tur in OLCUM_TURLERI)) return { hata: 'Geçersiz ölçüm türü.' }
  const t = OLCUM_TURLERI[tur as OlcumTuru]
  const sayi = (x: unknown) => {
    const n = typeof x === 'number' ? x : Number(String(x ?? '').replace(',', '.').trim())
    return Number.isFinite(n) ? n : null
  }
  if (tur === 'tansiyon') {
    const sis = sayi(deger), dia = sayi(ikinci)
    if (sis == null || dia == null || sis < 40 || sis > 300 || dia < 20 || dia > 200 || dia >= sis) return { hata: 'Tansiyon değerleri geçersiz (büyük/küçük).' }
    return { deger: `${Math.round(sis)}/${Math.round(dia)}`, ayrinti: { sistolik: Math.round(sis), diastolik: Math.round(dia) } }
  }
  const n = sayi(deger)
  if (n == null || n < t.min || n > t.max) return { hata: `${t.ad} değeri geçersiz.` }
  return { deger: String(n), ayrinti: {} }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum
  const { id: patientId } = await params
  if (!(await hastaSahibiMi(supabase, doktorId, patientId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }
  const { data } = await supabase
    .from('cihaz_olcumleri')
    .select('id, tur, deger, birim, alindi, onaylandi, ayrinti')
    .eq('doctor_id', doktorId)
    .eq('patient_id', patientId)
    .eq('kaynak', 'manuel')
    .order('alindi', { ascending: false })
    .limit(30)
  return NextResponse.json({ olcumler: data || [] })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, personelId, user } = oturum
  const { id: patientId } = await params
  if (!(await hastaSahibiMi(supabase, doktorId, patientId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }
  const b = (await req.json().catch(() => ({}))) as { tur?: unknown; deger?: unknown; ikinci?: unknown }
  const d = olcumDogrula(b.tur, b.deger, b.ikinci)
  if ('hata' in d) return NextResponse.json({ error: d.hata }, { status: 400 })
  const t = OLCUM_TURLERI[b.tur as OlcumTuru]
  const { data, error } = await supabase
    .from('cihaz_olcumleri')
    .insert({
      doctor_id: doktorId,
      patient_id: patientId,
      note_id: null,
      tur: b.tur,
      deger: d.deger,
      birim: t.birim,
      ayrinti: { ...d.ayrinti, kaydeden: { rol, personelId: personelId ?? null, userId: user.id } },
      kaynak: 'manuel',
      transport: 'manuel',
      olcum_zamani: new Date().toISOString(),
      onaylandi: false,
    })
    .select('id, tur, deger, birim, alindi, onaylandi')
    .single()
  if (error || !data) return NextResponse.json({ error: 'Ölçüm kaydedilemedi.' }, { status: 500 })
  return NextResponse.json({ olcum: data }, { status: 201 })
}
