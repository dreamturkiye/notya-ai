/**
 * NOTYA-CHECKPOINT-KARSILASTIRMA-01 — the corpus charts, copied from today's main
 * (lib/asistan/dosyaSorgu/denetim/fikstur.ts, the "Gökhan şikâyet korpusu" half). At this commit that file holds only
 * the four audit fixtures and is product-side, so the corpus half lives here as a harness file. Values are unchanged:
 * the same synthetic patients answer the same sentences on both builds.
 */
import type { HamDosya } from '@/lib/doktor/dosyaOlaylari'
import { takvimDozlari } from '@/specialties/pediatri/engines/asiPlan'
import { ayEkle, gunEkle } from '@/specialties/pediatri/engines/girdi'

// ─── Gökhan şikâyet korpusu (NOTYA-GOKHAN-KORPUS-01) ─────────────────────────────────────────────────────
// Rich SYNTHETIC charts for the regression corpus (lib/asistan/tests/gokhanSikayetKorpusu.ts). Modelled on the
// SHAPE of the beta case (a 2-year-old boy with 15 visits), not on its data: every name, date and value below is
// invented. Dates are relative to `bugunIso` so the child is always 25 months old and the appointments are always
// in the future. Written to the in-memory scene by lib/asistan/tests/gokhanKorpusHastalari.ts.

export interface KorpusDosyasi extends HamDosya {
  /** Encrypted on the patient row in the scene (the identity reader's "kart" source). */
  telefon?: string
  /** The complete intake form, identity keys included (kimlikSorusu reads them; the chart reader drops them). */
  form: Record<string, unknown>
  belgeDosyalari: { baslik: string; tarih: string; ozet: string }[]
  goruntuler: { tip: string; bolge: string; tarih: string; yorum: string }[]
}

export const KORPUS_BEBEK_ADI = 'Emircan Karaoğlu'
export const KORPUS_ERISKIN_ADI = 'Nermin Aydoğan'

/** 25 months before `bugunIso`, minus three days. */
export function korpusBebekDogum(bugunIso: string): string {
  return gunEkle(ayEkle(bugunIso, -25), -3)
}

/**
 * Golden values the corpus assertions quote. Kept next to the fixture so a change in one is a change in the other;
 * lib/asistan/gokhanKorpus.test.ts checks every value against the built chart.
 */
export const KORPUS_BEBEK = {
  ad: KORPUS_BEBEK_ADI,
  anneAdi: 'Elif', babaAdi: 'Serdar', veliTelefon: '0532 000 11 22', telefon: '0532 000 11 22',
  dogumYeri: 'İzmir', kanGrubu: '0 Rh+',
  vizitSayisi: 15, asiSatiri: 16,
  /** Well-child visits: age in months → measurements, and where they are stored. */
  saglamCocuk: {
    6: { kilo: 7.9, boy: 67.5, bas: 43.4, yer: 'vitaller' },
    12: { kilo: 9.8, boy: 76, bas: 46.4, yer: 'vitaller' },
    15: { kilo: 10.6, boy: 79, bas: 47.1, yer: 'metin' },
    18: { kilo: 11.3, boy: 82.5, bas: 47.8, yer: 'vitaller' },
    24: { kilo: 12.6, boy: 87.5, bas: 48.9, yer: 'vitaller' },
  },
  sonKilo: 12.8, sonBoy: 87.5, sonBas: 48.9, otitAtes: 39.1,
  aktifIlaclar: ['D vitamini damla', 'Ferro Sanol damla'],
  antibiyotikler: ['Amoksisilin', 'Augmentin'],
  eksikAsi: 'Hepatit A',
  hb: [10.4, 11.9], ferritin: [8, 24], crp: 28,
} as const

