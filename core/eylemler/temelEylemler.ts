/**
 * NOTYA-EYLEM — the BASE actions. Identical for every branş, no exceptions (cross-specialty-parity).
 *
 * Every `calistir` here writes through the SAME path the existing UI form uses. Where that path was
 * inline in a route, it was extracted first and both callers now share it:
 *   • alerji / kronik  → lib/doktor/hastaKayitAlanlari.ts (patients.notes_encrypted JSON)
 *   • ölçüm            → lib/doktor/gununNotunaEkle.ts    (notes.vitaller on today's note)
 *   • randevu çakışma  → lib/randevu/cakisma.ts           (shared with POST and PATCH)
 * There is deliberately no second insert path anywhere in this file.
 *
 * Tier discipline (docs §3): everything here is T1 (additive, reversible) or T2 (diff + tap). No T3
 * capability may be added — core/eylemler/yasakli.ts lists them and the guard test enforces absence.
 */
import { semaYap } from './sema'
import { bugunTRT, type AlanTanimi, type EylemBaglami, type EylemTanimi, type HastaOzeti } from './types'
import {
  alerjiCikarilmis,
  alerjiEklenmis,
  alerjiListe,
  alerjiVarMi,
  hastaNotAlanlariGuncelle,
  kronikEklenmis,
  kronikVarMi,
  notAlanlariCoz,
  type HastaNotAlanlari,
} from '@/lib/doktor/hastaKayitAlanlari'
import { gununNotunaEkle, gununNotunaVitalEkle, notVitalleriGeriYukle } from '@/lib/doktor/gununNotunaEkle'
import { randevuCakismasiVarMi, CAKISMA_MESAJI, CAKISMA_KONTROL_HATASI } from '@/lib/randevu/cakisma'
import { bransKapsami } from '@/lib/specialties/kapsam'
import { ilacUyarilariHesapla } from './ilacUyari'
import { encrypt } from '@/lib/security/encryption'

/** Helper: build a definition with the schema derived from its own field list. */
function eylem<V = Record<string, unknown>>(t: Omit<EylemTanimi<V>, 'sema'>): EylemTanimi<V> {
  return { ...t, sema: semaYap<V>(t.alanlar) } as EylemTanimi<V>
}

/** A date must not precede birth and must not be in the future — the two mistakes a model actually makes. */
function tarihMakul(etiket: string, tarih: unknown, hasta: HastaOzeti, bugun: string): string | null {
  if (!tarih) return null
  const t = String(tarih)
  if (t > bugun) return `${etiket} ileri bir tarih (${t}). Gelecekte yapılmış bir kayıt olamaz.`
  if (hasta.dogumTarihi && t < hasta.dogumTarihi) return `${etiket} hastanın doğum tarihinden (${hasta.dogumTarihi}) önce.`
  return null
}

/* ─────────────────────────────── T1 · Aşı ─────────────────────────────── */

const ASI_ALANLARI: AlanTanimi[] = [
  { anahtar: 'asi_adi', etiket: 'Aşı', tip: 'metin', zorunlu: true, aciklama: 'Vaccine name as written in the source, e.g. "Hepatit B", "KKK", "DaBT-İPA-Hib"' },
  { anahtar: 'uygulama_tarihi', etiket: 'Uygulama tarihi', tip: 'tarih', zorunlu: true, aciklama: 'Date the dose was given' },
  { anahtar: 'doz_no', etiket: 'Doz no', tip: 'sayi', enAz: 1, enCok: 12, aciklama: 'Which dose in the series, if stated' },
  {
    anahtar: 'kaynak', etiket: 'Kayıt kaynağı', tip: 'secim',
    aciklama: 'Where the dose was given: kayit = in this practice, beyan = elsewhere / declared or read from a document',
    secenekler: [
      { deger: 'kayit', etiket: 'Bu muayenehanede uygulandı' },
      { deger: 'beyan', etiket: 'Dış kurum / beyan' },
    ],
  },
  { anahtar: 'sonraki_doz_tarihi', etiket: 'Sonraki doz', tip: 'tarih', aciklama: 'Next dose due date, only if the source states it' },
  { anahtar: 'notlar', etiket: 'Not', tip: 'metin' },
]

