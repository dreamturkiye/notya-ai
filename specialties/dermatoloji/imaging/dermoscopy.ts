/** 3-point, 7-point, CASH as support — never a diagnosis. Link clinical↔dermoscopy via lesionId. */
export type Point3 = { score: 0 | 1 | 2 | 3; notes: string }
export type Point7 = { score: number; notes: string }
export type Cash = { color: number; architecture: number; symmetry: number; homogeneity: number }

export function linkClinicalDermoscopy(clinicalPhotoId: string, dermoscopyPhotoId: string, lesionId: string) {
  return { lesionId, clinicalPhotoId, dermoscopyPhotoId, support_only: true as const }
}

export const DERMOSCOPY_DISCLAIMER = 'Tarama desteği, tanı değildir. Doktor onayı gerekir.'

// ──────────────────────────────────────────────────────────────────────────────
// DERM-EXCEPTIONAL-01 — dermoskopi çalışma sayfaları. Hekim ölçütleri işaretler, motor toplar.
// Çıktı asla tanı değildir: "uzman değerlendirmesi / biyopsi kararı hekimin". Algoritma adları ve
// ölçüt başlıkları kamuya açık literatürdendir; kitap metni kopyalanmaz (Bolognia rol atfı).
// ──────────────────────────────────────────────────────────────────────────────

export type DermoskopiAlgoritma = 'uc_nokta' | 'yedi_nokta' | 'cash'

export const DERMOSKOPI_ALGORITMA_ADI: Record<DermoskopiAlgoritma, string> = {
  uc_nokta: '3 nokta kontrol listesi',
  yedi_nokta: '7 nokta kontrol listesi',
  cash: 'CASH',
}

export type DermoskopiOlcut = {
  kod: string
  ad: string
  puan: number
  /** hekime kısa hatırlatma */
  ipucu?: string
}

/** 3 nokta: her ölçüt 1 puan, toplam 0–3. */
export const UC_NOKTA_OLCUTLERI: DermoskopiOlcut[] = [
  { kod: 'asimetri', ad: 'Yapı / renk asimetrisi', puan: 1, ipucu: 'İki eksende asimetri' },
  { kod: 'atipik_ag', ad: 'Atipik pigment ağı', puan: 1, ipucu: 'Düzensiz kalınlaşmış çizgiler' },
  { kod: 'mavi_beyaz', ad: 'Mavi-beyaz yapı', puan: 1, ipucu: 'Peçe veya regresyon alanı' },
]

/** 7 nokta: 3 majör (2 puan), 4 minör (1 puan); toplam 0–10. */
export const YEDI_NOKTA_OLCUTLERI: DermoskopiOlcut[] = [
  { kod: 'atipik_ag', ad: 'Atipik pigment ağı (majör)', puan: 2 },
  { kod: 'mavi_beyaz_pece', ad: 'Mavi-beyaz peçe (majör)', puan: 2 },
  { kod: 'atipik_damar', ad: 'Atipik damar yapısı (majör)', puan: 2 },
  { kod: 'duzensiz_cizgilenme', ad: 'Düzensiz çizgilenme (minör)', puan: 1 },
  { kod: 'duzensiz_nokta_globul', ad: 'Düzensiz nokta / globüller (minör)', puan: 1 },
  { kod: 'duzensiz_leke', ad: 'Düzensiz pigment lekesi (minör)', puan: 1 },
  { kod: 'regresyon', ad: 'Regresyon yapıları (minör)', puan: 1 },
]

/** CASH: dört bileşen, hekim 0–3 (simetri 0–2) arası puanlar; toplam 0–11. */
export const CASH_BILESENLERI: Array<{ kod: keyof Cash; ad: string; max: number; ipucu: string }> = [
  { kod: 'color', ad: 'Renk sayısı (Color)', max: 3, ipucu: '1–2 renk düşük, ≥3 renk yüksek' },
  { kod: 'architecture', ad: 'Mimari düzensizlik (Architecture)', max: 3, ipucu: 'Düzenli → belirgin düzensiz' },
  { kod: 'symmetry', ad: 'Simetri (Symmetry)', max: 2, ipucu: 'İki eksende simetrik → asimetrik' },
  { kod: 'homogeneity', ad: 'Homojenlik / yapı çeşitliliği (Homogeneity)', max: 3, ipucu: 'Homojen → çok sayıda farklı yapı' },
]

export type DermoskopiSonuc = {
  algoritma: DermoskopiAlgoritma
  ad: string
  toplam: number
  maksimum: number
  /** eşiği geçti mi — "uzman değerlendirmesi önerilir", tanı değil */
  esikUstu: boolean
  esikMetni: string
  isaretli: string[]
  disclaimer: string
  /** her zaman true — biyopsi/eksizyon kararı hekimin */
  hekimKarari: true
}

