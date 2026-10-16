/**
 * NOTYA-ASI-STOK-BARKOD-01 — barkod ayrıştırma.
 *
 * Türkiye'de aşı/ilaç ambalajları İTS (İlaç Takip Sistemi) kapsamında GS1 DataMatrix taşır — GS1
 * Application Identifier (AI) kodlanmış: 01=GTIN, 17=SKT (YYMMDD), 10=Lot/Parti No, 21=Seri No,
 * 240=Ek ürün kodu. Kaynak: GS1 Genel Teknik Özellikler (GS1 General Specifications) + Türkiye
 * İlaç ve Tıbbi Cihaz Kurumu İTS kılavuzu (ilacsuhadaskodu.titck.gov.tr dokümantasyonu, İTS
 * GS1 DataMatrix zorunluluğu). Ayraç FNC1 tarayıcıda genelde GS (0x1D) olarak gelir; biz hem GS
 * hem de yaygın tarayıcı çıkışı olan boşluksuz ardışık sabit/ değişken alan uzunluklarını kabul
 * ediyoruz.
 *
 * Bu modül GS1 çözemediği her şeyi "ham kod" olarak kabul eder (klinikte el yazısı/kendi etiketli
 * kodlar da olabilir) — asla hata fırlatıp taramayı durdurmaz; barkodBilgisi() her zaman en az
 * { ham } döner.
 */

const GS = '\u001d'

export type GS1Bilgisi = {
  gtin?: string
  lotNo?: string
  seriNo?: string
  sktIso?: string // YYYY-MM-DD
}

export type BarkodBilgisi = GS1Bilgisi & {
  ham: string
  /** Stok eşleştirmesinde kullanılacak normalize edilmiş anahtar — gtin+lot varsa onu, yoksa ham kodu kullanır. */
  anahtar: string
}

/** GS1 AI alanlarının sabit uzunlukları (değişken uzunluklu olanlar — 10, 21 — GS ile veya dizinin sonunda biter). */
const SABIT_UZUNLUK: Record<string, number> = { '01': 14, '17': 6 }
const DEGISKEN_AI = new Set(['10', '21', '240'])

function yy_mm_dd_to_iso(yymmdd: string): string | undefined {
  if (!/^\d{6}$/.test(yymmdd)) return undefined
  const yy = Number(yymmdd.slice(0, 2))
  const mm = yymmdd.slice(2, 4)
  const dd = yymmdd.slice(4, 6)
  // GS1: 00-50 -> 2000-2050, 51-99 -> 1951-1999. Bu üründe pratikte hep 20xx.
  const yyyy = yy <= 50 ? 2000 + yy : 1900 + yy
  // GS1 kuralı: gün 00 ise o ayın son günü (burada kullanılmıyor ama 00 ham geçilmez) — biz basitçe 01 kabul ederiz.
  const gun = dd === '00' ? '01' : dd
  return `${yyyy}-${mm}-${gun}`
}

/** Ham GS1-128 / GS1 DataMatrix dizisini AI alanlarına ayrıştırır. GS1 kalıbı yoksa null döner. */
export function gs1Coz(ham: string): GS1Bilgisi | null {
  let s = ham.replace(/^\]d2/i, '').replace(/^\]C1/i, '') // bazı tarayıcılar sembol kimliğini önüne ekler
  if (!/^(01\d{14}|17\d{6}|10|21|240)/.test(s)) return null
  const sonuc: GS1Bilgisi = {}
  let i = 0
  let bulunduMu = false
  while (i < s.length) {
    const ai = s.slice(i, i + 2)
    if (ai in SABIT_UZUNLUK) {
      const uzunluk = SABIT_UZUNLUK[ai]
      const deger = s.slice(i + 2, i + 2 + uzunluk)
      if (deger.length < uzunluk) break
      if (ai === '01') sonuc.gtin = deger
      if (ai === '17') sonuc.sktIso = yy_mm_dd_to_iso(deger)
      i += 2 + uzunluk
      bulunduMu = true
    } else if (DEGISKEN_AI.has(ai)) {
      let bitis = s.indexOf(GS, i + 2)
      if (bitis === -1) bitis = s.length
      const deger = s.slice(i + 2, bitis)
      if (ai === '10') sonuc.lotNo = deger
      if (ai === '21') sonuc.seriNo = deger
      i = bitis + (s[bitis] === GS ? 1 : 0)
      bulunduMu = true
    } else {
      // Tanınmayan AI — ilerleyemiyoruz, güvenli şekilde dur (yanlış ayrıştırmaktan iyidir).
      break
    }
  }
  return bulunduMu ? sonuc : null
}

export function barkodBilgisi(ham: string): BarkodBilgisi {
  const temiz = String(ham || '').trim()
  const gs1 = gs1Coz(temiz)
  if (gs1 && (gs1.gtin || gs1.lotNo)) {
    return { ham: temiz, ...gs1, anahtar: [gs1.gtin, gs1.lotNo].filter(Boolean).join('|') || temiz }
  }
  return { ham: temiz, anahtar: temiz }
}
