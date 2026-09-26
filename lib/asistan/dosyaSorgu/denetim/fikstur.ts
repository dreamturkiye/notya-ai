/**
 * NOTYA-AYSE-STANDART-01 — denetim fikstürleri: dört SENTETİK pediatri dosyası (düz nesne, veritabanı yok).
 *
 * Gerçek hasta, gerçek hesap, production verisi YOK (hasta-izolasyon SKILL — veri kuralı). Adlar QA biçimindedir.
 * Her dosya standarttaki bir tuzağı taşır; altın beklentiler ../denetim.test.ts içindedir:
 *   (a) 26 aylık: notta "bugün Hepatit B 2. dozunu yapacağız" ama aşı satırı yok; ferritin istendi, sonuç yok;
 *       10 gün önceki amoksisilin (aktif SAYILMAMALI); kilo p53 → p10 (3 vizit); M-CHAT planlandı, yapılmadı;
 *       3 otit atağı üç farklı yazımla.
 *   (b) 8 aylık sağlıklı: aşılar takvimde, bir açık kontrol.
 *   (c) 4 yaş: penisilin alerjisi + amoksisilin reçetesi (güvenlik); demir eksikliği düzelmiş (Hb 10,2 → 12,1).
 *   (d) açık çelişki: notta "aşıları tam", aşı tablosunda KKK yok.
 */
import type { HamDosya } from '@/lib/doktor/dosyaOlaylari'
import { takvimDozlari, type TakvimDonemi } from '@/specialties/pediatri/engines/asiPlan'
import { ayEkle, gunEkle } from '@/specialties/pediatri/engines/girdi'

/** Denetimin "bugün"ü — fikstürler bu tarihe göre yazıldı. */
export const DENETIM_BUGUN = '2026-09-26'

/** Takvimdeki her dozu önerilen tarihinde "uygulandı" yazar; `haric` = ['hepb:2', …] atlanır. */
function takvimSatirlari(onek: string, dogumIso: string, donem: TakvimDonemi, haric: string[] = []) {
  return takvimDozlari({ donem })
    .map((d) => ({ d, tarih: d.onerilenGun != null ? gunEkle(dogumIso, d.onerilenGun) : ayEkle(dogumIso, d.onerilenAy) }))
    .filter(({ d, tarih }) => tarih <= DENETIM_BUGUN && !haric.includes(`${d.seri}:${d.no}`))
    .map(({ d, tarih }, i) => ({ id: `${onek}-asi-${i}`, asi_adi: d.urun, doz_no: d.no, uygulama_tarihi: tarih }))
}

// ─── (a) 26 aylık erkek ─────────────────────────────────────────────────────────────────────────────────
export const FIKSTUR_A: HamDosya = {
  hasta: { ad: 'QA Çocuk A DENETIM-A', dogumIso: '2024-07-20', cinsiyet: 'Erkek' },
  brans: 'Pediatri',
  intake: { alerjiVarMi: 'Hayır', gebelikHaftasiPed: '39', dogumKilosuPed: '3350 g' },
  intakeTarih: '2025-11-10',
  vizitler: [
    {
      id: 'a-v1', tarih: '2025-11-10T10:00:00Z',
      subjektif: 'Sağ kulak ağrısı ve ateş, 2 gündür.',
      objektif: 'Sağ TM hiperemik ve bombe.',
      tani: 'Akut otitis media (H66.9)',
      plan: 'Amoksisilin 10 gün. 10 gün sonra kontrol.',
      ilaclar: [{ ad: 'Amoksisilin 250 mg/5 ml süspansiyon', doz: '5 ml', kullanim: '2x1, 10 gün' }],
    },
    {
      id: 'a-v2', tarih: '2026-03-20T10:00:00Z',
      subjektif: 'Kulağını çekiştiriyor, huzursuz, ateş 38,5.',
      objektif: 'Sol timpanik membran hiperemik.',
      tani: 'Orta kulak enfeksiyonu',
      plan: 'Parasetamol gerekirse. 1 hafta sonra kontrol.',
      vitaller: { kilo: '12', boy: '85' },
    },
    {
      id: 'a-v3', tarih: '2026-06-20T10:00:00Z',
      subjektif: 'Kontrol. İştahsız, yemek yemiyor.',
      objektif: 'Kulak zarları doğal.',
      tani: 'İştahsızlık',
      plan: 'Ferritin ve hemogram istendi.',
      vitaller: { kilo: '11,6', boy: '87' },
    },
    {
      id: 'a-v4', tarih: '2026-09-16T10:00:00Z',
      subjektif: 'Sağ kulak ağrısı, 1 gündür.',
      objektif: 'Sağ TM bombe, hiperemik.',
      tani: 'AOM',
      plan: 'Amoksisilin 10 gün başlandı. Bugün Hepatit B 2. dozunu yapacağız. M-CHAT planlandı. 10 gün sonra kontrol.',
      ilaclar: [{ ad: 'Amoksisilin 400 mg/5 ml süspansiyon', doz: '5 ml', kullanim: '2x1, 10 gün' }],
      vitaller: { kilo: '11,2', boy: '88' },
    },
  ],
  // 5'li karma dönemi (2025 öncesi doğum): Hep B 0-1-6 ayrı. 2. ve 3. doz kayıtta yok.
  asilar: takvimSatirlari('a', '2024-07-20', 'besli', ['hepb:2', 'hepb:3']),
  ilaclar: [
    { id: 'a-i1', ilac_adi: 'Amoksisilin 400 mg/5 ml süspansiyon', etken_madde: 'amoksisilin', doz: '5 ml', kullanim_sikli: '2x1, 10 gün', baslangic_tarihi: '2026-09-16', aktif: true },
  ],
  lablar: [
    { id: 'a-l1', canonical_key: 'Hb', kanonik_deger: 11.2, kanonik_birim: 'g/dL', numune_tarihi: '2026-06-25', ref_low: 11.5, ref_high: 15.5 },
    { id: 'a-l2', canonical_key: 'MCV', kanonik_deger: 72, kanonik_birim: 'fL', numune_tarihi: '2026-06-25', ref_low: 70, ref_high: 86 },
  ],
}

