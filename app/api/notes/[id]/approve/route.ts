// ============================================================
// NOTYA AI - API Route: Not Onaylama
// POST /api/notes/[id]/approve
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { vitalOlcumleriniNormallestir } from '@/lib/clinical/olcumCoz'
import { cekBlokDegistir, cekBlokVarMi, cekNotMetni } from '@/lib/doktor/muayeneCekListesi'
import { cekListeHesapla, cekListeVerisiYukle, kayitliHekimIsaretleri } from '@/lib/doktor/cekListeSunucu'
import { hekimBransi } from '@/lib/doktor/hekimAdi'
import { hastaDogumIso } from '@/lib/specialties/kapsamSunucu'
import { notAsilariniTemizle } from '@/lib/doktor/notAsilari'
import { nottanAsiAktar, type AsiAktarimSonucu } from '@/lib/doktor/notAsiAktarim'

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
      'id, doctor_id, session_id, content_subjektif, content_objektif, content_degerlendirme, content_plan, content_anamnez, content_fizik_muayene, content_tani, content_tedavi, basvuru_yakinmasi, vitaller, hasta_ozeti, alarm_bulgulari, content_ilaclar, content_asilar, icd10_codes, recete_onerisi, ai_degerlendirme, created_at, sessions(patient_id, specialty)'
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

  // NOTYA-ASI-NOT-01: "Bu muayenede uygulanan aşılar" (dizi) — hekim formda düzenler; onayda aşı kartına aktarılır
  // (nottanAsiAktar aşağıda). Liste sunucuda temizlenir: ad normalize, doz 1–12, tarih ISO — değer uydurulmaz.
  const yeniAsilar = duzenlemeler.asilar
  if (Array.isArray(yeniAsilar)) {
    const temiz = notAsilariniTemizle(yeniAsilar)
    const eskiStr = JSON.stringify(existing.content_asilar || [])
    const yeniStr = JSON.stringify(temiz)
    if (eskiStr !== yeniStr) {
      guncelleme.content_asilar = temiz
      loglar.push({ note_id: noteId, doctor_id: user.id, alan: 'content_asilar', onceki: eskiStr.slice(0, 2000), sonraki: yeniStr.slice(0, 2000) })
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
  let yeniAiDeg = duzenlemeler.aiDegerlendirme
  // NOTYA-CEK-DOGRULA-02: ÇEK LİSTESİ bloğu istemciden / LLM'den alınmaz — onaylanan GÜNCEL alanlardan sunucuda yeniden hesaplanır.
  const aiTaban = typeof yeniAiDeg === 'string' && yeniAiDeg.trim() ? yeniAiDeg : String(existing.ai_degerlendirme || '')
  if (cekBlokVarMi(existing.ai_degerlendirme) || cekBlokVarMi(aiTaban)) {
    try {
      const seansC = (Array.isArray(existing.sessions) ? existing.sessions[0] : existing.sessions) as { patient_id?: string | null; specialty?: string | null } | null
      const patientId = seansC?.patient_id ? String(seansC.patient_id) : null
      const son = (kolon: string) => (kolon in guncelleme ? guncelleme[kolon] : (existing as Record<string, unknown>)[kolon]) as string | null
      const [doktorBransi, dogumIso] = await Promise.all([hekimBransi(supabase, user.id), hastaDogumIso(supabase, user.id, patientId)])
      const veri = await cekListeVerisiYukle(supabase, {
        doktorId: user.id, patientId, seansBransi: seansC?.specialty ?? null, doktorBransi, hastaDogumIso: dogumIso,
        referansIso: existing.created_at as string, haricNotId: noteId,
      })
      const { metin } = cekListeHesapla(veri, cekNotMetni({
        basvuruYakinmasi: son('basvuru_yakinmasi'), subjektif: son('content_subjektif'), objektif: son('content_objektif'),
        degerlendirme: son('content_degerlendirme'), plan: son('content_plan'), anamnez: son('content_anamnez'),
        fizikMuayene: son('content_fizik_muayene'), tani: son('content_tani'), tedavi: son('content_tedavi'),
        vitaller: (son('vitaller') as unknown as Record<string, unknown>) || null, ilaclar: son('content_ilaclar'),
        asilar: son('content_asilar'),
      }), kayitliHekimIsaretleri(existing.ai_degerlendirme, veri))
      yeniAiDeg = cekBlokDegistir(aiTaban, metin)
    } catch (e) { console.error('[approve] cek-liste', e) }
  }
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
  // geçerlidir; reçete aktarımı onayı bloklamamalı. NOTYA-AKTARIM-HATA-01 (Kaan,
  // 2026-09-24): hata alanı artık istemciye gönderiliyor — önceden yalnız sunucu
  // logunda kalıyordu, hekim aktarımın sessizce başarısız olduğunu hiçbir zaman
  // göremiyordu (çakışma uyarısı vardı, gerçek hata yoktu).
  let receteAktarim: { aktarilan: number; atlanan: number; sonlandirilan: number; hata: string | null } | null = null
  let asiAktarim: AsiAktarimSonucu | null = null
  const seansA = Array.isArray(existing.sessions) ? existing.sessions[0] : existing.sessions
  const hastaIdA = (seansA as { patient_id?: string } | null)?.patient_id
  // HASTA-IZOLASYON-01: only into this doctor's OWN patient — a session can carry a foreign patient_id
  // (sessions are also inserted from the browser), and hasta_ilaclar / asilar feed the patient portal.
  let hastaBenim = false
  try {
    const { hastaSahibiMi } = await import('@/lib/doktor/hastaSahipligi')
    hastaBenim = !!hastaIdA && (await hastaSahibiMi(supabase, user.id, hastaIdA))
  } catch (e) { console.error('[approve] sahiplik', e) }

  // NOTYA-ASI-NOT-01: not onayı = aşı kartı. Her onayda (ilk + yeniden) notun aşıları kartla eşitlenir; aktarım
  // başarısız olursa onay yine geçerlidir (ilaç aktarımıyla aynı kural).
  if (hastaBenim && hastaIdA) {
    try {
      const sonAsilar = 'content_asilar' in guncelleme ? guncelleme.content_asilar : existing.content_asilar
      const s = await nottanAsiAktar(supabase, {
        noteId, doctorId: user.id, patientId: hastaIdA, asilar: sonAsilar,
        notTarihi: existing.created_at as string | null, dogumIso: await hastaDogumIso(supabase, user.id, hastaIdA),
      })
      if (s.hata) console.error('[asi-aktarim]', s.hata)
      asiAktarim = s
    } catch (e) { console.error('[asi-aktarim]', e) }
  }

  try {
    const patientId = hastaIdA
    if (patientId && hastaBenim) {
      const { nottanIlacAktar } = await import('@/lib/doktor/receteAktarim')
      const sonuc = await nottanIlacAktar(supabase, {
        noteId,
        doctorId: user.id,
        patientId,
        tarih: existing.created_at as string | null,
      })
      if (sonuc.hata) console.error('[recete-aktarim]', sonuc.hata)
      receteAktarim = { aktarilan: sonuc.aktarilan, atlanan: sonuc.atlanan, sonlandirilan: sonuc.sonlandirilan, hata: sonuc.hata }
    }
  } catch (e) {
    console.error('[recete-aktarim]', e)
  }

  // NOTYA-ILAC-SONLANDIR-01 (Kaan / Dr. Gökhan, 2026-09-25): not bir ilacı kesiyorsa ("Klacid'i keselim",
  // "artık vermiyoruz") o ilaç hastanın İlaçlar listesinde sonlandırılır — yalnız onayda, aktarımdan SONRA
  // (bu notun yeniden yazdığı ilaçlar asla kesilmez). Hata onayı bloklamaz; hekime tek satır + Geri al gider.
  let ilacSonlandirma: { sonlandirilan: { id: string; ad: string; alinti: string }[]; mesaj: string; hata: string | null } | null = null
  if (hastaIdA && hastaBenim) {
    try {
      const { nottanIlacSonlandir } = await import('@/lib/doktor/ilacSonlandir')
      const son = (kolon: string) => (kolon in guncelleme ? guncelleme[kolon] : (existing as Record<string, unknown>)[kolon])
      ilacSonlandirma = await nottanIlacSonlandir(supabase, {
        noteId, doctorId: user.id, patientId: hastaIdA,
        not: {
          content_subjektif: son('content_subjektif'), content_anamnez: son('content_anamnez'), content_objektif: son('content_objektif'),
          content_degerlendirme: son('content_degerlendirme'), content_tani: son('content_tani'), content_plan: son('content_plan'),
          content_tedavi: son('content_tedavi'), content_ilaclar: son('content_ilaclar'), recete_onerisi: son('recete_onerisi'),
        },
      })
      if (ilacSonlandirma.hata) console.error('[ilac-sonlandir]', ilacSonlandirma.hata)
    } catch (e) { console.error('[ilac-sonlandir]', e) }
  }

  // NOTYA-OGRENME-03: her onay ilişki sayacına işler (not + düzeltme adedi)
  try {
    const { seansIsle } = await import('@/lib/doktor/hafiza')
    await seansIsle(supabase, user.id, 'not')
    if (loglar.length > 0) await seansIsle(supabase, user.id, 'duzeltme', loglar.length)
  } catch (e) { console.error('[hafiza] onay', e) }

  if (hastaBenim && hastaIdA) {
    try {
      const { paketSoapKaydet } = await import('@/lib/seansPaketi/doldur')
      const { decrypt } = await import('@/lib/security/encryption')
      const son = (kolon: string) => (kolon in guncelleme ? guncelleme[kolon] : (existing as Record<string, unknown>)[kolon])
      const hamIlac = son('content_ilaclar')
      const ilaclar = Array.isArray(hamIlac) ? hamIlac.map((it) => { const o = (it || {}) as { ad?: string; sure?: string }; return { ad: String(o.ad || ''), sure: o.sure || null } }).filter((i) => i.ad) : []
      let dogum: string | null = null
      const { data: hastaSatir } = await supabase.from('patients').select('dob_encrypted').eq('id', hastaIdA).eq('doctor_id', user.id).maybeSingle()
      try { dogum = hastaSatir?.dob_encrypted ? String(decrypt(String(hastaSatir.dob_encrypted)) || '') : null } catch { dogum = null }
      await paketSoapKaydet(supabase, {
        doktorId: user.id,
        patientId: hastaIdA,
        noteId,
        seansId: (existing as { session_id?: string }).session_id || null,
        not: {
          sikayet: son('basvuru_yakinmasi'),
          fizik: son('content_objektif'),
          icd: son('icd10_codes'),
          ilaclar,
          vitaller: (son('vitaller') || null) as { kilo?: number | null } | null,
          brans: (seansA as { specialty?: string } | null)?.specialty || null,
          dogum,
        },
        duranAdlar: (ilacSonlandirma?.sonlandirilan || []).map((s) => s.ad),
      })
    } catch (e) { console.error('[seans-paketi]', e) }
  }

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

  return NextResponse.json({ success: true, duzenlenenAlanSayisi: loglar.length, receteAktarim, asiAktarim, ilacSonlandirma })
}