export const ASI_KAYDI_EKLE = eylem({
  anahtar: 'asi_kaydi_ekle',
  etiket: 'Aşı kaydı',
  aciklama:
    'Hastanın aşı kaydına bir doz ekler (kendi muayenehanesinde uygulanan ya da dış kurumda yapılıp belgede/beyanda geçen). Doğum epikrizi, aşı karnesi ya da hekimin söylediği bir doz için kullanılır.',
  alanlar: ASI_ALANLARI,
  zorunlu: ['asi_adi', 'uygulama_tarihi'],
  kademe: 'T1',
  branslar: 'hepsi',
  makullukKontrol: (ctx, v) =>
    tarihMakul('Uygulama tarihi', v.uygulama_tarihi, ctx.hasta, ctx.bugunTRT) ||
    (v.sonraki_doz_tarihi && String(v.sonraki_doz_tarihi) < ctx.bugunTRT
      ? `Sonraki doz tarihi (${v.sonraki_doz_tarihi}) geçmişte — kontrol edin.`
      : null),
  mukerrerKontrol: async (ctx, v) => {
    if (!v.asi_adi) return null
    const { data } = await ctx.supabase
      .from('asilar')
      .select('id, asi_adi, uygulama_tarihi')
      .eq('doktor_id', ctx.doktorId)
      .eq('patient_id', ctx.hasta.id)
      .ilike('asi_adi', String(v.asi_adi))
      .limit(5)
    const ayniGun = (data || []).find((r) => String(r.uygulama_tarihi || '') === String(v.uygulama_tarihi || ''))
    if (ayniGun) return `Bu aşı aynı tarihle (${v.uygulama_tarihi}) dosyada zaten var — mükerrer kayıt olabilir.`
    if ((data || []).length) return `Bu hastada "${v.asi_adi}" için ${data!.length} kayıt daha var — doz numarasını kontrol edin.`
    return null
  },
  calistir: async (ctx, v) => {
    // Same insert shape as app/api/doktor/asilar POST; `kategori` and `kaynak` use that route's own
    // coercion so the two rows are indistinguishable downstream.
    const satir = {
      doktor_id: ctx.doktorId,
      patient_id: ctx.hasta.id,
      asi_adi: String(v.asi_adi),
      doz_no: v.doz_no ?? null,
      kategori: ctx.hasta.yasAy != null && ctx.hasta.yasAy < 216 ? 'pediatrik' : 'yetiskin',
      uygulama_tarihi: v.uygulama_tarihi ?? null,
      sonraki_doz_tarihi: v.sonraki_doz_tarihi ?? null,
      kaynak: v.kaynak === 'kayit' ? 'kayit' : 'beyan',
      notlar: v.notlar ?? null,
    }
    const { data, error } = await ctx.supabase.from('asilar').insert(satir).select('id').single()
    if (error || !data) throw new Error(error?.message || 'Aşı kaydedilemedi.')
    return { hedefTablo: 'asilar', hedefId: String(data.id), once: null, sonra: satir, ilgiliSekme: { etiket: 'Aşılar sekmesinde gör', yol: `/dashboard/doktor/hastalar/${ctx.hasta.id}?sekme=asilar` } }
  },
  geriAl: async (ctx, k) => {
    await ctx.supabase.from('asilar').delete().eq('id', k.hedefId).eq('doktor_id', ctx.doktorId).eq('patient_id', ctx.hasta.id)
  },
})

/* ─────────────────────────────── T1 · İlaç ─────────────────────────────── */

const ILAC_ALANLARI: AlanTanimi[] = [
  { anahtar: 'ilac_adi', etiket: 'İlaç', tip: 'metin', zorunlu: true, aciklama: 'Brand or generic name as the doctor said it' },
  { anahtar: 'etken_madde', etiket: 'Etken madde', tip: 'metin' },
  { anahtar: 'doz', etiket: 'Doz', tip: 'metin', aciklama: 'e.g. "500 mg". NEVER invent a dose — if the doctor did not say it, mark it tahmin.' },
  { anahtar: 'kullanim_sikli', etiket: 'Kullanım', tip: 'metin', aciklama: 'e.g. "2x1", "günde 1 kez"' },
  { anahtar: 'baslangic_tarihi', etiket: 'Başlangıç', tip: 'tarih' },
  { anahtar: 'bitis_tarihi', etiket: 'Bitiş', tip: 'tarih' },
  { anahtar: 'notlar', etiket: 'Not', tip: 'metin' },
]

