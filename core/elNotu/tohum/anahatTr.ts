/**
 * ESNEK-READER-2 — default outline of a Turkish handwritten clinical page (seed DATA, no patient data). Used as the
 * structure prior until a doctor's own outline is learned from his confirmed pages (core/elNotu/anahat.ts). The general
 * outline serves every one of the 40 branches; a branş adds its examination fields where its form has them.
 */
import type { AnahatAlani } from '../anahat'

export const GENEL_ANAHAT_TR: AnahatAlani[] = [
  { ad: 'Yaş / cinsiyet', tur: 'oyku', esler: ['yaş', 'K', 'E'] },
  { ad: 'Şikayet', tur: 'oyku', esler: ['Şk', 'Şik', 'şikayeti', 'yakınma'] },
  { ad: 'Hikaye', tur: 'oyku', esler: ['Hik', 'öykü', 'hikayesi'] },
  { ad: 'Sistemik hastalık', tur: 'sistemik', esler: ['Sist hast', 'sist. hast.', 'SH', 'sistemik hast'] },
  { ad: 'Sürekli ilaç', tur: 'ilac', esler: ['Sürekli ilaç kullanımı', 'Sür. ilaç', 'ilaç kullanımı', 'kullandığı ilaçlar'] },
  { ad: 'İlaç alerjisi', tur: 'alerji', esler: ['ilaç alj', 'ilaç allerjisi', 'alerji'], korumali: 'alerji' },
  { ad: 'Alerjik nedenler', tur: 'alerji', esler: ['alerjik', 'allerjik nedenler'] },
  { ad: 'Sigara', tur: 'aliskanlik', esler: ['sig', 'tütün'] },
  { ad: 'Alkol', tur: 'aliskanlik' },
  { ad: 'Su / sıvı', tur: 'aliskanlik', esler: ['su', 'sıvı', 'sv'] },
  { ad: 'Özgeçmiş', tur: 'ozgecmis', esler: ['ÖS', 'ÖG', 'ÖZG', 'geçirilmiş operasyon', 'op'] },
  { ad: 'Soygeçmiş', tur: 'ozgecmis', esler: ['SG', 'SoyG', 'aile öyküsü'] },
  { ad: 'Muayene', tur: 'muayene', esler: ['FM', 'fizik muayene', 'muayenesi'] },
  { ad: 'Tetkik', tur: 'tetkik', esler: ['USG', 'BT', 'MR', 'Lab', 'görüntüleme'] },
  { ad: 'Tanı', tur: 'tani', esler: ['Dx', 'Δ', 'ön tanı', 'tanısı'] },
  { ad: 'Plan', tur: 'plan', esler: ['Tx', 'tedavi', 'öneri', 'Rx', '→'] },
]

const KBB_EK: AnahatAlani[] = [
  { ad: 'Kulak', tur: 'muayene', esler: ['KZ', 'kulak zarı', 'otoskopi', 'EAC'] },
  { ad: 'Burun', tur: 'muayene', esler: ['SD', 'septum', 'konka', 'rinoskopi'] },
  { ad: 'Orofarenks', tur: 'muayene', esler: ['tonsil', 'ağız içi', 'OF'] },
  { ad: 'Larenks', tur: 'muayene', esler: ['VK', 'vokal kord', 'İDL', 'endoskopi'] },
  { ad: 'Boyun', tur: 'muayene', esler: ['LAP', 'tiroid', 'gland'] },
]

const BRANS_ANAHAT_TR: Record<string, AnahatAlani[]> = { 'kulak-burun-bogaz': KBB_EK, kbb: KBB_EK }

/** Default outline for a branş: the general history outline with the branş's examination fields before "Tetkik". */
export function anahatTr(brans: string | null | undefined): AnahatAlani[] {
  const ek = (brans && BRANS_ANAHAT_TR[brans]) || []
  if (!ek.length) return GENEL_ANAHAT_TR
  const i = GENEL_ANAHAT_TR.findIndex((a) => a.tur === 'tetkik')
  return [...GENEL_ANAHAT_TR.slice(0, i), ...ek, ...GENEL_ANAHAT_TR.slice(i)]
}