function isaretliAdlar(olcutler: DermoskopiOlcut[], isaretler: Record<string, boolean>): string[] {
  return olcutler.filter((o) => isaretler[o.kod]).map((o) => o.ad)
}

export function ucNoktaSkor(isaretler: Record<string, boolean>): DermoskopiSonuc {
  const toplam = UC_NOKTA_OLCUTLERI.reduce((s, o) => s + (isaretler[o.kod] ? o.puan : 0), 0)
  return {
    algoritma: 'uc_nokta',
    ad: DERMOSKOPI_ALGORITMA_ADI.uc_nokta,
    toplam,
    maksimum: 3,
    esikUstu: toplam >= 2,
    esikMetni: toplam >= 2
      ? 'İki veya daha fazla ölçüt işaretli — uzman değerlendirmesi / eksizyonel biyopsi kararı hekimin.'
      : 'Eşiğin altında — klinik izlem ve karşılaştırmalı fotoğraf kararı hekimin.',
    isaretli: isaretliAdlar(UC_NOKTA_OLCUTLERI, isaretler),
    disclaimer: DERMOSCOPY_DISCLAIMER,
    hekimKarari: true,
  }
}

export function yediNoktaSkor(isaretler: Record<string, boolean>): DermoskopiSonuc {
  const toplam = YEDI_NOKTA_OLCUTLERI.reduce((s, o) => s + (isaretler[o.kod] ? o.puan : 0), 0)
  return {
    algoritma: 'yedi_nokta',
    ad: DERMOSKOPI_ALGORITMA_ADI.yedi_nokta,
    toplam,
    maksimum: 10,
    esikUstu: toplam >= 3,
    esikMetni: toplam >= 3
      ? 'Toplam 3 ve üzeri — uzman değerlendirmesi / eksizyonel biyopsi kararı hekimin.'
      : 'Toplam 3’ün altında — izlem ve karşılaştırmalı fotoğraf kararı hekimin.',
    isaretli: isaretliAdlar(YEDI_NOKTA_OLCUTLERI, isaretler),
    disclaimer: DERMOSCOPY_DISCLAIMER,
    hekimKarari: true,
  }
}

export function cashSkor(c: Partial<Cash>): DermoskopiSonuc {
  const clamp = (n: number, max: number) => Math.min(max, Math.max(0, Math.round(Number(n) || 0)))
  const toplam = CASH_BILESENLERI.reduce((s, b) => s + clamp(Number(c[b.kod] ?? 0), b.max), 0)
  return {
    algoritma: 'cash',
    ad: DERMOSKOPI_ALGORITMA_ADI.cash,
    toplam,
    maksimum: CASH_BILESENLERI.reduce((s, b) => s + b.max, 0),
    esikUstu: toplam >= 8,
    esikMetni: toplam >= 8
      ? 'Yüksek toplam — uzman değerlendirmesi / eksizyonel biyopsi kararı hekimin.'
      : 'Düşük–orta toplam — izlem kararı hekimin.',
    isaretli: CASH_BILESENLERI.filter((b) => clamp(Number(c[b.kod] ?? 0), b.max) > 0).map((b) => `${b.ad}: ${clamp(Number(c[b.kod] ?? 0), b.max)}`),
    disclaimer: DERMOSCOPY_DISCLAIMER,
    hekimKarari: true,
  }
}

/** Fitzpatrick kaydı — dermoskopi / fototerapi / lazer kararlarında anlamlı; boşsa hekime hatırlatılır. */
export function fitzpatrickGerekli(baglam: 'dermoskopi' | 'fototerapi' | 'lazer' | 'genel'): boolean {
  return baglam !== 'genel'
}

/** Trikoskopi not alanları — saç ünitesinde fotoğrafa bağlı yapılandırılmış not. */
export const TRIKOSKOPI_ALANLARI: Array<{ kod: string; ad: string; ipucu: string }> = [
  { kod: 'sari_nokta', ad: 'Sarı noktalar', ipucu: 'Foliküler açıklıkta sarı nokta varlığı' },
  { kod: 'siyah_nokta', ad: 'Siyah noktalar', ipucu: 'Kırık kıl uçları' },
  { kod: 'unlem_kil', ad: 'Ünlem işareti kılları', ipucu: 'Proksimalde incelmiş kıllar' },
  { kod: 'kisa_distrofik', ad: 'Kısa distrofik kıllar', ipucu: 'Aktivite göstergesi (hekim değerlendirmesi)' },
  { kod: 'cesitlilik', ad: 'Kıl kalınlığı çeşitliliği', ipucu: 'Anizotrikoz — androgenetik alopesi ipucu' },
  { kod: 'peripilar', ad: 'Peripiler işaret', ipucu: 'Foliküler çevre bulgusu' },
  { kod: 'foliküler_kayip', ad: 'Foliküler açıklık kaybı', ipucu: 'Skatrisyel alopesi ipucu — tanı hekimin' },
]
