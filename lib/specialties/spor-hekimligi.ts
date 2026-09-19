/**
 * SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Spor Hekimliği registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN muayenehane / poliklinik. Takım kadrosu HIS, doping panelleri
 * (çekirdek ürün) ve tanı auto-lock bu bölümün birincil ürünü DEĞİLDİR.
 *
 * RTP basamağı / sakatlık şiddet bandı KARAR DESTEĞİDİR; tanı hekimdedir.
 * Ortopedi / FTR araç gridlerine sızmaz.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const SPOR_HEKIMLIGI_PROFILE: SpecialtyProfile = {
  key: 'spor-hekimligi',
  etiket: 'Spor Hekimliği',
  resmiUnvan: 'Spor Hekimliği',
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'rtp',
      ad: 'RTP (return-to-play) basamak 0–5 (karar desteği, tanı değil)',
      kaynak: 'Türkiye Spor Hekimliği Derneği / RTP basamak çerçevesi',
      motor: 'specialties/spor-hekimligi/engines/rtp',
      deterministik: true,
    },
    {
      id: 'sakatlik',
      ad: 'Sakatlık günlüğü + yüklenme uyarısı (karar desteği, tanı değil)',
      kaynak: 'TOTBİD + Spor Hekimliği ortak yaklaşım; yük oranı karar desteği',
      motor: 'specialties/spor-hekimligi/engines/sakatlik',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'spor-hekimligi', etiket: 'Spor Hekimliği', bilesen: 'SporHekimligiHome', sira: 14 }],
  goruntu: null,
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/spor-hekimligi/engines/spor.ts REF_ACIKLAMA (TSHD, SB, TOTBİD, RTP, SGK/SUT, TİTCK)'],
  promptNotlari: ['Tam kilit specialties/spor-hekimligi/prompts (SPOR-PROMPTS-LOCK): uydurma doz yok, tanı hekim kilidinde, konküzyon/göğüs/senkop → 112.'],
  specialistReview: [
    { konu: 'RTP basamak etiketleri ve kontrol aralıkları', neden: 'Branş protokolü ve spor dalına göre değişir; hekim doğrular.' },
    { konu: 'Yüklenme oranı eşikleri', neden: 'Acute:chronic eşikler spor dalına göre değişir; karar desteğidir.' },
    { konu: 'Acil triyaj bayrakları (konküzyon, efor göğüs, senkop)', neden: 'Acil sevk eşiği klinik bağlam gerektirir.' },
  ],

  portal: [{
    id: 'sporum',
    nav: [{ key: 'sporum', label: 'Sporum', path: '/sporum' }],
    bundleKeys: ['spor'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Sporum: hekimin belirlediği kontrol tarihi ve antrenmana dönüş planı hatırlatmaları — tanı, doz, doping yok.',
      'RTP basamağı hasta dilinde "antrenmana dönüş planı aşaması" olarak; klinik skor yorumu yok.',
      'Baş darbesi sonrası kusma/bilinç kaybı, egzersiz göğüs ağrısı veya bayılmada portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['SporumView'],
    derinlik: 'Strong',
  }],

  olgunluk: 'beta-hazir',
}
