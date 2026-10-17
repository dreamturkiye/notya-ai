/**
 * MUAYENE-EKLERI-01 — transkriptten "bir ek gerekir ama yüklenmemiş" ipuçlarını bulur. Saf + istemci-güvenli.
 *
 * Yalnız ÖNERİDİR: Ekleri Ekle ekranında kısa, kapatılabilir bir satır olarak gösterilir; not üretimini ASLA engellemez.
 *
 * Güvence (testler: hatirlatici.test.ts):
 *  - Kural cümle (yan cümle) bazındadır. Aynı cümlede olumsuzlama ("yaptırmamış", "olmamış", "yapılmamış", "istemedi",
 *    "reddetti", "eksik") varsa aşı hatırlatıcısı ÇIKMAZ — hastanın geçmişi/beyanı bu muayenede yapılan bir işlem değildir.
 *  - Gelecek / başka ziyaret ("bir sonraki ziyarette yapacağız", "haftaya") hatırlatıcı çıkarmaz; "yapacağım" yalnız
 *    "şimdi / birazdan / hemen" ile birlikteyse sayılır.
 *  - İstem fiilleri ("tahlil istedim", "grafi çektirelim") hatırlatıcı çıkarmaz: hekim o an elinde bir belge olduğunu
 *    söylemiyor. Yalnız ekleme / yükleme / "baktım" / "getirmiş" gibi eldeki bir belgeyi anan fiiller sayılır.
 *  - \b Türkçe harflerde güvenilmez; kelime sınırı için Unicode lookaround kullanılır.
 */
import type { EkTuru } from './tipler'

export type HatirlaticiKodu = 'asi' | 'barkod' | 'lab' | 'rontgen' | 'ekg' | 'foto' | 'genel'

export interface Hatirlatici {
  kod: HatirlaticiKodu
  /** Yüklenince hangi ek türü karşılar (yükle düğmesi bu türü önerir). */
  tur: EkTuru | null
  /** Hekime gösterilen yumuşak soru. */
  mesaj: string
  /** Tetikleyen cümle (ekranda gösterilir; log'a yazılmaz). */
  kanit: string
}

const KS = '(?![\\p{L}\\p{N}])' // kelime sonu
const KB = '(?<![\\p{L}\\p{N}])' // kelime başı

const ASI_ADLARI = [
  'hexaxim', 'pentaxim', 'infanrix', 'kpa', 'prevenar', 'synflorix', 'rotarix', 'rotateq', 'kkk', 'mmr', 'bcg',
  'dabt', 'dabt-ipa', 'menveo', 'nimenrix', 'bexsero', 'gardasil', 'varivax', 'havrix', 'engerix', 'td',
].join('|')

// Bu muayenede yapılan işlem fiilleri (geçmiş / şimdiki).
const ASI_FIIL_ANLIK =
  '(?:yaptım|yaptık|yapıyorum|yapıyoruz|yapıldı|yapılıyor|yapıyoruz|verdim|verdik|veriyorum|veriyoruz|verildi|vurdum|vurduk|vuruyorum|vuruyoruz|vuruldu|uyguladım|uyguladık|uyguluyorum|uyguluyoruz|uygulandı|yaptırdım)'
// Gelecek fiilleri — yalnız "şimdi/birazdan" ile.
const ASI_FIIL_GELECEK = '(?:yapacağım|yapacağız|vereceğim|vereceğiz|vuracağım|vuracağız|uygulayacağım|uygulayacağız)'
const ANLIK_ZAMAN = new RegExp(`${KB}(?:şimdi|birazdan|hemen|az\\s+sonra|şu\\s+an|şimdi\\s+de)${KS}`, 'u')

const ASI_OZNE = `(?:aşı\\p{L}*|(?:${ASI_ADLARI})${KS})`
const ARA = '(?:\\s+[\\p{L}\\p{N}\\-]+){0,3}?'
const ASI_ANLIK_RE = new RegExp(`${KB}${ASI_OZNE}${ARA}\\s+${ASI_FIIL_ANLIK}${KS}`, 'u')
const ASI_GELECEK_RE = new RegExp(`${KB}${ASI_OZNE}${ARA}\\s+${ASI_FIIL_GELECEK}${KS}`, 'u')

