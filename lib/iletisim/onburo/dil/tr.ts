/**
 * WHATSAPP-ONBURO-01 — the Turkish pack of "Ayşe ön büro" (Türkiye build). Pure, no network.
 *
 * Matching follows iptalNiyeti.ts: the text is folded with normalizeTr (ı/İ/I → i, diacritics stripped, punctuation and
 * emoji removed, doubled letters collapsed: "saat" → "sat", "randevuu" → "randevu") and compared on whole TOKENS or on
 * space-anchored phrases — never with JS \b or the /i flag, which mishandle the Turkish dotted / dotless i. Every
 * vocabulary entry below is written in the folded + collapsed form.
 *
 * The medical and emergency lists are deliberately broad: a false positive costs one holding sentence and a card for the
 * doctor; a false negative could let an automatic answer stand next to a medical question. They await clinician review
 * (docs/OPEN-COMMITMENTS.md WHATSAPP-ONBURO-01).
 */
import { duzeltmeMesafesi, iptalSiniflandir, normalizeTr } from '@/lib/iletisim/whatsapp/iptalNiyeti'
import { katla } from '@/lib/iletisim/whatsapp/niyet'
import { KVKK_ONAY_KISA } from '@/lib/iletisim/whatsapp/kvkk'
import { goreliTarihCoz } from '@/lib/randevu/tarihCozumle'
import type { BilgiAlani, OnBuroDili, RandevuNiyeti, SlotTercihi } from './tipler'

const MAKSIMUM_KELIME = 14

/** randevu, randevuyu, randevum … and the typos randavu, randvu, rnadevu, randeu (first letter must be r). */
export function randevuKelimesiMi(t: string): boolean {
  if (t.startsWith('randevu')) return t.length <= 16
  if (t[0] !== 'r' || t.length < 6 || t.length > 8) return false
  return duzeltmeMesafesi(t, 'randevu') <= 1
}
/** First-person possessive: "randevum", "randevumu", "randevumuz" — talk ABOUT an existing appointment. */
const SAHIPLIK = /^randevu(m|mu|muz|muzu|mun|mda|mdan|ma|miz|mizi)$/

/** "istiyorum" and its everyday spellings (istiyom, istyorum, isterim, istiyoruz, isticem). */
function istekKelimesiMi(t: string): boolean {
  if (/^(istiyorum|istiyoruz|istiyom|isterim|isteriz|isticem|isticez|istiyordum|istiyorduk|isterdim|istemistim)$/.test(t)) return true
  return t.startsWith('ist') && t.length >= 7 && t.length <= 10 && duzeltmeMesafesi(t, 'istiyorum') <= 1
}
/** "al-" as a request: almak, alabilir, alayım, alalım, alacaktım, alıcam, alcam, alsam … (never the past "aldım"). */
const ALMA = /^(almak|almam|almamiz|alabilir|alabilirim|alabiliriz|alabilirmiyim|alabilirmiyiz|alayim|alalim|alacaktim|alacaktik|alacagim|alacagiz|alicam|alicaz|alcam|alcaz|alsam|alsak|alabilsem|alim|alirmiyim)$/
const DIGER_ISTEK = /^(rica|lazim|gerek|gerekiyor|gerekli|lutfen|olustur\w*|ayarla\w*|ayarlar\w*|planla\w*|verir|verebilir|verin|verirseniz|verebilirseniz|acar|acabilir|acin|yazar|yazabilir|yazin|talep|talebim|talebi)$/
const GECMIS = /^(aldim|aldik|almistim|almistik|alindi|alinmis|alinmisti|verildi|verilmis|verdiniz|vermistiniz|vardi|olusturuldu|yapildi|yaptirdim|yaptirmistim)$/
const OLUMSUZ = new Set([
  'istemiyorum', 'istemiyoruz', 'istemem', 'istemedim', 'almayacagim', 'almayacagiz', 'almicam', 'almiyorum', 'almadim', 'almayalim',
  'gerekmiyor', 'degil', 'degilim', 'degildir', 'vazgectim', 'vazgectik', 'olmasin', 'hayir', 'gereksiz',
])
const BELIRSIZ = new Set(['belki', 'dusunuyorum', 'dusunuyoruz', 'emin', 'bakariz', 'ilerde', 'ileride'])
/** Information questions that are NOT a booking: price, how-to, where. They go to the practice sheet instead. */
const BILGI_SORUSU = /(^| )(nasil|ne kadar|ucret\w*|fiyat\w*|kac (tl|lira|para)|nerede|adres\w*)( |$)/
/** Availability asked without the noun, and the "I want to be seen" family. */
const UYGUNLUK = /(^| )((bos|uygun|musait|yakin) (bir )?(sat|satiniz|gun|gununuz|yer|yeriniz|zaman|tarih)\w* (var mi|varmi|var midir|ne zaman)|en yakin (ne zaman|hangi gun|sat|gun|tarih|randevu)\w*|ne zaman gelebilirim|ne zaman gelebiliriz|ne zamana (gun|sira|randevu) (var|verirsiniz)|(muayene|kontrol) olmak ist\w*|(muayeneye|kontrole|doktora|hekime) (gelmek|gorunmek) ist\w*|gorunmek ist\w*|(sira|gun|yer) (almak|ayirtmak) ist\w*|(sira|gun) alabilir (miyim|miyiz))( |$)/
const YALIN = new Set(['randevu', 'yeni randevu', 'randevu lutfen', 'randevu rica', 'randevu rica ediyorum', 'randevu icin', 'randevu icin yaziyorum', 'randevu talebi', 'randevu talep ediyorum'])

