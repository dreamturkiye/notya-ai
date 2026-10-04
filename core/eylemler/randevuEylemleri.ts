/**
 * NOTYA-RANDEVU-V2 PR3 — Ayşe's appointment tool: move or cancel one of the patient's appointments, always as a
 * card the doctor confirms (create = the existing `kontrol_randevusu_olustur`; listing = the existing calendar
 * reader). Base action (every branş), offered ONLY while the doctor's 'Hasta Portalı Randevu' is ON
 * (`ozellik: 'randevu_v2'` → AracSuzgeci.randevuV2), and ordered after every existing tool so it never pushes one
 * out of the prompt cap.
 *
 * Writes go through the same rules as the calendar: overlap check (lib/randevu/cakisma.ts, plus the migration 116
 * guarantee on new-flow rows), V2 reminder jobs dropped/re-planned. Nothing leaves the system from this tap: no
 * patient message is sent (T3 'hastaya_mesaj_gonder' stays absent) — the card tells the doctor to inform the patient.
 */
import { semaYap } from './sema'
import type { EylemBaglami, EylemTanimi } from './types'
import { randevuCakismasiVarMi, CAKISMA_MESAJI, CAKISMA_KONTROL_HATASI } from '@/lib/randevu/cakisma'
import { bekleyenIsleriIptal, cakismaHatasiMi, isEkle } from '@/lib/randevu/v2/isler'
import { hatirlatmaZamanlari } from '@/lib/randevu/v2/isPlani'
import { saatEtiketi } from '@/lib/randevu/v2/zaman'

const SAAT = /^([01]\d|2[0-3]):([0-5]\d)$/
const trtAn = (tarih: string, saat: string) => new Date(`${tarih}T${saat}:00+03:00`).toISOString()

type Veri = { islem: 'tasi' | 'iptal'; mevcut_tarih: string; mevcut_saat?: string; yeni_tarih?: string; yeni_saat?: string; neden?: string }
type Satir = { id: string; baslangic: string; bitis: string; durum: string; kaynak: string | null; iptal_nedeni: string | null }

/** The patient's one active appointment on that TRT day (and hour, when given). */
async function randevuBul(ctx: EylemBaglami, v: Partial<Veri>): Promise<{ satir: Satir } | { hata: string }> {
  if (!v.mevcut_tarih) return { hata: 'Hangi günkü randevu olduğu belli değil.' }
  const bas = new Date(`${v.mevcut_tarih}T00:00:00+03:00`).toISOString()
  const son = new Date(Date.parse(bas) + 86_400_000).toISOString()
  const { data, error } = await ctx.supabase.from('randevular').select('id, baslangic, bitis, durum, kaynak, iptal_nedeni')
    .eq('doktor_id', ctx.doktorId).eq('patient_id', ctx.hasta.id).neq('durum', 'iptal')
    .gte('baslangic', bas).lt('baslangic', son).order('baslangic', { ascending: true }).limit(10)
  if (error) return { hata: 'Randevu okunamadı.' }
  let liste = (data || []) as Satir[]
  if (v.mevcut_saat && SAAT.test(v.mevcut_saat)) liste = liste.filter((r) => saatEtiketi(r.baslangic) === v.mevcut_saat)
  if (!liste.length) return { hata: `Hastanın ${v.mevcut_tarih}${v.mevcut_saat ? ` ${v.mevcut_saat}` : ''} için aktif randevusu yok.` }
  if (liste.length > 1) return { hata: 'O gün birden fazla randevu var; hangi saatteki olduğunu belirtin.' }
  return { satir: liste[0] }
}

const ALANLAR = [
  {
    anahtar: 'islem', etiket: 'İşlem', tip: 'secim', zorunlu: true,
    secenekler: [
      { deger: 'tasi', etiket: 'Başka saate taşı' },
      { deger: 'iptal', etiket: 'İptal et' },
    ],
  },
  { anahtar: 'mevcut_tarih', etiket: 'Randevu günü', tip: 'tarih', zorunlu: true, aciklama: 'The day of the EXISTING appointment (TRT)' },
  { anahtar: 'mevcut_saat', etiket: 'Randevu saati', tip: 'metin', aciklama: 'TRT HH:MM of the existing appointment, only if the doctor said it or the day has several' },
  { anahtar: 'yeni_tarih', etiket: 'Yeni gün', tip: 'tarih', aciklama: 'Only for islem=tasi' },
  { anahtar: 'yeni_saat', etiket: 'Yeni saat', tip: 'metin', aciklama: 'Only for islem=tasi; TRT HH:MM (24h). Never guess.' },
  { anahtar: 'neden', etiket: 'Neden', tip: 'metin' },
] as const

