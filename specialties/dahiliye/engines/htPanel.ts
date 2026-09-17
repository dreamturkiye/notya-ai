/**
 * NOTYA-DAH-WOW W2.5 — HT başlangıç paneli order set + sonuçlanmayan lab takibi (14 gün).
 * Kalemler onaylı lab canonical_key ile eşleşir; EKG belge olarak (Belgeler) izlenir. İstem ≠ sonuç: yalnız onaylı satır "geldi" sayılır.
 */
import type { Dipnot } from './dahiliye'

export interface PanelKalem { ad: string; keys: string[]; belge?: boolean }
export const HT_BASLANGIC_PANELI: PanelKalem[] = [
  { ad: 'Hemogram (Hb)', keys: ['Hb'] }, { ad: 'Açlık glukoz', keys: ['Glu'] }, { ad: 'HbA1c', keys: ['HbA1c'] },
  { ad: 'Lipid paneli', keys: ['TChol', 'LDL', 'HDL', 'TG'] }, { ad: 'Kreatinin + eGFR', keys: ['Kre', 'eGFR'] }, { ad: 'Na / K', keys: ['Na', 'K'] },
  { ad: 'Ürik asit', keys: ['Uric'] }, { ad: 'Spot idrar albümin/kreatinin (UACR)', keys: ['UACR'] }, { ad: 'Tam idrar (protein)', keys: ['UA_protein'] },
  { ad: 'TSH', keys: ['TSH'] }, { ad: 'EKG (Belgeler)', keys: [], belge: true },
]
export const HT_PANEL_DIPNOT: Dipnot = { ref: 'HT_UZLASI2025', not: 'Yeni HT başlangıç değerlendirmesi: hemogram, glukoz/HbA1c, lipid, kreatinin/eGFR, elektrolit, ürik asit, UACR, idrar tahlili, EKG; TSH klinik şüphede' }

export interface IstemDurum { sonuclanan: string[]; bekleyen: string[]; tamam: boolean; gecikti: boolean; gunGecen: number; takipGorevi: { kod: string; ad: string; due: string } | null }

/** labTarihleri: canonical_key → onaylı numune tarihleri. belgeTarihleri: EKG vb. belge yükleme tarihleri. */
export function istemDurumu(istem: { id: string; tarih: string; kalemler: PanelKalem[] }, labTarihleri: Record<string, string[]>, belgeTarihleri: string[], bugun: string, esikGun = 14): IstemDurum {
  const sonuclanan: string[] = [], bekleyen: string[] = []
  for (const k of istem.kalemler) {
    const geldi = k.belge ? belgeTarihleri.some((t) => t >= istem.tarih) : k.keys.some((key) => (labTarihleri[key] || []).some((t) => t >= istem.tarih))
    ;(geldi ? sonuclanan : bekleyen).push(k.ad)
  }
  const gunGecen = Math.round((Date.parse(bugun) - Date.parse(istem.tarih)) / 86400000)
  const gecikti = bekleyen.length > 0 && gunGecen > esikGun
  return { sonuclanan, bekleyen, tamam: bekleyen.length === 0, gecikti, gunGecen, takipGorevi: gecikti ? { kod: `lab_takip_${istem.id.slice(0, 8)}`, ad: `Sonuçlanmayan tetkik (${gunGecen} gün): ${bekleyen.join(', ')} — hastayı ara`, due: bugun } : null }
}
