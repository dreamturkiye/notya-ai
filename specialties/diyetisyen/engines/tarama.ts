/**
 * BRANS-PAKETI (diyetisyen) — eating-disorder screening, the deliberate brake of the diyetisyen package.
 *
 * Instrument: SCOFF (Morgan, Reid & Lacey, BMJ 1999;319:1467) — five yes/no questions, ≥ 2 "evet" = positive screen.
 * Turkish validation (citation confirmed 2026-11-27): Aydemir Ö, Köksal B, Yalın Sapmaz Ş, Yüceyar H. "Kadın üniversite
 * öğrencilerinde REZZY Yeme Bozuklukları Ölçeği Türkçe formunun güvenilirlik ve geçerliliği", Anadolu Psikiyatri Dergisi
 * 2015;16(Özel Sayı 1):31–35, doi:10.5455/apd.174219 — the Turkish form is named "REZZY"; n = 50, Cronbach α 0,74, one
 * factor, r = 0,52 with the Eating Attitude Test. Turkish users score each "evet" 1 point, ≥ 2 = risk group, max 5 (as
 * cited by Turkish studies using it). The five published Turkish items could NOT be read online (journal full text and
 * thesis appendices not reachable) — the items below are a faithful translation, part of the template the dietitian
 * reviews and accepts (editable once). Aligning them word for word waits on a Chrome pass
 * (docs/kaynak/DIYETISYEN-PAKETI-ARASTIRMA.md § Source verification).
 * Why here: TEMD Obezite 2024 — "Yeme bozuklukları ve depresyon her obezite hastasında mutlaka incelenmeli" (Kanıt A);
 * 2023 International PCOS Guideline — screen for eating disorders / disordered eating where relevant.
 *
 * Rules: shown at intake and then every 90 days; the patient never sees a score or a result; a positive screen raises a
 * professional alert (hekime_bildir) whose patient-side text is gentle and never shows numbers. Not a diagnosis.
 */
export const SCOFF_SORULARI: readonly string[] = [
  'Kendinizi rahatsız edecek kadar dolu hissettiğiniz için kendinizi kusturduğunuz oluyor mu?',
  'Ne kadar yediğiniz üzerindeki kontrolü kaybettiğiniz için endişelendiğiniz oluyor mu?',
  'Son 3 ay içinde 6 kilodan fazla kilo kaybettiniz mi?',
  'Başkaları zayıf olduğunuzu söylediği hâlde kendinizi şişman olarak görüyor musunuz?',
  'Yemek ya da yemekle ilgili düşüncelerin hayatınıza hâkim olduğunu söyleyebilir misiniz?',
]

export const SCOFF_ESIK = 2
export const TARAMA_ARALIGI_GUN = 90

/** Gentle patient copy — identical for positive and negative screens (no result is ever implied by the wording). */
export const TARAMA_TESEKKUR = 'Yanıtlarınız için teşekkürler. Bu sorular herkese sorulur; yanıtlarınızı uzmanınız görür ve bir sonraki görüşmede isterseniz birlikte konuşursunuz.'
/** Patient-side alert text when positive (shown like any message from the professional — no number, no label). */
export const TARAMA_HASTA_METNI = 'Uzmanınız bir sonraki görüşmede sizinle beslenme alışkanlıklarınız hakkında biraz daha konuşmak isteyebilir. Kendinizi zor hissederseniz uzmanınıza her zaman yazabilirsiniz.'

export function scoffPuani(cevaplar: readonly unknown[]): number | null {
  if (cevaplar.length !== SCOFF_SORULARI.length || !cevaplar.every((c) => c === true || c === false)) return null
  return cevaplar.filter((c) => c === true).length
}

export function scoffDegerlendir(cevaplar: readonly unknown[]): { pozitif: boolean; puan: number } | null {
  const puan = scoffPuani(cevaplar)
  return puan == null ? null : { pozitif: puan >= SCOFF_ESIK, puan }
}

/** Due at first use and then every 90 days after the last answered screen. */
export function taramaZamaniMi(sonTaramaGun: string | null, bugun: string): boolean {
  if (!sonTaramaGun) return true
  const fark = (Date.parse(`${bugun}T00:00:00Z`) - Date.parse(`${sonTaramaGun}T00:00:00Z`)) / 86_400_000
  return !Number.isFinite(fark) || fark >= TARAMA_ARALIGI_GUN
}