export const RANDEVU_DEGISTIR: EylemTanimi<Veri> = {
  anahtar: 'randevu_degistir',
  etiket: 'Randevu değişikliği',
  aciklama: 'Hastanın mevcut bir randevusunu başka saate taşır ya da iptal eder (hekim onaylar). Yeni randevu için kontrol_randevusu_olustur kullan. Saat söylenmediyse tahmin etme. Hastaya otomatik mesaj gitmez: kartı hazırladıktan sonra hekime değişikliği hastaya bildirmesini hatırlat.',
  alanlar: ALANLAR,
  zorunlu: ['islem', 'mevcut_tarih'],
  kademe: 'T1',
  branslar: 'hepsi',
  ozellik: 'randevu_v2',
  sema: semaYap<Veri>(ALANLAR),
  // Blocking at commit (core/eylemler/onayla.ts): only real problems here.
  makullukKontrol: (ctx, v) => {
    if (v.mevcut_saat && !SAAT.test(String(v.mevcut_saat))) return 'Saat SS:DD biçiminde olmalı (ör. 14:30).'
    if (v.islem === 'tasi') {
      if (!v.yeni_tarih || !v.yeni_saat) return 'Yeni gün ve saat gerekli.'
      if (!SAAT.test(String(v.yeni_saat))) return 'Yeni saat SS:DD biçiminde olmalı (ör. 14:30).'
      if (String(v.yeni_tarih) < ctx.bugunTRT) return `Yeni tarih geçmişte (${v.yeni_tarih}).`
    }
    return null
  },
  mukerrerKontrol: async (ctx, v) => {
    const b = await randevuBul(ctx, v)
    if ('hata' in b) return b.hata
    if (v.islem !== 'tasi' || !v.yeni_tarih || !v.yeni_saat || !SAAT.test(v.yeni_saat)) return null
    const bas = trtAn(v.yeni_tarih, v.yeni_saat)
    const bit = new Date(Date.parse(bas) + (Date.parse(b.satir.bitis) - Date.parse(b.satir.baslangic))).toISOString()
    const c = await randevuCakismasiVarMi(ctx.supabase, ctx.doktorId, bas, bit, b.satir.id)
    return c.cakisiyor ? CAKISMA_MESAJI : null
  },
  calistir: async (ctx, v) => {
    const b = await randevuBul(ctx, v)
    if ('hata' in b) throw new Error(b.hata)
    const r = b.satir
    const once = { baslangic: r.baslangic, bitis: r.bitis, durum: r.durum, iptal_nedeni: r.iptal_nedeni }
    let sonra: Record<string, unknown>
    if (v.islem === 'tasi') {
      if (!v.yeni_tarih || !v.yeni_saat || !SAAT.test(v.yeni_saat)) throw new Error('Yeni gün ve saat gerekli.')
      const bas = trtAn(v.yeni_tarih, v.yeni_saat)
      const bit = new Date(Date.parse(bas) + (Date.parse(r.bitis) - Date.parse(r.baslangic))).toISOString()
      // Same overlap guard as the calendar form.
      const c = await randevuCakismasiVarMi(ctx.supabase, ctx.doktorId, bas, bit, r.id)
      if (c.hata) throw new Error(CAKISMA_KONTROL_HATASI)
      if (c.cakisiyor) throw new Error(CAKISMA_MESAJI)
      sonra = { baslangic: bas, bitis: bit, hatirlatma_gonderildi: false, hasta_teyit_at: null }
    } else {
      sonra = { durum: 'iptal', iptal_nedeni: String(v.neden || '').trim() || 'Hekim iptal etti' }
    }
    const { error } = await ctx.supabase.from('randevular').update(sonra).eq('id', r.id).eq('doktor_id', ctx.doktorId).eq('patient_id', ctx.hasta.id)
    if (error) throw new Error(cakismaHatasiMi(error) ? CAKISMA_MESAJI : 'Randevu güncellenemedi.')
    // V2 jobs follow the appointment: old ones dropped; a moved confirmed one gets its reminders again.
    await bekleyenIsleriIptal(ctx.supabase, ctx.doktorId, r.id)
    if (v.islem === 'tasi' && r.durum === 'onaylandi') {
      await isEkle(ctx.supabase, { id: r.id, doktor_id: ctx.doktorId }, hatirlatmaZamanlari(String(sonra.baslangic), Date.now()))
    }
    return { hedefTablo: 'randevular', hedefId: r.id, once, sonra, ilgiliSekme: { etiket: 'Randevularda gör', yol: '/dashboard/doktor/randevular' } }
  },
  geriAl: async (ctx, k) => {
    const once = (k.once || {}) as { baslangic?: string; bitis?: string; durum?: string; iptal_nedeni?: string | null }
    if (!once.baslangic || !once.bitis || !once.durum) return
    const { error } = await ctx.supabase.from('randevular')
      .update({ baslangic: once.baslangic, bitis: once.bitis, durum: once.durum, iptal_nedeni: once.iptal_nedeni ?? null })
      .eq('id', k.hedefId).eq('doktor_id', ctx.doktorId).eq('patient_id', ctx.hasta.id)
    if (error) throw new Error(cakismaHatasiMi(error) ? 'Eski saat artık dolu; geri alınamadı.' : 'Geri alınamadı.')
    await bekleyenIsleriIptal(ctx.supabase, ctx.doktorId, k.hedefId)
    if (once.durum === 'onaylandi') await isEkle(ctx.supabase, { id: k.hedefId, doktor_id: ctx.doktorId }, hatirlatmaZamanlari(once.baslangic, Date.now()))
  },
}

export const RANDEVU_EYLEMLERI: EylemTanimi[] = [RANDEVU_DEGISTIR as unknown as EylemTanimi]