function randevuNiyeti(metin: string): RandevuNiyeti {
  const k = normalizeTr(metin)
  if (!k) return 'yok'
  const kelimeler = k.split(' ')
  if (kelimeler.length > MAKSIMUM_KELIME) return 'yok'
  const isim = kelimeler.some(randevuKelimesiMi)
  const uygunluk = UYGUNLUK.test(' ' + k + ' ')
  if (!isim && !uygunluk) return 'yok'
  // Cancel / reschedule wording always belongs to the existing flow (iptalNiyeti.ts), never to a new booking.
  const iptal = iptalSiniflandir(metin).tur
  if (iptal === 'guclu' || iptal === 'zayif' || iptal === 'yeniden' || iptal === 'olumsuz' || iptal === 'celiski') return 'degil'
  if (kelimeler.some((t) => OLUMSUZ.has(t) || BELIRSIZ.has(t) || GECMIS.test(t))) return 'degil'
  if (BILGI_SORUSU.test(' ' + k + ' ')) return 'degil'
  if (uygunluk) return 'istek'
  if (YALIN.has(k)) return 'istek'
  const istek = kelimeler.some((t) => istekKelimesiMi(t) || ALMA.test(t) || DIGER_ISTEK.test(t)) || /(^| )(var mi|varmi|bos mu|musait mi)( |$)/.test(' ' + k + ' ')
  const sahiplik = kelimeler.some((t) => SAHIPLIK.test(t))
  // "randevum ne zaman / var mı / onaylandı mı": the patient talks about HIS appointment. Only an explicit acquire verb
  // ("randevum yok, randevu almak istiyorum") makes it a request.
  if (sahiplik && !kelimeler.some((t) => ALMA.test(t))) return 'degil'
  return istek ? 'istek' : 'degil'
}

const BASKA_GUN = /(^| )(baska (bir )?(gun|zaman|tarih|sat)\w*|uymuyor|uymaz|uymadi|olmuyor|hicbiri|hic biri|bunlar olmaz|farkli (bir )?(gun|sat|zaman)\w*)( |$)/
const DAHA_GEC = /(^| )(daha gec|daha sonra|daha ileri|ileri (bir )?tarih\w*|sonraki hafta|sonraki gun\w*)( |$)/
const DAHA_ERKEN = /(^| )(daha erken|daha yakin|en yakin|en erken|daha once)( |$)/
const SABAH = /(^| )(sabah\w*|ogleden once|oglene kadar|oglenden once)( |$)/
const OGLEDEN_SONRA = /(^| )(ogleden sonra\w*|oglen sonra\w*|oglenden sonra\w*|aksam\w*|aksamustu|ikindi\w*|mesai sonrasi|is cikisi)( |$)/
const SAYISAL_TARIH = /(^| )(\d{1,2})[./](\d{1,2})( |$)/