// ─── (b) 8 aylık sağlıklı kız ───────────────────────────────────────────────────────────────────────────
export const FIKSTUR_B: HamDosya = {
  hasta: { ad: 'QA Bebek B DENETIM-B', dogumIso: '2026-01-26', cinsiyet: 'Kadın' },
  brans: 'Pediatri',
  intake: { alerjiVarMi: 'Hayır', gebelikHaftasiPed: '40' },
  intakeTarih: '2026-03-26',
  vizitler: [
    { id: 'b-v1', tarih: '2026-05-26T09:00:00Z', subjektif: 'Sağlam çocuk izlemi, 4. ay.', objektif: 'Fizik muayene doğal.', tani: 'Sağlam çocuk izlemi', plan: 'Aşıları yapıldı. D vitamini devam.', vitaller: { kilo: '6,5' } },
    { id: 'b-v2', tarih: '2026-07-26T09:00:00Z', subjektif: 'Sağlam çocuk izlemi, 6. ay.', objektif: 'Fizik muayene doğal.', tani: 'Sağlam çocuk izlemi', plan: 'Aşıları yapıldı. Demir profilaksisi başlandı.', vitaller: { kilo: '7,8' } },
    { id: 'b-v3', tarih: '2026-09-10T09:00:00Z', subjektif: 'Sağlam çocuk izlemi. Oturuyor, heceliyor.', objektif: 'Fizik muayene doğal.', tani: 'Sağlam çocuk izlemi', plan: '2 hafta sonra kontrol.', vitaller: { kilo: '8,3' } },
  ],
  asilar: takvimSatirlari('b', '2026-01-26', 'altili'),
  ilaclar: [
    { id: 'b-i1', ilac_adi: 'D vitamini damla', doz: '400 IU', kullanim_sikli: '1x1', baslangic_tarihi: '2026-02-10', aktif: true },
    { id: 'b-i2', ilac_adi: 'Demir damla', doz: '1 mg/kg/gün', kullanim_sikli: '1x1', baslangic_tarihi: '2026-07-26', aktif: true },
  ],
  gidr: [{ id: 'b-g1', created_at: '2026-09-10T09:10:00Z', ay_yas: 7, yas_basamak_etiket: '6-8 ay', sevk_onerisi: false }],
}