export const ILAC_EKLE = eylem({
  anahtar: 'ilac_ekle',
  etiket: 'İlaç ekle',
  aciklama: 'Hastanın sürekli ilaç listesine bir ilaç ekler. Doz ve kullanım sıklığını ASLA uydurma — hekim söylemediyse tahmin olarak işaretle, sistem hekime sorar.',
  alanlar: ILAC_ALANLARI,
  zorunlu: ['ilac_adi', 'doz', 'kullanim_sikli'],
  kademe: 'T1',
  branslar: 'hepsi',
  // hasta_ilaclar.onay_durumu defaults to 'onayli', and the Sağlığım portal shows exactly the
  // 'onayli' rows — so this record is visible to the patient the moment the doctor taps.
  portalaYansir: true,
  makullukKontrol: (ctx, v) => tarihMakul('Başlangıç tarihi', v.baslangic_tarihi, ctx.hasta, '9999-12-31'),
  mukerrerKontrol: async (ctx, v) => {
    if (!v.ilac_adi) return null
    const { data } = await ctx.supabase
      .from('hasta_ilaclar')
      .select('id, ilac_adi')
      .eq('doctor_id', ctx.doktorId)
      .eq('patient_id', ctx.hasta.id)
      .eq('aktif', true)
      .ilike('ilac_adi', String(v.ilac_adi))
      .limit(1)
    return data?.length ? `"${v.ilac_adi}" hastanın aktif ilaç listesinde zaten var.` : null
  },
  // NOTYA-EYLEM-21: alerji / aynı etken madde / etkileşim / pediatrik yaş — kartın ÜSTÜNDE, dokunuştan önce.
  uyariKontrol: (ctx, v) =>
    ilacUyarilariHesapla(ctx, {
      ilacAdi: String(v.ilac_adi || ''),
      etkenMadde: (v.etken_madde as string | null) ?? null,
      // NOTYA-EYLEM-30: the written dose is what an overdose verdict is measured against.
      doz: (v.doz as string | null) ?? null,
      kullanimSikligi: (v.kullanim_sikli as string | null) ?? null,
    }),
  calistir: async (ctx, v) => {
    const satir = {
      doctor_id: ctx.doktorId,
      patient_id: ctx.hasta.id,
      ilac_adi: String(v.ilac_adi),
      etken_madde: v.etken_madde ?? null,
      doz: v.doz ?? null,
      kullanim_sikli: v.kullanim_sikli ?? null,
      baslangic_tarihi: v.baslangic_tarihi ?? ctx.bugunTRT,
      bitis_tarihi: v.bitis_tarihi ?? null,
      aktif: true,
      notlar: v.notlar ?? null,
      // onay_durumu is left to the column default ('onayli'), exactly as the UI POST route does.
    }
    const { data, error } = await ctx.supabase.from('hasta_ilaclar').insert(satir).select('id').single()
    if (error || !data) throw new Error(error?.message || 'İlaç kaydedilemedi.')
    return { hedefTablo: 'hasta_ilaclar', hedefId: String(data.id), once: null, sonra: satir, ilgiliSekme: { etiket: 'İlaçlar sekmesinde gör', yol: `/dashboard/doktor/hastalar/${ctx.hasta.id}?sekme=ilaclar` } }
  },
  geriAl: async (ctx, k) => {
    await ctx.supabase.from('hasta_ilaclar').delete().eq('id', k.hedefId).eq('doctor_id', ctx.doktorId).eq('patient_id', ctx.hasta.id)
  },
})

/* ───────────────────────── T1 · Alerji / kronik hastalık ───────────────────────── */

export const ALERJI_EKLE = eylem({
  anahtar: 'alerji_ekle',
  etiket: 'Alerji ekle',
  aciklama: 'Hastanın dosyasındaki alerji bilgisine bir madde ekler (ilaç, gıda, çevresel).',
  alanlar: [
    { anahtar: 'alerji', etiket: 'Alerji', tip: 'metin', zorunlu: true, aciklama: 'The allergen, e.g. "Penisilin", "fıstık"' },
  ],
  zorunlu: ['alerji'],
  kademe: 'T1',
  branslar: 'hepsi',
  mukerrerKontrol: async (ctx, v) => {
    if (!v.alerji) return null
    const { data } = await ctx.supabase.from('patients').select('notes_encrypted').eq('id', ctx.hasta.id).eq('doctor_id', ctx.doktorId).maybeSingle()
    return data && alerjiVarMi(notAlanlariCoz(data.notes_encrypted as string | null), String(v.alerji))
      ? `"${v.alerji}" dosyada alerji olarak zaten kayıtlı.`
      : null
  },
  calistir: async (ctx, v) => {
    const r = await hastaNotAlanlariGuncelle(ctx.supabase, ctx.doktorId, ctx.hasta.id, (n) => alerjiEklenmis(n, String(v.alerji)))
    if (!r) throw new Error('Hasta bulunamadı.')
    return { hedefTablo: 'patients', hedefId: ctx.hasta.id, once: { alerjiler: r.once.alerjiler ?? null }, sonra: { alerjiler: r.sonra.alerjiler ?? null }, ilgiliSekme: { etiket: 'Özet sekmesinde gör', yol: `/dashboard/doktor/hastalar/${ctx.hasta.id}` } }
  },
  geriAl: async (ctx, k) => {
    const eski = (k.once as { alerjiler?: string } | null)?.alerjiler ?? ''
    await hastaNotAlanlariGuncelle(ctx.supabase, ctx.doktorId, ctx.hasta.id, (n) => ({ ...n, alerjiler: eski }))
  },
})

