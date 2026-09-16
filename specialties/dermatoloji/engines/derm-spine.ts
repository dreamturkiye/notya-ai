/**
 * NOTYA-DERM-02 — Dermatoloji eksik paket (audit fix). Pure rules; AI drafts, hekim kilitler.
 * Adds on top of clinic-fit: ABCDE + melanom acil kuralı, işlem paketi (biyopsi + küçük cerrahi) with onam/işlem notu/yara bakımı,
 * biyolojik başlama lab kapısı (TB/HBV from approved labs), izotretinoin cross-specialty task, pediatrik şablonlar, kozmetik onam stubs.
 */
export type Abcde = { asimetri: boolean; sinir: boolean; renk: boolean; cap6mm: boolean; evrim: boolean }
export type LezyonDegerlendirme = { abcdePuan: number; melanomSuphesi: boolean; acil: boolean; oneri: string[]; not: string }
export function lezyonDegerlendir(a: Abcde, dermoskopUyari: boolean, cirkinOrdekYavrusu: boolean, boyutMm: number | null): LezyonDegerlendirme {
  const puan = [a.asimetri, a.sinir, a.renk, a.cap6mm || (boyutMm != null && boyutMm >= 6), a.evrim].filter(Boolean).length
  const melanomSuphesi = puan >= 3 || a.evrim && puan >= 2 || dermoskopUyari || cirkinOrdekVarMi(cirkinOrdekYavrusu)
  const oneri: string[] = []
  if (melanomSuphesi) { oneri.push('Melanom şüphesi: eksizyonel biyopsi (2 mm sınır) planı + dermatoonkoloji/patoloji — hekim kararı'); oneri.push('Tıraş (shave) biyopsi melanom şüphesinde önerilmez') }
  else if (puan >= 1) oneri.push('Dermoskopik takip: 3 ay sonra aynı lezyon_id ile foto')
  else oneri.push('Rutin takip; yıllık tam vücut muayenesi')
  return { abcdePuan: puan, melanomSuphesi, acil: melanomSuphesi, oneri, not: 'ABCDE bir tarama aracıdır; tanı histopatoloji ile — asistan tanı koymaz.' }
}
function cirkinOrdekVarMi(x: boolean) { return x }

export const RESMI_TANI_SECENEKLERI = ['Melanositik nevüs', 'Seboreik keratoz', 'Aktinik keratoz', 'BCC şüphesi', 'SCC şüphesi', 'Melanom şüphesi', 'Dermatofibrom', 'Hemanjiom', 'Siğil (verruka)', 'Diğer'] as const

