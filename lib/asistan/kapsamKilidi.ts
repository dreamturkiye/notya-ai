/**
 * NOTYA-KAPSAM-01 (Kaan, 2026-10-01) — Ayşe yalnız uygulamanın işine cevap verir.
 *
 * Canlı vaka: 'Tesla almak istiyorum' ilk turda yanlış yola düştü, takip sorusunda Ayşe genel amaçlı bir sohbet botu
 * gibi alım analizi yaptı. Katmanlar:
 *   (a) bu dosya — modelsiz, ucuz, kesin ön kapı. YALNIZ açık bir kapsam-dışı kalıp varsa VE hiçbir kapsam-içi
 *       sinyal (hasta, ilaç, muayene, randevu, aşı, lab, uygulama ...) yoksa reddeder. Varsayılan her zaman GEÇİR:
 *       yanlış ret (tıbbi soruya 'yardımcı olamam'), sızan bir Tesla cevabından kötüdür.
 *   (b) personaEngine global istemindeki KAPSAM kuralı — belirsiz durumlar için model yedeği, aynı sabit cümle.
 * Ret cümlesi TEK sabittir: ekran ve ses aynı dizgiyi söyler. Reddedilen turda hasta araması, model, öğrenme ve
 * kayıt kartı yoktur (ayseCevapla çağrı yeri). Selam, teşekkür, 'tamam', 'tekrar söyle', düzeltme gibi sosyal turlar
 * hiçbir kapsam-dışı kalıpla eşleşmez, bu yüzden her zaman geçer.
 */
import { duzle } from '@/lib/doktor/hastaCozumleyici'
import { KAPSAM_RED, KAPSAM_SORU, kapsamRedMi } from '@/lib/asistan/kapsamRed'

export { KAPSAM_RED, KAPSAM_SORU, kapsamRedMi }

/** Kapsam-içi sinyal kökleri (duzle sonrası). Kısa kökler (<=4 harf) yalnız kısa ekle eşleşir ('asi' ile 'asilzade' değil). */
const IC_KOKLER = [
  'hasta', 'muayene', 'vizit', 'seans', 'randevu', 'takvim', 'asi', 'ilac', 'doz', 'recete', 'tani', 'icd', 'lab',
  'laboratuvar', 'tahlil', 'tetkik', 'goruntule', 'grafi', 'ultrason', 'ates', 'oksur', 'ishal', 'kusma', 'sikayet',
  'semptom', 'belirti', 'bulgu', 'hastalik', 'enfeksiyon', 'antibiyotik', 'alerji', 'tedavi', 'soap', 'not', 'dosya',
  'kayit', 'rapor', 'epikriz', 'sevk', 'konsult', 'buyume', 'persentil', 'kilo', 'yas', 'aylik', 'bebek', 'cocuk',
  'yenidogan', 'gebe', 'hamile', 'emzir', 'kan', 'tansiyon', 'nabiz', 'solunum', 'saturasyon', 'agri', 'etkilesim',
  'kontrendikasyon', 'yan etki', 'surup', 'damla', 'tablet', 'kapsul', 'vucut', 'akciger', 'kalp', 'bobrek',
  'karaciger', 'mide', 'bagirsak', 'beyin', 'deri', 'goz', 'kulak', 'bogaz', 'burun', 'kemik', 'eklem', 'idrar',
  'zaturre', 'bronsit', 'astim', 'diyabet', 'hipertansiyon', 'anemi', 'menenjit', 'otit', 'grip', 'covid', 'klinik',
  'tibbi', 'tip', 'doktor', 'hekim', 'hemsire', 'poliklinik', 'hastane', 'sgk', 'fatura', 'odeme', 'tahsilat',
  'whatsapp', 'eposta', 'mail', 'sms', 'belge', 'ayar', 'uygulama', 'notya', 'buton', 'ekran', 'sayfa', 'profil',
  'onay', 'mg', 'kg', 'ml', 'mcg', 'bmi', 'crp', 'ekg', 'eeg', 'tsh', 'nobet', 'alkol', 'sigara', 'uyku', 'beslen',
  'diyet', 'gelisim', 'teshis', 'prognoz', 'patoloji', 'cerrahi', 'ameliyat', 'anestezi', 'reflu', 'kolik', 'sepsis',
  'kanser', 'tumor', 'kist', 'sarilik', 'bilirubin', 'hemoglobin', 'vitamin', 'mineral', 'steroid', 'serum',
  'hava yolu', 'havayolu', 'oda havasi',
]