// ─── (c) 4 yaş erkek — penisilin alerjisi + amoksisilin; düzelmiş demir eksikliği ───────────────────────
export const FIKSTUR_C: HamDosya = {
  hasta: { ad: 'QA Çocuk C DENETIM-C', dogumIso: '2022-06-15', cinsiyet: 'Erkek' },
  brans: 'Pediatri',
  intake: { alerjiVarMi: 'Evet', alerjiAciklama: 'Penisilin' },
  intakeTarih: '2025-01-05',
  vizitler: [
    {
      id: 'c-v1', tarih: '2026-02-10T11:00:00Z',
      subjektif: 'Solukluk, iştahsızlık.', objektif: 'Konjonktivalar soluk.', tani: 'Demir eksikliği anemisi',
      plan: 'Demir tedavisi başlandı, 3 ay. Hemogram ve ferritin 3 ay sonra kontrol edilecek.', vitaller: { kilo: '15,8', boy: '101' },
    },
    {
      id: 'c-v2', tarih: '2026-06-05T11:00:00Z',
      subjektif: 'Kontrol. İştahı açıldı.', objektif: 'Doğal.', tani: 'Demir eksikliği anemisi — düzelme', plan: 'Demir tedavisi tamamlandı.', vitaller: { kilo: '16,3', boy: '103' },
    },
    {
      id: 'c-v3', tarih: '2026-09-20T11:00:00Z',
      subjektif: 'Boğaz ağrısı, ateş.', objektif: 'Tonsiller hiperemik, eksudalı.', tani: 'Akut tonsillofarenjit',
      plan: 'Amoksisilin 10 gün reçete edildi.', ilaclar: [{ ad: 'Amoksisilin 250 mg/5 ml süspansiyon', doz: '7,5 ml', kullanim: '2x1, 10 gün' }], vitaller: { kilo: '16,5', boy: '105' },
    },
  ],
  asilar: takvimSatirlari('c', '2022-06-15', 'besli'),
  ilaclar: [
    { id: 'c-i1', ilac_adi: 'Demir (II) sülfat damla', etken_madde: 'demir', doz: '3 mg/kg/gün', kullanim_sikli: '1x1, 3 ay', baslangic_tarihi: '2026-02-10', aktif: true },
    { id: 'c-i2', ilac_adi: 'Amoksisilin 250 mg/5 ml süspansiyon', etken_madde: 'amoksisilin', doz: '7,5 ml', kullanim_sikli: '2x1, 10 gün', baslangic_tarihi: '2026-09-20', aktif: true },
  ],
  lablar: [
    { id: 'c-l1', canonical_key: 'Hb', kanonik_deger: 10.2, kanonik_birim: 'g/dL', numune_tarihi: '2026-02-08', ref_low: 11.5, ref_high: 15.5 },
    { id: 'c-l2', canonical_key: 'MCV', kanonik_deger: 68, kanonik_birim: 'fL', numune_tarihi: '2026-02-08', ref_low: 75, ref_high: 87 },
    { id: 'c-l3', canonical_key: 'Ferritin', kanonik_deger: 6, kanonik_birim: 'ng/mL', numune_tarihi: '2026-02-08', ref_low: 12, ref_high: 150 },
    { id: 'c-l4', canonical_key: 'Hb', kanonik_deger: 12.1, kanonik_birim: 'g/dL', numune_tarihi: '2026-06-05', ref_low: 11.5, ref_high: 15.5 },
    { id: 'c-l5', canonical_key: 'MCV', kanonik_deger: 76, kanonik_birim: 'fL', numune_tarihi: '2026-06-05', ref_low: 75, ref_high: 87 },
    { id: 'c-l6', canonical_key: 'Ferritin', kanonik_deger: 28, kanonik_birim: 'ng/mL', numune_tarihi: '2026-06-05', ref_low: 12, ref_high: 150 },
  ],
}

// ─── (d) açık çelişki: "aşıları tam" ama KKK yok ────────────────────────────────────────────────────────
export const FIKSTUR_D: HamDosya = {
  hasta: { ad: 'QA Çocuk D DENETIM-D', dogumIso: '2023-03-01', cinsiyet: 'Kız' },
  brans: 'Pediatri',
  intake: { alerjiVarMi: 'Hayır' },
  intakeTarih: '2025-06-10',
  vizitler: [
    { id: 'd-v1', tarih: '2025-06-10T10:00:00Z', subjektif: 'Aşıları tam, sağlam çocuk kontrolü.', objektif: 'Doğal.', tani: 'Sağlam çocuk izlemi', plan: '6 ay sonra kontrol.', vitaller: { kilo: '12,5', boy: '89' } },
    { id: 'd-v2', tarih: '2026-09-01T10:00:00Z', subjektif: 'Burun akıntısı, öksürük.', objektif: 'Farenks hafif hiperemik.', tani: 'ÜSYE', plan: 'Semptomatik tedavi.', vitaller: { kilo: '14,6', boy: '98' } },
  ],
  asilar: takvimSatirlari('d', '2023-03-01', 'besli', ['kkk:1']),
}

export const FIKSTURLER = { a: FIKSTUR_A, b: FIKSTUR_B, c: FIKSTUR_C, d: FIKSTUR_D } as const
