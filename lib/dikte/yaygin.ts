/**
 * DIKTE-TIBBI-01 — word lists the medical dictation corrector needs to stay conservative.
 *
 * All entries are FOLDED keys (see `anahtar()` in ./duzelt): lower case, Turkish letters folded to ASCII
 * (ı/i/İ → i, ş → s, ğ → g, ç → c, ö → o, ü → u). Data only; pure.
 */

/**
 * Words that are NEVER changed and never learned as a heard→correct pair: laterality, negation, presence,
 * quantity words, units. A change to one of these is a clinical correction by the doctor, not a misheard term —
 * "sağ" → "sol" learned as a dictation pair would flip the side in every later note.
 */
export const KORUNAN = new Set<string>([
  'sag', 'sol', 'saga', 'sola', 'sagda', 'solda', 'sagdan', 'soldan', 'sagi', 'solu', 'bilateral', 'unilateral', 'iki', 'taraf', 'taraf',
  'tarafli', 'yok', 'var', 'degil', 'normal', 'anormal', 'negatif', 'pozitif', 'olmayan', 'olan', 'yoktu', 'vardi', 'yoktur', 'vardir',
  'hafif', 'orta', 'siddetli', 'agir', 'minimal', 'belirgin', 'az', 'cok', 'fazla', 'biraz', 'artmis', 'azalmis', 'ust', 'alt', 'on', 'arka',
  'bir', 'uc', 'dort', 'bes', 'alti', 'yedi', 'sekiz', 'dokuz', 'on', 'yirmi', 'otuz', 'kirk', 'elli', 'yuz', 'bin', 'yarim', 'ceyrek',
  'mg', 'miligram', 'gram', 'gr', 'ml', 'mililitre', 'mcg', 'mikrogram', 'unite', 'iu', 'kg', 'cm', 'mm', 'derece', 'gun', 'hafta', 'ay', 'yil',
  'saat', 'dakika', 'kez', 'defa', 'doz', 'tablet', 'kapsul', 'damla', 'surup', 'olcek', 'puf', 'sprey', 'ampul', 'flakon', 'fitil',
  'sabah', 'aksam', 'ogle', 'gece', 'gunde', 'haftada', 'ayda', 'ac', 'tok', 'once', 'sonra', 'ile', 'icin', 've', 'veya', 'ya', 'da', 'de',
  'erkek', 'kadin', 'kiz', 'yas', 'yasinda', 'aylik', 'gunluk', 'yillik',
])

/**
 * Everyday Turkish words an ASR engine produces instead of a medical term. A word on this list is a real word, so a
 * single-word fuzzy match never rewrites it (only an explicit, context-gated known-error rule or the doctor's own
 * pair may). Not a dictionary — the corrector also refuses short tokens and any token that is already a term.
 */
