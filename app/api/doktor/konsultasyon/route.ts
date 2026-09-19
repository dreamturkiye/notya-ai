/**
 * KONSULTASYON-01 (Kaan 2026-09-19) — /api/doktor/konsultasyon · kapalı döngü konsültasyon (yönlendirme).
 * EVRENSEL: tüm branşlar (~30) aynı rotayı kullanır; branşa özel kod yok. Branşlar yalnız önerilen hedef listesine
 * sıra katkısı yapar (SpecialtyProfile.konsultasyonHedefleri).
 *
 * Not: /api/doktor/konsult (Ayşe'ye Danış — yapay zekâ meslektaş) ile karıştırmayın; bu rota hekimden hekime istemdir.
 *
 *   GET  ?patientId=        → hastanın konsültasyonları (+ bağlı Kasa raporu, belge taslağı durumu) + hedef seçenekleri
 *   GET  ?bekleyen=1        → hekimin yanıt bekleyen konsültasyonları, tüm hastalar (Araçlar › Bekleyen Konsültasyonlar +
 *                             kohort satırı — N gündür açık, en uzun bekleyen üstte)
 *   GET  ?bekleyen=sayi     → aynı listenin özeti { sayi, dikkat, kirmizi, enUzunGun } (ana sayfa; ad çözülmez)
 *   GET  ?form=<id>         → yazdırılabilir KONSÜLTASYON İSTEM FORMU verisi (antet + hasta tanımlayıcıları)
 *   POST { patientId, hedefBrans, klinikSoru, hedefHekim?, aciliyet?, not?, tanilar?, mevcutDurum?, istemTarihi? }
 *   PATCH { id, islem: 'yanit' | 'belge_bagla' | 'kapat' | 'nota_ekle' | 'hatirlat' | 'duzenle', … }
 *         'duzenle' (AYSE-KONSULTASYON-01): istem alanları yalnız yanıt beklerken; 'yanitlandi' / kapanmış → 409 (istem
 *         KİLİDİ sunucuda). Her değişen alanın önceki metni konsultasyon_revizyonlar'a yazılır — önce iz, sonra güncelleme;
 *         iz yazılamazsa değişiklik YAPILMAZ. Yanıt özeti düzeltmesi ('yanit', önceki özet varken) de iz bırakır.
 *
 * VERİ: tablo `sevkler` (033; dahiliye/göz/KD aynı tabloya yazmaya devam eder). Terim "sevk" UI'de kullanılmaz —
 * SGK sevki (SUT EK-2/F / e-sevk) ayrı ve düzenleyici bir belgedir. lib/doktor/konsultasyon.ts başlığına bakın.
 *
 * HASTA-IZOLASYON-01 (.cursor/skills/hasta-izolasyon/SKILL.md): gelen her kimlik saldırgan kontrolündedir.
 *   • patientId → hastaSahibiMi() önce; yabancı = 404 (yok).
 *   • konsültasyon id → satır `id` VE `doctor_id` ile aynı sorguda; ardından satırın hastası da yeniden doğrulanır
 *     (düzeltme öncesi açıktan kalmış kirli satır yayılmasın).
 *   • belgeId → medical_documents `id` + `doctor_id` + AYNI hasta + silinmemiş; başka hastanın raporu bağlanamaz.
 *   • nota ekleme gununNotunaEkle(doktorId, patientId) — hekimin kendi seansı/notu.
 * HEKİM KİLİDİ: yanit_ozeti hekimin kendi cümlesidir; Notya tanı iddia etmez. Nota yazma yalnız 'nota_ekle' ile.
 */
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { hekimAdi, hekimBransi } from '@/lib/doktor/hekimAdi'
import { decrypt } from '@/lib/security/encryption'
import { specialtyProfile } from '@/lib/specialties/registry'
import { veliDiliMi } from '@/lib/specialties/kapsam'
import { notifyPatientNewPracticeMessage } from '@/lib/portal/notifyPatientEmail'
import {
  BEKLEYEN_DURUMLAR,
  HATIRLATMA_ARALIGI_GUN,
  KONSULTASYON_KOLONLARI,
  REVIZYON_KOLONLARI,
  beklemeGunu,
  bekleyenListesi,
  bekleyenOzeti,
  bugunTrIso,
  gecisIzinli,
  hedefEtiketi,
  hedefSecenekleri,
  istemDogrula,
  konsultasyonHatirlatmaMesaji,
  konsultasyonNotBlogu,
  duzenlemeDogrula,
  yanitRevizyonu,
  yanitDogrula,
  yanitSuresiOzeti,
  type KonsultasyonIslemi,
  type KonsultasyonSatiri,
  type Revizyon,
} from '@/lib/doktor/konsultasyon'

