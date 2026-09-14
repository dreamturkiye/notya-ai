/**
 * NOTYA-GELISIM-01 (Kaan 2026-09-14): "Denver II" adı geçmeyecek — ticari/telifli bir test,
 * madde/norm içeriğine erişimimiz yok. Bunun yerine T.C. Sağlık Bakanlığı'nın kendi resmi
 * "Gelişimi İzleme ve Değerlendirme Rehberi" (GİDR) — Bebek ve Çocuk İzlem Protokolleri'nin
 * bir parçası, sağlık personeli için kamuya açık yayınlanmış (kaynak: T.C. Sağlık Bakanlığı,
 * Milli Pediatri Derneği/Türk Pediatri Kurumu/Türk Neonatoloji Derneği/Sosyal Pediatri Derneği
 * katkısıyla). Standart bir "skor" üretmez — DSÖ/GİDR yaklaşımı açık uçlu görüşmedir: aile
 * her sütundaki işlevleri anlatır, sağlıklı çocukların %97'sinin o yaşta yapabildiği işlevler
 * baz alınır. Bu yüzden burada da sabit bir puanlama YOK; AI'nin rolü doktorun işaretlediği
 * gecikmeleri SOAP diline çevirmek ve "ne zaman sevk" önerisi sunmaktır — sahte bir "Denver
 * skoru" üretmez (Kaan'ın açık talimatı).
 *
 * Kapsam: 1-24 ay arası itemli (GİDR'nin standardize edilmiş kısmı). 25-36 ay kaynak belgede
 * "STANDARDİZASYON TAMAMLANMAMIŞTIR" diye açıkça işaretli — o yaş aralığını itemli
 * sunmuyoruz, uydurmuyoruz. 3 yaş ve sonrası kaynakta zaten itemli checklist değil, destekleyici
 * rehberlik metni — o kısmı "gelisimiDestekle" alanında ayrı tutuyoruz.
 */

export type GelisimAlan = 'iletisim' | 'alici-dil' | 'hareket-kaba' | 'hareket-ince' | 'iliski' | 'oyun-kendine-bakim'

export interface GelisimMaddesi {
  alan: GelisimAlan
  madde: string
}

export interface GelisimYasBasamagi {
  /** Bu basamağı bitiren sağlıklı çocukların ~%97'sinin yapabildiği işlevler (GİDR yöntemi). */
  etiket: string
  ayBaslangic: number
  ayBitis: number
  maddeler: GelisimMaddesi[]
}

export const GELISIM_ALAN_BASLIK: Record<GelisimAlan, string> = {
  'iletisim': 'Anlatım Dili',
  'alici-dil': 'Alıcı Dil (Anlama)',
  'hareket-kaba': 'Kaba Hareket',
  'hareket-ince': 'İnce Hareket',
  'iliski': 'İlişki',
  'oyun-kendine-bakim': 'Oyun / Kendine Bakım',
}

