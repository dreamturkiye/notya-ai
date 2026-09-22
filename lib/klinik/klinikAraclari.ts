/**
 * Klinik Araçlar — Doktor Araçlar'dan ayrı katalog.
 * Klinik kendi kategorisidir; /doktor-tools gridine girmez.
 */
import type { KlinikYeniSlug } from '@/lib/specialties/klinikDikey'
import { klinikSlugCoz, muttefikAracGizliMi, muttefikMeslekMi } from '@/lib/specialties/klinikDikey'

export type KlinikArac = {
  circleColor: string
  icon: string
  title: string
  desc: string
  route: string
  dallar: KlinikYeniSlug[]
}

export const KLINIK_ARACLARI: readonly KlinikArac[] = [
  { circleColor: '#2563EB', icon: 'GR', title: 'Donör greft bandı', desc: 'cm² × yoğunluk → greft bandı (karar desteği) — nihai greft uzmanında', route: '/klinik-tools/sac-greft', dallar: ['sac-ekimi'] },
  { circleColor: '#1D4ED8', icon: 'YT', title: 'Yıkama takvimi', desc: 'Ameliyat günü → 1/3/10/14. gün bakım vadeleri', route: '/klinik-tools/sac-takvim', dallar: ['sac-ekimi'] },
  { circleColor: '#1E40AF', icon: 'SK', title: 'Saç ekimi kohort', desc: 'Geciken yıkama · 10/14. gün kontrol · 1-tap hatırlatma', route: '/klinik-tools/sac-kohort', dallar: ['sac-ekimi'] },
  { circleColor: '#9333EA', icon: 'SG', title: 'Onam / soğuma', desc: 'Ayakta Teşhis soğuma kaydı · vasküler acil 112', route: '/klinik-tools/estetik-soguma', dallar: ['medikal-estetik'] },
  { circleColor: '#7E22CE', icon: 'BK', title: 'İşlem bakım takvimi', desc: '1 / 14 / 28. gün kontrol vadeleri', route: '/klinik-tools/estetik-takvim', dallar: ['medikal-estetik'] },
  { circleColor: '#6B21A8', icon: 'EK', title: 'Estetik kohort', desc: 'Soğuma · 14/28. gün kontrol · vasküler bayrak', route: '/klinik-tools/estetik-kohort', dallar: ['medikal-estetik'] },
  { circleColor: '#059669', icon: 'IV', title: 'Sonraki seans vadesi', desc: 'IV / izlem aralığı — karışım ve doz yazılmaz', route: '/klinik-tools/long-vade', dallar: ['longevity'] },
  { circleColor: '#047857', icon: 'LK', title: 'Longevity kohort', desc: 'Geciken seans · IV izlem · 112 bayrağı', route: '/klinik-tools/long-kohort', dallar: ['longevity'] },
  { circleColor: '#0EA5E9', icon: 'IC', title: 'ICF seans özeti', desc: 'Hekim tanı referansı zorunlu · ICF — tanı yok', route: '/klinik-tools/fizyo-icf', dallar: ['fizyoterapi'] },
  { circleColor: '#0284C7', icon: 'SS', title: 'Seans vadesi', desc: 'Sonraki seans hatırlatma — SGK hak iddiası yok', route: '/klinik-tools/fizyo-seans', dallar: ['fizyoterapi'] },
  { circleColor: '#0369A1', icon: 'FK', title: 'Fizyoterapi kohort', desc: 'Geciken seans · tanı referansı', route: '/klinik-tools/fizyo-kohort', dallar: ['fizyoterapi'] },
  { circleColor: '#6366F1', icon: 'SN', title: 'Seans çerçevesi', desc: 'Yaklaşım + ölçek kaydı · kriz 112 — tıbbi tanı yok', route: '/klinik-tools/psikolog-seans', dallar: ['klinik-psikolog'] },
  { circleColor: '#4F46E5', icon: 'PK', title: 'Klinik psikoloji kohort', desc: 'Geciken seans · kriz bayrağı', route: '/klinik-tools/psikolog-kohort', dallar: ['klinik-psikolog'] },
  { circleColor: '#10B981', icon: 'MK', title: 'Makro bandı', desc: 'kcal / protein karar desteği · hekim tanısı', route: '/klinik-tools/diyet-makro', dallar: ['diyetisyen'] },
  { circleColor: '#059669', icon: 'DK', title: 'Diyetisyen kohort', desc: 'Geciken kontrol · tanı referansı', route: '/klinik-tools/diyet-kohort', dallar: ['diyetisyen'] },
  { circleColor: '#8B5CF6', icon: 'GY', title: 'GYA özeti', desc: 'Hekim tanı + GYA odak — Neyzi yok', route: '/klinik-tools/ergo-gya', dallar: ['ergoterapi'] },
  { circleColor: '#7C3AED', icon: 'EG', title: 'Ergoterapi kohort', desc: 'Geciken seans · GYA odak', route: '/klinik-tools/ergo-kohort', dallar: ['ergoterapi'] },
  { circleColor: '#F97316', icon: 'PT', title: 'Eşik kaydı', desc: 'Saf ses ortalaması bandı — işitme kaybı tanısı değil', route: '/klinik-tools/odyo-esik', dallar: ['odyoloji'] },
  { circleColor: '#EA580C', icon: 'OK', title: 'Odyoloji kohort', desc: 'Geciken eşik · ani işitme 112', route: '/klinik-tools/odyo-kohort', dallar: ['odyoloji'] },
]

export function klinikAraciDalaUygun(route: string, uzmanlik: string | null | undefined): boolean {
  if (muttefikMeslekMi(uzmanlik) && muttefikAracGizliMi(route)) return false
  const arac = KLINIK_ARACLARI.find((a) => a.route === route)
  if (!arac) return true
  const dal = klinikSlugCoz(uzmanlik)
  return !!dal && arac.dallar.includes(dal)
}

export function klinikAraclariListesi(uzmanlik: string | null | undefined): KlinikArac[] {
  const dal = klinikSlugCoz(uzmanlik)
  const muttefik = muttefikMeslekMi(uzmanlik) || muttefikMeslekMi(dal)
  return KLINIK_ARACLARI.filter((a) => {
    if (muttefik && muttefikAracGizliMi(a.route)) return false
    return !!dal && a.dallar.includes(dal)
  })
}
