/**
 * GOZ-CHAPTER — Göz Hastalıkları live chapter (registry wrapper). Clinic engines, prompts lock, UI and imaging live in
 * specialties/goz-hastaliklari; live truth = goz_* tables (migration 048). TR yasal/dernek kaynakları önce
 * (SUT 4.2.33 birincil metinle doğrulandı; TEMD 2026 retinopati taraması; SB görme taraması), uluslararası derinlik ikincil.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'
import { GOZ_MANIFEST } from '../../specialties/goz-hastaliklari/manifest'
import { GOZ_GORUNTU_DISCLAIMER } from '../../specialties/goz-hastaliklari/imaging/dualSign'

export const GOZ_PROFILE: SpecialtyProfile = {
  key: 'goz-hastaliklari',
  etiket: 'Göz Hastalıkları',
  resmiUnvan: 'Göz Hastalıkları',
  pediatrikBaglam: 'asla',

  // Bilateral VA + GİB first-class (ateş-first standing rule keeps baseline order in front).
  olcumler: [
    ...BASELINE_OLCUMLER,
    { anahtar: 'gormeKeskinligiSag', etiket: 'Görme Keskinliği (Sağ)', birim: '' },
    { anahtar: 'gormeKeskinligiSol', etiket: 'Görme Keskinliği (Sol)', birim: '' },
    { anahtar: 'gozIciBasinciSag', etiket: 'Göz İçi Basıncı (Sağ)', birim: 'mmHg' },
    { anahtar: 'gozIciBasinciSol', etiket: 'Göz İçi Basıncı (Sol)', birim: 'mmHg' },
  ],

  hesaplayicilar: [
    { id: 'va-logmar', ad: 'VA ayrıştırma: ondalık/Snellen → logMAR, ETDRS harf farkı (PS/EH/IH sayısal değil)', kaynak: 'logMAR = −log10(ondalık); 0,1 logMAR = 5 harf', motor: 'specialties/goz-hastaliklari/engines/va', deterministik: true },
    { id: 'glokom-dongu', ad: 'Glokom: GİB trend × hekim hedefi, GA/OCT gecikme görevi (titrasyon yok)', kaynak: 'TOD Glokom birimi (hekim teyit); EGS 5. baskı 2020', motor: 'specialties/goz-hastaliklari/engines/glokom', deterministik: true },
    { id: 'dr-takvim', ad: 'DR tarama + evreye göre kontrol penceresi (TEMD ↔ ICO iki sütun)', kaynak: 'TEMD DM Kılavuzu 2026 §13.2.1; ICO DR 2017 Tablo 3a', motor: 'specialties/goz-hastaliklari/engines/dr', deterministik: true },
    { id: 'anti-vegf-sut', ad: 'Anti-VEGF yükleme takvimi + SGK kapıları + SUT yanıt sınıfı', kaynak: 'SUT 4.2.33 (RG-23/5/2026 dahil, birincil metin 2026-09-17)', motor: 'specialties/goz-hastaliklari/engines/antiVegf', deterministik: true },
    { id: 'goz-acil', ad: 'Acil kırmızı bayrak kapısı (kimyasal yanık, ani görme kaybı, dekolman, açı kapanması, penetran travma)', kaynak: 'TOD hasta bilgilendirme + TOD Primer Açı Kapanması; TEMD Tablo 13.1', motor: 'specialties/goz-hastaliklari/engines/acil', deterministik: true },
  ],

  sekmeler: [{ id: 'goz', etiket: 'Göz', bilesen: 'GozHome', sira: 15 }],

  goruntu: {
    modaliteler: ['oct', 'fundus', 'foto'],
    zamanCizgisi: true,
    ayseSinir: `${GOZ_GORUNTU_DISCLAIMER} OCT/fundus/ön segment görüntüsünde evre veya tanı koymazsın; gözlem taslağı yazarsın, uzman onaylar.`,
  },

  belgeler: [
    ...BASELINE_BELGELER,
    { id: 'anti-vegf-rapor', ad: 'Anti-VEGF / implant SGK rapor taslağı (SUT 4.2.33)', format: 'rapor' },
    { id: 'katarakt-bilgi', ad: 'Katarakt / GİL işlem öncesi bilgi notu', format: 'rapor' },
  ],

  ekKaynaklar: GOZ_MANIFEST.books.map((b) => `${b.title} (${b.role}, ${b.year})`),

  promptNotlari: [
    'Tam kilit specialties/goz-hastaliklari/prompts (GOZ-PROMPTS-LOCK).',
    'VA/GİB yalnız hekimin kaydettiği sayı; OD = sağ, OS = sol — karıştırma.',
    'DR evresi / glokom tanısı / hedef GİB yalnız hekim girişi; sohbetten evre üretme.',
  ],

  specialistReview: [
    { konu: 'TOD birim kılavuzları (üye erişimli)', neden: 'Retina/Glokom/Pediatrik birim dokümanları okunamadı; glokom aralıkları EGS 5 (birincil PDF) hekim-düzenlenebilir ön ayar, pediatrik/ROP aralıkları hekim girişi. TOD metni gelince TR sütunu eklenecek.' },
    { konu: 'TEMD "minimal / ileri evre" ↔ ICDR eşlemesi', neden: 'TEMD evre tablosu vermez; hafif NPDR = minimal, orta+ veya DMÖ = ileri evre varsayımı hekimle teyit edilmeli.' },
    { konu: 'SUT EK-3/G GİL listesi', neden: 'Monofokal/torik/multifokal ödeme kalemleri doğrulanamadı — rapor kontrol maddesi "hekim/idare teyit eder".' },
    { konu: 'SB görme taraması sevk kesme değerleri', neden: 'Genelge yaş noktaları ikincil özetten; Lea/Snellen sevk eşikleri doğrulanamadığı için gömülmedi.' },
    { konu: 'ICD-10 öneri kodları (H35.3, H36.0, H34.8, H44.2, H25.9)', neden: 'Rapor taslağında öneri; Medula girişinde hekim doğrular.' },
  ],

  portal: [{
    id: 'gozlerim', nav: [{ key: 'gozlerim', label: 'Gözlerim', path: '/gozlerim' }], bundleKeys: ['goz'], eligibility: 'doctor_specialty',
    copyHints: ['Görme keskinliği / göz içi basıncı yalnız klinikte kaydedilen sayı olarak; yorum yok.', 'Damla ve enjeksiyon tarihleri yalnız hekimin girdiği; doz uydurulmaz.', 'Ani görme kaybı / ağrı / ışık çakması → 112 veya muayenehane, portal mesajı değil.'],
    views: ['GozlerimView'], derinlik: 'Strong',
  }],

  // GOZ-EXCEPTIONAL-01: ürün Strong, sentetik smoke yeşil — MD saha onayı (GOZ-MD-BETA) gelmeden uzman-dogrulandi YAZILMAZ.
  olgunluk: 'beta-hazir',
}