function tercih(metin: string, simdi: Date, saatDilimi: string): SlotTercihi | null {
  const k = ' ' + normalizeTr(metin) + ' '
  const t: SlotTercihi = {}
  if (SABAH.test(k)) t.dilim = 'sabah'
  else if (OGLEDEN_SONRA.test(k)) t.dilim = 'ogleden_sonra'
  // Dates: the shared resolver reads un-collapsed folded text ("salı" → "sali", "15 kasım" → "15 kasim").
  const gun = goreliTarihCoz(katla(metin), saatDilimi, simdi)
  const bugun = goreliTarihCoz('bugun', saatDilimi, simdi) || ''
  if (gun && gun >= bugun) t.gun = gun
  else {
    const m = String(metin || '').match(SAYISAL_TARIH)
    if (m) {
      const g = Number(m[2]), a = Number(m[3])
      if (g >= 1 && g <= 31 && a >= 1 && a <= 12) {
        let yil = Number(bugun.slice(0, 4))
        let iso = `${yil}-${String(a).padStart(2, '0')}-${String(g).padStart(2, '0')}`
        if (iso < bugun) { yil += 1; iso = `${yil}${iso.slice(4)}` }
        t.gun = iso
      }
    }
  }
  if (!t.gun) {
    if (BASKA_GUN.test(k)) t.baskaGun = true
    if (DAHA_GEC.test(k)) t.dahaGec = true
    else if (DAHA_ERKEN.test(k)) t.dahaErken = true
  }
  return Object.keys(t).length ? t : null
}

function secim(metin: string): number | null {
  const m = katla(metin).match(/^([1-3])( numara| nolu| inci| nci| uncu| olsun| olur| tamam)?$/)
  return m ? Number(m[1]) : null
}

// ── Guards (folded text; substring stems, on purpose broad) ───────────────────────────────────────────────────────────
const ACIL = [
  /gogus\w* agri|gogsum\w* (agri|sikis|yan)|gogsumde|kalp krizi|kalbim (sikis|duracak)|carpinti\w* (cok|siddetli)/,
  /nefes (alam|alamiyor|darligi|darlig)|nefesi? (kesil|daral)|nefessiz|boguluyor|bogulacak|morardi|morariyor/,
  /kanama\w* (dur|cok|siddetli|var)|kan (kusuyor|kustu|geliyor)|cok kan|kanamasi durmuyor|kan kaybi/,
  /intihar|kendimi oldur|kendini oldur|olmek istiyorum|yasamak istemiyorum|canima kiy|kendime zarar/,
  /nobet (gecir|geciriyor|gecirdi)|havale (gecir|geciriyor|gecirdi)|kasiliyor|kasildi|titreyerek bayil/,
  /bilinc\w* (kapa|yok|kayb|bulanik)|suur\w* (kapa|yok|kayb|bulanik)|bayildi|bayiliyor|baygin|uyanmiyor|tepki vermiyor|kendinde degil/,
  /felc|yuzu (kaydi|egri)|konusamiyor|kolu (tutmuyor|uyustu)|inme gecir/,
  /zehirlen|ilac(lari)? (ictim hepsini|hepsini icti)|fazla doz|yuksek doz (aldi|icti)|camasir suyu icti|yuttu/,
  /alerjik sok|anafilak|dili sisti|bogazi sisti|dudagi sisti|yuzu sisti/,
  /bebek (emmiyor|nefes almiyor|morardi|uyanmiyor)|cocuk (nefes alamiyor|morardi|uyanmiyor|bayildi)/,
  /olecegim|oluyorum|acil( durum\w*)?( |$)|ambulans\w*/,
]
const TIBBI = [
  /ilac\w*|hap\w*|surup\w*|antibiyotik\w*|agri kesici|damla\w*|krem\w*|merhem\w*|igne\w*|asi(si|yi|dan|lar\w*)?( |$)|serum|tablet\w*|kapsul\w*|fitil\w*/,
  /doz\w*|kac (mg|ml|olcek|damla|tane)|mg( |$)|ml( |$)|olcek|ac karna|tok karna|gunde kac|kac satte bir|icsin mi|icmeli|kullanayim mi|kullanmali|vereyim mi|vermeli|devam edeyim mi|birakayim mi|keseyim mi/,
  /ates\w*|oksur\w*|ishal|kus(ma|tu|uyor)\w*|bulanti\w*|agri\w*|agriyor|sanci\w*|kasinti\w*|dokuntu\w*|kizarik\w*|sislik\w*|sisti|morluk|yara\w*|akinti\w*|kanama\w*|kan (geldi|geliyor)|halsiz\w*|bas donmesi|carpinti\w*|nefes\w*|hirilti\w*|krampl?\w*|uyusma\w*|yanma\w*|iltihap\w*|enfeksiyon\w*|grip\w*|nezle|covid|korona/,
  /tahlil\w*|sonuc\w*|test\w* (sonuc|degeri|cikti)|kan degeri|deger(ler)?i\w*|rapor\w*|mr\w* sonuc|rontgen|ultrason|biyopsi|patoloji|emar/,
  /normal mi|normal midir|tehlikeli mi|zararli mi|yan etki\w*|endise|ciddi mi|onemli mi|gecer mi|ne yapmaliyim|ne yapmam lazim|ne yapayim|ne onerirsiniz|iyi gelir mi|kullanabilir miyim|icebilir miyim|yiyebilir miyim/,
  /hamile\w*|gebe\w*|gebelik\w*|emzir\w*|adet\w*|regl\w*|dusuk|bebegim\w*|bebek hareket|cocugum\w* (yemiyor|uyumuyor|agliyor|hasta)|kilo (aldi|verdi|almiyor)/,
  /tani\w*|teshis\w*|hastalig\w*|ameliyat\w*|tedavi\w*|recete\w*|tansiyon\w*|seker\w* (yuksek|dusuk|olctum|cikti)|kolesterol|nabiz|tiroid|insulin|alerji\w*/,
]