export function kapsamIciSinyalVar(n: string): boolean {
  const kelimeler = n.split(' ').filter(Boolean)
  const metin = ` ${n} `
  for (const k of IC_KOKLER) {
    if (k.includes(' ')) { if (metin.includes(` ${k}`)) return true; continue }
    for (const t of kelimeler) {
      if (!t.startsWith(k)) continue
      if (k === 'asi' && t.startsWith('asist')) continue
      if (k.length > 4 || t.length - k.length <= 4) return true
    }
  }
  return false
}

/** Açık kapsam-dışı kalıplar — duzle edilmiş metnin ` n ` (başı sonu boşluklu) hali üzerinde. */
const DISI_KALIPLAR: RegExp[] = [
  // araba / alışveriş
  / (tesla|togg|bmw|mercedes|audi|volkswagen|ferrari|porsche|renault|fiat|toyota|honda|hyundai|otomobil|araba|motosiklet)[a-z]* /,
  / (iphone|samsung|laptop|ayakkabi|trendyol|hepsiburada|amazon|alisveris|indirim|kampanya)[a-z]* /,
  / (bilgisayar|telefon|televizyon) alm[a-z]* /,
  / (satin al|kiralik ev|ev almak|emlak|konut)[a-z]* /,
  // hava durumu
  / hava (durumu|nasil|tahmin|sicak|soguk|yagmur|karli|kar|bulutlu|acik|kapali|serin|ruzgar|kac derece)[a-z]* /,
  / (yagmur|kar) yag(acak|ar|iyor|mis)[a-z]* /,
  / (yagmur|kar) (var mi|yagiyor mu|yagar mi) /,
  / (bugun|yarin|haftasonu|hafta sonu) hava /,
  / hava (bugun|yarin) /,
  / (bugun|yarin) sicaklik /,
  // NOTYA-KAPSAM-05 (2026-10-01): "Bugün İstanbul'da hava yağışlı mı?" slipped past the list above and ran a
  // patient count (bugün + Şehir filter). Weather adjectives anywhere within three words of 'hava', either order.
  / hava (\S+ ){0,3}(yagis|yagmur|karli|gunes|bulut|ruzgar|sisli|firtina|serin|sicak|soguk|derece|nem)[a-z]* /,
  / (yagisli|yagmurlu|karli|gunesli|bulutlu|ruzgarli|sisli|firtinali) (\S+ ){0,3}hava[a-z]* /,
  / (yagis|yagmur|kar|firtina|dolu) (bekleniyor|var mi|olacak mi|yagacak mi|ihtimali)[a-z]* /,
  / (meteoroloji|hava tahmini|hava raporu)[a-z]* /,
  // spor
  / (fenerbahce|galatasaray|besiktas|trabzonspor|super lig|sampiyonlar ligi|nba|formula 1|dunya kupasi|euroleague|avrupa kupasi)[a-z]* /,
  / mac(i|in|lar|lari|ta)? (.* )?(kac|sonuc|skor|bitti|ne zaman|kazandi)[a-z]* /,
  / (kac kac|skor kac|kim kazandi) /,
  // haber / siyaset
  / (son dakika|haberler|secim|secimler|cumhurbaskan|erdogan|trump|putin|ukrayna|gazze|israil|hukumet|siyaset|milletvekili|miting|siyasi parti)[a-z]* /,
  // finans
  / (dolar|euro|sterlin|doviz|borsa|hisse senet|hisse fiyat|hissesi|bitcoin|btc|ethereum|kripto|altin fiyat|gram altin|faiz|kredi|yatirim|bist|nasdaq|enflasyon|coin)[a-z]* /,
  / kac tl /,
  // yemek
  / (yemek tarifi|tarifi ver|tarifini ver|ne pisirsem|restoran oner|mekan oner|pasta tarifi|kek tarifi)[a-z]* /,
  / nasil yapilir (.* )?(kek|pilav|corba|makarna|borek|kurabiye|hamur|pizza)[a-z]* /,
  / (kek|pilav|corba|makarna|borek|kurabiye|hamur|pizza)[a-z]* (.* )?nasil yapilir /,
  // seyahat
  / (ucak bileti|otobus bileti|bilet al|otel|oteller|tatil|seyahat|ucus|gezilecek|vize|rezervasyon yap|turistik)[a-z]* /,
  // eğlence
  / (netflix|spotify|ne izlesem|ne dinlesem)[a-z]* /,
  / (film|dizi|youtube|konser|oyun) (oner|tavsiye|izle|dinle|sec|hangisi)[a-z]* /,
  / (sarki sozu|fikra anlat|saka yap|siir yaz|hikaye yaz|burc|astroloji|ruya tabiri|eurovision)[a-z]* /,
  // kodlama
  / (python|javascript|typescript|html|css|react|sql sorgu|kod yaz|kodu yaz|program yaz|script yaz|bash script|excel formul|yazilim ogren)[a-z]* /,
  // genel kültür
  / (baskenti neresi|baskenti ne|en yuksek dag|en uzun nehir|kim icat etti|elon musk)[a-z]* /,
  // kişisel tavsiye
  / (sevgilim|evlilik tavsiye|ne giysem|nereye gitsem|odev yap|odevimi)[a-z]* /,
]

