/**
 * Sesle uyandır sözleri. Tanıma tarayıcının konuşma motorundan gelen metin üzerindedir;
 * eşleşme katlanmış Türkçe ile yapılır (ı/i, ç/c) ki motor yazımı değişse de tutsun.
 * "asistanı açma" ve "asistanı açık" açılış sayılmaz.
 */

export function sozuKatla(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** "Asistanı aç" — yalın "açık" / "açma" değil. */
export function asistaniAcMi(s: string): boolean {
  return /(^|\s)asistan[i]? ac(\s|$)/.test(sozuKatla(s))
}

/** "Asistanı kapat" — görüşmeyi keser, muayene kaydına dokunmaz. */
export function asistaniKapatMi(s: string): boolean {
  return /(^|\s)asistan[i]? kapat(\s|$)/.test(sozuKatla(s))
}