// ---------- İşlem paketi ----------
export type IslemTuru = 'punch' | 'shave' | 'eksizyon' | 'kriyo' | 'koter' | 'tirnak_avulsiyon' | 'sigil' | 'kuretaj'
export const ISLEM_SABLONLARI: Record<IslemTuru, { ad: string; onamKodu: string; notAlanlari: string[]; yaraBakimi: string[]; patolojiGerekir: boolean; sutur: boolean; kontrolGun: number }> = {
  punch: { ad: 'Punch biyopsi', onamKodu: 'derm_biyopsi', notAlanlari: ['anestezi', 'punch_mm', 'sutur', 'hemostaz', 'numune_etiketi'], yaraBakimi: ['24 saat kuru tut', 'Günde 1 antibiyotikli pomad', 'Sütür alımı 7–14 gün (bölgeye göre)'], patolojiGerekir: true, sutur: true, kontrolGun: 10 },
  shave: { ad: 'Shave (tıraş) biyopsi', onamKodu: 'derm_biyopsi', notAlanlari: ['anestezi', 'derinlik', 'hemostaz', 'numune_etiketi'], yaraBakimi: ['Vazelin + pansuman', 'Kabuk düşene kadar koparma'], patolojiGerekir: true, sutur: false, kontrolGun: 14 },
  eksizyon: { ad: 'Eksizyonel biyopsi', onamKodu: 'derm_eksizyon', notAlanlari: ['anestezi', 'sinir_mm', 'derinlik', 'sutur', 'yonlendirme_isareti', 'numune_etiketi'], yaraBakimi: ['48 saat pansuman', 'Sütür alımı 7–14 gün', 'Skar bakımı'], patolojiGerekir: true, sutur: true, kontrolGun: 10 },
  kriyo: { ad: 'Kriyoterapi', onamKodu: 'derm_kucuk_cerrahi', notAlanlari: ['sure_sn', 'dongu', 'lezyon_sayisi'], yaraBakimi: ['Bül oluşabilir; patlatma', 'Kabuk 1–2 haftada düşer'], patolojiGerekir: false, sutur: false, kontrolGun: 21 },
  koter: { ad: 'Elektrokoter', onamKodu: 'derm_kucuk_cerrahi', notAlanlari: ['anestezi', 'ayar', 'lezyon_sayisi'], yaraBakimi: ['Antibiyotikli pomad', 'Güneşten koru'], patolojiGerekir: false, sutur: false, kontrolGun: 14 },
  tirnak_avulsiyon: { ad: 'Tırnak avülsiyonu', onamKodu: 'derm_kucuk_cerrahi', notAlanlari: ['blok_anestezi', 'kismi_tam', 'matriks_islemi'], yaraBakimi: ['Yüksekte tut 48 saat', 'Günlük pansuman', 'Ağrı kesici (hekim)'], patolojiGerekir: false, sutur: false, kontrolGun: 7 },
  sigil: { ad: 'Siğil tedavisi', onamKodu: 'derm_kucuk_cerrahi', notAlanlari: ['yontem', 'lezyon_sayisi'], yaraBakimi: ['Tekrar seans gerekebilir (2–3 hf)'], patolojiGerekir: false, sutur: false, kontrolGun: 21 },
  kuretaj: { ad: 'Küretaj', onamKodu: 'derm_kucuk_cerrahi', notAlanlari: ['anestezi', 'lezyon_sayisi', 'hemostaz'], yaraBakimi: ['Pansuman 48 saat'], patolojiGerekir: false, sutur: false, kontrolGun: 14 },
}
export function islemGorevleri(tur: IslemTuru, islemTarihi: string): { kod: string; ad: string; due: string }[] {
  const t = ISLEM_SABLONLARI[tur]; const [y, m, d] = islemTarihi.split('-').map(Number); const gun = (g: number) => new Date(Date.UTC(y, m - 1, d + g)).toISOString().slice(0, 10)
  const out = [{ kod: `yara_${tur}`, ad: `Yara bakımı kontrolü — ${t.ad}`, due: gun(t.kontrolGun) }]
  if (t.sutur) out.push({ kod: `sutur_${tur}`, ad: 'Sütür alımı', due: gun(10) })
  if (t.patolojiGerekir) out.push({ kod: `pat_${tur}`, ad: 'Patoloji sonucu bekleniyor → Belgeler › Asistana raporla → aynı lezyona bağla', due: gun(10) })
  return out
}

// ---------- Onam şablonları (derm) ----------
export const DERM_ONAMLAR = [
  { kod: 'derm_biyopsi', ad: 'Deri Biyopsisi (Punch / Shave) Onamı', maddeler: ['Lokal anestezi ile küçük bir deri örneği alınır; patolojiye gönderilir.', 'Sonuç süresi ve olası ek işlem anlatıldı.'], riskler: ['Kanama, enfeksiyon', 'Skar / pigment değişikliği', 'Yetersiz örnek → tekrar'] },
  { kod: 'derm_eksizyon', ad: 'Eksizyonel Biyopsi / Küçük Cerrahi Eksizyon Onamı', maddeler: ['Lezyon cerrahi sınırla çıkarılır; sütürle kapatılır.', 'Patoloji sonucuna göre geniş eksizyon gerekebilir.'], riskler: ['Kanama, enfeksiyon, yara açılması', 'Skar, keloid', 'Sinir/his kaybı (nadir)'] },
  { kod: 'derm_kucuk_cerrahi', ad: 'Küçük Dermatolojik İşlem Onamı (kriyo / koter / tırnak / siğil / küretaj)', maddeler: ['İşlem türü, seans sayısı ve iyileşme süresi anlatıldı.'], riskler: ['Bül, kabuk, geçici ağrı', 'Hipo/hiperpigmentasyon', 'Nüks'] },
  { kod: 'derm_izotretinoin', ad: 'İzotretinoin Tedavisi ve Gebelikten Korunma Onamı', maddeler: ['Teratojen: tedavi öncesi, sırasında ve bitiminden 1 ay sonrasına kadar gebelik olmamalıdır.', 'Aylık β-hCG ve çift korunma yöntemi anlatıldı.', 'Kan bağışı yapılmaz; lipid ve karaciğer izlemi.'], riskler: ['Kuruluk, dudak çatlağı', 'Lipid/karaciğer yükselmesi', 'Duygudurum değişikliği'] },
  { kod: 'derm_biyolojik', ad: 'Biyolojik Tedavi Başlama Onamı', maddeler: ['TB ve hepatit taraması yapıldı; enfeksiyon riski anlatıldı.', 'Canlı aşı yapılmaz; aşı takvimi güncellendi.'], riskler: ['Enfeksiyon, TB reaktivasyonu', 'Enjeksiyon yeri reaksiyonu'] },
  { kod: 'derm_kozmetik_botoks', ad: 'Botulinum Toksin Onamı (kozmetik)', maddeler: ['Etki 2–4 ayda geçer; tıbbi tanı değildir.'], riskler: ['Asimetri, pitozis (geçici)', 'Morluk'] },
  { kod: 'derm_kozmetik_dolgu', ad: 'Dolgu Onamı (kozmetik)', maddeler: ['Hyalüronik asit; hyalüronidaz ile geri alınabilir.'], riskler: ['Vasküler oklüzyon (nadir, acil)', 'Nodül, asimetri'] },
  { kod: 'derm_kozmetik_lazer', ad: 'Lazer / IPL Onamı (kozmetik)', maddeler: ['Cilt tipi ve güneş öyküsü değerlendirildi; seans sayısı anlatıldı.'], riskler: ['Pigment değişikliği', 'Yanık (nadir)'] },
] as const