export const dynamic = 'force-dynamic'

const yok = (m = 'Konsültasyon bulunamadı.') => NextResponse.json({ error: m }, { status: 404 })
const HASTA_YOK = 'Hasta bulunamadı.'
const UUID = /^[0-9a-f-]{8,64}$/i
const coz = (v: unknown): string => { if (!v) return ''; try { return decrypt(String(v)) } catch { return '' } }
function adCoz(v: unknown): string {
  try { const j = JSON.parse(coz(v)); return [j.ad, j.soyad].filter(Boolean).join(' ').trim() } catch { return '' }
}

/** Satır: id + doctor_id aynı sorguda, sonra hastanın hâlâ bu hekimin olduğu. Değilse null (→ 404). */
async function satirBu(sb: SupabaseClient, doktorId: string, id: unknown): Promise<KonsultasyonSatiri | null> {
  if (typeof id !== 'string' || !UUID.test(id)) return null
  const { data } = await sb.from('sevkler').select(KONSULTASYON_KOLONLARI).eq('id', id).eq('doctor_id', doktorId).maybeSingle()
  if (!data) return null
  const s = data as unknown as KonsultasyonSatiri
  if (!(await hastaSahibiMi(sb, doktorId, s.patient_id))) return null
  return s
}

/** Kasa belgesi: bu hekimin, BU hastanın, silinmemiş belgesi mi? */
async function belgeBu(sb: SupabaseClient, doktorId: string, patientId: string, belgeId: unknown): Promise<{ id: string; file_name: string; created_at: string } | null> {
  if (typeof belgeId !== 'string' || !UUID.test(belgeId)) return null
  const { data } = await sb.from('medical_documents').select('id, file_name, created_at')
    .eq('id', belgeId).eq('doctor_id', doktorId).eq('patient_id', patientId).is('deleted_at', null).maybeSingle()
  return data ? { id: String(data.id), file_name: String(data.file_name || 'belge'), created_at: String(data.created_at || '') } : null
}

/**
 * Düzenleme izi — güncellemeden ÖNCE yazılır (sessiz üzerine yazma yok). Satır hekime + hastaya kapsanır.
 * Dönüş: eklenen satır kimlikleri (güncelleme başarısız olursa geri alınır) ya da null (iz yazılamadı → değişiklik yok).
 */