const ASI_OLUMSUZ = new RegExp(
  [
    `yaptırma(?:mış|dı|mışlar|mıştı|dık|dılar|yacak|yacağ)`,
    `yaptırmak\\s+istemi`,
    `yaptırmadı`,
    `olma(?:mış|dı|mışlar|mıştı|dık|dılar|yacak)`,
    `olmak\\s+istemi`,
    `yapılma(?:mış|dı|mıştı|yacak)`,
    `yapma(?:dım|dık|dı|yacağ|yacak|mış)`,
    `vurma(?:dım|dık|dı|yacağ)`,
    `verme(?:dim|dik|di|yeceğ)`,
    `uygulama(?:dım|dık|dı|yacağ)`,
    `uygulanma(?:dı|mış)`,
    `istemedi`, `istemiyor`, `reddet`, `kabul\\s+etme`, `eksik`, `gecik`, `atlan`, `kaçır`,
  ].map((p) => `${p}`).join('|'),
  'u',
)
const GELECEK_ZAMAN = new RegExp(
  `${KB}(?:sonraki|gelecek|haftaya|kontrolde|kontrole|randevuda|randevuya|hafta\\s+sonra|ay\\s+sonra|yarın|önümüzdeki|bir\\s+dahaki|dahaki)${KS}`,
  'u',
)

const LAB_ISIM = new RegExp(
  `${KB}(?:tahlil|tetkik|lab|laboratuvar|laboratuar|hemogram|biyokimya|kan\\s+sayım|idrar\\s+tahlil|crp|tsh|ferritin|hba1c|sedimantasyon|kan\\s+değer)\\p{L}*`,
  'u',
)
const RONTGEN_ISIM = new RegExp(
  `${KB}(?:röntgen|rontgen|grafi|akciğer\\s+grafi|ultrason|usg|ultrasonografi|tomografi|manyetik\\s+rezonans|mrg|eko(?:kardiyografi)?)\\p{L}*`,
  'u',
)
const EKG_ISIM = new RegExp(`${KB}(?:ekg|elektrokardiyografi|kardiyogram)\\p{L}*`, 'u')
const FOTO_ISIM = new RegExp(`${KB}(?:fotoğraf|foto|resim)\\p{L}*`, 'u')
const ONCE_SONRA = new RegExp(`${KB}(?:önce(?:si)?|öncesi)\\s+(?:ve\\s+|ile\\s+)?(?:sonra(?:sı)?|sonrası)${KS}`, 'u')
const BUYUME_FOTO = new RegExp(`${KB}büyüme\\s+(?:grafiği\\s+)?(?:fotoğraf|foto)\\p{L}*`, 'u')
const BARKOD = new RegExp(`${KB}(?:barkod|karekod|qr\\s*kod|lot\\s*(?:no|numara))\\p{L}*`, 'u')
const BARKOD_FIIL = new RegExp(`${KB}(?:okut|okutt|okutac|okuyac|okuyor|okudum|tara|taray|taradı|taradım|tarıyor|tarıyorum|tarayac)\\p{L}*`, 'u')

// Eldeki belgeyi anan fiiller. İstem fiilleri (iste-, çektir-, yaptır-) BİLEREK yok.
const EKLE_FIIL = new RegExp(
  `${KB}(?:ekle(?:yeceğim|yelim|yeceğiz|yip|dim|dik|yorum|yoruz|rim)|ekli|yükle(?:yeceğim|yelim|yeceğiz|dim|dik|yorum|yoruz|rim)|sisteme\\s+(?:gir|ekle|yükle|kaydet)\\p{L}*|kaydedeceğim|kaydediyorum)${KS}`,
  'u',
)
const BAKTIM_FIIL = new RegExp(
  `${KB}(?:bak(?:tım|tık|ıyorum|ıyoruz)|inceledim|inceliyorum|getirmiş|getirmişler|getirdi|getirdiler|elinde|elindeki|gördüm|görüyoruz|görüyorum)${KS}`,
  'u',
)
const CEKTIM_FIIL = new RegExp(`${KB}(?:çektim|çektik|çekiyorum|çekiyoruz|çekeceğim|çekelim|çekiyoruz)${KS}`, 'u')

const GENEL_ISIM = new RegExp(`${KB}(?:belge|dosya|sonuç|rapor)\\p{L}*`, 'u')

const MESAJ: Record<HatirlaticiKodu, { mesaj: string; tur: EkTuru | null }> = {
  asi: { mesaj: 'Muayene sırasında aşı yaptığınızı söylediniz — aşı bilgisini yüklemek ister misiniz?', tur: 'asi' },
  barkod: { mesaj: 'Barkodu okuttuğunuzdan söz ettiniz — barkodu taramak ister misiniz?', tur: 'asi' },
  lab: { mesaj: 'Bir laboratuvar sonucundan söz ettiniz — tahlili yüklemek ister misiniz?', tur: 'lab' },
  rontgen: { mesaj: 'Bir röntgen / görüntülemeden söz ettiniz — dosyayı eklemek ister misiniz?', tur: 'rontgen' },
  ekg: { mesaj: 'Bir EKG\'den söz ettiniz — kaydı eklemek ister misiniz?', tur: 'ekg' },
  foto: { mesaj: 'Fotoğraftan söz ettiniz — fotoğrafları eklemek ister misiniz?', tur: 'foto' },
  genel: { mesaj: 'Bir belge ekleyeceğinizi söylediniz — şimdi eklemek ister misiniz?', tur: null },
}

