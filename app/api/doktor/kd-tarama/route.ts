/**
 * KD-TARAMA-01 (Kaan, 2026-11-09) — Kadın Hastalıkları ve Doğum: thyroid in pregnancy, HPV vaccination, SMA carrier
 * screening, PMS/PMDD diary. KD ONLY: every other branch answers 403 (lib/doktor/kdTaramaSunucu.ts → kdTaramaBransi, by
 * the doctor's own users.specialty). Doctor only (no secretary).
 *
 *   GET  ?patientId=<id>                                      → KdTaramaOzeti (records + engine results + cervical history)
 *   POST { patientId, tur, veri }                             → { kayit }   tur: tiroid_olcum | tiroid_durum | lt4_not | hpv_doz | sma | pmdd_gunluk | pmdd_kontrol
 *   POST { patientId, islem: 'gunluk_gunu', gunlukId, gun }    → { ok }      a diary day copied from a paper diary (kaynak = klinik)
 *   POST { patientId, islem: 'gunluk_kapat', gunlukId }        → { ok }
 *
 * HASTA-IZOLASYON: the server helpers prove the patient first; a foreign patient or diary id answers 404. A saved record
 * adds one line to the day's note (gununNotunaEkle), as every KD form does. No dose is written anywhere.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { doktorBransi, gunlukGunuYaz, gunlukKapat, kayitEkle, kdTaramaBransi, ozetGetir, type KdKayit } from '@/lib/doktor/kdTaramaSunucu'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'private, no-store' }
const yanit = (g: unknown, status = 200) => NextResponse.json(g, { status, headers: NO_STORE })
const BULUNAMADI = () => yanit({ error: 'Hasta bulunamadı.' }, 404)

const HATA: Readonly<Record<string, string>> = {
  kd_degil: 'Bu bölüm yalnız Kadın Hastalıkları ve Doğum hekimleri içindir.',
  deger_yok: 'TSH veya serbest T4 değeri girin.', hafta: 'Gebelik haftası 0–45 arasında olmalı.', deger_araligi: 'Değer aralık dışında.',
  durum: 'Durum seçin.', lt4_bos: 'Levotiroksin notunu hekim yazar (boş olamaz).', lt4_uzun: 'Not en çok 300 karakter.',
  doz_no: 'Doz numarası 1–3 olmalı.', tarih: 'Tarih geçersiz.', gelecek_tarih: 'İleri tarihli kayıt yapılamaz.',
  sma_durum: 'Tarama durumunu seçin.', sma_sonuc_gerekli: 'Yapıldıysa laboratuvarın sonucunu seçin.', sma_sonuc_yalniz_yapildi: 'Sonuç yalnız "yapıldı" durumunda girilir.',
  sma_kopya_bicimi: 'SMN1 kopya sayısını rapordaki gibi yazın (ör. 1, 2, ≥3, 2+0).', sma_es_sonucu_gerekli: 'Eş testi yapıldıysa sonucunu seçin.', sma_tarih: 'Tarih geçersiz.',
  gun_tarih: 'Günlük tarihi geçersiz.', gun_puan: 'Puanlar 0–5 arasında olmalı.', gun_bos: 'En az bir belirti puanı ya da adet işareti girin.', gunluk_kapali: 'Günlük kapalı.',
  tur: 'Kayıt türü geçersiz.', yazilamadi: 'Kaydedilemedi.',
}

async function kapi(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return { hata: oturum.hata }
  const engel = sadeceDoktor(oturum)
  if (engel) return { hata: engel }
  if (!kdTaramaBransi(await doktorBransi(oturum.supabase, oturum.doktorId))) return { hata: yanit({ error: HATA.kd_degil, kod: 'kd_degil' }, 403) }
  return { oturum }
}

function notSatiri(k: KdKayit): string {
  const v = k.veri
  switch (k.tur) {
    case 'tiroid_olcum': return `Gebelikte tiroid (${v.hafta}. hf): ${v.tsh != null ? `TSH ${v.tsh} mIU/L` : ''}${v.ft4 != null ? ` sT4 ${v.ft4}${v.ft4Birim ? ` ${v.ft4Birim}` : ''}` : ''}`.trim()
    case 'tiroid_durum': return `Gebelikte tiroid durumu: ${({ yok: 'bilinen tiroid hastalığı yok', hipotiroidi: 'hipotiroidi (LT4)', hipertiroidi: 'hipertiroidi', antikor_pozitif: 'ötiroid, antikor pozitif' } as Record<string, string>)[String(v.durum)] || v.durum}`
    case 'lt4_not': return `Levotiroksin (hekim notu): ${v.metin}`
    case 'hpv_doz': return `HPV aşısı ${v.no}. doz (${v.tip === 'bilinmiyor' ? 'tip bilinmiyor' : String(v.tip).toUpperCase()}) — ${k.tarih}`
    case 'sma': return `SMA taşıyıcılık taraması: ${v.durum}${v.sonuc ? ` — ${v.sonuc}${v.smn1Kopya ? `, SMN1 kopya ${v.smn1Kopya} (rapordaki gibi)` : ''}` : ''}`
    case 'pmdd_gunluk': return 'PMS/PMDD prospektif semptom günlüğü başlatıldı (Sağlığım).'
    case 'pmdd_kontrol': return `PMDD kontrol listesi (DSM-5-TR yapısı): ${v.durum === 'tum_kriterler' ? 'tüm kriterler işaretli' : v.durum === 'gecici' ? 'F dışında tümü — geçici' : 'eksik kriter var'} — tanı hekimindir.`
  }
}

export async function GET(req: NextRequest) {
  const k = await kapi(req)
  if ('hata' in k) return k.hata
  const patientId = req.nextUrl.searchParams.get('patientId') || ''
  if (!patientId) return BULUNAMADI()
  const ozet = await ozetGetir(k.oturum.supabase, k.oturum.doktorId, patientId)
  return ozet ? yanit(ozet) : BULUNAMADI()
}

export async function POST(req: NextRequest) {
  const k = await kapi(req)
  if ('hata' in k) return k.hata
  const { supabase, doktorId } = k.oturum
  const b = (await req.json().catch(() => ({}))) as { patientId?: unknown; tur?: unknown; veri?: unknown; islem?: unknown; gunlukId?: unknown; gun?: unknown }
  const patientId = typeof b.patientId === 'string' ? b.patientId : ''
  if (!patientId) return BULUNAMADI()
  try {
    if (b.islem === 'gunluk_kapat') return (await gunlukKapat(supabase, doktorId, patientId, String(b.gunlukId || ''))) ? yanit({ ok: true }) : BULUNAMADI()
    if (b.islem === 'gunluk_gunu') {
      const r = await gunlukGunuYaz(supabase, { doktorId, patientId, gunlukId: String(b.gunlukId || ''), gun: b.gun, kaynak: 'klinik' })
      if (!r.ok) return r.status === 404 ? BULUNAMADI() : yanit({ error: HATA[r.hata] || 'Geçersiz.', kod: r.hata }, r.status)
      return yanit({ ok: true })
    }
    const r = await kayitEkle(supabase, doktorId, patientId, b.tur, b.veri)
    if (!r.ok) return r.status === 404 ? BULUNAMADI() : yanit({ error: HATA[r.hata] || 'Geçersiz kayıt.', kod: r.hata }, r.status)
    await gununNotunaEkle(supabase, doktorId, patientId, notSatiri(r.kayit)).catch(() => undefined)
    return yanit({ kayit: r.kayit }, 201)
  } catch { return yanit({ error: HATA.yazilamadi }, 500) }
}
