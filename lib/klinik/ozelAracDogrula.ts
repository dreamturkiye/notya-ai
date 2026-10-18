/**
 * Her Özel Branş aracının mutlu yol + ret yolu. Testler bunu çağırır.
 * Portal satırı doz, tanı, greft, dB ve kcal taşımaz.
 */
import { KLINIK_YENI_SLUGS, type KlinikYeniSlug } from '@/lib/specialties/klinikDikey'
import { GUVENLIK_MADDELERI } from '@/specialties/longevity/engines/long'
import { OZEL_ARACLAR, ozelAracCalistir, portalSatirlari, type AracCikti } from '@/lib/klinik/ozelAracCalistir'

const BUGUN = '2026-10-18'
const YASAK = /kcal|mL|ünite|doz|tanı|greft|dB/i

type Vaka = { girdi: Record<string, string>; tur: 'cikti' | 'hata' | 'acil' | 'portal' }

const GUVEN = GUVENLIK_MADDELERI.slice(0, 3).join('|')

const VAKALAR: Record<string, Vaka[]> = {
  '/ozel-branslar/sac-greft': [
    { girdi: { cm2: '20', yogunluk: '40' }, tur: 'cikti' },
    { girdi: { cm2: '0', yogunluk: '40' }, tur: 'hata' },
  ],
  '/ozel-branslar/sac-takvim': [
    { girdi: { ameliyat: '2026-10-01' }, tur: 'portal' },
    { girdi: { ameliyat: '' }, tur: 'hata' },
  ],
  '/ozel-branslar/sac-cizgi': [
    { girdi: { on: 'doğal', temporal: 'kapalı', verteks: 'seyrek' }, tur: 'cikti' },
    { girdi: { on: '', temporal: '' }, tur: 'hata' },
  ],
  '/ozel-branslar/sac-foto': [
    { girdi: { ameliyat: '2026-10-01', riza: '1' }, tur: 'portal' },
    { girdi: { ameliyat: '2026-10-01', riza: '' }, tur: 'hata' },
  ],
  '/ozel-branslar/cerrahi-onam': [
    { girdi: { onam: '2026-10-01', ameliyat: '2026-10-08' }, tur: 'cikti' },
    { girdi: { onam: '', ameliyat: '' }, tur: 'cikti' },
  ],
  '/ozel-branslar/cerrahi-takvim': [
    { girdi: { ameliyat: '2026-10-01' }, tur: 'portal' },
    { girdi: { ameliyat: '' }, tur: 'hata' },
  ],
  '/ozel-branslar/cerrahi-riza': [
    { girdi: { islem: 'Rinoplasti', onam: '1', hasta: '1' }, tur: 'cikti' },
    { girdi: { islem: 'Rinoplasti', onam: '1', hasta: '' }, tur: 'hata' },
  ],
  '/ozel-branslar/cerrahi-emboli': [
    { girdi: { nefes: '1' }, tur: 'acil' },
    { girdi: {}, tur: 'cikti' },
  ],
  '/ozel-branslar/estetik-soguma': [
    { girdi: { onam: '2026-10-01', islem: '2026-10-03' }, tur: 'cikti' },
    { girdi: { onam: '2026-10-08', islem: '2026-10-01' }, tur: 'cikti' },
  ],
  '/ozel-branslar/estetik-takvim': [
    { girdi: { islem: '2026-10-01' }, tur: 'portal' },
    { girdi: { islem: '' }, tur: 'hata' },
  ],
  '/ozel-branslar/estetik-vaskuler': [
    { girdi: { gorme: '1' }, tur: 'acil' },
    { girdi: {}, tur: 'cikti' },
  ],
  '/ozel-branslar/estetik-lot': [
    { girdi: { lot: 'LOT-14', bolge: 'Dudak' }, tur: 'cikti' },
    { girdi: { lot: '2 mL', bolge: 'Dudak' }, tur: 'hata' },
  ],
  '/ozel-branslar/derm-lazer': [
    { girdi: { son: '2026-10-01', aralik: '28' }, tur: 'portal' },
    { girdi: { son: '2026-10-01', aralik: '3' }, tur: 'hata' },
  ],
  '/ozel-branslar/derm-takvim': [
    { girdi: { bas: '2026-10-01' }, tur: 'portal' },
    { girdi: { bas: '' }, tur: 'hata' },
  ],
  '/ozel-branslar/derm-gunes': [
    { girdi: { bas: '2026-10-01', foto: '1' }, tur: 'portal' },
    { girdi: { bas: '2026-10-01', foto: '' }, tur: 'hata' },
  ],
  '/ozel-branslar/derm-acil': [
    { girdi: { kabarcik: '1' }, tur: 'acil' },
    { girdi: {}, tur: 'cikti' },
  ],
  '/ozel-branslar/long-vade': [
    { girdi: { son: '2026-10-01', aralik: '28' }, tur: 'portal' },
    { girdi: { son: '2026-10-01', aralik: '0' }, tur: 'hata' },
  ],
  '/ozel-branslar/long-guvenlik': [
    { girdi: { madde: GUVEN }, tur: 'cikti' },
    { girdi: { madde: GUVENLIK_MADDELERI[0] }, tur: 'hata' },
  ],
  '/ozel-branslar/long-sinif': [
    { girdi: { sinif: 'IV destek (sınıf)' }, tur: 'cikti' },
    { girdi: { sinif: 'NAD 500' }, tur: 'hata' },
  ],
  '/ozel-branslar/long-reaksiyon': [
    { girdi: { nefes: '1' }, tur: 'acil' },
    { girdi: {}, tur: 'cikti' },
  ],
  '/ozel-branslar/fizyo-icf': [
    { girdi: { tani: 'L4 radikülopati', aktivite: 'yürüme', katilim: 'iş' }, tur: 'cikti' },
    { girdi: { tani: '', aktivite: 'yürüme' }, tur: 'hata' },
  ],
  '/ozel-branslar/fizyo-seans': [
    { girdi: { son: '2026-10-01', aralik: '7' }, tur: 'portal' },
    { girdi: { son: '', aralik: '7' }, tur: 'hata' },
  ],
  '/ozel-branslar/fizyo-ev': [
    { girdi: { satir: 'Diz bükme\nTopuk kaydırma', bas: '2026-10-01' }, tur: 'portal' },
    { girdi: { satir: 'enjeksiyon', bas: '2026-10-01' }, tur: 'hata' },
  ],
  '/ozel-branslar/fizyo-bayrak': [
    { girdi: { eyer: '1' }, tur: 'acil' },
    { girdi: {}, tur: 'cikti' },
  ],
  '/ozel-branslar/psikolog-seans': [
    { girdi: { yaklasim: 'BDT', olcek: 'isim' }, tur: 'cikti' },
    { girdi: { yaklasim: '' }, tur: 'hata' },
  ],
  '/ozel-branslar/psikolog-vade': [
    { girdi: { son: '2026-10-01', aralik: '7' }, tur: 'portal' },
    { girdi: { son: '2026-10-01', aralik: '1' }, tur: 'hata' },
  ],
  '/ozel-branslar/psikolog-siklik': [
    { girdi: { siklik: 'haftalık', yaklasim: 'BDT' }, tur: 'cikti' },
    { girdi: { siklik: 'günlük', yaklasim: 'BDT' }, tur: 'hata' },
  ],
  '/ozel-branslar/psikolog-kriz': [
    { girdi: { kendine: '1' }, tur: 'acil' },
    { girdi: {}, tur: 'cikti' },
  ],
  '/ozel-branslar/diyet-makro': [
    { girdi: { tani: 'hipotiroidi', kilo: '70', hedef: 'koruma' }, tur: 'cikti' },
    { girdi: { tani: '', kilo: '70', hedef: 'koruma' }, tur: 'hata' },
  ],
  '/ozel-branslar/diyet-takvim': [
    { girdi: { bas: '2026-10-01' }, tur: 'portal' },
    { girdi: { bas: '' }, tur: 'hata' },
  ],
  '/ozel-branslar/diyet-ogun': [
    { girdi: { kahvalti: 'yumurta', ogle: 'mercimek', aksam: 'yoğurt' }, tur: 'cikti' },
    { girdi: { kahvalti: '400 kcal', ogle: 'mercimek', aksam: 'yoğurt' }, tur: 'hata' },
  ],
  '/ozel-branslar/diyet-acil': [
    { girdi: { kusma: '1' }, tur: 'acil' },
    { girdi: {}, tur: 'cikti' },
  ],
  '/ozel-branslar/ergo-gya': [
    { girdi: { tani: 'inme', gya: 'Giyinme|Yemek' }, tur: 'cikti' },
    { girdi: { tani: '', gya: 'Giyinme' }, tur: 'hata' },
  ],
  '/ozel-branslar/ergo-seans': [
    { girdi: { son: '2026-10-01', aralik: '7' }, tur: 'portal' },
    { girdi: { son: '2026-10-01', aralik: '1' }, tur: 'hata' },
  ],
  '/ozel-branslar/ergo-blok': [
    { girdi: { sabah: 'giyinme', oglen: 'yemek', aksam: 'banyo', bas: '2026-10-01' }, tur: 'portal' },
    { girdi: { sabah: '', oglen: '', aksam: '', bas: '2026-10-01' }, tur: 'hata' },
  ],
  '/ozel-branslar/ergo-dusme': [
    { girdi: { dusme: '1' }, tur: 'acil' },
    { girdi: {}, tur: 'cikti' },
  ],
  '/ozel-branslar/odyo-esik': [
    { girdi: { db: '30' }, tur: 'cikti' },
    { girdi: { db: '400' }, tur: 'hata' },
  ],
  '/ozel-branslar/odyo-oda': [
    { girdi: { m2: '4', tarama: '1' }, tur: 'cikti' },
    { girdi: { m2: '0' }, tur: 'hata' },
  ],
  '/ozel-branslar/odyo-cihaz': [
    { girdi: { rapor: '1', kontrol: '2026-11-01' }, tur: 'portal' },
    { girdi: { rapor: '' }, tur: 'cikti' },
  ],
  '/ozel-branslar/odyo-ani': [
    { girdi: { saatler: '1' }, tur: 'acil' },
    { girdi: {}, tur: 'cikti' },
  ],
}