export const KRONIK_HASTALIK_EKLE = eylem({
  anahtar: 'kronik_hastalik_ekle',
  etiket: 'Kronik hastalık ekle',
  aciklama: 'Hastanın özgeçmişindeki kronik hastalık listesine bir tanı ekler (hipertansiyon, astım, diyabet gibi bilinen, daha önce konmuş tanılar).',
  alanlar: [
    { anahtar: 'hastalik', etiket: 'Kronik hastalık', tip: 'metin', zorunlu: true, aciklama: 'An already-established chronic diagnosis the doctor or the file states. Never a new diagnosis you inferred.' },
  ],
  zorunlu: ['hastalik'],
  kademe: 'T1',
  branslar: 'hepsi',
  mukerrerKontrol: async (ctx, v) => {
    if (!v.hastalik) return null
    const { data } = await ctx.supabase.from('patients').select('notes_encrypted').eq('id', ctx.hasta.id).eq('doctor_id', ctx.doktorId).maybeSingle()
    return data && kronikVarMi(notAlanlariCoz(data.notes_encrypted as string | null), String(v.hastalik))
      ? `"${v.hastalik}" özgeçmişte zaten kayıtlı.`
      : null
  },
  calistir: async (ctx, v) => {
    const r = await hastaNotAlanlariGuncelle(ctx.supabase, ctx.doktorId, ctx.hasta.id, (n) => kronikEklenmis(n, String(v.hastalik)))
    if (!r) throw new Error('Hasta bulunamadı.')
    return { hedefTablo: 'patients', hedefId: ctx.hasta.id, once: { kronikHastaliklar: r.once.kronikHastaliklar ?? null }, sonra: { kronikHastaliklar: r.sonra.kronikHastaliklar ?? null }, ilgiliSekme: { etiket: 'Özet sekmesinde gör', yol: `/dashboard/doktor/hastalar/${ctx.hasta.id}` } }
  },
  geriAl: async (ctx, k) => {
    const eski = (k.once as { kronikHastaliklar?: string[] } | null)?.kronikHastaliklar ?? []
    await hastaNotAlanlariGuncelle(ctx.supabase, ctx.doktorId, ctx.hasta.id, (n) => ({ ...n, kronikHastaliklar: eski }))
  },
})

/* ─────────────────────────────── T1 · Ölçüm ─────────────────────────────── */

const OLCUM_ALANLARI: AlanTanimi[] = [
  { anahtar: 'boy', etiket: 'Boy', tip: 'sayi', birim: 'cm', enAz: 20, enCok: 250 },
  { anahtar: 'kilo', etiket: 'Kilo', tip: 'sayi', birim: 'kg', enAz: 0.3, enCok: 400 },
  { anahtar: 'ates', etiket: 'Ateş', tip: 'sayi', birim: '°C', enAz: 30, enCok: 45 },
  { anahtar: 'nabiz', etiket: 'Nabız', tip: 'sayi', birim: '/dk', enAz: 20, enCok: 260 },
  { anahtar: 'spo2', etiket: 'SpO₂', tip: 'sayi', birim: '%', enAz: 40, enCok: 100 },
  { anahtar: 'tansiyon', etiket: 'Tansiyon', tip: 'metin', aciklama: 'e.g. "120/80"' },
]

export const OLCUM_EKLE = eylem({
  anahtar: 'olcum_ekle',
  etiket: 'Ölçüm ekle',
  aciklama: 'Bugünkü muayene notunun yaşamsal bulgularına ölçüm yazar (boy, kilo, ateş, nabız, SpO₂, tansiyon). Bugün bu hastaya ait bir muayene yoksa çalışmaz.',
  alanlar: OLCUM_ALANLARI,
  zorunlu: [],
  kademe: 'T1',
  branslar: 'hepsi',
  calistir: async (ctx, v) => {
    const vitaller: Record<string, unknown> = {}
    for (const a of OLCUM_ALANLARI) if (v[a.anahtar] !== undefined && v[a.anahtar] !== null && v[a.anahtar] !== '') vitaller[a.anahtar] = v[a.anahtar]
    if (!Object.keys(vitaller).length) throw new Error('En az bir ölçüm girin.')
    const r = await gununNotunaVitalEkle(ctx.supabase, ctx.doktorId, ctx.hasta.id, vitaller)
    if (!r.eklendi || !r.notId) throw new Error(r.sebep || 'Ölçüm eklenemedi.')
    return { hedefTablo: 'notes', hedefId: r.notId, once: r.once, sonra: r.sonra || vitaller, ilgiliSekme: { etiket: 'Muayene notunda gör', yol: `/dashboard/doktor/notlar/${r.notId}` } }
  },
  geriAl: async (ctx, k) => {
    await notVitalleriGeriYukle(ctx.supabase, k.hedefId, k.once)
  },
})

