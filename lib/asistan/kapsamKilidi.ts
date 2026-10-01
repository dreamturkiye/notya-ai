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
 *
 * NOTYA-KAPSAM-06 (2026-10-01) — kapı gerçek hastaları ve gerçek klinik soruları reddediyordu: kalıplar çıplak alt
 * dizgiydi ('burc' → Burcu, 'kripto' → kriptorşidizm, 'react' → C-reactive; 'erdogan' / 'faiz' ad-soyad; 'araba' /
 * 'otel' / 'secim' klinik cümlede). Şimdi: (1) tek kelimelik kalıp tam kelime + Türkçe çekim ekiyle eşleşir; (2) ad ya
 * da klinik anlamı da olan kelime (araba, otel, tatil, seçim, faiz, dolar, burç …) yalnız kapsam-dışı bağlamıyla
 * (al / öner / fiyat / oran / sonuç …) reddedilir; (3) klinik izin listesi (KLINIK_IZIN) çakışmaları kapsam-içi sayar;
 * (4) doktorun kendi hastasının adı geçen mesaj reddedilmez (kapsamKarariHastayla).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { duzle, mesajdakiHastaAdi } from '@/lib/doktor/hastaCozumleyici'
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

/**
 * NOTYA-KAPSAM-06: klinik izin listesi — bir kapsam-dışı kalıpla çakışan ya da onun yanında geçen klinik söz.
 * 'C-reactive' (react), kriptorşidizm / kriptokok (kripto), 'araba tutması' / 'otel dönüşü döküntü' (taşıt ve seyahat
 * kelimesi belirti bağlamında), 'ilk seçim' (tıbbi tercih), '3 Tesla MR', 'MAC değeri', 'audiometri' (audi).
 */
const KLINIK_IZIN = [
  'c reactive', 'c reaktif', 'reaktif', 'protein', 'kriptorsid', 'kriptokok', 'kriptospor', 'kriptojen',
  'tutmasi', 'dokuntu', 'kasinti', 'bulanti', 'kizarik', 'kustu', 'kusuyor', 'travma', 'yaralan', 'kazasi',
  'kaza gecir', 'opere', 'operasyon', 'endikasyon', 'profilaksi', 'sendrom', 'testis',
  'ilk secim', 'ilk secenek', 'secim kriter', 'mr', 'manyetik', 'mac degeri', 'audiometri', 'audiogram',
]

export function kapsamIciSinyalVar(n: string): boolean {
  const kelimeler = n.split(' ').filter(Boolean)
  const metin = ` ${n} `
  for (const k of [...IC_KOKLER, ...KLINIK_IZIN]) {
    if (k.includes(' ')) { if (metin.includes(` ${k}`)) return true; continue }
    for (const t of kelimeler) {
      if (!t.startsWith(k)) continue
      if (k === 'asi' && t.startsWith('asist')) continue
      if (k.length > 4 || t.length - k.length <= 4) return true
    }
  }
  return false
}

/**
 * Türkçe ad çekim eki (duzle sonrası): çoğul + iyelik + hâl. 'tesla' → teslanın, teslayı, teslalar; ama 'kripto' +
 * 'rsidizm', 'react' + 'ive', 'audi' + 'ometri', 'kek' + 'emelik' ek değildir — o kelimeler eşleşmez.
 */
const EK = '(?:l[ae]r)?(?:[iu]m[iu]z|[iu]n[iu]z|m[iu]z|n[iu]z|[iu]m|[iu]n|s[iu]|[iu]|m|n)?(?:n?[dt][ae]n?|[ny]?[iuae]|n?[iu]n|y?l[ae])?(?:ki)?'
/** Tam kelime + çekim eki. */
const kelime = (govdeler: string) => new RegExp(` (?:${govdeler})${EK} `)
/** Tam kelime + çekim eki, ardından en çok `ara` kelime sonra bir bağlam kelimesi (bağlam olduğu gibi eşleşir). */
const baglamli = (govdeler: string, baglam: string, ara = 1) => new RegExp(` (?:${govdeler})${EK} (?:\\S+ ){0,${ara}}(?:${baglam}) `)
/** Satın alma niyeti — 'al' kökü çıplak önek olarak alınmaz ('altında', 'alerji', 'alın' ile karışır). */
const AL = 'al|alsam|alsak|alayim|alalim|alacagim|alacam|almak|almali|almaliyim|alinir|satin|kac para|(?:kirala|oner|tavsiye|fiyat)[a-z]*'

