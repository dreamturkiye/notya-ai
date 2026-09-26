/**
 * NOTYA-TURKCE-01 geniş tarama (yalnız rapor için; rehber test kullanmaz).
 * Vikisözlük listesinden (lib/security/tr-sozluk.json) ASCII'ye katlanmış bir dizin kurar:
 * "kullanicilar" gibi bir kelimenin en uzun sözlük öneki Türkçe karakterli bir kelimenin ASCII hali ise
 * (kullanıcı) ve kelimenin kendisi / o önek ASCII haliyle de geçerli bir kelime değilse → ASCII-Türkçe adayı.
 */
import sozluk from '../security/tr-sozluk.json'

const katla = (s: string) =>
  s.replace(/[çğıöşüâî]/g, (h) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i' } as Record<string, string>)[h])

const EK = ['kullanıcı', 'yardımcı', 'görüşme', 'sağlık', 'hastanın', 'doktorunuz', 'değerlendirme', 'oluşturuldu', 'güncelleme', 'yükleniyor', 'başarısız', 'başarılı', 'şifre', 'işlem', 'iletişim', 'öğle', 'akşam', 'müsait', 'çalışıyor', 'asistanı', 'hakkında', 'sorularınız', 'nasıl', 'henüz']
const gecerli = new Set<string>(sozluk as string[])
const katlanmis = new Map<string, string>()
for (const k of [...(sozluk as string[]), ...EK]) {
  if (!/[çğıöşü]/.test(k)) continue
  const a = katla(k)
  if (!gecerli.has(a) && !katlanmis.has(a)) katlanmis.set(a, k)
}
// Sık İngilizce kelimelerin katlanmış Türkçe eşleri (once→önce, sure→süre …) İngilizce metinde yanlış alarm verir.
const INGILIZCE = new Set(['once', 'sure', 'gore', 'sonu', 'ates', 'kurs', 'dusk', 'cola', 'sole', 'rule', 'mode', 'code', 'soda', 'tone', 'lone', 'bole', 'ruse'])

const KOKLER = ['siz', 'biz', 'onu', 'bunu', 'sizi', 'bizi']
// Ünsüz yumuşaması: sonucu ← sonuç, rengi ← renk, kitabı ← kitap, ağacı ← ağaç.
const yumusak = (onek: string) => {
  const son = onek.slice(-1)
  const govde = onek.slice(0, -1)
  const aday = { c: ['ç'], g: ['k'], b: ['p'], d: ['t'], ğ: ['k'] }[son] ?? []
  return aday.some((h) => gecerli.has(govde + h))
}

export function genisAsciiBul(metin: string): { ascii: string; dogru: string } | null {
  if (!/[a-z]{4,}/i.test(metin)) return null
  for (const ham of metin.split(/[^A-Za-zÇĞİÖŞÜçğıöşüâî]+/)) {
    if (ham.length < 4 || /[^A-Za-z]/.test(ham)) continue
    if (/^[A-Z]{2,}$/.test(ham)) continue // kısaltma / büyük harf
    if (/[a-z][A-Z]/.test(ham)) continue // camelCase tanımlayıcı
    const k = ham.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i')
    if (gecerli.has(k) || INGILIZCE.has(k)) continue
    // Geçerli bir kök + ek (tarih-i, veri-si, siz-in, sonuc-u) ASCII-Türkçe değildir.
    if (KOKLER.some((kok) => k.startsWith(kok))) continue
    let kokVar = false
    for (let n = 4; n < k.length && !kokVar; n++) kokVar = gecerli.has(k.slice(0, n)) || (/[aeiou]/.test(k[n]) && yumusak(k.slice(0, n)))
    if (kokVar) continue
    for (let n = k.length; n >= 4; n--) {
      const onek = k.slice(0, n)
      if (gecerli.has(onek)) break
      const d = katlanmis.get(onek)
      if (d && !INGILIZCE.has(onek)) return { ascii: ham, dogru: d + k.slice(n) }
    }
  }
  return null
}