export function korpusBebek(bugunIso: string): KorpusDosyasi {
  const dogum = korpusBebekDogum(bugunIso)
  const ay = (n: number, gun = 0) => `${gunEkle(ayEkle(dogum, n), gun)}T09:00:00Z`
  const once = (n: number) => `${gunEkle(bugunIso, -n)}T09:00:00Z`
  const tr = (d: number) => String(d).replace('.', ',')
  const s = KORPUS_BEBEK.saglamCocuk
  const vizitler: HamDosya['vizitler'] = [
    {
      id: 'k-v1', tarih: `${gunEkle(dogum, 5)}T09:00:00Z`,
      subjektif: '5 günlük erkek bebek, rutin sağlam yenidoğan kontrolü için getirildi. Anne sütü alıyor, emmesi iyi.',
      objektif: 'Genel durum iyi, hafif sarılık (yüz). Göbek kordonu kuru. Kalça muayenesi doğal.',
      degerlendirme: 'Sağlam yenidoğan. Fizyolojik sarılık.', tani: 'Sağlam yenidoğan izlemi',
      plan: 'D vitamini damla 400 IU/gün başlandı. Topuk kanı alındı. 1 ay sonra kontrol.',
      ilaclar: [{ ad: 'D vitamini damla', doz: '400 IU', kullanim: '1x1' }],
      vitaller: { kilo: 3.2, boy: 50, basCevresi: 35 },
    },
    {
      id: 'k-v2', tarih: ay(1),
      subjektif: '1 aylık erkek bebek, rutin sağlam çocuk kontrolü. Yalnız anne sütü, gazı var.',
      objektif: 'Fizik muayene doğal. Kırmızı refle alındı.',
      degerlendirme: 'Sağlam çocuk, büyüme uygun.', tani: 'Sağlam çocuk izlemi',
      plan: 'D vitamini devam. Kalça USG istendi. 1 ay sonra kontrol.',
      vitaller: { kilo: 4.3, boy: 54, basCevresi: 37.2 },
    },
    {
      id: 'k-v3', tarih: ay(2),
      subjektif: '2 aylık erkek bebek, rutin sağlam çocuk kontrolü ve aşıları için getirildi.',
      objektif: 'Fizik muayene doğal. Baş kontrolü başlamış, sosyal gülümseme var.',
      degerlendirme: 'Sağlam çocuk.', tani: 'Sağlam çocuk izlemi',
      plan: 'Aşıları uygulandı. D vitamini devam. 2 ay sonra kontrol.',
      vitaller: { kilo: 5.4, boy: 58, basCevresi: 39 },
    },
    {
      id: 'k-v4', tarih: ay(4),
      subjektif: '4 aylık erkek bebek, rutin sağlam çocuk kontrolü. Anne sütü alıyor.',
      objektif: 'Fizik muayene doğal. Baş kontrolü tam, dönmeye çalışıyor.',
      degerlendirme: 'Sağlam çocuk.', tani: 'Sağlam çocuk izlemi',
      plan: 'Aşıları uygulandı. Demir profilaksisi başlandı. 2 ay sonra kontrol.',
      vitaller: { kilo: 6.9, boy: 63.5, basCevresi: 41.5 },
    },
    {
      id: 'k-v5', tarih: ay(6),
      subjektif: '6 aylık erkek bebek, rutin sağlam çocuk kontrolü için getirildi. Ek gıdaya başlanacak. Desteksiz oturmaya başlamış.',
      objektif: 'Fizik muayene doğal. Ön fontanel 2x2 cm, normal bombelikte. Diş yok.',
      degerlendirme: '6 aylık sağlam çocuk, büyüme ve gelişme yaşına uygun.', tani: 'Sağlam çocuk izlemi',
      plan: 'Ek gıdaya geçiş anlatıldı. Aşıları uygulandı. D vitamini ve demir profilaksisi devam. 3 ay sonra kontrol.',
      vitaller: { kilo: s[6].kilo, boy: s[6].boy, basCevresi: s[6].bas },
    },
    {
      id: 'k-v6', tarih: ay(8, 10),
      subjektif: 'Burun akıntısı ve öksürük, 3 gündür. Ateş 38,4. Emmesi azalmış.',
      objektif: 'Farenks hiperemik. Kulak zarları doğal. Akciğer sesleri doğal.',
      degerlendirme: 'Viral üst solunum yolu enfeksiyonu.', tani: 'Akut nazofarenjit', icd: [{ code: 'J00', description_tr: 'Akut nazofarenjit' }],
      plan: 'Semptomatik tedavi, burun lavajı. Parasetamol ateşte. 3 gün içinde düzelmezse kontrol.',
      ilaclar: [{ ad: 'Calpol süspansiyon', doz: '4 ml', kullanim: 'ateşte, 6 saatte bir' }],
      vitaller: { kilo: 8.5, ates: 38.4 },
    },
    {
      id: 'k-v7', tarih: ay(9),
      subjektif: '9 aylık erkek bebek, rutin sağlam çocuk kontrolü. Emekliyor, tutunarak ayağa kalkıyor.',
      objektif: 'Kilo 8,9 kg, boy 72 cm, baş çevresi 45 cm. Fizik muayene doğal. İki alt kesici diş var.',
      degerlendirme: 'Sağlam çocuk.', tani: 'Sağlam çocuk izlemi',
      plan: 'Hemogram istendi. D vitamini devam. 3 ay sonra kontrol.',
    },
    {
      id: 'k-v8', tarih: ay(12),
      subjektif: '12 aylık erkek çocuk, rutin sağlam çocuk kontrolü. Tek başına birkaç adım atıyor, "anne", "baba" diyor.',
      objektif: 'Fizik muayene doğal. Altı diş var.',
      degerlendirme: '12 aylık sağlam çocuk, gelişim basamakları yaşına uygun.', tani: 'Sağlam çocuk izlemi',
      plan: 'Aşıları uygulandı. Demir profilaksisi kesildi. 3 ay sonra kontrol.',
      vitaller: { kilo: s[12].kilo, boy: s[12].boy, basCevresi: s[12].bas },
    },
    {
      id: 'k-v9', tarih: ay(14),
      subjektif: 'Boğaz ağrısı, ateş 39, yutma güçlüğü. 2 gündür.',
      objektif: 'Tonsiller hiperemik, eksüdalı. Servikal lenfadenopati. Kulak zarları doğal.',
      degerlendirme: 'Akut tonsillofarenjit.', tani: 'Akut tonsillofarenjit', icd: [{ code: 'J03.9', description_tr: 'Akut tonsillit' }],
      plan: 'Amoksisilin 7 gün. Parasetamol ateşte. 3 gün sonra kontrol.',
      ilaclar: [{ ad: 'Amoksisilin 250 mg/5 ml süspansiyon', doz: '5 ml', kullanim: '2x1, 7 gün' }],
      vitaller: { kilo: 10.2, ates: 39 },
    },
    {
      id: 'k-v10', tarih: ay(15),
      subjektif: '15 aylık erkek çocuk, rutin sağlam çocuk kontrolü. Yürüyor, 5-6 kelimesi var.',
      objektif: `Kilo ${tr(s[15].kilo)} kg, boy ${tr(s[15].boy)} cm, baş çevresi ${tr(s[15].bas)} cm. Fizik muayene doğal.`,
      degerlendirme: '15 aylık sağlam çocuk.', tani: 'Sağlam çocuk izlemi',
      plan: 'Beslenme önerileri verildi. 3 ay sonra kontrol.',
    },
    {
      id: 'k-v11', tarih: ay(18),
      subjektif: '18 aylık erkek çocuk, rutin sağlam çocuk kontrolü. İki kelimelik cümle kurmaya başlamış, kaşıkla yiyor.',
      objektif: 'Fizik muayene doğal. Yürüyüşü doğal.',
      degerlendirme: '18 aylık sağlam çocuk. M-CHAT-R/F uygulandı: düşük risk.', tani: 'Sağlam çocuk izlemi',
      plan: 'Aşıları uygulandı. 6 ay sonra kontrol.',
      vitaller: { kilo: s[18].kilo, boy: s[18].boy, basCevresi: s[18].bas },
    },
    {
      id: 'k-v12', tarih: ay(20),
      subjektif: 'Solukluk ve iştahsızlık. Günde 600 ml inek sütü içiyor, et tüketimi az.',
      objektif: 'Konjonktivalar soluk. Dalak ele gelmiyor. Üfürüm yok.',
      degerlendirme: 'Beslenmeye bağlı demir eksikliği anemisi.', tani: 'Demir eksikliği anemisi', icd: [{ code: 'D50.9', description_tr: 'Demir eksikliği anemisi' }],
      plan: 'Hemogram ve ferritin istendi. Süt günde 400 ml ile sınırlandı. Demir tedavisi başlandı. 4 ay sonra kontrol.',
      ilaclar: [{ ad: 'Ferro Sanol damla', doz: '3 mg/kg/gün', kullanim: '1x1' }],
      vitaller: { kilo: 11.5, boy: 84 },
    },
    {
      id: 'k-v13', tarih: ay(24),
      subjektif: '24 aylık erkek çocuk, rutin sağlam çocuk kontrolü. Koşuyor, merdiven çıkıyor, 2-3 kelimelik cümle kuruyor. İştahı düzelmiş.',
      objektif: 'Fizik muayene doğal. Solukluk yok.',
      degerlendirme: '24 aylık sağlam çocuk. Demir eksikliği anemisi düzelmekte.', tani: 'Sağlam çocuk izlemi',
      plan: 'Hepatit A 2. doz planlandı. Demir tedavisi 2 ay daha devam. D vitamini devam. 6 ay sonra kontrol.',
      vitaller: { kilo: s[24].kilo, boy: s[24].boy, basCevresi: s[24].bas },
    },
    {
      id: 'k-v14', tarih: once(12),
      subjektif: 'Sağ kulak ağrısı ve ateş, 1 gündür. Gece ağlayarak uyanmış, kulağını çekiştiriyor.',
      objektif: 'Sağ timpanik membran hiperemik ve bombe. Sol doğal. Farenks hafif hiperemik.',
      degerlendirme: 'Sağ akut otitis media.', tani: 'Akut otitis media', icd: [{ code: 'H66.9', description_tr: 'Otitis media' }],
      plan: 'Augmentin 10 gün. İbuprofen ağrı ve ateşte. 10 gün sonra kontrol.',
      ilaclar: [{ ad: 'Augmentin ES 600 mg/5 ml süspansiyon', doz: '4,5 ml', kullanim: '2x1, 10 gün' }, { ad: 'Pedifen şurup', doz: '6 ml', kullanim: 'ateşte, 8 saatte bir' }],
      vitaller: { kilo: 12.7, ates: KORPUS_BEBEK.otitAtes },
    },
    {
      id: 'k-v15', tarih: once(2),
      subjektif: 'Otit kontrolü. Ağrı ve ateş geçmiş, antibiyotiğini bitirmiş.',
      objektif: 'Sağ timpanik membran doğal, efüzyon yok.',
      degerlendirme: 'Akut otitis media iyileşmiş.', tani: 'Otitis media, iyileşmiş',
      plan: 'Tedavi tamamlandı. 1 ay sonra kontrol.',
      vitaller: { kilo: KORPUS_BEBEK.sonKilo },
    },
  ]
  // The national schedule up to today, written as applied on the recommended day — except Hepatit A 2. doz, which
  // the 24-month note only PLANS.
  const asilar = takvimDozlari({ donem: 'besli' })
    .map((d) => ({ d, tarih: d.onerilenGun != null ? gunEkle(dogum, d.onerilenGun) : ayEkle(dogum, d.onerilenAy) }))
    .filter(({ d, tarih }) => tarih <= bugunIso && `${d.seri}:${d.no}` !== 'hepa:2')
    .map(({ d, tarih }, i) => ({ id: `k-asi-${i}`, asi_adi: d.urun, doz_no: d.no, uygulama_tarihi: tarih, kaynak: 'klinik' }))
  const lab = (id: string, key: string, deger: number, birim: string, tarih: string, alt: number | null, ust: number | null) =>
    ({ id, canonical_key: key, kanonik_deger: deger, kanonik_birim: birim, value_text: `${deger} ${birim}`, numune_tarihi: tarih, ref_low: alt, ref_high: ust })
  const t20 = gunEkle(ayEkle(dogum, 20), 2), t24 = ayEkle(dogum, 24), t14 = gunEkle(bugunIso, -12)
  const form = {
    ad: 'Emircan', soyad: 'Karaoğlu', tcKimlik: '10000000146', telefon: KORPUS_BEBEK.telefon, eposta: 'qa-veli@example.test',
    adres: 'QA Mahallesi 1. Sokak No: 1', il: 'İzmir', dogumYeri: KORPUS_BEBEK.dogumYeri,
    anneAdi: KORPUS_BEBEK.anneAdi, babaAdi: KORPUS_BEBEK.babaAdi,
    veliYakinligi: 'anne', veliAd: KORPUS_BEBEK.anneAdi, veliSoyad: 'Karaoğlu', veliTelefon: KORPUS_BEBEK.veliTelefon,
    cinsiyet: 'Erkek', kanGrubu: KORPUS_BEBEK.kanGrubu, alerjiVarMi: 'Hayır', alerjiAciklama: '',
    kronikHastaliklar: [], kullaniyorMu: 'Evet', kullanilanIlaclar: 'D vitamini damla', gecirilmisAmeliyatlar: 'Yok',
    aileOykusu: 'Dedede hipertansiyon', sigara: 'Evde içilmiyor',
    gebelikHaftasiPed: '39', dogumKilosuPed: '3200 g', dogumBoyuPed: '50 cm', dogumSekliPed: 'Normal doğum', dogumSonrasiPed: 'Sorunsuz',
    basvuruNedeniPed: 'Sağlam çocuk izlemi', anneBoyu: '164', babaBoyu: '180',
    emzirmeSuresi: '14 ay', ekGidaBaslangic: '6. ay', uykuDuzeni: 'Gece 11 saat', gelisimBasamaklari: 'Oturma 6. ay, yürüme 12. ay, ilk kelimeler 11. ay',
  }
  return {
    hasta: { ad: KORPUS_BEBEK_ADI, dogumIso: dogum, cinsiyet: 'Erkek' },
    brans: 'Pediatri',
    telefon: KORPUS_BEBEK.telefon,
    form,
    intake: Object.fromEntries(Object.entries(form).filter(([k]) => !/^(tcKimlik|ad|soyad|telefon|eposta|adres|il|veli|anneAdi|babaAdi|dogumYeri)/.test(k))),
    intakeTarih: `${gunEkle(dogum, 5)}T08:30:00Z`,
    vizitler,
    asilar,
    ilaclar: [
      { id: 'k-i1', ilac_adi: 'D vitamini damla', etken_madde: 'kolekalsiferol', doz: '400 IU', kullanim_sikli: '1x1', baslangic_tarihi: gunEkle(dogum, 5), aktif: true },
      { id: 'k-i2', ilac_adi: 'Ferro Sanol damla', etken_madde: 'demir (II) glisin sülfat', doz: '3 mg/kg/gün', kullanim_sikli: '1x1', baslangic_tarihi: t20, aktif: true },
      { id: 'k-i3', ilac_adi: 'Amoksisilin 250 mg/5 ml süspansiyon', etken_madde: 'amoksisilin', doz: '5 ml', kullanim_sikli: '2x1, 7 gün', baslangic_tarihi: ayEkle(dogum, 14), aktif: true },
      { id: 'k-i4', ilac_adi: 'Augmentin ES 600 mg/5 ml süspansiyon', etken_madde: 'amoksisilin-klavulanat', doz: '4,5 ml', kullanim_sikli: '2x1, 10 gün', baslangic_tarihi: t14, aktif: true },
    ],
    lablar: [
      lab('k-l1', 'Hb', KORPUS_BEBEK.hb[0], 'g/dL', t20, 11, 14), lab('k-l2', 'MCV', 69, 'fL', t20, 70, 86), lab('k-l3', 'Ferritin', KORPUS_BEBEK.ferritin[0], 'ng/mL', t20, 12, 150),
      lab('k-l4', 'WBC', 9.1, '10^3/µL', t20, 6, 17), lab('k-l5', 'PLT', 380, '10^3/µL', t20, 150, 450),
      lab('k-l6', 'Hb', KORPUS_BEBEK.hb[1], 'g/dL', t24, 11, 14), lab('k-l7', 'MCV', 75, 'fL', t24, 70, 86), lab('k-l8', 'Ferritin', KORPUS_BEBEK.ferritin[1], 'ng/mL', t24, 12, 150),
      lab('k-l9', 'D vitamini', 34, 'ng/mL', t24, 30, 100), lab('k-l10', 'CRP', KORPUS_BEBEK.crp, 'mg/L', t14, 0, 5),
    ],
    randevular: [
      { id: 'k-r1', baslangic: `${gunEkle(bugunIso, 7)}T10:30:00+03:00`, tur: 'kontrol', durum: 'planli' },
      { id: 'k-r2', baslangic: `${gunEkle(bugunIso, 45)}T11:00:00+03:00`, tur: '30 ay izlem', durum: 'planli' },
    ],
    mchat: [{ id: 'k-m1', created_at: ay(18), risk_seviyesi: 'dusuk', toplam_puan: 1 }],
    belgeler: [{ id: 'k-b1', modality_final: 'usg', hekim_ozet: 'Kalça USG: bilateral Graf tip 1a, normal.', onaylandi_at: ay(1, 12) }],
    belgeDosyalari: [
      { baslik: 'Doğum epikrizi', tarih: `${gunEkle(dogum, 3)}T10:00:00Z`, ozet: 'Doğum epikrizi: 39 hafta, normal doğum, 3200 g. Hepatit B 1. doz doğumda uygulandı. K vitamini yapıldı. İşitme taraması geçti.' },
      { baslik: 'Aşı karnesi fotoğrafı', tarih: ay(18, 1), ozet: 'Aşı karnesi fotoğrafı: 18. ay aşıları işli.' },
      { baslik: 'Hemogram sonucu', tarih: `${t20}T12:00:00Z`, ozet: 'Hemogram: Hb 10,4 g/dL, MCV 69 fL; ferritin 8 ng/mL.' },
    ],
    goruntuler: [{ tip: 'USG', bolge: 'Kalça', tarih: gunEkle(ayEkle(dogum, 1), 12), yorum: 'Bilateral Graf tip 1a, normal.' }],
  }
}

