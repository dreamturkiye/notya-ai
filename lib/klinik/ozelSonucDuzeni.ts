/** Sonuç kartının düzeni. Her dal en az iki düzen kullanır. */
export type SonucDuzeni = 'seri' | 'acil' | 'olcu' | 'liste'

const DUZEN: Record<string, SonucDuzeni> = {
  '/ozel-branslar/sac-greft': 'olcu',
  '/ozel-branslar/sac-takvim': 'seri',
  '/ozel-branslar/sac-cizgi': 'liste',
  '/ozel-branslar/sac-foto': 'seri',
  '/ozel-branslar/cerrahi-onam': 'liste',
  '/ozel-branslar/cerrahi-takvim': 'seri',
  '/ozel-branslar/cerrahi-riza': 'liste',
  '/ozel-branslar/cerrahi-emboli': 'acil',
  '/ozel-branslar/estetik-soguma': 'liste',
  '/ozel-branslar/estetik-takvim': 'seri',
  '/ozel-branslar/estetik-vaskuler': 'acil',
  '/ozel-branslar/estetik-lot': 'liste',
  '/ozel-branslar/derm-lazer': 'seri',
  '/ozel-branslar/derm-takvim': 'seri',
  '/ozel-branslar/derm-gunes': 'seri',
  '/ozel-branslar/derm-acil': 'acil',
  '/ozel-branslar/long-vade': 'seri',
  '/ozel-branslar/long-guvenlik': 'liste',
  '/ozel-branslar/long-sinif': 'liste',
  '/ozel-branslar/long-reaksiyon': 'acil',
  '/ozel-branslar/fizyo-icf': 'liste',
  '/ozel-branslar/fizyo-seans': 'seri',
  '/ozel-branslar/fizyo-ev': 'seri',
  '/ozel-branslar/fizyo-bayrak': 'acil',
  '/ozel-branslar/psikolog-seans': 'liste',
  '/ozel-branslar/psikolog-vade': 'seri',
  '/ozel-branslar/psikolog-siklik': 'liste',
  '/ozel-branslar/psikolog-kriz': 'acil',
  '/ozel-branslar/diyet-makro': 'olcu',
  '/ozel-branslar/diyet-takvim': 'seri',
  '/ozel-branslar/diyet-ogun': 'liste',
  '/ozel-branslar/diyet-acil': 'acil',
  '/ozel-branslar/ergo-gya': 'liste',
  '/ozel-branslar/ergo-seans': 'seri',
  '/ozel-branslar/ergo-blok': 'seri',
  '/ozel-branslar/ergo-dusme': 'acil',
  '/ozel-branslar/odyo-esik': 'olcu',
  '/ozel-branslar/odyo-oda': 'olcu',
  '/ozel-branslar/odyo-cihaz': 'seri',
  '/ozel-branslar/odyo-ani': 'acil',
}

export function ozelSonucDuzeni(route: string): SonucDuzeni | null {
  return DUZEN[route] || null
}

export function ozelSonucDuzenleri(): Record<string, SonucDuzeni> {
  return { ...DUZEN }
}