// Kaynak: T.C. Sağlık Bakanlığı, Bebek ve Çocuk İzlem Protokolleri, Akış Şeması 11a (GİDR).
export const GIDR_BASAMAKLARI: GelisimYasBasamagi[] = [
  {
    etiket: '1-3 ay', ayBaslangic: 1, ayBitis: 3, maddeler: [
      { alan: 'iletisim', madde: 'Kucaklandığında rahatlar; mutluluk, huzursuzluk, açlık durumunda farklı sesler çıkarır' },
      { alan: 'alici-dil', madde: 'Sese tepki verir, dinler, bakar' },
      { alan: 'hareket-kaba', madde: 'Yüzüstü başını kaldırır ve çevirir; sağ-sol kol ve bacaklarını eşit oynatır' },
      { alan: 'hareket-ince', madde: 'Ellerini çoğunlukla açık tutar' },
      { alan: 'iliski', madde: 'Karşısındakinin yüzüne bakar, hareketlerini izler, karşılıklı gülümser' },
      { alan: 'oyun-kendine-bakim', madde: 'Oyunlara hareketlenir, karşılık verir' },
    ],
  },
  {
    etiket: '4-5 ay', ayBaslangic: 4, ayBitis: 5, maddeler: [
      { alan: 'iletisim', madde: 'Gülmeye ek olarak mutluluk/heyecan/istek gibi duygularını yüz ifadesiyle gösterir; "aa, uu" sesleri çıkarır, kahkaha atar' },
      { alan: 'alici-dil', madde: 'Konuşulduğunda dinler, ağza bakar, seslerle karşılık verir' },
      { alan: 'hareket-kaba', madde: 'Başını dik tutar; yüzüstü başını 90° kaldırır' },
      { alan: 'hareket-ince', madde: 'Kollarını istediği nesneye doğru uzatır, ellerini birleştirir' },
      { alan: 'iliski', madde: 'Uzun süreli anlamlı göz teması kurar; bakarak/gülerek/uzanarak ilişki kurmak ister' },
      { alan: 'oyun-kendine-bakim', madde: 'Oynandığında sesler çıkarır; oyuncaklara uzanır, yakalar, ağzına götürür' },
    ],
  },
  {
    etiket: '6-7 ay', ayBaslangic: 6, ayBitis: 7, maddeler: [
      { alan: 'iletisim', madde: '"Agu"lar, sesli-sessiz harfleri birleştirir (ga, da, bı gibi)' },
      { alan: 'alici-dil', madde: 'Tanıdığı kişi/nesnelerin adını, "gitti", "ver", "gel", "al" gibi sözcükleri anlar' },
      { alan: 'hareket-kaba', madde: 'Destekle oturur; bacaklarına ağırlık verir, basar' },
      { alan: 'hareket-ince', madde: 'Elleriyle uzanır, oyuncakları/nesneleri tutar' },
      { alan: 'iliski', madde: 'Annesini ve yakın bakım vereni tanıdığını yüzüne bakarak, gülerek belli eder' },
      { alan: 'oyun-kendine-bakim', madde: 'Ellerine bakar, nesneleri sallar; "cee" oyununa şaşkınlıkla tepki verir' },
    ],
  },
  {
    etiket: '8-10 ay', ayBaslangic: 8, ayBitis: 10, maddeler: [
      { alan: 'iletisim', madde: 'Bir anlamlı sözcük söyler; istediklerini eliyle işaret ederek gösterir' },
      { alan: 'alici-dil', madde: '"Mama", "hayır" gibi sık tekrarlanan basit sözcükleri anladığını gösterir' },
      { alan: 'hareket-kaba', madde: 'Elleriyle bir yere tutunup ayağa kalkar; tutunmadan anlık ayakta durur' },
      { alan: 'hareket-ince', madde: 'Küçük cisimleri tutarken işaret parmağını "kıskaç" gibi kullanır' },
      { alan: 'iliski', madde: 'Yakınlık, mutluluk, merak, öfke gibi pek çok duyguyu gösterebilir (sarılır, öper, yabancı ortamda tutunur)' },
      { alan: 'oyun-kendine-bakim', madde: 'Oyuncakları/nesneleri atar, vurur, arar; kendisi saklanır, "cee" oynar, taklit eder (el sallar)' },
    ],
  },
  {
    etiket: '11-13 ay', ayBaslangic: 11, ayBitis: 13, maddeler: [
      { alan: 'iletisim', madde: '"Da-da" gibi heceleri birleştirir; isteğini gülerek, istemediğini geriye atılarak/başını sallayarak anlatır' },
      { alan: 'alici-dil', madde: 'Parmaklarını kullanarak kendini besler' },
      { alan: 'hareket-kaba', madde: 'Yüzüstünden sırtüstüne döner, desteksiz oturur' },
      { alan: 'hareket-ince', madde: 'Nesneleri elden ele geçirir; üzüm gibi küçük taneleri yerden alır' },
      { alan: 'iliski', madde: 'Annesinden ayrılınca tepki verebilir, kavuşunca rahatlar; yabancıları yadırgayabilir' },
      { alan: 'oyun-kendine-bakim', madde: 'Kap-kacağı vurur, doldurur, boşaltır; nesnelerin nasıl işlediğini araştırır' },
    ],
  },
  {
    etiket: '14-16 ay', ayBaslangic: 14, ayBitis: 16, maddeler: [
      { alan: 'iletisim', madde: '"Anne/baba/mama" dışında bir anlamlı sözcük daha söyler; istediğini parmağıyla işaret eder' },
      { alan: 'alici-dil', madde: '"Ayakkabılarını getir" gibi basit komutları anladığını gösterir; veda eder, el sallar' },
      { alan: 'hareket-kaba', madde: 'Yardımsız yürür' },
      { alan: 'hareket-ince', madde: 'Parmaklarını kullanarak nesneleri araştırır' },
      { alan: 'iliski', madde: 'Duygularını gösterir (sarılır, öper); yakınlarının davranışlarını taklit eder' },
      { alan: 'oyun-kendine-bakim', madde: 'Bebek/başkasını besleme, araba sürme gibi en az bir hayal oyunu kurar; parmaklarıyla kendini besler' },
    ],
  },
  {
    etiket: '17-19 ay', ayBaslangic: 17, ayBitis: 19, maddeler: [
      { alan: 'iletisim', madde: 'En az 3 anlamlı sözcük kullanır; anlattıklarının çoğunu ailesi anlayabilir' },
      { alan: 'alici-dil', madde: 'Tek basamaklı pek çok komutu anlar (ayakkabını getir, topunu al gibi)' },
      { alan: 'hareket-kaba', madde: 'Topa tekme vurur' },
      { alan: 'hareket-ince', madde: 'Kalem/çubukla kağıt veya toprak üstünde çizgi çizer; iki küpü üst üste koyar' },
      { alan: 'iliski', madde: 'Kişilere özgü ilişki kurar (dedesiyle gezmek, annesiyle uyumak ister)' },
      { alan: 'oyun-kendine-bakim', madde: 'Yardımsız yelek/hırka/ceket giyinebilir; tuvalet eğitimi ilerlemektedir' },
    ],
  },
  {
    etiket: '20-24 ay', ayBaslangic: 20, ayBitis: 24, maddeler: [
      { alan: 'iletisim', madde: 'Altı anlamlı sözcüğü vardır; "su ver" gibi iki sözcüklü cümle kurar' },
      { alan: 'alici-dil', madde: '"Anne nerede?" gibi basit soruları anlar' },
      { alan: 'hareket-kaba', madde: 'Merdivenlerden tutunarak çıkar' },
      { alan: 'hareket-ince', madde: 'Kalemi ucundan tutar' },
      { alan: 'iliski', madde: 'Yeni kişilere/çocuklara ilgi gösterir, ilişki kurmak ister' },
      { alan: 'oyun-kendine-bakim', madde: 'Tabak, çatal, kaşık, bardak kullanır; yelek/ceketini yardımsız çıkarabilir' },
    ],
  },
]

