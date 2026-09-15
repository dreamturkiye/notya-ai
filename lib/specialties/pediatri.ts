/**
 * NOTYA-REGISTRY-01 — Pediatri chapter. Everything the specialty adds on top of the baseline,
 * declared once. Nothing here changes behaviour yet (wiring happens module by module so that
 * Dr. Gökhan's live use is never broken by the migration). Maturity: specialist-validated —
 * built with a practising pediatrician (Dr. Gökhan Mamur) over 2026-09-10 → 09-14.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const PEDIATRI_PROFILE: SpecialtyProfile = {
  key: 'pediatri',
  etiket: 'Pediatri (Çocuk Sağlığı)',
  resmiUnvan: 'Çocuk Sağlığı ve Hastalıkları',

  // Ateş first (standing rule 2026-09-14), baş çevresi only for children.
  olcumler: [
    ...BASELINE_OLCUMLER,
    { anahtar: 'basCevresi', etiket: 'Baş Çevresi', birim: 'cm', kosul: 'pediatrik' },
  ],

  hesaplayicilar: [
    {
      id: 'neyzi-buyume', ad: 'Büyüme persentilleri (Neyzi 2015 LMS)',
      kaynak: 'Neyzi O ve ark., Türk çocukları büyüme referansları, 2015',
      motor: 'lib/clinical/buyumeEgrisi', deterministik: true, yasAraligiAy: [0, 216],
    },
    {
      id: 'mchat-rf', ad: 'M-CHAT-R/F otizm tarama',
      kaynak: 'Robins, Fein, Barton 2009 — resmi Türkçe çeviri, mchatscreen.com',
      motor: 'lib/clinical/mchatR', deterministik: true, yasAraligiAy: [16, 30],
    },
    {
      id: 'gidr-gelisim', ad: 'Gelişim taraması (GİDR)',
      kaynak: 'T.C. Sağlık Bakanlığı, Bebek ve Çocuk İzlem Protokolleri, Akış Şeması 11a',
      motor: 'lib/clinical/gelisimTaramasi', deterministik: true, yasAraligiAy: [1, 24],
    },
  ],

  sekmeler: [
    { id: 'buyume-egrileri', etiket: 'Büyüme Eğrileri', bilesen: 'HastaBuyumeEgrileri', sira: 3 },
    { id: 'mchat', etiket: 'M-CHAT-R/F', bilesen: 'HastaMchat', sira: 9 },
    { id: 'gelisim-taramasi', etiket: 'Gelişim Taraması', bilesen: 'HastaGelisimTaramasi', sira: 10 },
  ],

  goruntu: {
    modaliteler: ['xray', 'us', 'foto'],
    zamanCizgisi: false,
    ayseSinir: 'Görüntü değerlendirmen yalnız ön görüş ve dikkat çekilecek noktalardır; tanı koymazsın, nihai yorum hekimindir.',
  },

  belgeler: BASELINE_BELGELER,

  ekKaynaklar: [
    'T.C. Sağlık Bakanlığı Bebek ve Çocuk İzlem Protokolleri (GİDR dahil)',
    'Ulusal Aşı Takvimi (SB) — lib/asi/ulusalAsiTakvimi',
    'Hasta Hakları Yönetmeliği md.15 (veli özeti ifadesi)',
  ],

  promptNotlari: [
    'Büyüme/VKİ persentilini KENDİN hesaplama, WHO referansı verme — Neyzi motoru gösteriyor.',
    'Doktor açıkça söylemediyse persentile dayalı tanı (ör. obezite) ekleme.',
    'Yaşamsal bulgular sırası: Ateş, Tansiyon, Nabız, Solunum, SpO₂, Kilo, Boy, Baş çevresi.',
  ],

  specialistReview: [
    { konu: 'SGK branş kodları', neden: 'Yalnız 5 branş doğrulandı, 25 eksik — Medula P3 için gerekli.' },
    { konu: 'M-CHAT-R/F İzlem (Follow-Up) görüşmesi', neden: 'Orta risk (3-7) resmi araçta sevkten önce izlem gerektirir; henüz uygulanmadı.' },
    { konu: 'GİDR 25-36 ay', neden: 'Kaynak belgede standardizasyon tamamlanmamış; itemli sunulmuyor.' },
  ],

  olgunluk: 'uzman-dogrulandi',
}
