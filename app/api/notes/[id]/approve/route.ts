// ============================================================
// NOTYA AI - API Route: Not Onaylama
// POST /api/notes/[id]/approve
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { vitalOlcumleriniNormallestir } from '@/lib/clinical/olcumCoz'

export const dynamic = 'force-dynamic'

const getSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } })

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  if (!token) {
    return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })
  }

  const supabase = getSupabase()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Geçersiz token' }, { status: 401 })
  }

  const noteId = params?.id
  if (!noteId) {
    return NextResponse.json({ success: false, error: 'Not id gerekli' }, { status: 400 })
  }

  // Notun bu doktora ait olduğunu doğrula
  const { data: existing } = await supabase
    .from('notes')
    .select(
      'id, doctor_id, content_subjektif, content_objektif, content_degerlendirme, content_plan, basvuru_yakinmasi, vitaller, hasta_ozeti, alarm_bulgulari, content_ilaclar, icd10_codes, recete_onerisi, ai_degerlendirme, created_at, sessions(patient_id)'
    )
    .eq('id', noteId)
    .eq('doctor_id', user.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ success: false, error: 'Not bulunamadı' }, { status: 404 })
  }

  // NOTYA-SOAP-02: doktor onaylamadan önce düzenleyebilir. Düzenlemeler hem nota yazılır
  // hem de not_duzenlemeleri tablosuna önce/sonra olarak loglanır — Ayşe'nin "10. seansta
  // keskinleşmesinin" veri tabanı (v2'de bu farklar prompta damitılacak). Stil öğrenmesinin
  // v1'i zaten aktif: onaylı notlar sonraki üretimlere üslup örneği olarak gider.
  const body = await req.json().catch(() => ({}))
  const duzenlemeler = (body?.duzenlemeler || {}) as Record<string, unknown>
  const alanEsleme: Record<string, keyof typeof existing> = {
    subjektif: 'content_subjektif',
    objektif: 'content_objektif',
    degerlendirme: 'content_degerlendirme',
    plan: 'content_plan',
    basvuruYakinmasi: 'basvuru_yakinmasi',   // Kaan/Gökhan 2026-09-10: başlık dışı her şey düzenlenebilir
    hastaOzeti: 'hasta_ozeti',               // veliye giden özet — doktorun sözü
  }
  const guncelleme: Record<string, unknown> = {
    approved_at: new Date().toISOString(),
    approved_by: user.id,
  }
  const loglar: { note_id: string; doctor_id: string; alan: string; onceki: string; sonraki: string }[] = []
  for (const [alan, kolon] of Object.entries(alanEsleme)) {
    const yeni = duzenlemeler[alan]
    if (typeof yeni !== 'string') continue
    const eski = String(existing[kolon] || '')
    if (yeni.trim() && yeni !== eski) {
      guncelleme[kolon] = yeni
      loglar.push({ note_id: noteId, doctor_id: user.id, alan, onceki: eski.slice(0, 2000), sonraki: yeni.slice(0, 2000) })
    }
  }

  // Evde dikkat edilmesi gerekenler (dizi) — veliye gider, doktor değiştirebilir
  const yeniAlarm = duzenlemeler.alarmBulgulari
  if (Array.isArray(yeniAlarm)) {
    const temiz = yeniAlarm.map((x) => String(x ?? '').trim()).filter(Boolean).slice(0, 20)
    const eskiStr = JSON.stringify(existing.alarm_bulgulari || [])
    const yeniStr = JSON.stringify(temiz)
    if (eskiStr !== yeniStr) {
      guncelleme.alarm_bulgulari = temiz
      loglar.push({ note_id: noteId, doctor_id: user.id, alan: 'alarm_bulgulari', onceki: eskiStr.slice(0, 2000), sonraki: yeniStr.slice(0, 2000) })
    }
  }
  // İlaçlar (dizi) — doktor İnceleme'de tamamen düzenleyebilir; onayda hasta dosyasına/portala
  // bu liste aktarılır (nottanIlacAktar aşağıda content_ilaclar'ı yeniden okur).
  const yeniIlaclar = duzenlemeler.ilaclar
  if (Array.isArray(yeniIlaclar)) {
    const temiz = yeniIlaclar
      .map((it) => { const o = (it || {}) as Record<string, unknown>; return { ad: String(o.ad || '').trim(), doz: String(o.doz || '').trim(), kullanim: String(o.kullanim || '').trim(), sure: String(o.sure || '').trim() } })
      .filter((i) => i.ad)
      .slice(0, 30)
    const eskiStr = JSON.stringify(existing.content_ilaclar || [])
    const yeniStr = JSON.stringify(temiz)
    if (eskiStr !== yeniStr) {
      guncelleme.content_ilaclar = temiz
      loglar.push({ note_id: noteId, doctor_id: user.id, alan: 'content_ilaclar', onceki: eskiStr.slice(0, 2000), sonraki: yeniStr.slice(0, 2000) })
    }
  }

  // ICD-10 önerileri (dizi) — Ayşe tanı değişince yeniden üretebilir, doktor onaylar
  const yeniIcd = duzenlemeler.icdKodlari
  if (Array.isArray(yeniIcd)) {
    const temiz = yeniIcd.map((it) => { const o = (it || {}) as Record<string, unknown>; return { code: String(o.code || '').trim(), description_tr: String(o.description_tr || o.description || '').trim(), is_primary: !!o.is_primary } }).filter((i) => i.code).slice(0, 15)
    const eskiStr = JSON.stringify(existing.icd10_codes || [])
    const yeniStr = JSON.stringify(temiz)
    if (eskiStr !== yeniStr) {
      guncelleme.icd10_codes = temiz
      loglar.push({ note_id: noteId, doctor_id: user.id, alan: 'icd10_codes', onceki: eskiStr.slice(0, 2000), sonraki: yeniStr.slice(0, 2000) })
    }
  }

  // Ayşe'nin reçete önerisi (dizi) — doktorun kendi "ilaclar" listesinden AYRI, yalnız öneri
  const yeniOneri = duzenlemeler.receteOnerisi
  if (Array.isArray(yeniOneri)) {
    const temiz = yeniOneri.map((it) => { const o = (it || {}) as Record<string, unknown>; return { ticariOrnek: String(o.ticariOrnek || '').trim(), etkenMadde: String(o.etkenMadde || '').trim(), doz: String(o.doz || '').trim(), kullanim: String(o.kullanim || '').trim(), sure: String(o.sure || '').trim(), sgkListesinde: !!o.sgkListesinde, not: String(o.not || '').trim() } }).filter((i) => i.ticariOrnek).slice(0, 15)
    const eskiStr = JSON.stringify(existing.recete_onerisi || [])
    const yeniStr = JSON.stringify(temiz)
    if (eskiStr !== yeniStr) {
      guncelleme.recete_onerisi = temiz
      loglar.push({ note_id: noteId, doctor_id: user.id, alan: 'recete_onerisi', onceki: eskiStr.slice(0, 2000), sonraki: yeniStr.slice(0, 2000) })
    }
  }

  // Ayşe'nin değerlendirmesi (metin, hastaya görünmez) — tanı değişince yeniden üretilebilir
  const yeniAiDeg = duzenlemeler.aiDegerlendirme
  if (typeof yeniAiDeg === 'string' && yeniAiDeg.trim() && yeniAiDeg.trim() !== String(existing.ai_degerlendirme || '').trim()) {
    guncelleme.ai_degerlendirme = yeniAiDeg.trim().slice(0, 4000)
    loglar.push({ note_id: noteId, doctor_id: user.id, alan: 'ai_degerlendirme', onceki: String(existing.ai_degerlendirme || '').slice(0, 2000), sonraki: yeniAiDeg.trim().slice(0, 2000) })
  }

  // Yaşamsal bulgular (JSON) — doktor İnceleme'de değiştirebilir; değişiklik öğrenme loguna da girer
  const yeniVital = duzenlemeler.vitaller
  if (yeniVital && typeof yeniVital === 'object' && !Array.isArray(yeniVital)) {
    const temiz: Record<string, string> = {}
    const norm = vitalOlcumleriniNormallestir(yeniVital) as Record<string, unknown>
    for (const [k, v] of Object.entries(norm)) { const t = String(v ?? '').trim(); if (t) temiz[k] = t.slice(0, 40) }
    const eskiStr = JSON.stringify(existing.vitaller || {})
    const yeniStr = JSON.stringify(temiz)
    if (eskiStr !== yeniStr) {
      guncelleme.vitaller = temiz
      loglar.push({ note_id: noteId, doctor_id: user.id, alan: 'vitaller', onceki: eskiStr.slice(0, 2000), sonraki: yeniStr.slice(0, 2000) })
    }
  }
  const { error: updateError } = await supabase
    .from('notes')
    .update(guncelleme)
    .eq('id', noteId)
    .eq('doctor_id', user.id)

  if (updateError) {
    return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
  }

  // NOTYA-RECETE-01: onay aynı zamanda paylaşım kapısı. Nottaki reçeteler burada
  // doktorun ilaç listesine 'beklemede' olarak aktarılır; aktif/sonlandırıldı
  // kararını doktor panelden verir ve portal yalnızca onaylı satırları gösterir
  // (Dr. Mamur, 2026-09-08 — Seçenek C). Aktarım başarısız olursa onay yine
  // geçerlidir; reçete aktarımı onayı bloklamamalı.
  let receteAktarim: { aktarilan: number; atlanan: number } | null = null
  try {
    const seans = Array.isArray(existing.sessions) ? existing.sessions[0] : existing.sessions
    const patientId = (seans as { patient_id?: string } | null)?.patient_id
    // HASTA-IZOLASYON-01: only into this doctor's OWN patient — a session can carry a foreign patient_id
    // (sessions are also inserted from the browser), and hasta_ilaclar feeds the patient portal.
    const { hastaSahibiMi } = await import('@/lib/doktor/hastaSahipligi')
    if (patientId && (await hastaSahibiMi(supabase, user.id, patientId))) {
      const { nottanIlacAktar } = await import('@/lib/doktor/receteAktarim')
      const sonuc = await nottanIlacAktar(supabase, {
        noteId,
        doctorId: user.id,
        patientId,
        tarih: existing.created_at as string | null,
      })
      if (sonuc.hata) console.error('[recete-aktarim]', sonuc.hata)
      receteAktarim = { aktarilan: sonuc.aktarilan, atlanan: sonuc.atlanan }
    }
  } catch (e) {
    console.error('[recete-aktarim]', e)
  }

  // NOTYA-OGRENME-03: her onay ilişki sayacına işler (not + düzeltme adedi)
  try {
    const { seansIsle } = await import('@/lib/doktor/hafiza')
    await seansIsle(supabase, user.id, 'not')
    if (loglar.length > 0) await seansIsle(supabase, user.id, 'duzeltme', loglar.length)
  } catch (e) { console.error('[hafiza] onay', e) }

  if (loglar.length > 0) {
    try { await supabase.from('not_duzenlemeleri').insert(loglar) } catch { /* öğrenme logu kritik değil */ }
    // NOTYA-OGRENME-02: düzeltme içeren her onayda profil damıtılır (Haiku — ucuz, ~1sn).
    // Damıtılan profil sonraki tüm not üretimlerine "öğrenilmiş tercihler" olarak gider.
    try {
      const { data: gecmis } = await supabase
        .from('not_duzenlemeleri')
        .select('alan, onceki, sonraki')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      const { data: profilSatiri } = await supabase
        .from('doktor_stil_profilleri')
        .select('profil, ornek_sayisi')
        .eq('doctor_id', user.id)
        .maybeSingle()
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const { stilProfiliDamit } = await import('@/lib/doktor/soapUret')
      const { hekimBransi } = await import('@/lib/doktor/hekimAdi')
      const yeniProfil = await stilProfiliDamit(
        new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }),
        String(profilSatiri?.profil || ''),
        gecmis || [],
        await hekimBransi(supabase, user.id)
      )
      if (yeniProfil) {
        await supabase.from('doktor_stil_profilleri').upsert({
          doctor_id: user.id,
          profil: yeniProfil,
          ornek_sayisi: (profilSatiri?.ornek_sayisi || 0) + loglar.length,
          guncelleme: new Date().toISOString(),
        })
      }
    } catch (e) { console.error('[ogrenme] damitma', e) }
  }

  return NextResponse.json({ success: true, duzenlenenAlanSayisi: loglar.length, receteAktarim })
}
