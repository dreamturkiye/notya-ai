/**
 * BRANS-PAKETI (diyetisyen) — drug–food timing notes for the medicines on the patient's file. Sourced, no doses, no
 * advice to start / stop / change a medicine (that is the physician's). Matching is by name on the doctor-recorded
 * medicine list (hasta_ilaclar), so a note appears only when the medicine is really on file.
 *
 * Sources (docs/kaynak/DIYETISYEN-PAKETI-ARASTIRMA.md):
 *  - Levotiroksin: TEMD Tiroid Hastalıkları Tanı ve Tedavi Kılavuzu 2025, Bölüm 7 "Levotiroksin kullanımında dikkat edilmesi
 *    gerekenler" s. 91: öğünden en az 30 dakika önce su ile; demir sülfat / kalsiyum karbonat ile EN AZ 4 SAAT ara (2026-11-28
 *    doğrulandı). TİTCK onaylı KÜB (Euthyrox, 2020): kahvaltıdan yarım saat önce, kalsiyum/demirle en az 2 saat — 4 saat
 *    her ikisini de karşılar, bu yüzden 4 saat yazılır. Tablo 1.3: kalsiyum karbonat, demir sülfat, omeprazol / lansoprazol
 *    T4 emilimini azaltır. Kahve: KÜB'de yok; UCLA Endocrine Center hasta rehberi 60 dk
 *    önerir (uluslararası destek — Türk kaynağında süre yok, bu yüzden "en az 30–60 dk" diye yazılır).
 *  - Metformin–B12: ADA Standards of Care (Bölüm 9, uzun süreli metforminde B12 düzeyinin periyodik ölçümü; 2026
 *    öneri numarası bu oturumda doğrulanamadı).
 *  - GLP-1 RA (semaglutid, tirzepatid, liraglutid, dulaglutid): ACLM/ASN/OMA/TOS ortak bildirgesi 2025 "Nutritional
 *    Priorities to Support GLP-1 Therapy for Obesity" (yeterli protein + direnç egzersizi ile yağsız kütleyi koruma, GİS
 *    yan etki yönetimi, mikro besin eksikliğini önleme); ADA SoC 2026 öneri 8.14 / 5.23 (kilo kaybında yeterli protein
 *    ve mikro besin). Şiddetli, sırta vuran karın ağrısı ilaç prospektüslerinde acil başvuru nedenidir (pankreatit uyarısı).
 */
export interface IlacBesinNotu { kod: 'levotiroksin' | 'metformin' | 'glp1'; baslik: string; maddeler: string[]; kaynak: string }

export const ILAC_DESENLERI: Record<IlacBesinNotu['kod'], RegExp> = {
  levotiroksin: /levotiroks|levothyrox|euthyrox|levotiron|\btefor\b/i,
  metformin: /metformin|glukofen|glucophage|matofin|gluformin|diaformin|glifor/i,
  glp1: /semaglut|ozempic|wegovy|rybelsus|tirzepat|mounjaro|zepbound|liraglut|saxenda|victoza|dulaglut|trulicity|eksenatid|exenatid|byetta/i,
}

export const ILAC_BESIN_NOTLARI: Record<IlacBesinNotu['kod'], IlacBesinNotu> = {
  levotiroksin: {
    kod: 'levotiroksin', baslik: 'Levotiroksin ve öğün zamanı',
    maddeler: [
      'Sabah aç karnına, su ile, kahvaltıdan en az yarım saat önce (TEMD 2025; onaylı ürün bilgisi).',
      'Kalsiyum ve demir içeren takviye veya ilaçlarla en az 4 saat ara (TEMD Tiroid 2025).',
      'Kahve: ilaçtan sonra en az 30–60 dakika beklenmesi önerilir.',
      'Soya ağırlıklı beslenmeye geçiş ya da bırakış ve mide asidi ilaçları emilimi etkileyebilir — değişiklik hekime bildirilir.',
    ],
    kaynak: 'TEMD Tiroid 2025 Bölüm 7 (s. 91) ve Tablo 1.3; TİTCK KÜB (levotiroksin)',
  },
  metformin: {
    kod: 'metformin', baslik: 'Metformin ve B12',
    maddeler: [
      'Uzun süreli metformin kullanımında B12 düzeyi azalabilir; ölçüm ve takviye kararı hekimindir.',
      'B12 kaynakları (et, balık, yumurta, süt ürünleri) planda yer alır; vejetaryen planda hekime not düşülür.',
      'Mide-bağırsak yakınmalarında ilacın öğünle alınması hekimin tarifine göredir — doz ve saat değişikliği yazılmaz.',
    ],
    kaynak: 'ADA Standards of Care, Bölüm 9',
  },
  glp1: {
    kod: 'glp1', baslik: 'GLP-1 etkili ilaç kullananlarda beslenme',
    maddeler: [
      'İştah belirgin azalır: her öğünde protein kaynağı ve diyetisyenin belirlediği günlük protein hedefi, yağsız kütleyi korumak için direnç egzersiziyle birlikte.',
      'Bulantıda küçük porsiyon, yavaş yeme, yağlı/kızartma yiyeceklerin azaltılması; kabızlıkta lif ve sıvı.',
      'Sıvı alamayacak kadar kusma, şiddetli ya da sırta vuran karın ağrısı: hasta hekime / acile yönlendirilir.',
      'Mikro besin yeterliliği izlenir; takviye ve doz kararı hekimindir.',
    ],
    kaynak: 'ACLM/ASN/OMA/TOS ortak bildirgesi 2025; ADA SoC 2026 öneri 8.14',
  },
}

/** Notes for the medicines on file (deduplicated, fixed order). */
export function ilacBesinNotlari(ilacAdlari: readonly string[]): IlacBesinNotu[] {
  const kodlar = (Object.keys(ILAC_DESENLERI) as Array<IlacBesinNotu['kod']>).filter((k) => ilacAdlari.some((a) => ILAC_DESENLERI[k].test(String(a || ''))))
  return kodlar.map((k) => ILAC_BESIN_NOTLARI[k])
}

/**
 * Levothyroxine day plan from the time the patient takes it ("07:00") — earliest breakfast, coffee and calcium/iron.
 * Uses TEMD Tiroid 2025's 30 min / 4 h (which also satisfies the KÜB's 30 min / 2 h) and the 60 min coffee figure;
 * returns null for an invalid time.
 */
export function levotiroksinGunPlani(ilacSaati: string): { kahvalti: string; kahve: string; kalsiyumDemir: string } | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(ilacSaati || '').trim())
  if (!m) return null
  const dk = Number(m[1]) * 60 + Number(m[2])
  const s = (x: number) => { const y = ((x % 1440) + 1440) % 1440; return `${String(Math.floor(y / 60)).padStart(2, '0')}:${String(y % 60).padStart(2, '0')}` }
  return { kahvalti: s(dk + 30), kahve: s(dk + 60), kalsiyumDemir: s(dk + 240) }
}