// ---------- Biyolojik başlama lab kapısı ----------
export type LabDurum = { key: string; deger: number | null; metin: string | null; tarih: string | null }
export function biyolojikKapisi(labs: LabDurum[], bugun: string): { hazir: boolean; eksik: string[]; uyari: string[] } {
  const bul = (k: string) => labs.find((l) => l.key === k)
  const eskiMi = (t: string | null) => !t || (new Date(bugun).getTime() - new Date(t).getTime()) / 864e5 > 365
  const eksik: string[] = [], uyari: string[] = []
  const igra = bul('IGRA'), hbs = bul('HBsAg'), hbc = bul('AntiHBc'), hcv = bul('AntiHCV'), hiv = bul('HIV')
  if (!igra || eskiMi(igra.tarih)) eksik.push('IGRA (Quantiferon) / PPD — son 12 ay'); else if (/pozitif|positive|\+/i.test(igra.metin || '')) uyari.push('IGRA pozitif: latent TB profilaksisi (göğüs/enfeksiyon) biyolojik öncesi')
  if (!hbs) eksik.push('HBsAg'); else if (/pozitif|positive|\+/i.test(hbs.metin || '')) uyari.push('HBsAg pozitif: hepatoloji görüşü + antiviral profilaksi')
  if (!hbc) eksik.push('Anti-HBc total'); else if (/pozitif|positive|\+/i.test(hbc.metin || '')) uyari.push('Anti-HBc pozitif: HBV DNA + reaktivasyon izlemi')
  if (!hcv) eksik.push('Anti-HCV')
  if (!hiv) eksik.push('HIV')
  if (!bul('Hb') || !bul('ALT')) eksik.push('Hemogram + ALT/AST')
  if (!labs.some((l) => l.key === 'CXR')) uyari.push('Akciğer grafisi: Belgeler › Asistana raporla (TB bulgusu) — hekim onayı')
  return { hazir: eksik.length === 0, eksik, uyari }
}

// ---------- İzotretinoin kadın hasta kapısı ----------
export function izotretinoinKapisi(kadin: boolean, bhcgTarih: string | null, kontrasepsiyonOnamId: string | null, bugun: string): { baslanabilir: boolean; eksik: string[]; aylikDue: string } {
  const eksik: string[] = []
  if (kadin) {
    if (!bhcgTarih || (new Date(bugun).getTime() - new Date(bhcgTarih).getTime()) / 864e5 > 30) eksik.push('Son 30 gün içinde negatif β-hCG belgesi (Lab)')
    if (!kontrasepsiyonOnamId) eksik.push('Gebelikten korunma onamı (derm_izotretinoin)')
  }
  const [y, m, d] = bugun.split('-').map(Number)
  return { baslanabilir: eksik.length === 0, eksik, aylikDue: new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10) }
}

// ---------- Pediatrik derm şablonları ----------
export const PEDIATRIK_SABLONLAR = {
  atopik: { ad: 'Atopik dermatit', maddeler: ['Nemlendirici günde 2×', 'Topikal steroid basamak (hekim)', 'Tetikleyici (yün, ter, sabun)', 'SCORAD/EASI takip'], gorev: 'Atopik kontrol 4–6 hf' },
  hemanjiom: { ad: 'İnfantil hemanjiom', maddeler: ['Foto serisi aynı lezyon_id', 'Yüksek riskli yerleşim (periorbital, hava yolu, segmental) → propranolol değerlendirmesi (hekim)', 'Ülserasyon uyarısı'], gorev: 'Hemanjiom foto kontrolü 4 hf' },
  pisik: { ad: 'Bez dermatiti (pişik)', maddeler: ['Bariyer krem, sık bez değişimi', 'Kandida süperenfeksiyonu (uydu lezyon) → antifungal (hekim)'], gorev: 'Pişik kontrol 2 hf' },
} as const
