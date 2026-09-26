/**
 * KURAL — TÜRKÇE: HTML5 form doğrulama durumlarının Türkçe mesajları (components/core/TurkceDogrulama.tsx kullanır).
 * DOM'a bağımlı değil — alanın validity durumu ve birkaç niteliği yeterli, böylece test edilebilir.
 */
export interface DogrulamaAlani {
  type?: string
  tagName?: string
  title?: string
  validity: Pick<ValidityState, 'valueMissing' | 'typeMismatch' | 'patternMismatch' | 'tooShort' | 'tooLong' | 'rangeUnderflow' | 'rangeOverflow' | 'stepMismatch' | 'badInput'>
  getAttribute?: (ad: string) => string | null
}

/**
 * Hata sayfasında gösterilecek mesaj: yalnız Türkçe karakter taşıyan (uygulamanın kendi) mesajlar.
 * Tarayıcı / çalışma zamanı hataları İngilizcedir ("Failed to fetch", "Cannot read properties of undefined").
 */
export function turkceHataMesaji(mesaj: string | undefined | null): string | null {
  if (!mesaj) return null
  return /[çğıİöşüÇĞÖŞÜ]/.test(mesaj) ? mesaj : null
}

export function dogrulamaMesaji(el: DogrulamaAlani): string | null {
  const v = el.validity
  const tur = (el.type || '').toLowerCase()
  const etiket = (el.tagName || '').toLowerCase()
  const nitelik = (ad: string) => el.getAttribute?.(ad) ?? null

  if (v.valueMissing) {
    if (tur === 'checkbox') return 'Devam etmek için bu kutuyu işaretleyin.'
    if (tur === 'radio') return 'Lütfen seçeneklerden birini seçin.'
    if (tur === 'file') return 'Lütfen bir dosya seçin.'
    if (etiket === 'select' || tur.startsWith('select')) return 'Lütfen listeden bir seçim yapın.'
    return 'Lütfen bu alanı doldurun.'
  }
  if (v.typeMismatch) {
    if (tur === 'email') return 'Lütfen geçerli bir e-posta adresi girin (ör. ad@ornek.com).'
    if (tur === 'url') return 'Lütfen geçerli bir web adresi girin (ör. https://ornek.com).'
    return 'Lütfen geçerli bir değer girin.'
  }
  if (v.badInput) {
    if (tur === 'number') return 'Lütfen geçerli bir sayı girin.'
    if (tur === 'date' || tur === 'datetime-local' || tur === 'time') return 'Lütfen geçerli bir tarih / saat girin.'
    return 'Lütfen geçerli bir değer girin.'
  }
  if (v.patternMismatch) return el.title ? `Lütfen istenen biçimde girin: ${el.title}` : 'Lütfen istenen biçimde girin.'
  if (v.tooShort) return nitelik('minlength') ? `Lütfen en az ${nitelik('minlength')} karakter girin.` : 'Lütfen daha uzun bir değer girin.'
  if (v.tooLong) return nitelik('maxlength') ? `Lütfen en fazla ${nitelik('maxlength')} karakter girin.` : 'Lütfen daha kısa bir değer girin.'
  if (v.rangeUnderflow) return nitelik('min') ? `Değer en az ${nitelik('min')} olmalı.` : 'Değer çok küçük.'
  if (v.rangeOverflow) return nitelik('max') ? `Değer en fazla ${nitelik('max')} olmalı.` : 'Değer çok büyük.'
  if (v.stepMismatch) return 'Lütfen geçerli bir değer girin.'
  return null
}