/**
 * BRANS-ALAN-SIZMASI: baş çevresi is its own action, not a field on `olcum_ekle`, so a kardiyolog
 * is never even OFFERED it. The gate is not a second hand-written branch list — it asks the scope
 * engine that already decides whether the Yaşamsal Bulgular form shows the field.
 */
export const BAS_CEVRESI_EKLE = eylem({
  anahtar: 'bas_cevresi_ekle',
  etiket: 'Baş çevresi',
  aciklama: 'Bugünkü muayene notuna baş çevresi ölçümü yazar (büyüme eğrilerine işlenir).',
  alanlar: [{ anahtar: 'basCevresi', etiket: 'Baş çevresi', tip: 'sayi', birim: 'cm', zorunlu: true, enAz: 20, enCok: 70 }],
  zorunlu: ['basCevresi'],
  kademe: 'T1',
  branslar: 'hepsi',
  hastaKosulu: (hasta, brans) =>
    bransKapsami({ doktorBransi: brans, hastaDogumIso: hasta.dogumTarihi }).olcumler.some((o) => o.anahtar === 'basCevresi'),
  calistir: async (ctx, v) => {
    const r = await gununNotunaVitalEkle(ctx.supabase, ctx.doktorId, ctx.hasta.id, { basCevresi: v.basCevresi })
    if (!r.eklendi || !r.notId) throw new Error(r.sebep || 'Ölçüm eklenemedi.')
    return { hedefTablo: 'notes', hedefId: r.notId, once: r.once, sonra: r.sonra || {}, ilgiliSekme: { etiket: 'Büyüme eğrilerinde gör', yol: `/dashboard/doktor/hastalar/${ctx.hasta.id}?sekme=buyume` } }
  },
  geriAl: async (ctx, k) => {
    await notVitalleriGeriYukle(ctx.supabase, k.hedefId, k.once)
  },
})

/* ─────────────────────────────── T1 · Randevu ─────────────────────────────── */

const SAAT = /^([01]\d|2[0-3]):([0-5]\d)$/

/** TRT (UTC+3) local wall time → the instant stored in `randevular.baslangic`. */
export function trtAnI(tarih: string, saat: string): string {
  return new Date(`${tarih}T${saat}:00+03:00`).toISOString()
}