/** Every guard entry starts at a word boundary ("masası" must not read as "aşı"). */
const basta = (r: RegExp) => new RegExp('(^| )(' + r.source + ')')
const ACIL_K = ACIL.map(basta)
const TIBBI_K = TIBBI.map(basta)

const BILGI_KURALLARI: Array<{ alan: BilgiAlani; desen: RegExp }> = [
  { alan: 'adres', desen: /(^| )(adres\w*|neredesiniz|nerede\w*|yeriniz\w*|nasil gelirim|nasil gelebilirim|yol tarifi|hangi (semt|ilce|cadde|sokak|bina|kat))( |$)/ },
  { alan: 'harita', desen: /(^| )(konum\w*|harita\w*|lokasyon\w*|yol tarifi|navigasyon)( |$)/ },
  { alan: 'calismaSaatleri', desen: /(^| )(calisma sat\w*|mesai\w*|kacta (aciliyor|kapaniyor|acik)|kaca kadar|sat kaca kadar|acik mi(siniz)?|aciksiniz|kapali mi(siniz)?|hangi gunler\w*|cumartesi (acik|calisiyor)\w*|pazar (acik|calisiyor)\w*|hafta sonu (acik|calisiyor)\w*)( |$)/ },
  { alan: 'otopark', desen: /(^| )(otopark\w*|park yeri|park (var|edebilir)\w*|arac(la|imi)?\w* (park|gel)\w*|vale)( |$)/ },
  { alan: 'ulasim', desen: /(^| )(ulasim\w*|metro\w*|otobus\w*|minibus\w*|dolmus\w*|tramvay\w*|marmaray|toplu tasima|duragi?\w*)( |$)/ },
  { alan: 'ucretler', desen: /(^| )(ucret\w*|fiyat\w*|ne kadar|kac (tl|lira|para)|muayene (parasi|bedeli)|ucretli mi|ucretsiz mi|tarife\w*)( |$)/ },
  { alan: 'odeme', desen: /(^| )(odeme\w*|kredi karti|kart (geciyor|gecerli|kabul)\w*|nakit\w*|taksit\w*|havale|eft|iban|pos)( |$)/ },
  { alan: 'sigorta', desen: /(^| )(sigorta\w*|sgk\w*|ozel sigorta|tamamlayici\w*|tss|oss|anlasmali\w*|provizyon\w*)( |$)/ },
  { alan: 'getirilecekler', desen: /(^| )(ne getir\w*|neler getir\w*|yanimda ne\w*|gelirken ne\w*|getirmem gereken\w*|hangi (belge|evrak)\w*|kimlik (gerek|lazim|getir)\w*)( |$)/ },
  { alan: 'iptalPolitikasi', desen: /(^| )(iptal (kosul|politika|kural|suresi|ucreti)\w*|kac sat once iptal|gelmezsem|gelemezsem ne olur)( |$)/ },
  // "telefonum 0532…" / "numaram" is the patient giving HIS number — only a question about the practice's number matches.
  { alan: 'telefon', desen: /(^| )(telefon numaraniz\w*|telefonunuz\w*|telefon numarasi\w*|telefon numarasini\w*|numaraniz\w*|sabit hat\w*|arayabilir miyim|nereden arayabilirim|hangi numara\w*|sizi (nasil|nereden) ara\w*|telefonla (ulas|ara)\w*)( |$)/ },
]
const HAZIRLIK = /(^| )(hazirlik\w*|hazirlan\w*|ac (mi )?(gelmeli|geleyim|gelmem)\w*|ac karna (mi )?gel\w*|oncesinde ne yap\w*|gelmeden once\w*)( |$)/
const KONTROL = /(^| )(kontrol\w*|takip)( |$)/
const ILK = /(^| )(ilk (kez|defa|muayene)\w*|yeni hasta\w*|daha once gelmedim)( |$)/

