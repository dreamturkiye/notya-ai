/**
 * NOTYA-SES-TAKVIM-01 — clinic-day calendar is a lookup, not a model turn.
 *
 * Live (Kaan, 2026-09-29): "bugün randevu var mı" waited 10s+ (full patient dossier on
 * every voice turn), the answer appeared as text only, then ElevenLabs dropped the
 * Custom LLM ("Bağlantı kurulamadı"). Voice never spoke the day list because
 * tek-beyin has no randevu_takvim client tool — the question went through ayseCevapla
 * like a chart query. Detect here; answer from randevular (doktor_id) without the LLM.
 */
import { kayitNiyetiMi } from '@/core/eylemler/oneri'
import { bugunTRT, gunKaydirTRT } from '@/core/eylemler/types'
import { trAramaNormalize } from '@/lib/utils/turkceArama'

export type TakvimSorusu = {
  tarih: string
  saat: string | null
}

const SAAT = /\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/

export function takvimSorusuMu(mesaj: string | null | undefined): boolean {
  return takvimSorusuCoz(mesaj) != null
}

/** Clinic calendar lookup (today / tomorrow / a date / a slot). Null = not this question. */
export function takvimSorusuCoz(mesaj: string | null | undefined): TakvimSorusu | null {
  const ham = String(mesaj || '').trim()
  if (!ham || kayitNiyetiMi(ham)) return null
  const n = ` ${trAramaNormalize(ham).replace(/[?!.,;:]+/g, ' ').replace(/\s+/g, ' ').trim()} `
  if (n.length < 6) return null

  const randevu = /\b(randevu\w*|takvim\w*|appointment\w*)\b/.test(n)
  const gun = /\b(bugun|yarin|today|tomorrow)\b/.test(n) || /\bo gun\b/.test(n)
  const soru = /\b(var mi|neler|ne var|kimler|bos mu|cakisma|any|have we|do we|have any)\b/.test(n)
    || /\b(listele|oku|goster)\b/.test(n)
  const bosSaat = /\b(o saat|saat)\b/.test(n) && /\b(bos|cakis|musait|uygun)\b/.test(n)
  const saatBos = SAAT.test(ham) && /\b(bos|cakis|musait|uygun)\b/.test(n)
  if (!randevu && !bosSaat && !saatBos) return null
  if (randevu && !gun && !soru && !bosSaat && !saatBos) return null
  if (/\b(olustur|hazirla)\b/.test(n) && !soru && !gun) return null

  let offset = 0
  if (/\byarin\b|\btomorrow\b/.test(n)) offset = 1
  const iso = n.match(/\b(20\d{2}-\d{2}-\d{2})\b/)
  const tarih = iso ? iso[1] : (offset ? gunKaydirTRT(offset) : bugunTRT())

  const sm = ham.match(SAAT)
  const saat = sm ? `${String(sm[1]).padStart(2, '0')}:${sm[2]}` : null
  return { tarih, saat }
}