export const KONTROL_RANDEVUSU_OLUSTUR = eylem({
  anahtar: 'kontrol_randevusu_olustur',
  etiket: 'Kontrol randevusu',
  aciklama: 'Hastaya kontrol randevusu açar. Tarih ve saat Türkiye saatiyle verilir. Saati hekim söylemediyse tahmin etme.',
  alanlar: [
    { anahtar: 'tarih', etiket: 'Tarih', tip: 'tarih', zorunlu: true },
    { anahtar: 'saat', etiket: 'Saat', tip: 'metin', zorunlu: true, aciklama: 'TRT, HH:MM (24h)' },
    { anahtar: 'sure_dk', etiket: 'Süre', tip: 'sayi', birim: 'dk', enAz: 5, enCok: 240 },
    {
      anahtar: 'tur', etiket: 'Tür', tip: 'secim',
      secenekler: [
        { deger: 'kontrol', etiket: 'Kontrol' },
        { deger: 'muayene', etiket: 'Muayene' },
        { deger: 'diger', etiket: 'Diğer' },
      ],
    },
    { anahtar: 'notlar', etiket: 'Not', tip: 'metin' },
  ],
  zorunlu: ['tarih', 'saat'],
  kademe: 'T1',
  branslar: 'hepsi',
  makullukKontrol: (ctx, v) => {
    if (v.saat && !SAAT.test(String(v.saat))) return 'Saat SS:DD biçiminde olmalı (ör. 14:30).'
    if (v.tarih && String(v.tarih) < ctx.bugunTRT) return `Randevu tarihi geçmişte (${v.tarih}).`
    return null
  },
  mukerrerKontrol: async (ctx, v) => {
    if (!v.tarih || !v.saat || !SAAT.test(String(v.saat))) return null
    const bas = trtAnI(String(v.tarih), String(v.saat))
    const bit = new Date(new Date(bas).getTime() + Number(v.sure_dk || 20) * 60000).toISOString()
    const c = await randevuCakismasiVarMi(ctx.supabase, ctx.doktorId, bas, bit)
    return c.cakisiyor ? CAKISMA_MESAJI : null
  },
  calistir: async (ctx, v) => {
    const bas = trtAnI(String(v.tarih), String(v.saat))
    const bit = new Date(new Date(bas).getTime() + Number(v.sure_dk || 20) * 60000).toISOString()
    // Same overlap guard as the UI booking form — an assistant-prepared booking may not skip it.
    const c = await randevuCakismasiVarMi(ctx.supabase, ctx.doktorId, bas, bit)
    if (c.hata) throw new Error(CAKISMA_KONTROL_HATASI)
    if (c.cakisiyor) throw new Error(CAKISMA_MESAJI)
    const satir = {
      doktor_id: ctx.doktorId,
      patient_id: ctx.hasta.id,
      baslangic: bas,
      bitis: bit,
      tur: v.tur === 'muayene' || v.tur === 'diger' ? v.tur : 'kontrol',
      notlar: v.notlar ?? null,
      olusturan_id: ctx.doktorId,
    }
    const { data, error } = await ctx.supabase.from('randevular').insert(satir).select('id').single()
    if (error || !data) throw new Error(error?.message || 'Randevu oluşturulamadı.')
    return { hedefTablo: 'randevular', hedefId: String(data.id), once: null, sonra: satir, ilgiliSekme: { etiket: 'Randevularda gör', yol: '/dashboard/doktor/randevular' } }
  },
  geriAl: async (ctx, k) => {
    await ctx.supabase.from('randevular').delete().eq('id', k.hedefId).eq('doktor_id', ctx.doktorId).eq('patient_id', ctx.hasta.id)
  },
})

/* ─────────────────────────────── T1 · Dosya notu ─────────────────────────────── */

export const DOSYA_NOTU_EKLE = eylem({
  anahtar: 'dosya_notu_ekle',
  etiket: 'Dosya notu',
  aciklama: "Bugünkü muayene notunun değerlendirme bölümüne bir satır ekler. Bugün bu hastaya ait bir muayene yoksa çalışmaz.",
  alanlar: [{ anahtar: 'metin', etiket: 'Not', tip: 'uzunMetin', zorunlu: true }],
  zorunlu: ['metin'],
  kademe: 'T1',
  branslar: 'hepsi',
  calistir: async (ctx, v) => {
    const satir = `${String(v.metin).trim()} (Ayşe hazırladı, hekim onayladı — ${ctx.bugunTRT})`
    const r = await gununNotunaEkle(ctx.supabase, ctx.doktorId, ctx.hasta.id, satir)
    if (!r.eklendi || !r.notId) throw new Error(r.sebep || 'Not eklenemedi.')
    return { hedefTablo: 'notes', hedefId: r.notId, once: null, sonra: { satir }, ilgiliSekme: { etiket: 'Muayene notunda gör', yol: `/dashboard/doktor/notlar/${r.notId}` } }
  },
  // No geriAl: the note text is free-form and a later edit would be silently reverted. The doctor
  // removes the line in the note editor, where they can see what else changed.
})

/* ─────────────────────────────── T2 · İlaç düzeltmeleri ─────────────────────────────── */

async function aktifIlac(ctx: EylemBaglami, ad: string) {
  const { data } = await ctx.supabase
    .from('hasta_ilaclar')
    .select('id, ilac_adi, doz, kullanim_sikli, aktif, bitis_tarihi')
    .eq('doctor_id', ctx.doktorId)
    .eq('patient_id', ctx.hasta.id)
    .eq('aktif', true)
    .ilike('ilac_adi', ad)
    .limit(2)
  return data || []
}

