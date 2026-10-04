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
import { asilariMetindenTamamla, metindenUygulananAsilariCikar, notAsilariniTemizle } from '@/lib/doktor/notAsilari'
import { nottanAsiAktar, ziyaretGunu, type AsiAktarimSonucu } from '@/lib/doktor/notAsiAktarim'
import { metindenTetkikleriCikar, notTetkikleriniTemizle } from '@/lib/doktor/notTetkikler'
import { nottanTetkikAktar, type TetkikAktarimSonucu } from '@/lib/doktor/notTetkikAktarim'

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

  // content_tetkikler (migration 114) — kolon yoksa null; onay yine çalışır.
  let mevcutTetkikler: unknown = null
  {
    const { data: tRow, error: tErr } = await supabase.from('notes').select('content_tetkikler').eq('id', noteId).eq('doctor_id', user.id).maybeSingle()
    if (!tErr) mevcutTetkikler = tRow?.content_tetkikler ?? null
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
  // NOTYA-ASI-NOT-05: liste boşsa objektif/plan/tedavi metninden "uygulandı/yaptım" aşılarını çıkar
  // (yeniden-değerlendirme asilar'ı AI ile yazmadığı için hekim metni otorite).
  const yeniAsilar = duzenlemeler.asilar
  {
    let temiz = Array.isArray(yeniAsilar) ? notAsilariniTemizle(yeniAsilar) : notAsilariniTemizle(existing.content_asilar)
    if (!temiz.length) {
      const son = (kolon: string) => (kolon in guncelleme ? guncelleme[kolon] : (existing as Record<string, unknown>)[kolon]) as string | null
      const gun = ziyaretGunu(existing.created_at as string | null)
      temiz = metindenUygulananAsilariCikar([son('content_objektif'), son('content_plan'), son('content_tedavi')])
        .map((a) => ({ ...a, uygulama_tarihi: a.uygulama_tarihi || gun }))
    } else {
      const son = (kolon: string) => (kolon in guncelleme ? guncelleme[kolon] : (existing as Record<string, unknown>)[kolon]) as string | null
      const gun = ziyaretGunu(existing.created_at as string | null)
      temiz = asilariMetindenTamamla(temiz, [son('content_objektif'), son('content_plan'), son('content_tedavi')])
        .map((a) => ({ ...a, uygulama_tarihi: a.uygulama_tarihi || gun }))
    }
    const eskiStr = JSON.stringify(existing.content_asilar || [])
    const yeniStr = JSON.stringify(temiz)
    if (eskiStr !== yeniStr) {
      guncelleme.content_asilar = temiz.length ? temiz : null
      loglar.push({ note_id: noteId, doctor_id: user.id, alan: 'content_asilar', onceki: eskiStr.slice(0, 2000), sonraki: yeniStr.slice(0, 2000) })
    }
  }

  // NOTYA-TETKIK-NOT-01: istenen tetkikler (dizi) — hekim formda düzenler; boşsa plan/tedavi metninden çıkarılır;
  // onayda hasta_tetkik_istemleri'ne aktarılır (nottanTetkikAktar aşağıda).
  const yeniTetkikler = duzenlemeler.tetkikler
  let onayTetkikler: ReturnType<typeof notTetkikleriniTemizle> = []
  {
    let temiz = Array.isArray(yeniTetkikler) ? notTetkikleriniTemizle(yeniTetkikler) : notTetkikleriniTemizle(mevcutTetkikler)
    if (!temiz.length) {
      const son = (kolon: string) => (kolon in guncelleme ? guncelleme[kolon] : (existing as Record<string, unknown>)[kolon]) as string | null
      temiz = metindenTetkikleriCikar(son('content_plan'), son('content_tedavi'))
    }
    onayTetkikler = temiz
    const eskiStr = JSON.stringify(mevcutTetkikler || [])
    const yeniStr = JSON.stringify(temiz)
    if (eskiStr !== yeniStr) {
      guncelleme.content_tetkikler = temiz.length ? temiz : null
      loglar.push({ note_id: noteId, doctor_id: user.id, alan: 'content_tetkikler', onceki: eskiStr.slice(0, 2000), sonraki: yeniStr.slice(0, 2000) })
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
  // NOTYA-RECETE-07: onaylanan Plan + İlaçlar imzası — revizyonda aynı çift için kart yeniden açılmaz.
  try {
    const { ilacUyumImzasi } = await import('@/lib/doktor/receteAktarim')
    const sonPlan = String(('content_plan' in guncelleme ? guncelleme.content_plan : existing.content_plan) || '')
    const sonIlac = (('content_ilaclar' in guncelleme ? guncelleme.content_ilaclar : existing.content_ilaclar) || []) as {
      ad?: string; doz?: string; kullanim?: string; sure?: string
    }[]
    guncelleme.ilac_uyum_imza = ilacUyumImzasi(sonPlan, Array.isArray(sonIlac) ? sonIlac : [])
  } catch (e) { console.error('[approve] ilac-uyum-imza', e) }

  {
    let { error: updateError } = await supabase
      .from('notes')
      .update(guncelleme)
      .eq('id', noteId)
      .eq('doctor_id', user.id)

    // Migration 114 henüz yoksa content_tetkikler kolonunu atlayıp tekrar dene.
    if (updateError && 'content_tetkikler' in guncelleme && /content_tetkikler|column/i.test(updateError.message || '')) {
      const { content_tetkikler: _atla, ...kalan } = guncelleme as Record<string, unknown>
      const tekrar = await supabase.from('notes').update(kalan).eq('id', noteId).eq('doctor_id', user.id)
      updateError = tekrar.error
    }
    // Migration 123 henüz yoksa ilac_uyum_imza kolonunu atlayıp tekrar dene.
    if (updateError && 'ilac_uyum_imza' in guncelleme && /ilac_uyum_imza|column/i.test(updateError.message || '')) {
      const { ilac_uyum_imza: _atla, ...kalan } = guncelleme as Record<string, unknown>
      const tekrar = await supabase.from('notes').update(kalan).eq('id', noteId).eq('doctor_id', user.id)
      updateError = tekrar.error
    }

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }
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
  let tetkikAktarim: TetkikAktarimSonucu | null = null
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

  // NOTYA-TETKIK-NOT-01: not onayı = tetkik istemi kaydı. Her onayda (ilk + yeniden) eşitlenir.
  if (hastaBenim && hastaIdA) {
    try {
      const s = await nottanTetkikAktar(supabase, {
        noteId, doctorId: user.id, patientId: hastaIdA, tetkikler: onayTetkikler,
        notTarihi: existing.created_at as string | null,
      })
      if (s.hata) console.error('[tetkik-aktarim]', s.hata)
      tetkikAktarim = s
    } catch (e) { console.error('[tetkik-aktarim]', e) }
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
    // NOTYA-MESLEKTAS-V2: öğrenme yanıt döndükten sonra (waitUntil). İstek yoluna LLM yok.
    try {
      const { onaySonrasiOgren } = await import('@/lib/doktor/ogrenme/arkaPlandaOgren')
      onaySonrasiOgren(supabase, user.id, noteId, loglar)
    } catch (e) { console.error('[ogrenme] kanca', e) }
  }

  // NOTYA-RANDEVU-V2 PR3: "N hafta sonra kontrol" in the approved plan → a kontrol randevusu card for the doctor
  // to confirm (existing eylem flow). Only while Hasta Portalı Randevu is ON; never books anything by itself.
  let kontrolOnerisi: string | null = null
  const planMetni = (guncelleme.content_plan as string | undefined) ?? (existing as { content_plan?: string | null }).content_plan
  if (hastaBenim && hastaIdA) {
    try {
      const { kontrolOnerisiHazirla } = await import('@/lib/randevu/v2/kontrolOnerisi')
      kontrolOnerisi = await kontrolOnerisiHazirla(supabase, {
        doktorId: user.id, patientId: hastaIdA, notId: noteId,
        plan: planMetni,
        brans: (seansA as { specialty?: string } | null)?.specialty || null,
      })
    } catch (e) { console.error('[randevu-v2] kontrol önerisi', e) }
  }

  // NOTYA-TAKIP-01: durable kontrol case for desk + portal + reminders (even when V2 portal is OFF).
  if (hastaBenim && hastaIdA) {
    try {
      const { takipNotOnayinda } = await import('@/lib/doktor/takip')
      await takipNotOnayinda(supabase, {
        doktorId: user.id,
        patientId: hastaIdA,
        notId: noteId,
        plan: planMetni,
        notTarihi: (existing.created_at as string | null) || null,
      })
    } catch (e) { console.error('[takip] not onay', e) }
  }

  if (hastaBenim && hastaIdA) {
    const { onbellekKirlet } = await import('@/lib/doktor/ogrenme/dosyaOnbellek')
    void onbellekKirlet(supabase, user.id, hastaIdA).catch(() => { /* önbellek */ })
  }

  // NOTYA-OZET-CIFT-01: onay sonrası Genel Özet + Son muayene özeti (dosya Özet sekmesi).
  if (hastaBenim && hastaIdA) {
    try {
      const { hastaKlinikOzetleriGuncelle } = await import('@/lib/doktor/hastaKlinikOzet')
      const son = (kolon: string) => (kolon in guncelleme ? guncelleme[kolon] : (existing as Record<string, unknown>)[kolon])
      void hastaKlinikOzetleriGuncelle(supabase, user.id, hastaIdA, {
        created_at: existing.created_at as string | null,
        approved_at: (guncelleme.approved_at as string) || new Date().toISOString(),
        basvuru_yakinmasi: son('basvuru_yakinmasi') as string | null,
        content_tani: son('content_tani') as string | null,
        content_degerlendirme: son('content_degerlendirme') as string | null,
        content_plan: son('content_plan') as string | null,
        content_tedavi: son('content_tedavi') as string | null,
        content_subjektif: son('content_subjektif') as string | null,
        hasta_ozeti: son('hasta_ozeti') as string | null,
      }).catch((e) => console.error('[klinik-ozet] onay', e))
    } catch (e) { console.error('[klinik-ozet] onay', e) }
  }

  return NextResponse.json({ success: true, duzenlenenAlanSayisi: loglar.length, receteAktarim, asiAktarim, tetkikAktarim, ilacSonlandirma, ...(kontrolOnerisi ? { kontrolOnerisi } : {}) })
}
