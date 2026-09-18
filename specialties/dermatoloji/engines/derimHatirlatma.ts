/**
 * DERM-CHAPTER — Derim (hasta portalı) hatırlatmaları. Hekim tetikler; portal yalnız gösterir.
 *
 * Hasta güvenli dil (`.cursor/skills/specialty-hasta-portali`): tanı, morfoloji, skor (PASI/EASI/DLQI),
 * J/cm² yorumu, ilaç adı ve doz **yazılmaz**. Portal bu satırları `derm_gorevleri` üzerinden okur
 * (app/api/portal/hasta/[token] → bundle.deri.hatirlatmalar), bu yüzden metinler görev adı olarak üretilir.
 */
import { annualTbseDue, type PhotoSession } from './phototherapy-log'
import { patchStatus, plannedReads } from './patch-calendar'
import type { PatchCourse } from '../schema'

export type DerimHatirlatmaKodu =
  | 'bhcg_aylik'
  | 'fototerapi_seans'
  | 'yama_d2'
  | 'yama_d4'
  | 'yara_kontrol'
  | 'tbse_yillik'
  | 'kontrol_foto'
  | 'lab_kontrol'

export type DerimHatirlatma = {
  kod: string
  /** hasta yüzü metni — tanı / skor / doz yok */
  ad: string
  due: string | null
  /** hekim panelinde neden önerildiği (portala gitmez) */
  gerekce: string
}

/** Hasta güvenli sabit metinler — tek yerde, sızıntı testi bunları kilitler. */
export const DERIM_HATIRLATMA_METNI: Record<DerimHatirlatmaKodu, string> = {
  bhcg_aylik: 'Aylık kan testi randevunuz (tedavi güvenliği)',
  fototerapi_seans: 'Işık tedavisi seansınız',
  yama_d2: 'Yama testi 2. gün okuma randevunuz',
  yama_d4: 'Yama testi 4. gün okuma randevunuz',
  yara_kontrol: 'İşlem sonrası yara kontrolü',
  tbse_yillik: 'Yıllık deri kontrolü randevunuz',
  kontrol_foto: 'Kontrol fotoğrafı için randevunuz',
  lab_kontrol: 'Tedavi güvenlik laboratuvar kontrolü',
}

export type HatirlatmaGirdi = {
  bugun: string
  /** izotretinoin / GÖP paketi aktif ve kadın hasta → aylık test */
  gopAktif?: boolean
  gopSonrakiHcgIso?: string | null
  /** fototerapi seans planı (hekimin girdiği sonraki seans) */
  fototerapiSonrakiIso?: string | null
  sessions?: PhotoSession[]
  /** açık yama kürü */
  yamaKuru?: PatchCourse | null
  /** işlem sonrası yara kontrol tarihi (derm-spine görevinden) */
  yaraKontrolIso?: string | null
  lastTbseIso?: string | null
  /** hekimin belirlediği sonraki kontrol fotoğrafı tarihi */
  nextPhotoIso?: string | null
  /** sistemik tedavi lab kontrol tarihi */
  labDueIso?: string | null
}

/**
 * Hekimin tek dokunuşla oluşturabileceği hatırlatma önerileri. Hiçbiri otomatik gönderilmez —
 * UI'de hekim seçer ve "Hastaya hatırlat" der (API `hatirlatma` eylemi `derm_gorevleri`'ne yazar).
 */
export function derimHatirlatmaOnerileri(g: HatirlatmaGirdi): DerimHatirlatma[] {
  const out: DerimHatirlatma[] = []
  const ekle = (kod: DerimHatirlatmaKodu, due: string | null, gerekce: string, sonek = '') => {
    out.push({ kod: `derim_${kod}${sonek}`, ad: DERIM_HATIRLATMA_METNI[kod], due, gerekce })
  }

  if (g.gopAktif) ekle('bhcg_aylik', g.gopSonrakiHcgIso || null, 'GÖP paketi aktif — aylık β-hCG kapısı')
  if (g.fototerapiSonrakiIso) ekle('fototerapi_seans', g.fototerapiSonrakiIso, 'Hekimin planladığı sonraki fototerapi seansı')
  else if ((g.sessions || []).length) ekle('fototerapi_seans', null, 'Fototerapi defterinde seans var, sonraki tarih girilmedi')

  if (g.yamaKuru) {
    const durum = patchStatus(g.yamaKuru, g.bugun)
    const plan = plannedReads(g.yamaKuru.appliedAt)
    if (durum === 'open_d2' || durum === 'overdue_d2' || durum === 'not_yet') ekle('yama_d2', plan.d2, `Yama kürü ${g.yamaKuru.appliedAt} · D2 okuma`)
    if (durum === 'open_d4' || durum === 'overdue_d4' || durum === 'not_yet') ekle('yama_d4', plan.d4, `Yama kürü ${g.yamaKuru.appliedAt} · D4 okuma`)
  }
  if (g.yaraKontrolIso) ekle('yara_kontrol', g.yaraKontrolIso, 'İşlem sonrası yara bakımı kontrolü')
  if (annualTbseDue(g.lastTbseIso ?? null, g.bugun)) ekle('tbse_yillik', null, g.lastTbseIso ? `Son deri taraması ${g.lastTbseIso} — yıllık vade` : 'Deri taraması kaydı yok')
  if (g.nextPhotoIso) ekle('kontrol_foto', g.nextPhotoIso, 'Hekimin belirlediği kontrol fotoğrafı tarihi')
  if (g.labDueIso) ekle('lab_kontrol', g.labDueIso, 'Sistemik / biyolojik tedavi laboratuvar izlemi')

  return out
}

const YASAK_DESENLER = [
  /pasi/i, /easi/i, /dlqi/i, /scorad|skorad/i, /uas7/i, /\bsalt\b/i,
  /\bmg\b/i, /\bj\/cm/i, /doz/i, /melanom/i, /psoriasis|sedef/i, /biyops/i,
  /izotretinoin/i, /biyolojik/i, /tanı/i,
]

/** Hasta yüzü metin kilidi — portal metni bu testten geçmeden yazılmaz. */
export function hastaGuvenliMi(metin: string): boolean {
  return !YASAK_DESENLER.some((re) => re.test(metin))
}

export function hatirlatmaGecerliMi(h: DerimHatirlatma): boolean {
  return hastaGuvenliMi(h.ad)
}