export const ILAC_SONLANDIR = eylem({
  anahtar: 'ilac_sonlandir',
  etiket: 'İlacı sonlandır',
  aciklama: 'Hastanın aktif ilaçlarından birini sonlandırır (kesildi olarak işaretler). İlaç listede yoksa çalışmaz.',
  alanlar: [
    { anahtar: 'ilac_adi', etiket: 'İlaç', tip: 'metin', zorunlu: true },
    { anahtar: 'bitis_tarihi', etiket: 'Bitiş tarihi', tip: 'tarih' },
    { anahtar: 'sebep', etiket: 'Sebep', tip: 'metin' },
  ],
  zorunlu: ['ilac_adi'],
  kademe: 'T2',
  branslar: 'hepsi',
  portalaYansir: true,
  mukerrerKontrol: async (ctx, v) => {
    const liste = await aktifIlac(ctx, String(v.ilac_adi || ''))
    if (!liste.length) return `"${v.ilac_adi}" hastanın aktif ilaç listesinde bulunamadı.`
    if (liste.length > 1) return `"${v.ilac_adi}" ile eşleşen birden çok aktif kayıt var — hangisi olduğunu ekrandan seçin.`
    return null
  },
  calistir: async (ctx, v) => {
    const liste = await aktifIlac(ctx, String(v.ilac_adi))
    if (liste.length !== 1) throw new Error(liste.length ? 'Birden çok eşleşme — ilaç listesinden seçin.' : 'İlaç bulunamadı.')
    const once = liste[0]
    const guncel = { aktif: false, bitis_tarihi: v.bitis_tarihi ?? ctx.bugunTRT, notlar: v.sebep ? `Sonlandırma: ${v.sebep}` : undefined }
    const yama = Object.fromEntries(Object.entries(guncel).filter(([, x]) => x !== undefined))
    const { error } = await ctx.supabase.from('hasta_ilaclar').update(yama).eq('id', once.id).eq('doctor_id', ctx.doktorId).eq('patient_id', ctx.hasta.id)
    if (error) throw new Error(error.message)
    return { hedefTablo: 'hasta_ilaclar', hedefId: String(once.id), once, sonra: { ...once, ...yama }, ilgiliSekme: { etiket: 'İlaçlar sekmesinde gör', yol: `/dashboard/doktor/hastalar/${ctx.hasta.id}?sekme=ilaclar` } }
  },
})

export const ILAC_DOZ_DEGISTIR = eylem({
  anahtar: 'ilac_doz_degistir',
  etiket: 'İlaç dozunu değiştir',
  aciklama: 'Aktif bir ilacın dozunu ya da kullanım sıklığını günceller. Yeni dozu hekim söylemediyse ASLA uydurma.',
  alanlar: [
    { anahtar: 'ilac_adi', etiket: 'İlaç', tip: 'metin', zorunlu: true },
    { anahtar: 'yeni_doz', etiket: 'Yeni doz', tip: 'metin' },
    { anahtar: 'yeni_kullanim', etiket: 'Yeni kullanım', tip: 'metin' },
  ],
  zorunlu: ['ilac_adi'],
  kademe: 'T2',
  branslar: 'hepsi',
  portalaYansir: true,
  mukerrerKontrol: async (ctx, v) => {
    const liste = await aktifIlac(ctx, String(v.ilac_adi || ''))
    if (!liste.length) return `"${v.ilac_adi}" hastanın aktif ilaç listesinde bulunamadı.`
    if (liste.length > 1) return `"${v.ilac_adi}" ile eşleşen birden çok aktif kayıt var — hangisi olduğunu ekrandan seçin.`
    return null
  },
  // A dose change is still a drug decision: the same check runs, with the edited row excluded from
  // the duplicate test (it is the row being changed, not a second box of the same molecule).
  uyariKontrol: (ctx, v) =>
    ilacUyarilariHesapla(ctx, {
      ilacAdi: String(v.ilac_adi || ''),
      doz: (v.yeni_doz as string | null) ?? null,
      kullanimSikligi: (v.yeni_kullanim as string | null) ?? null,
    }),
  calistir: async (ctx, v) => {
    if (!v.yeni_doz && !v.yeni_kullanim) throw new Error('Yeni doz ya da yeni kullanım girin.')
    const liste = await aktifIlac(ctx, String(v.ilac_adi))
    if (liste.length !== 1) throw new Error(liste.length ? 'Birden çok eşleşme — ilaç listesinden seçin.' : 'İlaç bulunamadı.')
    const once = liste[0]
    const yama: Record<string, unknown> = {}
    if (v.yeni_doz) yama.doz = v.yeni_doz
    if (v.yeni_kullanim) yama.kullanim_sikli = v.yeni_kullanim
    const { error } = await ctx.supabase.from('hasta_ilaclar').update(yama).eq('id', once.id).eq('doctor_id', ctx.doktorId).eq('patient_id', ctx.hasta.id)
    if (error) throw new Error(error.message)
    return { hedefTablo: 'hasta_ilaclar', hedefId: String(once.id), once, sonra: { ...once, ...yama }, ilgiliSekme: { etiket: 'İlaçlar sekmesinde gör', yol: `/dashboard/doktor/hastalar/${ctx.hasta.id}?sekme=ilaclar` } }
  },
})

/* ─────────────────────────────── T2 · Alerji / hasta bilgisi ─────────────────────────────── */

