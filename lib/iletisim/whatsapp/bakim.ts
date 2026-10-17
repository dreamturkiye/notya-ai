/**
 * WHATSAPP-API-01 — hourly maintenance (app/api/cron/whatsapp-bakim):
 *   1. number health for every connected doctor: quality rating + messaging tier (feeds the send limit), expired token
 *      (Meta 190) → connection marked "hata" + ONE Telegram alert per 12h;
 *   2. templates a connection does not have yet (the 2 newer ones) are submitted to Meta for review;
 *   3. outbound attempts that never got an outcome ("deneniyor" > 10 min) are closed as "belirsiz" — never resent
 *      automatically, because the message may have left (same rule as the dispatcher) — and counted in one admin alert;
 *   4. delivery failures reported by Meta that have no e-posta fallback yet (night-time failures, a missed webhook);
 *   5. retention: audit rows older than 2 years are purged through the one allowed function (whatsapp_gunluk_imha).
 * Bounded by a time budget; one doctor's error never stops the others. Does nothing while WhatsApp is not configured.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { telegramGonder } from '@/lib/uyari/telegram'
import { whatsappAyar } from '@/lib/iletisim/otomatik/whatsapp/ayar'
import { bagliDoktorlar, baglantiOku, sablonlariGuncelle } from '@/lib/iletisim/otomatik/whatsapp/depo'
import { GUNLUK, gunlukYaz } from '@/lib/iletisim/otomatik/whatsapp/gunluk'
import type { FetchFn } from '@/lib/iletisim/otomatik/whatsapp/graph'
import { saglikTazele } from '@/lib/iletisim/otomatik/whatsapp/saglik'
import { SABLON_KODLARI, sablonlariHazirla } from '@/lib/iletisim/otomatik/whatsapp/sablonlar'
import { basarisizTeslimYedegi, yedeksizBasarisizlar } from './yedek'

export const TAKILMA_DK = 10
export const SAKLAMA_YIL = 2

export interface BakimOzeti {
  calisti: boolean
  doktor: number
  saglik: number
  sablonGonderilen: number
  takilanKapatilan: number
  yedekGonderilen: number
  imha: number
}

export async function takilanDenemeleriKapat(sb: SupabaseClient, simdi: Date = new Date()): Promise<number> {
  const bas = new Date(simdi.getTime() - 24 * 3600_000).toISOString()
  const son = new Date(simdi.getTime() - TAKILMA_DK * 60_000).toISOString()
  const { data, error } = await sb.from(GUNLUK).select('doctor_id, patient_id, tur, idem_anahtar, karsi_taraf_hash, sablon_kodu')
    .eq('yon', 'giden').eq('durum', 'deneniyor').not('idem_anahtar', 'is', null).gte('created_at', bas).lt('created_at', son).limit(200)
  if (error || !data) return 0
  let kapatilan = 0
  for (const d of data) {
    const { data: sonuc } = await sb.from(GUNLUK).select('id').eq('doctor_id', d.doctor_id).eq('idem_anahtar', d.idem_anahtar).neq('durum', 'deneniyor').limit(1)
    if (sonuc?.length) continue
    const y = await gunlukYaz(sb, {
      doktorId: String(d.doctor_id), patientId: d.patient_id ? String(d.patient_id) : null, yon: 'giden', tur: String(d.tur), durum: 'belirsiz',
      idemAnahtar: String(d.idem_anahtar), sablonKodu: d.sablon_kodu ? String(d.sablon_kodu) : null, ayrinti: { neden: 'takildi' },
    })
    if (y.ok) kapatilan++
  }
  return kapatilan
}

export async function bakimCalistir(
  sb: SupabaseClient,
  o: { fetch?: FetchFn; simdi?: Date; sureButcesiMs?: number; env?: NodeJS.ProcessEnv; alarm?: (m: string) => Promise<unknown> } = {},
): Promise<BakimOzeti> {
  const simdi = o.simdi ?? new Date()
  const bos: BakimOzeti = { calisti: false, doktor: 0, saglik: 0, sablonGonderilen: 0, takilanKapatilan: 0, yedekGonderilen: 0, imha: 0 }
  if (!whatsappAyar(o.env)) return bos
  const bitis = Date.now() + (o.sureButcesiMs ?? 45_000)
  const ozet: BakimOzeti = { ...bos, calisti: true }

  const doktorlar = (await bagliDoktorlar(sb)).slice(0, 300)
  ozet.doktor = doktorlar.length
  for (const doktorId of doktorlar) {
    if (Date.now() >= bitis) break
    try {
      const b = await baglantiOku(sb, doktorId)
      if (!b) continue
      const s = await saglikTazele(sb, b, o.fetch, simdi)
      if (s.durum === 'guncel') ozet.saglik++
      if (s.durum === 'token_gecersiz') continue
      const eksik = SABLON_KODLARI.filter((k) => !b.sablonlar[k])
      if (eksik.length) {
        const yeni = await sablonlariHazirla(b.wabaId, b.token, o.fetch).catch(() => null)
        if (yeni) { await sablonlariGuncelle(sb, doktorId, { ...b.sablonlar, ...yeni }); ozet.sablonGonderilen += eksik.length }
      }
    } catch { /* next doctor */ }
  }

  try {
    ozet.takilanKapatilan = await takilanDenemeleriKapat(sb, simdi)
    if (ozet.takilanKapatilan > 0) {
      try { await (o.alarm ?? telegramGonder)(`[Notya WhatsApp] ${ozet.takilanKapatilan} giden mesajın sonucu bilinmiyor (yanıt alınamadı). Otomatik yeniden gönderilmedi; kontrol edin.`) } catch { /* best effort */ }
    }
  } catch { /* audit table missing → nothing to close */ }

  try {
    for (const f of await yedeksizBasarisizlar(sb, simdi)) {
      if (Date.now() >= bitis) break
      const r = await basarisizTeslimYedegi(sb, { doktorId: f.doctor_id, mesajId: f.mesaj_id }, { simdi }).catch(() => 'basarisiz')
      if (r === 'gonderildi') ozet.yedekGonderilen++
    }
  } catch { /* none */ }

  try {
    const sinir = new Date(simdi.getTime()); sinir.setFullYear(sinir.getFullYear() - SAKLAMA_YIL)
    const { data } = await sb.rpc('whatsapp_gunluk_imha', { p_oncesi: sinir.toISOString() })
    ozet.imha = Number(data) || 0
  } catch { /* function missing before 169 */ }
  return ozet
}