/** Ret sonrası 'devam' soruları (karşılaştırma, fiyat, 'peki hangisi?') — zayıf iz; yalnız bir ret hemen önce geldiyse. */
const DEVAM_IZLERI =
  / (hangisi|daha iyi|daha ucuz|fiyat|kac para|kac tl|kac km|menzil|batarya|model|alsam|almali|tavsiye|oner|ne dersin|karsilastir|mantikli|avantaj|dezavantaj|yorumla|analiz|degir mi|ne kadar)[a-z]* /

/** Metin açıkça kapsam-dışıysa true. `oncekiRed`: önceki asistan cevabı KAPSAM_RED idi (aynı konunun devamı). */
export function kapsamDisiMi(mesaj: string | null | undefined, secenek: { oncekiRed?: boolean } = {}): boolean {
  return kapsamKarari(mesaj, secenek) === 'disi'
}

/**
 * NOTYA-KAPSAM-05: kapsam-dışı bir konunun izi (hava, yağmur, maç, gündem …) var ama açık bir kalıp yok ve hiçbir
 * kapsam-içi sinyal de yok ('Hava güzel mi?'). Bu kelimeler tıbbi bir cümlede tek başına geçmez; 'hava yolu' gibi
 * tıbbi kullanım IC sinyaliyle zaten geçer. Belirsiz turda hasta aracı çalışmaz: kısa bir netleştirme sorusu sorulur.
 */
const DISI_IZLERI = / (hava|havalar|yagmur[a-z]*|yagis[a-z]*|firtina[a-z]*|meteoroloji[a-z]*|gundem[a-z]*|futbol[a-z]*|basketbol[a-z]*|mac|maci|maclar[a-z]*|sarki[a-z]*) /

export type KapsamKarari = 'ic' | 'disi' | 'belirsiz'

/**
 * Üç yollu karar: 'disi' → KAPSAM_RED; 'belirsiz' → KAPSAM_SORU (hasta aracı yok, model yok); 'ic' → normal akış.
 * Varsayılan 'ic' kalır: iz kelimesi olmayan her soru eskisi gibi geçer.
 */
export function kapsamKarari(mesaj: string | null | undefined, secenek: { oncekiRed?: boolean } = {}): KapsamKarari {
  const n = duzle(String(mesaj || ''))
  if (!n) return 'ic'
  if (kapsamIciSinyalVar(n)) return 'ic'
  const metin = ` ${n} `
  if (DISI_KALIPLAR.some((re) => re.test(metin))) return 'disi'
  if (secenek.oncekiRed && n.split(' ').length >= 3 && DEVAM_IZLERI.test(metin)) return 'disi'
  if (DISI_IZLERI.test(metin)) return 'belirsiz'
  return 'ic'
}
