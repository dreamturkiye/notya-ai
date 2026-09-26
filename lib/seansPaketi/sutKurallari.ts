/**
 * NOTYA-SUT-01 — ilk dilim. Pediatri + genel. Tam SUT kataloğu yok.
 * Dahiliye HT/DM/statin/DOAK çiftleri specialties/dahiliye/engines/sgkRapor.ts sınıflarından okunur.
 * Uyarı metninde hasta adı ve TC yok. Kural kartı kesmez.
 */
import type { SeansPaketGovde, SutUyari } from './tip'

const HT = /pril\b|sartan|amlodipin|nifedipin|lerkanidipin|hidroklorotiyazid|indapamid|bisoprolol|metoprolol|nebivolol|karvedilol/
const DM = /metformin|gliflozin|gliptin|glutid|tirzepatid|gliklazid|glimepirid|insülin|insulin/
const STATIN = /statin|ezetimib/
const DOAK = /apiksaban|rivaroksaban|dabigatran|edoksaban|warfarin/
const AB = /amoksisilin|klavulan|sefuroksim|sefiksim|azitromisin|klaritromisin|sefdinir/
const PPI = /omeprazol|lansoprazol|pantoprazol|esomeprazol|rabeprazol/
const YETISKIN_FORM = /erişkin|eriskin|forte|500\s*mg|film tablet/

function kat(s: string): string {
  return s.toLocaleLowerCase('tr-TR')
}

function gun(sure?: string | null): number | null {
  const m = String(sure || '').match(/(\d+)\s*gün/)
  return m ? Number(m[1]) : null
}

export function sutKurallari(g: SeansPaketGovde, opt: { onayli: boolean; kutular?: number[] } = { onayli: true }): SutUyari[] {
  const out: SutUyari[] = []
  const pedi = !g.brans || g.brans === 'pediatri'
  const ilaclar = g.ilaclar.filter((i) => i.eylem !== 'durdur')
  const metin = kat(ilaclar.map((i) => i.ad).join(' '))
  const icd = g.icd10.map((t) => t.kod.toUpperCase()).join(' ')

  const rapor = (kosul: boolean, cumle: string) => {
    if (kosul) out.push({ kod: 'rapor_gerekli', seviye: 'kirmizi', cumle })
  }
  if (!pedi) {
    rapor(/I1[0-3]/.test(icd) && HT.test(metin), 'Hipertansiyon tanısı ile antihipertansif için kullanım raporu gerekebilir.')
    rapor(/E1[01]/.test(icd) && DM.test(metin), 'Diyabet tanısı ile bu ilaç için kullanım raporu gerekebilir.')
  }
  rapor(/E78/.test(icd) && STATIN.test(metin), 'Lipid ilacı için kullanım raporu gerekebilir.')
  rapor(/I48|I26|I82/.test(icd) && DOAK.test(metin), 'Antikoagülan için kullanım raporu gerekebilir.')

  const yas = g.yasAy
  if (yas !== null && yas < 144 && YETISKIN_FORM.test(metin)) {
    out.push({ kod: 'yas_kilo', seviye: 'kirmizi', cumle: 'Yaş veya kilo bu doz ya da erişkin form için uygun görünmüyor.' })
  }

  for (const i of ilaclar) {
    const ad = kat(i.ad)
    const gn = gun(i.sure)
    if (AB.test(ad) && gn !== null && gn > 14) out.push({ kod: 'antibiyotik_sure', seviye: 'kirmizi', cumle: 'Antibiyotik süresi 14 günü aşıyor.' })
    else if (AB.test(ad) && gn !== null && gn > 10) out.push({ kod: 'antibiyotik_sure', seviye: 'sari', cumle: 'Antibiyotik süresi 10 günü aşıyor.' })
    if (PPI.test(ad) && gn !== null && gn > 56) out.push({ kod: 'ppi_8hafta', seviye: 'sari', cumle: 'Mide ilacı 8 haftayı aşıyor.' })
  }

  if ((opt.kutular || []).some((k) => k > 3)) out.push({ kod: 'kutu_3', seviye: 'sari', cumle: 'Bir ilaç 3 kutuyu aşıyor.' })

  const say = new Map<string, number>()
  for (const islem of g.islemTaslak) {
    const k = kat(islem).trim()
    if (!k) continue
    say.set(k, (say.get(k) || 0) + 1)
  }
  if ([...say.values()].some((n) => n > 1)) out.push({ kod: 'cift_islem', seviye: 'sari', cumle: 'Aynı gün aynı işlem iki kez duruyor.' })

  if (!opt.onayli) out.push({ kod: 'paket_eksik', seviye: 'sari', cumle: 'SOAP veya Fısıltı onayı olmadan reçete taslağı.' })
  if (g.enabizIzin === false) out.push({ kod: 'enabiz_red', seviye: 'bilgi', cumle: 'Hasta e-Nabız çıktısını istemiyor.' })

  const gorulen = new Set<string>()
  return out.filter((u) => {
    const anahtar = `${u.kod}:${u.seviye}`
    if (gorulen.has(anahtar)) return false
    gorulen.add(anahtar)
    return true
  })
}

/** Kırmızı kopya kilidi uzman (klinik/hastane) ve plan okunamazsa açık. Starter ve Pro kilitlemez. */
export function kopyaKilitliMi(tier: string | null | undefined, uyarilar: SutUyari[], gecildi: boolean): boolean {
  if (gecildi) return false
  if (!uyarilar.some((u) => u.seviye === 'kirmizi')) return false
  if (tier === 'starter' || tier === 'pro') return false
  return true
}

export function gerekceGecerli(s: string): boolean {
  return s.trim().length >= 10
}

export function kapiModu(tier: string | null | undefined): 'kapali' | 'sari' | 'tam' {
  if (tier === 'starter') return 'kapali'
  if (tier === 'pro') return 'sari'
  return 'tam'
}