export const ALERJI_KALDIR = eylem({
  anahtar: 'alerji_kaldir',
  etiket: 'Alerjiyi kaldır',
  aciklama: 'Dosyadaki bir alerji kaydını kaldırır (yanlış girilmiş ya da doğrulanmamış bir alerji için).',
  alanlar: [{ anahtar: 'alerji', etiket: 'Alerji', tip: 'metin', zorunlu: true }],
  zorunlu: ['alerji'],
  kademe: 'T2',
  branslar: 'hepsi',
  mukerrerKontrol: async (ctx, v) => {
    const { data } = await ctx.supabase.from('patients').select('notes_encrypted').eq('id', ctx.hasta.id).eq('doctor_id', ctx.doktorId).maybeSingle()
    const n = notAlanlariCoz((data?.notes_encrypted as string | null) ?? null)
    return alerjiVarMi(n, String(v.alerji || ''))
      ? null
      : `"${v.alerji}" dosyada alerji olarak kayıtlı değil (kayıtlı: ${alerjiListe(n).join(', ') || 'yok'}).`
  },
  calistir: async (ctx, v) => {
    const r = await hastaNotAlanlariGuncelle(ctx.supabase, ctx.doktorId, ctx.hasta.id, (n: HastaNotAlanlari) => alerjiCikarilmis(n, String(v.alerji)))
    if (!r) throw new Error('Hasta bulunamadı.')
    return { hedefTablo: 'patients', hedefId: ctx.hasta.id, once: { alerjiler: r.once.alerjiler ?? null }, sonra: { alerjiler: r.sonra.alerjiler ?? null }, ilgiliSekme: { etiket: 'Özet sekmesinde gör', yol: `/dashboard/doktor/hastalar/${ctx.hasta.id}` } }
  },
})

export const HASTA_BILGISI_DUZELT = eylem({
  anahtar: 'hasta_bilgisi_duzelt',
  etiket: 'Hasta bilgisini düzelt',
  aciklama: 'Hasta kaydındaki doğum tarihini ya da telefonu düzeltir. Adı ve kimlik bilgisini bu araçla değiştirme.',
  alanlar: [
    { anahtar: 'dogum_tarihi', etiket: 'Doğum tarihi', tip: 'tarih' },
    { anahtar: 'telefon', etiket: 'Telefon', tip: 'metin' },
  ],
  zorunlu: [],
  kademe: 'T2',
  branslar: 'hepsi',
  makullukKontrol: (ctx, v) => {
    if (v.dogum_tarihi && String(v.dogum_tarihi) > ctx.bugunTRT) return 'Doğum tarihi gelecekte olamaz.'
    if (v.dogum_tarihi && String(v.dogum_tarihi) < '1900-01-01') return 'Doğum tarihi 1900 öncesi olamaz.'
    return null
  },
  calistir: async (ctx, v) => {
    const yama: Record<string, unknown> = {}
    if (v.dogum_tarihi) yama.dob_encrypted = encrypt(String(v.dogum_tarihi))
    if (v.telefon) yama.phone_encrypted = encrypt(String(v.telefon))
    if (!Object.keys(yama).length) throw new Error('Değiştirilecek alan yok.')
    yama.updated_at = new Date().toISOString()
    const { error } = await ctx.supabase.from('patients').update(yama).eq('id', ctx.hasta.id).eq('doctor_id', ctx.doktorId)
    if (error) throw new Error(error.message)
    // Encrypted values are never written into the audit row — only which fields moved and to what
    // the doctor confirmed on screen (the card already showed önce → sonra in plain text).
    return {
      hedefTablo: 'patients',
      hedefId: ctx.hasta.id,
      once: { dogum_tarihi: ctx.hasta.dogumTarihi },
      sonra: { dogum_tarihi: v.dogum_tarihi ?? ctx.hasta.dogumTarihi, telefon_degisti: Boolean(v.telefon) },
      ilgiliSekme: { etiket: 'Hasta dosyasında gör', yol: `/dashboard/doktor/hastalar/${ctx.hasta.id}` },
    }
  },
})

export const TEMEL_EYLEMLER: EylemTanimi[] = [
  ASI_KAYDI_EKLE,
  ILAC_EKLE,
  ALERJI_EKLE,
  KRONIK_HASTALIK_EKLE,
  OLCUM_EKLE,
  BAS_CEVRESI_EKLE,
  KONTROL_RANDEVUSU_OLUSTUR,
  DOSYA_NOTU_EKLE,
  ILAC_SONLANDIR,
  ILAC_DOZ_DEGISTIR,
  ALERJI_KALDIR,
  HASTA_BILGISI_DUZELT,
] as EylemTanimi[]

export { bugunTRT }