const SORU_TOKENLERI = new Set([
  'mi', 'mu', 'miyim', 'muyum', 'miyiz', 'muyuz', 'midir', 'mudur', 'misiniz', 'musunuz', 'misin', 'musun', 'neden', 'nasil', 'nerede', 'neresi',
  'hangi', 'kac', 'kacta', 'nedir', 'niye', 'nicin', 'kim', 'ne', 'neler', 'ogrenebilir', 'ogrenmek', 'bilgi', 'sormak', 'soracaktim', 'merak',
])

/** Everyday words that are never part of a name (a greeting or a thank-you must not be filed as one). */
const AD_DEGIL = new Set([
  'merhaba', 'selam', 'selamlar', 'tesekkur', 'tesekkurler', 'ederim', 'ederiz', 'sagol', 'sagolun', 'tamam', 'evet', 'hayir', 'lutfen', 'istiyorum',
  'iyi', 'gunler', 'aksamlar', 'kolay', 'gelsin', 'rica', 'gun', 'sat', 'yarin', 'bugun', 'olur', 'olmaz', 'peki', 'anladim', 'hocam', 'doktor', 'bey', 'hanim',
])

const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

export const TR_ON_BURO: OnBuroDili = {
  kod: 'tr',
  acilNumara: '112',
  randevuNiyeti,
  tercih,
  secim,
  acilMi: (metin) => { const k = ' ' + normalizeTr(metin) + ' '; return ACIL_K.some((r) => r.test(k)) },
  tibbiMi: (metin) => { const k = ' ' + normalizeTr(metin) + ' '; return TIBBI_K.some((r) => r.test(k)) },
  soruMu: (metin) => /\?/.test(String(metin || '')) || normalizeTr(metin).split(' ').some((t) => SORU_TOKENLERI.has(t)),
  bilgiAlanlari: (metin) => {
    const k = ' ' + normalizeTr(metin) + ' '
    const alanlar: BilgiAlani[] = BILGI_KURALLARI.filter((x) => x.desen.test(k)).map((x) => x.alan)
    if (HAZIRLIK.test(k)) alanlar.push(KONTROL.test(k) ? 'hazirlik.kontrol' : ILK.test(k) ? 'hazirlik.ilk_muayene' : 'hazirlik.muayene')
    return Array.from(new Set(alanlar))
  },
  ziyaretTuru: (metin) => { const k = ' ' + normalizeTr(metin) + ' '; return KONTROL.test(k) ? 'kontrol' : ILK.test(k) ? 'ilk_muayene' : null },
  adSoyad: (metin) => {
    const ham = String(metin || '').replace(/^\s*(ben|adım soyadım|adim soyadim|adım|adim|ismim|ad soyad|isim)\s*[:\-]?\s*/i, '').replace(/[.,!]+$/g, '').trim()
    if (ham.length < 5 || ham.length > 60 || /\d/.test(ham)) return null
    const parcalar = ham.split(/\s+/)
    if (parcalar.length < 2 || parcalar.length > 4) return null
    if (normalizeTr(ham).split(' ').some((t) => AD_DEGIL.has(t) || randevuKelimesiMi(t))) return null
    if (!parcalar.every((p) => /^[A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû'’-]{2,}$/.test(p))) return null
    return parcalar.map((p) => p.charAt(0).toLocaleUpperCase('tr-TR') + p.slice(1).toLocaleLowerCase('tr-TR')).join(' ')
  },
  zamanEtiketi: (iso, saatDilimi) => {
    const d = new Date(iso)
    const gun = new Intl.DateTimeFormat('tr-TR', { timeZone: saatDilimi, day: 'numeric', month: 'long', weekday: 'long' }).format(d)
    const saat = new Intl.DateTimeFormat('tr-TR', { timeZone: saatDilimi, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d)
    return `${gun} ${saat}`
  },
  alanEtiketi: {
    adres: 'Adres', harita: 'Konum', calismaSaatleri: 'Çalışma saatleri', otopark: 'Otopark', ulasim: 'Ulaşım', ucretler: 'Ücretler',
    odeme: 'Ödeme', sigorta: 'Sigorta / SGK', getirilecekler: 'Yanınızda getirin', iptalPolitikasi: 'İptal koşulları', telefon: 'Telefon',
    'hazirlik.ilk_muayene': 'İlk muayene hazırlığı', 'hazirlik.muayene': 'Muayene hazırlığı', 'hazirlik.kontrol': 'Kontrol hazırlığı',
  },
  calismaSaatiMetni: (gunler) => {
    const sira = ['1', '2', '3', '4', '5', '6', '0']
    const parcalar: string[] = []
    for (const g of sira) {
      const x = gunler[g]
      if (x?.acik) parcalar.push(`${GUNLER[Number(g)]} ${x.baslangic}–${x.bitis}`)
    }
    return parcalar.join(', ')
  },
  metin: {
    oneri: (satirlar, onayli) => `Size uygun zamanlar:\n${satirlar.map((s, i) => `${i + 1}) ${s}`).join('\n')}\nSeçmek için numarasını yazın${onayli ? '; muayenehanemiz onayladığında size bildirilecektir' : ''}. Başka bir gün ya da saat isterseniz yazabilirsiniz (ör. “salı”, “öğleden sonra”).`,
    slotYok: 'Şu an size önerebileceğimiz boş bir saat bulamadık. Muayenehanemiz sizinle iletişime geçecektir.',
    tercihYok: 'İstediğiniz zamanda boş saat bulamadık. En yakın uygun zamanlar şöyle:',
    slotDoldu: 'Seçtiğiniz saat az önce doldu.',
    talepAlindi: (zaman) => `Randevu talebiniz alındı: ${zaman}. Muayenehanemizin onayı bekleniyor; onaylandığında size bildirilecektir.`,
    randevuOlustu: (zaman) => `Randevunuz oluşturuldu: ${zaman}. İptal etmek isterseniz “İPTAL” yazabilirsiniz. Görüşmek üzere.`,
    talepOnaylandi: (zaman) => `Randevunuz onaylandı: ${zaman}. Görüşmek üzere.`,
    talepReddedildi: 'Randevu talebiniz bu saat için onaylanamadı. Yeni bir saat için bu numaraya “randevu” yazabilir ya da muayenehaneyi arayabilirsiniz.',
    randevuGeriAlindi: (zaman) => `${zaman} randevunuz muayenehanemiz tarafından iptal edildi. Uygun bir saat için sizinle iletişime geçilecektir.`,
    istekBirakildi: 'Anlaşıldı, randevu isteğiniz için bir işlem yapılmadı. Yeniden randevu almak isterseniz “randevu” yazabilirsiniz.',
    oneriSiniri: 'Size uygun bir saati birlikte bulalım: muayenehanemiz sizinle iletişime geçecektir.',
    kimIcin: (adlar) => `Randevu kimin için?\n${adlar.map((a, i) => `${i + 1}) ${a}`).join('\n')}\nNumarasını yazmanız yeterli.`,
    adSor: 'Randevu talebiniz için lütfen adınızı ve soyadınızı yazın.',
    adAnlasilmadi: 'Adınızı ve soyadınızı tek mesajda yazar mısınız? (ör. Ayşe Yılmaz)',
    yeniHastaTalebi: (zaman) => `Teşekkürler. Randevu talebiniz${zaman ? ` (${zaman})` : ''} muayenehanemize iletildi; onaylandığında size bildirilecektir.`,
    bekleme: 'Sorunuzu muayenehanemize ilettik; en kısa sürede dönüş yapılacaktır.',
    tibbi: 'Sorunuzu hekimimize ilettik. Mesajla tanı ya da tedavi önerisi veremiyoruz; hekimimiz ya da muayenehanemiz size dönüş yapacaktır. Acil bir durumda 112’yi arayın.',
    acil: 'Bu kanal acil durumlar için değildir. Lütfen şimdi 112’yi arayın ya da en yakın acil servise gidin.',
    gizlilik: (doktorAdi) => `${doktorAdi ? `${doktorAdi} muayenehanesi` : 'Muayenehanemiz'}: randevu talebiniz için adınız ve bu telefon numaranız kaydedilecektir. ${KVKK_ONAY_KISA}`,
    yanitOnEki: '',
  },
}