/** Açık kapsam-dışı kalıplar — duzle edilmiş metnin ` n ` (başı sonu boşluklu) hali üzerinde. */
const DISI_KALIPLAR: RegExp[] = [
  // araba / alışveriş — marka tek başına yeter; 'araba' / 'ayakkabı' yalnız alım bağlamında ('araba tutması' klinik)
  kelime('tesla|togg|bmw|mercedes|audi|volkswagen|ferrari|porsche|renault|fiat|toyota|honda|hyundai|otomobil|motosiklet'),
  baglamli('araba|ayakkabi', AL),
  / (hangi|en iyi|ikinci el) araba[a-z]* /,
  kelime('iphone|samsung|laptop|trendyol|hepsiburada|amazon|alisveris|indirim|kampanya'),
  / (bilgisayar|telefon|televizyon) alm[a-z]* /,
  / (satin al|kiralik ev|ev almak)[a-z]* /,
  kelime('emlak|konut'),
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
  kelime('fenerbahce|galatasaray|besiktas|trabzonspor|euroleague|nba'),
  / (super lig|sampiyonlar ligi|formula 1|dunya kupasi|avrupa kupasi)[a-z]* /,
  / mac(i|in|lar|lari|ta)? (\S+ ){0,3}(kac|sonuc[a-z]*|skor[a-z]*|bitti|ne zaman|kazandi) /,
  / (kac kac|kim kazandi) /,
  // haber / siyaset — 'Erdoğan' bir soyadıdır, 'seçim' tıbbi tercih de olabilir: ikisi de yalnız siyaset bağlamıyla
  / son dakika (haber|gelisme)[a-z]* /,
  kelime('haberler|trump|putin|ukrayna|gazze|israil|hukumet|siyaset|miting|tayyip'),
  / (cumhurbaskan|basbakan|milletvekil|siyasi parti)[a-z]* /,
  baglamli('secim', '(?:sonuc|anket|kampanya|vaad|vaat|baraj|miting|kim kazan)[a-z]*|tarihi|ne zaman'),
  / (genel|yerel|erken|belediye|cumhurbaskanligi) secim[a-z]* /,
  / (kime oy|oy ver|oy kullan)[a-z]* /,
  // finans — 'Faiz' bir addır, 'dolar' bir fiildir ('mesane dolar'): yalnız para bağlamıyla
  kelime('doviz|borsa|bitcoin|btc|ethereum|kripto|kriptopara|kripto para|coin|kredi|yatirim|yatirimci|bist|nasdaq|enflasyon|hissesi'),
  / (hisse senet|hisse fiyat|altin fiyat|gram altin)[a-z]* /,
  baglamli('dolar|euro|sterlin', 'kac|kur|kuru|ne kadar|ne oldu|ne olur|dustu|duser|dusecek|alinir|almali|tl|(?:yuksel|bozdur)[a-z]*'),
  / faiz(i|ler|leri)? (oran|karar|indirim|artir|artis|getiri)[a-z]* /,
  / faiz(ler|leri) (\S+ )?(dus|yuksel|art|in)[a-z]* /,
  / (mevduat|kredi|politika) faiz[a-z]* /,
  / kac tl /,
  // yemek
  / (yemek tarifi|tarifi ver|tarifini ver|ne pisirsem|restoran oner|mekan oner|pasta tarifi|kek tarifi)[a-z]* /,
  new RegExp(` nasil yapilir (?:\\S+ ){0,3}(?:kek|pilav|corba|makarna|borek|kurabiye|hamur|pizza)${EK} `),
  new RegExp(` (?:kek|pilav|corba|makarna|borek|kurabiye|hamur|pizza)${EK} (?:\\S+ ){0,3}nasil yapilir `),
  // seyahat — 'otel' / 'tatil' / 'seyahat' / 'uçuş' belirti bağlamında klinik ('otel dönüşü döküntü'): yalnız planlama bağlamıyla
  / (ucak bileti|otobus bileti|bilet al|rezervasyon yap|vize basvur)[a-z]* /,
  / (gezilecek|turistik|schengen) /,
  baglamli('otel|tatil|seyahat|ucus|gezi', '(?:oner|tavsiye|rezervasyon|ayirt|fiyat|plan)[a-z]*'),
  new RegExp(` (?:hangi|en iyi|ucuz|uygun fiyatli) (?:otel|tatil|ucus|ucak)${EK} `),
  / (tatile|tatil icin|seyahate) nere[a-z]* /,
  // eğlence — 'Burcu' bir addır: burç yalnız yalın / 'burcum' / 'burçlar' ya da burç adıyla
  kelime('netflix|spotify|eurovision|astroloji'),
  / (ne izlesem|ne dinlesem) /,
  / (film|dizi|youtube|konser|oyun) (oner|tavsiye|izle|dinle|sec|hangisi)[a-z]* /,
  / (sarki sozu|fikra anlat|saka yap|siir yaz|hikaye yaz|ruya tabiri)[a-z]* /,
  / (burc|burcum|burcumu|burcumun|burcuma|burcun|burclar|burclari|burclarin) /,
  / (koc|boga|ikizler|yengec|aslan|basak|terazi|akrep|yay|oglak|kova|balik) burcu[a-z]* /,
  / (hangi|gunluk|haftalik|aylik|yukselen) burc[a-z]* /,
  // kodlama — 'react' C-reactive ile, 'css' Churg-Strauss ile karışır: yalnız kod bağlamıyla
  kelime('python|javascript|typescript|html'),
  baglamli('react|css|sql', '(?:kod|component|bilesen|hook|sorgu|fonksiyon|script|ogren)[a-z]*|yaz|yazar misin|yazsana', 2),
  / (kod yaz|kodu yaz|program yaz|script yaz|bash script|excel formul|yazilim ogren)[a-z]* /,
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

/**
 * NOTYA-KAPSAM-06: çağrı yerlerinin kullandığı kapı — doktorun kendi hastasının adı geçen mesaj reddedilmez
 * ('Hava Güneş bugün geldi mi', 'Yağmur Kar'ın aşıları'). Ad araması yalnız karar 'ic' DEĞİLSE çalışır, yalnız addır
 * (klinik arama / sayım yok — KAPSAM-05 kuralı bozulmaz) ve doktora kapsanmıştır: başka doktorun hastasının adı,
 * hiç kayıtlı olmayan bir adla aynı kararı alır (varlık bilgisi sızmaz). Tam ad (iki+ kelime, yan yana) her kararı
 * 'ic' yapar; tek ad parçası yalnız 'belirsiz'i kaldırır — 'Yarın yağmur yağacak mı' Yağmur adlı hasta olsa da rettir.
 * Arama hata verirse modelsiz karar aynen kalır.
 */
export async function kapsamKarariHastayla(
  supabase: SupabaseClient,
  doktorId: string,
  mesaj: string | null | undefined,
  secenek: { oncekiRed?: boolean } = {},
): Promise<KapsamKarari> {
  const karar = kapsamKarari(mesaj, secenek)
  if (karar === 'ic') return karar
  let ad: 'tam' | 'tek' | null = null
  try {
    ad = await mesajdakiHastaAdi(supabase, doktorId, String(mesaj || ''))
  } catch (e) {
    console.error('[kapsam] hasta adı araması', e instanceof Error ? e.message : String(e))
  }
  if (ad === 'tam' || (ad === 'tek' && karar === 'belirsiz')) return 'ic'
  return karar
}
