/**
 * NOTYA-ARAMA-TR-01 — Türkçe'ye doğru arama katlaması (case-folding).
 *
 * Neden ayrı bir modül: uygulamada hasta adı araması üç ayrı yerde birbirinden bağımsız
 * `toLocaleLowerCase('tr-TR')` ile yazılmıştı ve ÜÇÜ DE aynı sessiz hatayı taşıyordu.
 *
 * Hata şuydu: Türkçe locale'i I/i ayrımını KORUR — tam da dil kuralı gerektirdiği için:
 *     'Hasta Iki'.toLocaleLowerCase('tr-TR') === 'hasta ıki'   (I → ı, noktasız)
 *     'Hasta İki'.toLocaleLowerCase('tr-TR') === 'hasta iki'   (İ → i, noktalı)
 * Yazım için doğru olan bu davranış ARAMA için yanlıştır: "Hasta Iki" diye kayıtlı bir hastayı
 * doktor "hasta iki" yazarak asla bulamaz — iki dize normalize edildikten sonra bile farklıdır.
 * Dr. Gökhan'ın 2026-09-17'de bildirdiği canlı hata tam olarak buydu: "Hasta iki" yazdı, kayıtlı
 * "Hasta Iki" listede çıkmadı, randevu kayıtsız (serbest metin) olarak açıldı.
 *
 * Aramada doğru davranış: dört I biçiminin (I ı İ i) TEK bir kovaya düşmesi. Klavyesinde
 * noktalı/noktasız ayrımını umursamayan bir kullanıcı da, hastayı "IŞIK" diye kaydetmiş bir
 * sekreter de aynı sonucu bulsun. Aksan/şapka da aynı mantıkla düşürülür (ö→o, ş→s, ğ→g...):
 * "Gokhan" yazan "Gökhan"ı bulur.
 *
 * DİKKAT: bu fonksiyon YALNIZ arama/eşleştirme içindir. Ekranda gösterilecek veya veritabanına
 * yazılacak bir metni asla bununla dönüştürmeyin — hasta adının noktalı İ'si kaybolur.
 */

/** Arama için normalize: dört I biçimi tek harfe, küçük harf, aksanlar düşer, boşluk sadeleşir. */
export function trAramaNormalize(ham: string | null | undefined): string {
  return String(ham ?? '')
    // Önce dört I biçimini tek kovaya al — locale'e bırakılırsa I ile i ayrışır.
    .replace(/[İIıi]/g, 'i')
    .toLocaleLowerCase('tr-TR')
    // NFD + birleşen işaretleri at: ö→o, ç→c, ş→s, ğ→g, ü→u, â→a.
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** `metin` içinde `arama` geçiyor mu (Türkçe'ye doğru). Boş arama her şeyi eşler. */
export function trIcerir(metin: string | null | undefined, arama: string | null | undefined): boolean {
  const q = trAramaNormalize(arama)
  if (!q) return true
  return trAramaNormalize(metin).includes(q)
}

/** İki ad aynı kişiyi işaret edecek kadar aynı mı (kayıtsız girişte uyarı vermek için). */
export function trAyniAd(a: string | null | undefined, b: string | null | undefined): boolean {
  const x = trAramaNormalize(a)
  return !!x && x === trAramaNormalize(b)
}

/**
 * Tam metin İÇİNDE geçiyorsa ya da ad/soyad parçalarından biri bu önekle BAŞLIYORSA eşleşir.
 * HastaTypeahead'in "ad veya soyad baş harfleriyle daralt" davranışı budur.
 */
export function trParcaEslesir(metin: string | null | undefined, arama: string | null | undefined, ekParcalar: (string | null | undefined)[] = []): boolean {
  const q = trAramaNormalize(arama)
  if (!q) return true
  const tam = trAramaNormalize(metin)
  if (tam.includes(q)) return true
  const parcalar = [...ekParcalar.map((p) => trAramaNormalize(p)), ...tam.split(' ')].filter(Boolean)
  return parcalar.some((p) => p.startsWith(q))
}