export const YAYGIN = new Set<string>([
  // function words, pronouns, conjunctions
  'bu', 'su', 'o', 'ben', 'sen', 'biz', 'siz', 'onlar', 'bunu', 'sunu', 'onu', 'bunda', 'onda', 'burada', 'orada', 'simdi', 'sonra', 'once',
  'gibi', 'kadar', 'daha', 'en', 'cok', 'az', 'her', 'hic', 'hep', 'ama', 'fakat', 'ancak', 'yani', 'peki', 'evet', 'hayir', 'tamam', 'iste',
  'bile', 'mi', 'mu', 'mı', 'ki', 'ise', 'diye', 'gore', 'beri', 'dolayi', 'icinde', 'uzerinde', 'altinda', 'yaninda', 'arasinda', 'karsi',
  'nasil', 'neden', 'nerede', 'hangi', 'kim', 'ne', 'kac', 'bazen', 'genelde', 'zaten', 'artik', 'hala', 'henuz', 'tekrar', 'yine', 'birlikte',
  // verbs and verb forms common in dictation
  'geliyor', 'gelir', 'geldi', 'gelen', 'gidiyor', 'gitti', 'oldu', 'olur', 'oluyor', 'olmus', 'olarak', 'olan', 'olsun', 'yapildi', 'yapiliyor',
  'yapalim', 'yapin', 'yapmak', 'yapar', 'verelim', 'verildi', 'veriyorum', 'baslayalim', 'basladi', 'basliyor', 'devam', 'ediyor', 'edildi',
  'ilerliyor', 'ilerledi', 'goruldu', 'gorulmedi', 'goruluyor', 'izlendi', 'izleniyor', 'saptandi', 'saptanmadi', 'mevcut', 'kullaniyor',
  'kullansin', 'alsin', 'alıyor', 'aliyor', 'aldi', 'dedi', 'diyor', 'soyledi', 'anlatiyor', 'belirtiyor', 'yazalim', 'yaz', 'yazdim',
  'kontrol', 'kontrolde', 'kontrole', 'acik', 'kapali', 'temiz', 'iyi', 'kotu', 'buyuk', 'kucuk', 'yeni', 'eski', 'uzun', 'kisa', 'genis', 'dar',
  // colours, shapes, everyday nouns that collide with terms
  'kirmizi', 'beyaz', 'sari', 'yesil', 'mavi', 'siyah', 'soluk', 'pembe', 'mor', 'kahverengi', 'gri', 'renk', 'rengi', 'sekil', 'yuvarlak',
  'panik', 'saf', 'conta', 'ofis', 'ofisleri', 'ofisi', 'ortaya', 'atis', 'atislar', 'mahalle', 'mahallesi', 'mahallesinde', 'konak', 'tabak',
  'tabagi', 'tabaginda', 'nazan', 'mopar', 'stubble', 'paradoks', 'araf', 'kanal', 'kapi', 'masa', 'ev', 'okul', 'is', 'isi', 'yol', 'yolu',
  'su', 'suyu', 'yemek', 'ekmek', 'sut', 'cay', 'kahve', 'hava', 'ates', 'agri', 'sancı', 'sanci', 'kasinti', 'yanma', 'batma', 'zonklama',
  'bas', 'basi', 'goz', 'gozu', 'kulak', 'kulagi', 'burun', 'burnu', 'bogaz', 'bogazi', 'agiz', 'agzi', 'dil', 'dili', 'dis', 'disi', 'dudak',
  'boyun', 'boynu', 'gogus', 'gogsu', 'karin', 'karni', 'sirt', 'bel', 'beli', 'kol', 'kolu', 'bacak', 'bacagi', 'el', 'eli', 'ayak', 'ayagi',
  'parmak', 'diz', 'dizi', 'omuz', 'omzu', 'kalca', 'deri', 'cilt', 'kan', 'kani', 'idrar', 'diski', 'kemik', 'kas', 'sinir', 'damar',
  'anne', 'baba', 'cocuk', 'hasta', 'hastanin', 'hastaya', 'hastada', 'doktor', 'hekim', 'hemsire', 'sikayet', 'sikayeti', 'oyku', 'gecmis',
  'tedavi', 'ilac', 'ilaci', 'recete', 'rapor', 'tetkik', 'tahlil', 'sonuc', 'sonucu', 'film', 'filmi', 'goruntu', 'muayene', 'muayenesi',
  'muayenesinde', 'bulgu', 'bulgular', 'bulgusu', 'tani', 'tanisi', 'plan', 'oneri', 'takip', 'gun', 'gunu', 'hafta', 'ay', 'yil', 'zaman',
  'salgi', 'salgisi', 'akinti', 'kanama', 'sislik', 'sis', 'kizariklik', 'yara', 'yarasi', 'leke', 'kitle', 'kist', 'tas', 'tasi', 'kum',
  'biraz', 'hafif', 'belirgin', 'siddetli', 'surekli', 'aralikli', 'ani', 'yavas', 'hizli', 'sicak', 'soguk', 'islak', 'kuru', 'sert', 'yumusak',
  'mukoza', 'membran', 'konka', 'septum', 'tonsil', 'uvula', 'larenks', 'farenks', 'sinus',
  // names and places an ASR engine reaches for
  'ali', 'ayse', 'mehmet', 'ahmet', 'fatma', 'emre', 'can', 'deniz', 'derya', 'nazli', 'selin', 'murat', 'mustafa', 'zeynep', 'elif', 'ece',
  'istanbul', 'ankara', 'izmir', 'konya', 'bursa', 'antalya', 'adana',
])

/**
 * Turkish case / plural / possessive / copula suffixes a dictated term carries ("membranlar", "meatuslardan",
 * "hiperemikti"). Longest first: the corrector tries to strip one, fixes the stem, and puts the suffix back.
 */
export const EKLER: readonly string[] = [
  'larindan', 'lerinden', 'lardan', 'lerden', 'larinda', 'lerinde', 'larini', 'lerini', 'larina', 'lerine', 'larda', 'lerde', 'lari', 'leri',
  'lara', 'lere', 'lar', 'ler', 'sindan', 'sinden', 'sinda', 'sinde', 'nindan', 'ninden', 'ndan', 'nden', 'nda', 'nde', 'nin', 'nun', 'nın',
  'dan', 'den', 'tan', 'ten', 'yla', 'yle', 'la', 'le', 'da', 'de', 'ta', 'te', 'sini', 'sina', 'sine', 'si', 'su', 'ya', 'ye', 'yi', 'yu',
  'tir', 'dir', 'tur', 'dur', 'ti', 'di', 'tu', 'du', 'in', 'un', 'a', 'e', 'i', 'u',
]

/** Words that put a token in drug context: a drug name is only corrected next to a dose, form or prescribing verb. */
export const ILAC_BAGLAMI = new Set<string>([
  'mg', 'miligram', 'gram', 'gr', 'ml', 'mcg', 'mikrogram', 'iu', 'unite', 'tablet', 'tb', 'tablete', 'kapsul', 'damla', 'surup', 'olcek', 'puf',
  'sprey', 'ampul', 'flakon', 'fitil', 'krem', 'pomad', 'merhem', 'jel', 'losyon', 'gunde', 'haftada', 'kez', 'defa', 'doz', 'dozunda',
  'baslayalim', 'basladik', 'basliyoruz', 'kullansin', 'kullaniyor', 'kullanimi', 'verelim', 'verildi', 'recete', 'receteledim', 'yazalim',
  'yazdim', 'kesildi', 'keselim', 'devam', 'ilac', 'ilaci', 'ilaclari', 'antibiyotik', 'flk', 'forte', 'fort', 'bid', 'tid', 'qid',
])
