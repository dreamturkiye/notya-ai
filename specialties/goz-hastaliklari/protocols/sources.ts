/**
 * GOZ-CHAPTER — kaynak hiyerarşisi (TR önce). Rol / kimlik / yıl yazılır; kitap veya kılavuz metni gömülmez.
 * `dogrulama`: 'birincil' = birincil metin okunup ilgili madde doğrulandı (URL + tarih kayıtlı);
 * 'ikincil' = uluslararası derinlik, çakışmada TR kaynağı kazanır; 'hekim' = bu repoda doğrulanamadı, hekim teyit eder.
 */
export type GozRef =
  | 'SUT_4233' | 'SUT_4211' | 'SUT_EK3G' | 'SUT_244I'
  | 'TOD' | 'TEMD_DM' | 'SB_COCUK_IZLEM'
  | 'ICDR_2003' | 'ICO_DR_2017' | 'AAO_PPP_DR' | 'EGS_5' | 'AAO_PPP_PED'
  | 'KANSKI' | 'VAUGHAN' | 'AAO_BCSC'

export interface GozKaynak { ref: GozRef; ad: string; rol: 'tr-yasal' | 'tr-dernek' | 'uluslararasi' | 'ders-kitabi'; dogrulama: 'birincil' | 'ikincil' | 'hekim'; not?: string }

export const GOZ_KAYNAKLAR: Record<GozRef, GozKaynak> = {
  SUT_4233: { ref: 'SUT_4233', ad: 'SGK Sağlık Uygulama Tebliği 4.2.33 — Göz hastalıklarında ilaç kullanım ilkeleri (RG-23/5/2026-33262 değişikliği dahil)', rol: 'tr-yasal', dogrulama: 'birincil', not: 'mevzuat.gov.tr SUT birleştirilmiş metin, 2026-09-17 okundu' },
  SUT_4211: { ref: 'SUT_4211', ad: 'SUT 4.2.11 — Glokom ilaçları (göz uzmanı başlar; uzman raporuyla diğer hekimler yazar)', rol: 'tr-yasal', dogrulama: 'birincil' },
  SUT_EK3G: { ref: 'SUT_EK3G', ad: 'SUT EK-3/G — Göz Sağlığı ve Hastalıkları branşı tıbbi malzeme listesi (GİL kodları)', rol: 'tr-yasal', dogrulama: 'hekim', not: 'Liste içeriği (monofokal/torik/multifokal ödeme) bu repoda doğrulanamadı — hekim/idare teyit eder' },
  SUT_244I: { ref: 'SUT_244I', ad: 'SUT 2.4.4.I — FAKO planlama bildirimi (SGK sistemi kurulana kadar uygulanmaz)', rol: 'tr-yasal', dogrulama: 'birincil' },
  TOD: { ref: 'TOD', ad: 'Türk Oftalmoloji Derneği — birim (Retina-Vitreus, Glokom, Kornea, Pediatrik Oftalmoloji ve Şaşılık) önerileri', rol: 'tr-dernek', dogrulama: 'hekim', not: 'Birim dokümanlarının güncel sürümü hekim tarafından teyit edilir' },
  TEMD_DM: { ref: 'TEMD_DM', ad: 'TEMD Diabetes Mellitus ve Komplikasyonlarının Tanı, Tedavi ve İzlem Kılavuzu', rol: 'tr-dernek', dogrulama: 'ikincil' },
  SB_COCUK_IZLEM: { ref: 'SB_COCUK_IZLEM', ad: 'T.C. SB Bebek, Çocuk, Ergen İzlem Protokolleri — göz muayenesi / görme taraması', rol: 'tr-yasal', dogrulama: 'ikincil' },
  ICDR_2003: { ref: 'ICDR_2003', ad: 'Uluslararası Klinik Diyabetik Retinopati ve DMÖ Şiddet Ölçeği (Wilkinson ve ark., Ophthalmology 2003)', rol: 'uluslararasi', dogrulama: 'ikincil', not: 'Sınıf adları; evre hekim girer' },
  ICO_DR_2017: { ref: 'ICO_DR_2017', ad: 'ICO Guidelines for Diabetic Eye Care (2017 güncelleme)', rol: 'uluslararasi', dogrulama: 'ikincil' },
  AAO_PPP_DR: { ref: 'AAO_PPP_DR', ad: 'AAO Preferred Practice Pattern — Diabetic Retinopathy', rol: 'uluslararasi', dogrulama: 'ikincil' },
  EGS_5: { ref: 'EGS_5', ad: 'European Glaucoma Society Terminology and Guidelines for Glaucoma, 5. baskı (2020)', rol: 'uluslararasi', dogrulama: 'birincil', not: 'Birincil PDF okundu 2026-09-18: II.1.4.2.7 (s.84), FC V (s.98), II.3.3 (s.128) — GA sıklığı ve izlem aralıkları; TOD birim metni doğrulanana dek hekim-düzenlenebilir ön ayar' },
  AAO_PPP_PED: { ref: 'AAO_PPP_PED', ad: 'AAO PPP — Amblyopia / Pediatric Eye Evaluations', rol: 'uluslararasi', dogrulama: 'ikincil' },
  KANSKI: { ref: 'KANSKI', ad: "Kanski's Clinical Ophthalmology — ders kitabı derinliği", rol: 'ders-kitabi', dogrulama: 'ikincil' },
  VAUGHAN: { ref: 'VAUGHAN', ad: 'Vaughan & Asbury General Ophthalmology — ders kitabı derinliği', rol: 'ders-kitabi', dogrulama: 'ikincil' },
  AAO_BCSC: { ref: 'AAO_BCSC', ad: 'AAO Basic and Clinical Science Course — ders kitabı derinliği', rol: 'ders-kitabi', dogrulama: 'ikincil' },
}

export type Dipnot = { ref: GozRef; not: string }

/** TR önce sıralama (çakışmada TR kazanır). */
export const KAYNAK_SIRASI: GozRef[] = ['SUT_4233', 'SUT_4211', 'SUT_244I', 'SUT_EK3G', 'TOD', 'TEMD_DM', 'SB_COCUK_IZLEM', 'ICDR_2003', 'ICO_DR_2017', 'AAO_PPP_DR', 'EGS_5', 'AAO_PPP_PED', 'KANSKI', 'VAUGHAN', 'AAO_BCSC']