function portalTemiz(c: AracCikti): boolean {
  return portalSatirlari(c.vadeler, BUGUN).every((s) => !YASAK.test(s.ad))
}

export function ozelAracDogrula(slug?: KlinikYeniSlug): string[] {
  const araclar = slug ? OZEL_ARACLAR.filter((a) => a.slug === slug) : OZEL_ARACLAR
  const hatalar: string[] = []
  if (slug && araclar.length < 4) hatalar.push(`${slug} araç sayısı ${araclar.length}`)
  for (const a of araclar) {
    const vakalar = VAKALAR[a.route]
    if (!vakalar) {
      hatalar.push(`${a.route} vaka yok`)
      continue
    }
    for (const v of vakalar) {
      const s = ozelAracCalistir(a.route, v.girdi, BUGUN)
      if (v.tur === 'hata') {
        if (!('hata' in s)) hatalar.push(`${a.route} ret beklenirdi`)
        continue
      }
      if ('hata' in s) {
        hatalar.push(`${a.route} ${v.tur}: ${s.hata}`)
        continue
      }
      if (!portalTemiz(s)) hatalar.push(`${a.route} portal satırı yasak kelime taşıyor`)
      if (v.tur === 'acil' && !s.acil) hatalar.push(`${a.route} acil yok`)
      if (v.tur === 'portal' && portalSatirlari(s.vadeler, BUGUN).length === 0) hatalar.push(`${a.route} portal boş`)
      if (v.tur === 'cikti' && !s.ozet) hatalar.push(`${a.route} özet yok`)
    }
  }
  return hatalar
}

export function ozelAracSlugleri(): readonly KlinikYeniSlug[] {
  return KLINIK_YENI_SLUGS
}
