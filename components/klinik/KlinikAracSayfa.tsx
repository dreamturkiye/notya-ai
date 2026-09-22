'use client'
import KlinikAracKabugu from './KlinikAracKabugu'
import KlinikBolumHome from './KlinikBolumHome'
import type { AracVurgu } from '@/lib/doktor/aracUi'

const V: Record<string, AracVurgu> = {
  sac: { ana: '#2563EB', anaMetin: '#EFF6FF', yumusak: '#93C5FD', baslik: '#93C5FD' },
  est: { ana: '#9333EA', anaMetin: '#FAF5FF', yumusak: '#D8B4FE', baslik: '#D8B4FE' },
  long: { ana: '#059669', anaMetin: '#ECFDF5', yumusak: '#6EE7B7', baslik: '#6EE7B7' },
  fiz: { ana: '#0EA5E9', anaMetin: '#F0F9FF', yumusak: '#7DD3FC', baslik: '#7DD3FC' },
  psi: { ana: '#6366F1', anaMetin: '#EEF2FF', yumusak: '#A5B4FC', baslik: '#A5B4FC' },
  diy: { ana: '#10B981', anaMetin: '#ECFDF5', yumusak: '#6EE7B7', baslik: '#6EE7B7' },
  erg: { ana: '#8B5CF6', anaMetin: '#F5F3FF', yumusak: '#C4B5FD', baslik: '#C4B5FD' },
  ody: { ana: '#F97316', anaMetin: '#FFF7ED', yumusak: '#FDBA74', baslik: '#FDBA74' },
}

const META: Record<string, { slug: string; etiket: string; baslik: string; aciklama: string; vurgu: AracVurgu }> = {
  '/doktor-tools/sac-greft': { slug: 'sac-ekimi', etiket: 'Saç Ekimi', baslik: 'Donör greft bandı', aciklama: 'Karar desteği. Nihai greft hekimindir.', vurgu: V.sac },
  '/doktor-tools/sac-takvim': { slug: 'sac-ekimi', etiket: 'Saç Ekimi', baslik: 'Yıkama takvimi', aciklama: '1 / 3 / 10 / 14. gün vadeleri.', vurgu: V.sac },
  '/doktor-tools/sac-kohort': { slug: 'sac-ekimi', etiket: 'Saç Ekimi', baslik: 'Saç ekimi kohort', aciklama: 'Yıkama ve kontrol vadeleri. 1-tap hatırlatma.', vurgu: V.sac },
  '/doktor-tools/estetik-soguma': { slug: 'medikal-estetik', etiket: 'Medikal Estetik', baslik: 'Onam / soğuma', aciklama: 'Ayakta Teşhis kaydı. Doz yok.', vurgu: V.est },
  '/doktor-tools/estetik-takvim': { slug: 'medikal-estetik', etiket: 'Medikal Estetik', baslik: 'İşlem bakım takvimi', aciklama: '1 / 14 / 28. gün.', vurgu: V.est },
  '/doktor-tools/estetik-kohort': { slug: 'medikal-estetik', etiket: 'Medikal Estetik', baslik: 'Estetik kohort', aciklama: 'Soğuma ve kontrol vadeleri.', vurgu: V.est },
  '/doktor-tools/long-vade': { slug: 'longevity', etiket: 'Longevity', baslik: 'Sonraki seans vadesi', aciklama: 'Karışım ve doz yazılmaz.', vurgu: V.long },
  '/doktor-tools/long-kohort': { slug: 'longevity', etiket: 'Longevity', baslik: 'Longevity kohort', aciklama: 'Seans vadesi ve 112 bayrağı.', vurgu: V.long },
  '/doktor-tools/fizyo-icf': { slug: 'fizyoterapi', etiket: 'Fizyoterapi', baslik: 'ICF seans özeti', aciklama: 'Hekim tanısı zorunlu.', vurgu: V.fiz },
  '/doktor-tools/fizyo-seans': { slug: 'fizyoterapi', etiket: 'Fizyoterapi', baslik: 'Seans vadesi', aciklama: 'SGK hak iddiası yok.', vurgu: V.fiz },
  '/doktor-tools/fizyo-kohort': { slug: 'fizyoterapi', etiket: 'Fizyoterapi', baslik: 'Fizyoterapi kohort', aciklama: 'Geciken seans ve tanı referansı.', vurgu: V.fiz },
  '/doktor-tools/psikolog-seans': { slug: 'klinik-psikolog', etiket: 'Klinik Psikoloji', baslik: 'Seans çerçevesi', aciklama: 'Tıbbi tanı ve reçete yok.', vurgu: V.psi },
  '/doktor-tools/psikolog-kohort': { slug: 'klinik-psikolog', etiket: 'Klinik Psikoloji', baslik: 'Klinik psikoloji kohort', aciklama: 'Seans ve kriz bayrağı.', vurgu: V.psi },
  '/doktor-tools/diyet-makro': { slug: 'diyetisyen', etiket: 'Diyetisyen', baslik: 'Makro bandı', aciklama: 'Takviye dozu yok.', vurgu: V.diy },
  '/doktor-tools/diyet-kohort': { slug: 'diyetisyen', etiket: 'Diyetisyen', baslik: 'Diyetisyen kohort', aciklama: 'Kontrol vadesi ve tanı referansı.', vurgu: V.diy },
  '/doktor-tools/ergo-gya': { slug: 'ergoterapi', etiket: 'Ergoterapi', baslik: 'GYA özeti', aciklama: 'Neyzi / tanı yok.', vurgu: V.erg },
  '/doktor-tools/ergo-kohort': { slug: 'ergoterapi', etiket: 'Ergoterapi', baslik: 'Ergoterapi kohort', aciklama: 'Seans ve GYA odak.', vurgu: V.erg },
  '/doktor-tools/odyo-esik': { slug: 'odyoloji', etiket: 'Odyoloji', baslik: 'Eşik kaydı', aciklama: 'İşitme kaybı tanısı değil.', vurgu: V.ody },
  '/doktor-tools/odyo-kohort': { slug: 'odyoloji', etiket: 'Odyoloji', baslik: 'Odyoloji kohort', aciklama: 'Eşik, cihaz ve ani işitme.', vurgu: V.ody },
}

export default function KlinikAracSayfa({ route }: { route: string }) {
  const m = META[route]
  if (!m) return null
  return (
    <KlinikAracKabugu route={route} baslik={m.baslik} aciklama={m.aciklama} etiket={m.etiket} vurgu={m.vurgu}>
      <KlinikBolumHome slug={m.slug} />
    </KlinikAracKabugu>
  )
}