/** Adult chart for the non-paediatric entries: 46-year-old woman, hypertension + type 2 diabetes. */
export const KORPUS_ERISKIN = {
  ad: KORPUS_ERISKIN_ADI, kanGrubu: 'B Rh+', vizitSayisi: 4, sonTansiyon: '132/84',
  aktifIlaclar: ['Ramipril', 'Metformin', 'Atorvastatin'], hba1c: [7.8, 7.1],
} as const

export function korpusEriskin(bugunIso: string): KorpusDosyasi {
  const once = (n: number) => `${gunEkle(bugunIso, -n)}T09:00:00Z`
  const lab = (id: string, key: string, deger: number, birim: string, n: number, alt: number | null, ust: number | null) =>
    ({ id, canonical_key: key, kanonik_deger: deger, kanonik_birim: birim, value_text: `${deger} ${birim}`, numune_tarihi: gunEkle(bugunIso, -n), ref_low: alt, ref_high: ust })
  const form = {
    ad: 'Nermin', soyad: 'Aydoğan', tcKimlik: '10000000078', telefon: '0533 000 22 33', eposta: 'qa-eriskin@example.test',
    adres: 'QA Mahallesi 2. Sokak No: 2', il: 'Ankara', dogumYeri: 'Ankara',
    cinsiyet: 'Kadın', kanGrubu: KORPUS_ERISKIN.kanGrubu, alerjiVarMi: 'Hayır', alerjiAciklama: '',
    kronikHastaliklar: ['Hipertansiyon', 'Tip 2 diyabet'], kullaniyorMu: 'Evet', kullanilanIlaclar: 'Ramipril, Metformin',
    gecirilmisAmeliyatlar: 'Kolesistektomi (2019)', aileOykusu: 'Annede tip 2 diyabet, babada koroner arter hastalığı', sigara: 'İçmiyor', alkol: 'Yok',
  }
  return {
    hasta: { ad: KORPUS_ERISKIN_ADI, dogumIso: gunEkle(ayEkle(bugunIso, -46 * 12), -40), cinsiyet: 'Kadın' },
    brans: 'Dahiliye',
    telefon: '0533 000 22 33',
    form,
    intake: Object.fromEntries(Object.entries(form).filter(([k]) => !/^(tcKimlik|ad|soyad|telefon|eposta|adres|il|dogumYeri)/.test(k))),
    intakeTarih: once(402),
    vizitler: [
      {
        id: 'e-v1', tarih: once(400),
        subjektif: 'Baş ağrısı ve ense ağrısı, 2 haftadır. Evde tansiyonu 160/100 ölçülmüş.',
        objektif: 'Tansiyon 150/95 mmHg, nabız 82/dk. Kalp sesleri doğal. Ödem yok.',
        degerlendirme: 'Evre 1 hipertansiyon.', tani: 'Esansiyel hipertansiyon', icd: [{ code: 'I10', description_tr: 'Esansiyel hipertansiyon' }],
        plan: 'Ramipril 5 mg başlandı. Tuz kısıtlaması. Ev tansiyon takibi. 1 ay sonra kontrol.',
        ilaclar: [{ ad: 'Ramipril 5 mg tablet', doz: '5 mg', kullanim: '1x1' }],
        vitaller: { tansiyon: '150/95', nabiz: 82, kilo: 78, boy: 162 },
      },
      {
        id: 'e-v2', tarih: once(200),
        subjektif: 'Diyabet ve tansiyon kontrolü. Ağız kuruluğu ve sık idrara çıkma tarif ediyor.',
        objektif: 'Tansiyon 138/86 mmHg. Ayak muayenesi doğal.',
        degerlendirme: 'Tip 2 diyabet, glisemik kontrol yetersiz (HbA1c 7,8). Hipertansiyon kontrol altında.', tani: 'Tip 2 diyabet', icd: [{ code: 'E11.9', description_tr: 'Tip 2 diyabet' }],
        plan: 'Metformin 1000 mg günde iki kez. Atorvastatin 20 mg başlandı. HbA1c 3 ay sonra. Göz dibi muayenesi istendi.',
        ilaclar: [{ ad: 'Metformin 1000 mg tablet', doz: '1000 mg', kullanim: '2x1' }, { ad: 'Atorvastatin 20 mg tablet', doz: '20 mg', kullanim: '1x1' }],
        vitaller: { tansiyon: '138/86', nabiz: 78, kilo: 77 },
      },
      {
        id: 'e-v3', tarih: once(60),
        subjektif: 'Boğaz ağrısı ve halsizlik, 3 gündür. Ateş yok.',
        objektif: 'Farenks hiperemik. Akciğer sesleri doğal. Tansiyon 134/84 mmHg.',
        degerlendirme: 'Viral üst solunum yolu enfeksiyonu.', tani: 'Akut farenjit', icd: [{ code: 'J02.9', description_tr: 'Akut farenjit' }],
        plan: 'Semptomatik tedavi. Bol sıvı.',
        vitaller: { tansiyon: '134/84', ates: 36.9 },
      },
      {
        id: 'e-v4', tarih: once(14),
        subjektif: 'Kontrol. Şikayeti yok, ilaçlarını düzenli kullanıyor.',
        objektif: `Tansiyon ${KORPUS_ERISKIN.sonTansiyon} mmHg, nabız 76/dk.`,
        degerlendirme: 'Hipertansiyon ve tip 2 diyabet kontrol altında (HbA1c 7,1).', tani: 'Tip 2 diyabet, hipertansiyon',
        plan: 'Mevcut tedavi devam. 3 ay sonra HbA1c ve lipid paneli ile kontrol.',
        vitaller: { tansiyon: KORPUS_ERISKIN.sonTansiyon, nabiz: 76, kilo: 75.5 },
      },
    ],
    ilaclar: [
      { id: 'e-i1', ilac_adi: 'Ramipril 5 mg tablet', etken_madde: 'ramipril', doz: '5 mg', kullanim_sikli: '1x1', baslangic_tarihi: gunEkle(bugunIso, -400), aktif: true },
      { id: 'e-i2', ilac_adi: 'Metformin 1000 mg tablet', etken_madde: 'metformin', doz: '1000 mg', kullanim_sikli: '2x1', baslangic_tarihi: gunEkle(bugunIso, -200), aktif: true },
      { id: 'e-i3', ilac_adi: 'Atorvastatin 20 mg tablet', etken_madde: 'atorvastatin', doz: '20 mg', kullanim_sikli: '1x1', baslangic_tarihi: gunEkle(bugunIso, -200), aktif: true },
    ],
    lablar: [
      lab('e-l1', 'HbA1c', KORPUS_ERISKIN.hba1c[0], '%', 205, 4, 6), lab('e-l2', 'LDL', 142, 'mg/dL', 205, 0, 130), lab('e-l3', 'Kreatinin', 0.8, 'mg/dL', 205, 0.5, 1.1),
      lab('e-l4', 'HbA1c', KORPUS_ERISKIN.hba1c[1], '%', 16, 4, 6), lab('e-l5', 'LDL', 104, 'mg/dL', 16, 0, 130), lab('e-l6', 'eGFR', 88, 'mL/dk/1,73 m²', 16, 60, null),
    ],
    // The only appointment of TODAY in the corpus panel.
    randevular: [{ id: 'e-r1', baslangic: `${bugunIso}T16:00:00+03:00`, tur: 'kontrol', durum: 'planli' }],
    belgeDosyalari: [{ baslik: 'Göz dibi muayenesi raporu', tarih: once(180), ozet: 'Göz dibi: diyabetik retinopati saptanmadı.' }],
    goruntuler: [{ tip: 'EKG', bolge: 'İstirahat', tarih: gunEkle(bugunIso, -400), yorum: 'Normal sinüs ritmi.' }],
  }
}
