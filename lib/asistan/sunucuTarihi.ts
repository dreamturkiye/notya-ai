/**
 * NOTYA-AYSE-GERI-04 — the day and time on a card come from the DOCTOR's sentence, read by the server.
 *
 * Live defect: the doctor said a vaccine was given "bugün" and the card showed 28.02.2024. A model has no reliable
 * clock, and a date it writes is stored as "doktor söyledi". So for the words that mean a day relative to now —
 * "bugün", "dün", "az önce", "yarın", "cuma" — and for a spoken clock time, the server resolves the value itself, in
 * the doctor's timezone, and that value REPLACES whatever the model put in the field. The model still decides which
 * tool to call and fills everything else.
 *
 * Deliberately narrow: a value is produced only when the sentence leaves no doubt which field it belongs to. Two
 * different days in one sentence, a "sonraki doz" beside the date, a day in the future for something already done —
 * the server stays out and the model's value (or an empty, yellow field) stands. Pure; no DB, no model.
 */
import { duz, gunSozuSayisi, soylenenTarih } from '@/lib/randevu/randevuSozu'
import { bugunTz, saatDilimiSec } from '@/lib/randevu/tarihCozumle'

export interface SunucuTarihGirdisi {
  /** Tool the model called. */
  anahtar: string
  /** The doctor's sentence of this turn (ASR-repaired, not rewritten). */
  mesaj: string
  saatDilimi: string
  simdi?: Date
  /** Appointment day / time the caller already resolved (this sentence plus the pending command). */
  randevuTarih?: string | null
  randevuSaat?: string | null
}

/**
 * "yarınki randevusunu", "cuma günkü randevu", "10 Ekim'deki randevusunu": the day of the EXISTING appointment.
 * Returns that day and the sentence without the phrase (what is left may name the new day).
 */
export function mevcutRandevuGunu(mesaj: string, tz: string, simdi?: Date): { gun: string; kalan: string } | null {
  const n = duz(mesaj)
  const m = n.match(/ ((?:\S+ ){0,2}?\S+?(?:ki|ku)) randevu\w*/)
  if (!m) return null
  const parca = ` ${m[1].replace(/(daki|deki|taki|teki|ki|ku)$/, '')} `.replace(/ gun $/, ' ')
  const gun = soylenenTarih(parca, tz, simdi, { ileri: true })
  return gun ? { gun, kalan: n.replace(m[0], ' randevu ').replace(/\s+/g, ' ') } : null
}

const dolu = (o: Record<string, unknown>): Record<string, unknown> => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== ''))

/** Field values the server is sure of for this tool call. Empty object = nothing to override. */
export function sunucuTarihDegerleri(g: SunucuTarihGirdisi): Record<string, unknown> {
  const tz = saatDilimiSec(g.saatDilimi)
  const bugun = bugunTz(tz, g.simdi)
  const n = duz(g.mesaj)
  const tekGun = gunSozuSayisi(g.mesaj) <= 1
  switch (g.anahtar) {
    case 'kontrol_randevusu_olustur':
      return dolu({ tarih: g.randevuTarih, saat: g.randevuSaat })
    case 'randevu_tasi': {
      const mevcut = mevcutRandevuGunu(g.mesaj, tz, g.simdi)
      // "yarınki randevusunu cumaya al": the first day picks the appointment, the rest is the new slot.
      if (mevcut) return dolu({ mevcut_tarih: mevcut.gun, tarih: soylenenTarih(mevcut.kalan, tz, g.simdi, { ileri: true }), saat: g.randevuSaat })
      // Two days with no marker ("pazartesi randevusunu cumaya al"): which is which is not guessed.
      if (!tekGun) return dolu({ saat: g.randevuSaat })
      return dolu({ tarih: g.randevuTarih, saat: g.randevuSaat })
    }
    case 'randevu_iptal': {
      // Any day in a cancel sentence names the appointment to cancel.
      const mevcut = mevcutRandevuGunu(g.mesaj, tz, g.simdi)
      return dolu({ mevcut_tarih: mevcut?.gun ?? (tekGun ? soylenenTarih(g.mesaj, tz, g.simdi, { ileri: true }) : null) })
    }
    case 'asi_kaydi_ekle': {
      // A dose that WAS given: today or earlier. "Sonraki doz 3 ay sonra" beside it makes the day ambiguous.
      if (!tekGun || / (sonraki|bir sonraki|rapel|hatirlatma) /.test(n)) return {}
      const gun = soylenenTarih(g.mesaj, tz, g.simdi)
      return gun && gun <= bugun ? { uygulama_tarihi: gun } : {}
    }
    case 'ilac_ekle': {
      if (!tekGun || / (bitis\w*|kadar|boyunca|kes\w*) /.test(n)) return {}
      return dolu({ baslangic_tarihi: soylenenTarih(g.mesaj, tz, g.simdi) })
    }
    case 'ilac_sonlandir': {
      if (!tekGun) return {}
      return dolu({ bitis_tarihi: soylenenTarih(g.mesaj, tz, g.simdi) })
    }
    default:
      return {}
  }
}
