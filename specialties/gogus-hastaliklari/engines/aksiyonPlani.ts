/**
 * GOGUS-EXCEPTIONAL-01 — Astım / KOAH yazılı aksiyon planı taslağı. SAF fonksiyon.
 *
 * Hasta-güvenli, renkli bölge (yeşil / sarı / kırmızı) dilinde hatırlatma üretir.
 * YASAK: mcg, puff sayısı, etken madde dozu, tanı kilidi. İlaçlar yalnız SINIF düzeyinde
 * hekimin yazdığı metinden gelir; motor doz uydurmaz.
 */
import type { Dipnot } from './gogus'
import type { GoldGrup } from './catMmrc'

export type AksiyonHedef = 'astim' | 'koah'

export interface AksiyonPlaniGirdi {
  hedef: AksiyonHedef
  /** Hekimin yazdığı idame sınıfı (örn. "ICS-LABA idame") — doz yok */
  idameSinifi?: string | null
  /** Hekimin yazdığı kurtarıcı sınıfı */
  kurtariciSinifi?: string | null
  /** Astım 4 soru kontrolü */
  astimKontrol?: { gunduzSemptom: boolean; geceUyanma: boolean; kurtariciIhtiyac: boolean; aktiviteKisit: boolean } | null
  goldGrup?: GoldGrup | null
  /** Hekimin belirlediği kontrol tarihi (ISO) */
  kontrolIso?: string | null
  bugun: string
}

export interface AksiyonPlaniSonuc {
  baslik: string
  yesil: string[]
  sari: string[]
  kirmizi: string[]
  genel: string[]
  ozetNot: string
  dipnotlar: Dipnot[]
}

const ASTIM_KONTROL_AD = { iyi: 'iyi kontrol', kismen: 'kısmen kontrol', kontrolsuz: 'kontrolsüz' } as const

export function astimKontrolDuzeyi(k: NonNullable<AksiyonPlaniGirdi['astimKontrol']>): keyof typeof ASTIM_KONTROL_AD {
  const n = Object.values(k).filter(Boolean).length
  return n === 0 ? 'iyi' : n <= 2 ? 'kismen' : 'kontrolsuz'
}

export function aksiyonPlaniOlustur(g: AksiyonPlaniGirdi): AksiyonPlaniSonuc {
  const dip: Dipnot[] = [
    { ref: 'GINA', not: 'Yazılı aksiyon planı: yeşil/sarı/kırmızı bölgeler; doz ve basamak hekim yazar' },
    { ref: 'GOLD', not: 'KOAH alevlenme eylem planı: erken tanı ve hekim iletişimi; antibiyotik/steroid kararı hekimindir' },
    { ref: 'TTD', not: 'Hasta eğitimi ve inhaler tekniği aksiyon planının parçasıdır' },
  ]
  const idame = (g.idameSinifi || '').trim() || 'Hekiminizin yazdığı idame tedavi'
  const kurtarici = (g.kurtariciSinifi || '').trim() || 'Hekiminizin yazdığı kurtarıcı tedavi'

  if (g.hedef === 'astim') {
    const duzey = g.astimKontrol ? ASTIM_KONTROL_AD[astimKontrolDuzeyi(g.astimKontrol)] : null
    return {
      baslik: 'Astım aksiyon planı (taslak — doz hekimindir)',
      yesil: [
        'Gündüz şikâyet yok veya çok hafif; gece uyanma yok; günlük işler normal.',
        `İdame: ${idame} — doz ve cihazı hekiminizin yazdığı şekilde kullanın.`,
        'İnhaler tekniğinizi her kontrolde gözden geçirin.',
      ],
      sari: [
        'Gündüz şikâyet artışı, gece uyanma veya kurtarıcı ihtiyacı artışı.',
        `Kurtarıcı: ${kurtarici} — hekiminizin tarif ettiği şekilde; doz uydurmayın.`,
        '48 saat içinde düzelme yoksa muayenehanenizi arayın.',
      ],
      kirmizi: [
        'Konuşurken nefes darlığı, dudak/tırnak morarması, kurtarıcıya yanıt yok.',
        'Portal mesajı beklemeyin: 112’yi arayın veya en yakın acile gidin.',
      ],
      genel: [
        duzey ? `Bu vizitte kontrol düzeyi (hekim değerlendirmesi): ${duzey}.` : 'Kontrol düzeyi bu vizitte işaretlenmedi.',
        g.kontrolIso ? `Sonraki kontrol tarihi: ${g.kontrolIso}.` : 'Kontrol tarihi hekim tarafından belirlenecek.',
        'Tetikleyicilerden (sigara dumanı, bilinen alerjenler) uzak durun.',
      ],
      ozetNot: 'Bu plan bilgilendirme taslağıdır. İlaç dozu, basamak ve tanı hekimindir; Notya doz üretmez.',
      dipnotlar: dip,
    }
  }

  // KOAH
  return {
    baslik: 'KOAH alevlenme aksiyon planı (taslak — doz hekimindir)',
    yesil: [
      'Alışılmış nefes darlığı ve balgam düzeyinde; günlük aktiviteler sürüyor.',
      `İdame: ${idame} — hekiminizin yazdığı şekilde.`,
      g.goldGrup ? `GOLD grubu (karar desteği): ${g.goldGrup}.` : 'GOLD grubu bu vizitte hesaplanmadı.',
    ],
    sari: [
      'Nefes darlığı veya balgam artışı / renk değişimi; ateş veya halsizlik eşlik edebilir.',
      'Erken dönemde muayenehanenizi arayın; antibiyotik veya steroid kararı hekiminindir.',
      `Kurtarıcı bronkodilatör: ${kurtarici} — doz uydurmayın.`,
    ],
    kirmizi: [
      'Konuşamayacak kadar nefes darlığı, bilinç değişikliği, dudak morarması, masif kanlı balgam.',
      'Portal mesajı beklemeyin: 112’yi arayın veya en yakın acile gidin.',
    ],
    genel: [
      'Sigara bırakma desteği: ALO 171 (hekim yönlendirmesi).',
      g.kontrolIso ? `Sonraki kontrol tarihi: ${g.kontrolIso}.` : 'Kontrol tarihi hekim tarafından belirlenecek.',
      'Yıllık grip / pnömokok aşıları hekim önerisine göre planlanır.',
    ],
    ozetNot: 'Bu plan bilgilendirme taslağıdır. Tanı, ilaç sınıfı ve doz hekimindir; Notya doz üretmez.',
    dipnotlar: dip,
  }
}

/** Hasta yüzüne taşınabilecek, tanı/doz içermeyen kısa satırlar. */
export function aksiyonPlaniHastaSatirlari(s: AksiyonPlaniSonuc): string[] {
  return [
    ...s.yesil.map((x) => `İyi dönem: ${x}`),
    ...s.sari.map((x) => `Dikkat: ${x}`),
    ...s.kirmizi.map((x) => `Acil: ${x}`),
  ]
}