/** Konuşma dilindeki noktalama yoksa da cümleleri ayırır (ve/ama/fakat bağlaçlarında bölmez — olumsuzlama aynı cümlede aranır). */
export function tumceleriAyir(transkript: string): string[] {
  return String(transkript || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[ \t]+/g, ' ')
    .split(/[.!?;\n…]+|\s+[-–—]\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function kodBul(c: string, pediatrik: boolean): HatirlaticiKodu[] {
  const kodlar: HatirlaticiKodu[] = []
  const gelecekCumle = GELECEK_ZAMAN.test(c)
  // Aşı: yalnız bu muayenede yapılan işlem; olumsuzlama / başka ziyaret → yok. Olumsuzlama AYNI yan cümlede aranır
  // ("aşı yaptırmamış, bugün aşı yaptım" ikinci parçadan hatırlatır; "aşısı eksik, bugün yaptım" konu olmadığı için çıkmaz).
  for (const parca of c.split(/,|\s(?:ama|fakat|ancak|ve)\s/u)) {
    if (ASI_OLUMSUZ.test(parca) || GELECEK_ZAMAN.test(parca)) continue
    if (ASI_ANLIK_RE.test(parca) || (ASI_GELECEK_RE.test(parca) && ANLIK_ZAMAN.test(c))) { kodlar.push('asi'); break }
  }

  if (BARKOD.test(c) && BARKOD_FIIL.test(c) && !ASI_OLUMSUZ.test(c)) kodlar.push('barkod')

  const ekle = EKLE_FIIL.test(c)
  const baktim = BAKTIM_FIIL.test(c)
  const cektim = CEKTIM_FIIL.test(c)

  if (LAB_ISIM.test(c) && (ekle || baktim) && !gelecekCumle) kodlar.push('lab')
  if (RONTGEN_ISIM.test(c) && (ekle || baktim) && !gelecekCumle) kodlar.push('rontgen')
  if (EKG_ISIM.test(c) && (ekle || baktim || cektim) && !gelecekCumle) kodlar.push('ekg')

  const fotoIsim = FOTO_ISIM.test(c) || ONCE_SONRA.test(c) || (pediatrik && BUYUME_FOTO.test(c))
  if (fotoIsim && (ekle || cektim || baktim) && !gelecekCumle) kodlar.push('foto')
  else if (ONCE_SONRA.test(c) && FOTO_ISIM.test(c) && !gelecekCumle) kodlar.push('foto')

  // Konu belirtmeden "ekleyeceğim" — yalnız başka kod çıkmadıysa.
  if (!kodlar.length && ekle && GENEL_ISIM.test(c) && !gelecekCumle) kodlar.push('genel')
  return kodlar
}

/**
 * Transkriptten hatırlatıcı adaylarını çıkarır (her kod için en fazla bir kez; ilk eşleşen cümle kanıt olur).
 * `pediatrik` yalnız pediatrik kapsamda büyüme-fotoğrafı ifadesini açar (branş alan sızması).
 */
export function ekHatirlaticilar(transkript: string, secenek: { pediatrik?: boolean } = {}): Hatirlatici[] {
  const gorulen = new Map<HatirlaticiKodu, Hatirlatici>()
  for (const cumle of tumceleriAyir(transkript)) {
    for (const kod of kodBul(cumle, !!secenek.pediatrik)) {
      if (gorulen.has(kod)) continue
      gorulen.set(kod, { kod, tur: MESAJ[kod].tur, mesaj: MESAJ[kod].mesaj, kanit: cumle.slice(0, 160) })
    }
  }
  return Array.from(gorulen.values())
}

const KARSILAYAN_TUR: Record<HatirlaticiKodu, EkTuru[] | 'herhangi'> = {
  asi: ['asi'],
  barkod: ['asi'],
  lab: ['lab'],
  rontgen: ['rontgen'],
  ekg: ['ekg'],
  foto: ['foto'],
  genel: 'herhangi',
}

/** Zaten yüklenmiş ek varsa o hatırlatıcı gösterilmez. `mevcutTurler` = yüklenmiş eklerin (bilinen) türleri. */
export function eksikHatirlaticilar(adaylar: Hatirlatici[], mevcutTurler: EkTuru[]): Hatirlatici[] {
  return adaylar.filter((h) => {
    const k = KARSILAYAN_TUR[h.kod]
    if (k === 'herhangi') return mevcutTurler.length === 0
    return !mevcutTurler.some((t) => k.includes(t))
  })
}