/** Kaynak belgede 25-36 ay için: "STANDARDİZASYON TAMAMLANMAMIŞTIR" — itemli sunulmuyor. */
export const GIDR_25_36_AY_NOTU = '25-36 ay için GİDR\'nin kaynak belgesinde standart madde listesi henüz tamamlanmamış olarak belirtiliyor; bu aralıkta itemli bir liste sunmuyoruz.'

/**
 * 3 yaş ve sonrası: kaynak belge itemli checklist değil, ebeveyne yönelik destekleyici
 * gelişim rehberliği veriyor (duygusal/iletişim/hareket alanlarında ne beklenir, nasıl
 * desteklenir). Doktorun kullanımı için özetlendi, birebir aktarıldı — uydurma yok.
 */
export const GIDR_3_YAS_SONRASI_REHBERLIK = {
  baslik: '3 Yaş – Okul Öncesi (GİDR destekleyici rehberlik, itemli değil)',
  ozet: [
    'Bağımsızlık isteği ve öz güven pekişir; sorular sorma, anlatma isteği ve merak doruktadır.',
    'Konuşması ve anlaması ilişkilerinin temel taşıdır; cümle kurma, olay/duygu anlatma gelişir.',
    'Koşma, tırmanma, merdiven inip-çıkma güçlenir; parmak becerileri (kesme-yapıştırma, boncuk dizme, düğme ilikleme) gelişir.',
    'Duygusal, sosyal, hareket ve dil alanlarında belirgin bir gerilik/endişe varsa ileri değerlendirmeye yönlendirin.',
  ],
}

export interface GelisimYaniti { alan: GelisimAlan; madde: string; yapiyor: boolean }

/** Hangi yaş basamağı kullanılmalı — çocuğun ayına göre en uygun (bitirdiği son) basamağı bulur. */
export function gidrBasamakBul(ayYas: number): GelisimYasBasamagi | null {
  const uygun = GIDR_BASAMAKLARI.filter((b) => ayYas >= b.ayBaslangic)
  if (!uygun.length) return null
  return uygun[uygun.length - 1]
}