async function revizyonYaz(sb: SupabaseClient, doktorId: string, s: KonsultasyonSatiri, revizyonlar: Revizyon[]): Promise<string[] | null> {
  if (!revizyonlar.length) return []
  const { data, error } = await sb.from('konsultasyon_revizyonlar')
    .insert(revizyonlar.map((r) => ({ sevk_id: s.id, doctor_id: doktorId, patient_id: s.patient_id, alan: r.alan, onceki: r.onceki, sonraki: r.sonraki })))
    .select('id')
  if (error || !data) return null
  return (data as Array<{ id: string }>).map((x) => String(x.id))
}
const IZ_YAZILAMADI = 'Düzenleme izi kaydedilemedi — değişiklik yapılmadı. Lütfen tekrar deneyin.'

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const q = req.nextUrl.searchParams
  const bugun = bugunTrIso()

  // ── Yanıt bekleyenler: Araçlar › Bekleyen Konsültasyonlar + kohort satırı (=1) · ana sayfa özeti (=sayi) ──
  // KONSULTASYON-02: liste ve sayı AYNI bekleyenListesi() ile üretilir; yalnız kendi satırları, kendi hastaları.
  const bekleyenModu = q.get('bekleyen')
  if (bekleyenModu) {
    const sadeceSayi = bekleyenModu === 'sayi'
    const { data, error } = await sb.from('sevkler').select(KONSULTASYON_KOLONLARI)
      .eq('doctor_id', user.id).in('durum', [...BEKLEYEN_DURUMLAR])
      .order('created_at', { ascending: true }).limit(200)
    if (error) return NextResponse.json(sadeceSayi ? { ...bekleyenOzeti([]), tabloHazir: false } : { bekleyenler: [], tabloHazir: false })
    const satirlar = (data || []) as unknown as KonsultasyonSatiri[]
    const ids = [...new Set(satirlar.map((s) => s.patient_id))]
    // HASTA-IZOLASYON: ad yalnız bu hekimin hastasından çözülür; hastası başka hekime ait kirli satır listeden düşer.
    const { data: hastalar } = ids.length
      ? await sb.from('patients').select('id, name_encrypted').in('id', ids).eq('doctor_id', user.id)
      : { data: [] as Array<{ id: string; name_encrypted: string }> }
    // Sayı modunda ad çözülmez (yalnız sahiplik süzgeci) — ana sayfa her açılışta şifre çözmesin.
    const ad = new Map((hastalar || []).map((h) => [String(h.id), sadeceSayi ? '' : (adCoz(h.name_encrypted) || 'Hasta')]))
    const bekleyenler = bekleyenListesi(satirlar, ad, bugun)
    if (sadeceSayi) return NextResponse.json({ ...bekleyenOzeti(bekleyenler), tabloHazir: true })
    // SKS göstergesi: son 180 günde yanıtlanan konsültasyonların istem → yanıt süresi (yalnız ölçüm)
    const alt = new Date(Date.now() - 180 * 86400e3).toISOString().slice(0, 10)
    const { data: yanitli } = await sb.from('sevkler').select('durum, istem_tarihi, created_at, yanit_tarihi')
      .eq('doctor_id', user.id).eq('durum', 'yanitlandi').gte('yanit_tarihi', alt).limit(500)
    return NextResponse.json({ bekleyenler, yanitSuresi: yanitSuresiOzeti((yanitli || []) as unknown as KonsultasyonSatiri[]), tabloHazir: true })
  }

  // ── Yazdırılabilir istem formu ──
  const formId = q.get('form')
  if (formId) {
    const s = await satirBu(sb, user.id, formId)
    if (!s) return yok()
    const [{ data: hasta }, { data: u }, hekim] = await Promise.all([
      sb.from('patients').select('name_encrypted, dob_encrypted, gender_encrypted').eq('id', s.patient_id).eq('doctor_id', user.id).maybeSingle(),
      sb.from('users').select('specialty, recete_baslik').eq('id', user.id).maybeSingle(),
      hekimAdi(sb, user.id),
    ])
    if (!hasta) return yok(HASTA_YOK)
    const rb = (u?.recete_baslik && typeof u.recete_baslik === 'object' ? u.recete_baslik : {}) as { satirlar?: string[]; logoDataUrl?: string; diplomaNo?: string }
    const dogumIso = coz(hasta.dob_encrypted) || null
    const cins = coz(hasta.gender_encrypted)
    return NextResponse.json({
      konsultasyon: { ...s, hedefEtiketi: hedefEtiketi(s) },
      hasta: {
        adSoyad: adCoz(hasta.name_encrypted),
        dogumTarihi: dogumIso,
        cinsiyet: cins === 'female' ? 'Kadın' : cins === 'male' ? 'Erkek' : '',
        // VELI-YASAL-ONAM: hitap yaşa bağlı — 18 yaş altı her branşta veli / yasal temsilci satırı
        veliSatiri: veliDiliMi({ doktorBransi: u?.specialty || null, hastaDogumIso: dogumIso }),
      },
      baslik: {
        hekim,
        brans: specialtyProfile(u?.specialty || null).resmiUnvan,
        satirlar: Array.isArray(rb.satirlar) ? rb.satirlar.map(String).filter(Boolean) : [],
        logoDataUrl: String(rb.logoDataUrl || ''),
        diplomaNo: String(rb.diplomaNo || ''),
      },
    })
  }

  // ── Hastanın konsültasyonları ──
  const patientId = q.get('patientId') || ''
  if (!(await hastaSahibiMi(sb, user.id, patientId))) return yok(HASTA_YOK)
  const brans = await hekimBransi(sb, user.id)
  const hedefler = hedefSecenekleri(specialtyProfile(brans).konsultasyonHedefleri)
  const { data, error } = await sb.from('sevkler').select(KONSULTASYON_KOLONLARI)
    .eq('patient_id', patientId).eq('doctor_id', user.id)
    .order('created_at', { ascending: false }).limit(100)
  if (error) return NextResponse.json({ konsultasyonlar: [], hedefler, tabloHazir: false, error: 'Konsültasyon kayıtları henüz hazır değil.' })
  const satirlar = (data || []) as unknown as KonsultasyonSatiri[]

  // KANIT: bağlı Kasa raporları + (varsa) Tier A belge taslağı durumu — hepsi hekim + hasta kapsamlı.
  const belgeIdler = [...new Set(satirlar.map((s) => s.belge_id).filter((x): x is string => !!x))]
  const [belgeQ, analizQ] = belgeIdler.length
    ? await Promise.all([
      sb.from('medical_documents').select('id, file_name, file_type, created_at, deleted_at').in('id', belgeIdler).eq('doctor_id', user.id).eq('patient_id', patientId),
      sb.from('belge_analizleri').select('belge_id, durum, hekim_ozet, sonuc, olusturuldu').in('belge_id', belgeIdler).eq('doctor_id', user.id).eq('patient_id', patientId).order('olusturuldu', { ascending: false }),
    ])
    : [{ data: [] as Array<Record<string, unknown>> }, { data: [] as Array<Record<string, unknown>> }]
  // Düzenleme izi (AYSE-KONSULTASYON-01) — hekim + hasta kapsamlı; tablo yoksa (migration öncesi) iz boş döner.
  const revQ = satirlar.length
    ? await sb.from('konsultasyon_revizyonlar').select(REVIZYON_KOLONLARI).in('sevk_id', satirlar.map((x) => x.id))
      .eq('doctor_id', user.id).eq('patient_id', patientId).order('created_at', { ascending: true })
    : { data: [] as Array<Record<string, unknown>>, error: null }
  const revizyonlar = new Map<string, Array<Record<string, unknown>>>()
  for (const r of (revQ.error ? [] : revQ.data || []) as Array<Record<string, unknown>>) {
    const k = String(r.sevk_id)
    revizyonlar.set(k, [...(revizyonlar.get(k) || []), { id: String(r.id), alan: String(r.alan), onceki: r.onceki ?? null, sonraki: r.sonraki ?? null, created_at: String(r.created_at || '') }])
  }
  const belgeler = new Map((belgeQ.data || []).map((b) => [String(b.id), b]))
  const analizler = new Map<string, Record<string, unknown>>()
  for (const a of analizQ.data || []) if (!analizler.has(String(a.belge_id))) analizler.set(String(a.belge_id), a)

  const konsultasyonlar = satirlar.map((s) => {
    const b = s.belge_id ? belgeler.get(s.belge_id) : undefined
    const a = s.belge_id ? analizler.get(s.belge_id) : undefined
    const sonuc = (a?.sonuc && typeof a.sonuc === 'object' ? a.sonuc : {}) as { ozet?: string }
    return {
      ...s,
      hedefEtiketi: hedefEtiketi(s),
      eskiKayit: !s.hedef_brans,
      gun: beklemeGunu(s, bugun),
      belge: b ? { id: String(b.id), ad: String(b.file_name || 'belge'), tur: String(b.file_type || ''), tarih: String(b.created_at || ''), silindi: !!b.deleted_at } : null,
      // Belgeden çıkarılmış TASLAK (Tier A) — hekim onaylamadıkça yalnız öneri; yanıt özeti hekimin cümlesidir.
      belgeTaslagi: a ? { durum: String(a.durum || ''), ozet: String(a.hekim_ozet || sonuc.ozet || '').slice(0, 600) } : null,
      duzenlemeler: revizyonlar.get(s.id) || [],
    }
  })
  return NextResponse.json({ konsultasyonlar, hedefler, tabloHazir: true })
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const patientId = String(b?.patientId || '')
  // HASTA-IZOLASYON: yabancı hastaya istem açılmaz.
  if (!(await hastaSahibiMi(sb, user.id, patientId))) return yok(HASTA_YOK)
  const d = istemDogrula(b)
  if ('hata' in d) return NextResponse.json({ error: d.hata }, { status: 400 })
  const { data, error } = await sb.from('sevkler').insert({
    patient_id: patientId,
    doctor_id: user.id,
    // `hedef` NOT NULL (033) — geri uyum için kanonik anahtarın aynısı yazılır
    hedef: d.girdi.hedef_brans,
    ...d.girdi,
    kaynak: 'konsultasyon',
    durum: 'yanit_bekleniyor',
  }).select(KONSULTASYON_KOLONLARI).maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'Konsültasyon kaydedilemedi — tablo henüz hazır olmayabilir.' }, { status: 500 })
  const s = data as unknown as KonsultasyonSatiri
  return NextResponse.json({ ok: true, konsultasyon: { ...s, hedefEtiketi: hedefEtiketi(s) } }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const islem = String(b?.islem || '') as KonsultasyonIslemi
  if (!['yanit', 'belge_bagla', 'kapat', 'nota_ekle', 'hatirlat', 'duzenle'].includes(islem)) return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400 })

  // HASTA-IZOLASYON: satır id + doctor_id, sonra satırın hastası — yabancı id = yok.
  const s = await satirBu(sb, user.id, b?.id)
  if (!s) return yok()
  const izin = gecisIzinli(s.durum, islem)
  if (!izin.ok) return NextResponse.json({ error: izin.hata }, { status: 409 })
  const guncelle = async (g: Record<string, unknown>) => {
    const { data, error } = await sb.from('sevkler').update(g).eq('id', s.id).eq('doctor_id', user.id).select(KONSULTASYON_KOLONLARI).maybeSingle()
    if (error || !data) return null
    const y = data as unknown as KonsultasyonSatiri
    return { ...y, hedefEtiketi: hedefEtiketi(y) }
  }

  if (islem === 'duzenle') {
    // İstem KİLİDİ yukarıda (gecisIzinli): yalnız 'acik' / 'yanit_bekleniyor'. Önce iz, sonra güncelleme.
    const d = duzenlemeDogrula(b, s)
    if ('hata' in d) return NextResponse.json({ error: d.hata }, { status: 400 })
    const iz = await revizyonYaz(sb, user.id, s, d.revizyonlar)
    if (!iz) return NextResponse.json({ error: IZ_YAZILAMADI }, { status: 500 })
    const y = await guncelle(d.guncelleme)
    if (!y) {
      if (iz.length) await sb.from('konsultasyon_revizyonlar').delete().in('id', iz).eq('doctor_id', user.id)
      return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, konsultasyon: y, degisen: d.revizyonlar.map((r) => r.alan) })
  }

  if (islem === 'yanit' || islem === 'belge_bagla') {
    let belgeId: string | null = s.belge_id
    if (b?.belgeId != null && b.belgeId !== '') {
      // KANIT bağı: yalnız bu hekimin, BU hastanın Kasa belgesi.
      const belge = await belgeBu(sb, user.id, s.patient_id, b.belgeId)
      if (!belge) return yok('Belge bulunamadı.')
      belgeId = belge.id
    }
    if (islem === 'belge_bagla') {
      if (!belgeId || belgeId === s.belge_id) return NextResponse.json({ error: 'Bağlanacak belge seçin.' }, { status: 400 })
      const y = await guncelle({ belge_id: belgeId })
      return y ? NextResponse.json({ ok: true, konsultasyon: y }) : NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500 })
    }
    const v = yanitDogrula(b, s)
    if ('hata' in v) return NextResponse.json({ error: v.hata }, { status: 400 })
    const hekim = b?.hedefHekim != null ? String(b.hedefHekim).replace(/\s+/g, ' ').trim().slice(0, 120) : null
    // Yanıt düzeltmesi: önceki özetin izi (ilk yanıt iz değil, kaydın kendisidir).
    const rev = yanitRevizyonu(s.yanit_ozeti, v.yanit_ozeti)
    const iz = await revizyonYaz(sb, user.id, s, rev ? [rev] : [])
    if (!iz) return NextResponse.json({ error: IZ_YAZILAMADI }, { status: 500 })
    const y = await guncelle({ ...v, belge_id: belgeId, durum: 'yanitlandi', ...(hekim ? { hedef_hekim: hekim } : {}) })
    if (!y && iz.length) await sb.from('konsultasyon_revizyonlar').delete().in('id', iz).eq('doctor_id', user.id)
    return y ? NextResponse.json({ ok: true, konsultasyon: y }) : NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500 })
  }

  if (islem === 'kapat') {
    const y = await guncelle({ durum: 'kapandi_yanitsiz' })
    return y ? NextResponse.json({ ok: true, konsultasyon: y }) : NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500 })
  }

  if (islem === 'nota_ekle') {
    // Hekim BASTI — tek yazma yolu. Metin hekimin kendi yazdıklarıdır (soru + yanıt özeti), tanı iddiası eklenmez.
    const belge = s.belge_id ? await belgeBu(sb, user.id, s.patient_id, s.belge_id) : null
    const blok = konsultasyonNotBlogu(s, belge?.file_name || null, bugunTrIso())
    if (!blok) return NextResponse.json({ ok: false, error: 'Eklenecek yanıt yok.' }, { status: 400 })
    const sonuc = await gununNotunaEkle(sb, user.id, s.patient_id, blok)
    if (!sonuc.eklendi || !sonuc.notId) return NextResponse.json({ ok: false, error: sonuc.sebep || 'Bugünkü muayene formu bulunamadı.' })
    const y = await guncelle({ note_id: sonuc.notId })
    return NextResponse.json({ ok: true, notId: sonuc.notId, konsultasyon: y })
  }

  // islem === 'hatirlat' — hastaya Sağlığım mesajı (klinik soru / tanı YOK), 7 günde bir
  if (s.son_hatirlatma_at && Date.now() - Date.parse(s.son_hatirlatma_at) < HATIRLATMA_ARALIGI_GUN * 86400e3) {
    return NextResponse.json({ error: `Bu konsültasyon için son ${HATIRLATMA_ARALIGI_GUN} gün içinde hatırlatma gönderildi.` }, { status: 409 })
  }
  const m = konsultasyonHatirlatmaMesaji(hedefEtiketi(s))
  const simdi = new Date().toISOString()
  const { data: konu, error } = await sb.from('hasta_mesaj_konulari').insert({ doctor_id: user.id, patient_id: s.patient_id, konu: m.konu, hasta_klasor: 'gelen', son_mesaj_at: simdi, okundu_hasta: false, okundu_pratik: true }).select('id').single()
  if (error || !konu) return NextResponse.json({ error: 'Hatırlatma gönderilemedi.' }, { status: 500 })
  await sb.from('hasta_mesajlar').insert({ konu_id: konu.id, taraf: 'doktor', yazar_user_id: user.id, metin: m.metin })
  try { await notifyPatientNewPracticeMessage(sb, { doctorId: user.id, patientId: s.patient_id }) } catch { /* e-posta hatası gönderimi bozmaz */ }
  const y = await guncelle({ son_hatirlatma_at: simdi })
  return NextResponse.json({ ok: true, konsultasyon: y })
}
