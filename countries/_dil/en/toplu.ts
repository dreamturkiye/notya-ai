/**
 * TOPLU-ULKE-01 — the English language set's copy of the batch confirm card (EylemToplu), in the five forms of English.
 * Written once in en-GB (the set's base form); `enYaz` writes it in the form a pack asks for. Names no country.
 *
 * The field / action labels override the Turkish ones the server sends for the BASE medication action only
 * (`ilac_ekle`, keys `ilac_adi` … `notlar` — core/eylemler/temelEylemler.ts, identical on every release branch).
 */
import type { TopluMetin } from '@/components/core/topluMetin'
import { enYaz, type EnBicim } from './varyant'

export function enToplu(bicim: EnBicim): TopluMetin {
  const y = (t: string) => enYaz(t, bicim)
  return {
    kayitHazirlandi: (n) => y(`${n} ${n === 1 ? 'entry' : 'entries'} prepared`),
    uyariGordum: y('I have seen the warning - OK to save'),
    eksikAciklama: y('A required field is missing - enter it below. This entry is not added until it is filled in. The assistant did not guess these fields.'),
    seciniz: y('Select...'),
    seciliEksik: (alanlar) => y(`Selected - will be added once these are filled in: ${alanlar.join(', ')}.`),
    kaydediliyor: y('Saving...'),
    kaydedildi: y('Saved'),
    kaynak: y('Source'),
    dugme: (s) => {
      const parca = [`${s.hazir} ready`]
      if (s.eksikli) parca.push(`${s.eksikli} with missing fields`)
      if (s.uyariBekleyen) parca.push(`${s.uyariBekleyen} awaiting warning acknowledgement`)
      return y(`Save selected (${parca.join(', ')})`)
    },
    zaman: {
      azOnce: y('just now'),
      dakika: (n) => y(`${n} min ago`),
      saat: (n) => y(`${n} h ago`),
      dun: y('yesterday'),
      gun: (n) => y(`${n} days ago`),
    },
    tarihYerel: bicim,
    eylemEtiketleri: { ilac_ekle: y('Add medication') },
    alanEtiketleri: {
      ilac_adi: y('Medication'),
      etken_madde: y('Active ingredient'),
      doz: y('Dose'),
      kullanim_sikli: y('Frequency'),
      baslangic_tarihi: y('Start date'),
      bitis_tarihi: y('End date'),
      notlar: y('Notes'),
    },
  }
}
