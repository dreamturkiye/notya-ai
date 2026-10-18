/**
 * Klinik masa politikası. Doktor uygulamasındaki personel matrisi (`lib/doktor/personelYetki.ts`)
 * burada değiştirilmez. Bu tablo yalnız Klinik kurulumunda saklanır ve Klinik rotaları okur.
 */

export const KLINIK_ROLLERI = ['sekreter', 'asistan', 'hasta_danismani'] as const
export type KlinikRol = (typeof KLINIK_ROLLERI)[number]

export const KLINIK_MODULLERI = ['takvim', 'hasta', 'paket', 'odeme', 'mesaj', 'kurulum'] as const
export type KlinikModul = (typeof KLINIK_MODULLERI)[number]

export type YetkiSatiri = {
  rol: KlinikRol
  modul: KlinikModul
  oku: boolean
  yaz: boolean
  sil: boolean
}

export function rolMu(x: unknown): x is KlinikRol {
  return typeof x === 'string' && (KLINIK_ROLLERI as readonly string[]).includes(x)
}

export function modulMu(x: unknown): x is KlinikModul {
  return typeof x === 'string' && (KLINIK_MODULLERI as readonly string[]).includes(x)
}

function satir(rol: KlinikRol, modul: KlinikModul, oku: boolean, yaz: boolean, sil: boolean): YetkiSatiri {
  return { rol, modul, oku, yaz: oku && yaz, sil: oku && yaz && sil }
}

/** Varsayılan masa. Kurulum modülünü personel açamaz; onu yalnız klinik sahibi düzenler. */
export function varsayilanYetkiler(): YetkiSatiri[] {
  const bos = (rol: KlinikRol, modul: KlinikModul) => satir(rol, modul, false, false, false)
  return [
    satir('sekreter', 'takvim', true, true, true),
    satir('sekreter', 'hasta', true, true, false),
    satir('sekreter', 'paket', true, false, false),
    satir('sekreter', 'odeme', true, true, false),
    satir('sekreter', 'mesaj', true, true, false),
    bos('sekreter', 'kurulum'),
    satir('asistan', 'takvim', true, false, false),
    satir('asistan', 'hasta', true, false, false),
    satir('asistan', 'paket', true, false, false),
    bos('asistan', 'odeme'),
    bos('asistan', 'mesaj'),
    bos('asistan', 'kurulum'),
    satir('hasta_danismani', 'takvim', true, true, false),
    satir('hasta_danismani', 'hasta', true, true, false),
    satir('hasta_danismani', 'paket', true, false, false),
    satir('hasta_danismani', 'odeme', true, false, false),
    satir('hasta_danismani', 'mesaj', true, true, false),
    bos('hasta_danismani', 'kurulum'),
  ]
}

export function yetkiDogrula(satirlar: YetkiSatiri[]): string | null {
  const gorulen = new Set<string>()
  for (const s of satirlar) {
    if (!rolMu(s.rol) || !modulMu(s.modul)) return 'Rol veya modül tanınmıyor.'
    if (s.modul === 'kurulum' && (s.oku || s.yaz || s.sil)) return 'Kurulumu yalnız klinik sahibi düzenler.'
    if ((s.yaz || s.sil) && !s.oku) return 'Yazma ve silme, okuma açıkken seçilir.'
    if (s.sil && !s.yaz) return 'Silme, yazma açıkken seçilir.'
    const anahtar = `${s.rol}:${s.modul}`
    if (gorulen.has(anahtar)) return 'Aynı rol ve modül iki kez yazılamaz.'
    gorulen.add(anahtar)
  }
  if (gorulen.size !== KLINIK_ROLLERI.length * KLINIK_MODULLERI.length) return 'Her rol ve modül için bir satır gerekir.'
  return null
}

export function izinVar(
  satirlar: readonly YetkiSatiri[],
  rol: KlinikRol,
  modul: KlinikModul,
  eylem: 'oku' | 'yaz' | 'sil',
): boolean {
  const s = satirlar.find((x) => x.rol === rol && x.modul === modul)
  return Boolean(s && s[eylem])
}
