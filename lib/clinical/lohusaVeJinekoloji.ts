/**
 * NOTYA-KHD-03 — Lohusa izlemi + jinekoloji (kadın sağlığı) motoru.
 * Kaynaklar: T.C. SB Doğum Sonu Bakım Yönetim Rehberi (2014/2018) — ilk 24 saat hastane protokolü,
 * 24 saat → 42. gün doğum sonrası bakım protokolü; T.C. SB Kanser Tarama Standartları (KETEM):
 * serviks HPV/smear 30-65 yaş 5 yılda bir, meme mamografi 40-69 yaş 2 yılda bir, kolorektal
 * (GGK) 50-70 yaş 2 yılda bir; SB Aile Planlaması Danışmanlığı yöntem listesi.
 * Lohusa izlem pencerelerinin kesin gün aralıkları rehberin 2018 baskısından hekimle doğrulanacak
 * (specialistReview) — burada rehberin iki bölümlü yapısı + 42 gün bitiş noktası esas alındı.
 */

export interface LohusaPenceresi { no: 1 | 2 | 3 | 4; etiket: string; gunBas: number; gunSon: number; maddeler: string[] }

export const SB_LOHUSA_TAKVIMI: LohusaPenceresi[] = [
  { no: 1, etiket: 'İlk 24 saat (hastane)', gunBas: 0, gunSon: 1, maddeler: [
    'Kanama/uterus tonusu, tansiyon, nabız, ateş, idrar çıkışı',
    'Perine/insizyon değerlendirmesi, erken mobilizasyon',
    'Emzirmenin ilk saat içinde başlatılması, ten tene temas',
    'Rh negatif annede anti-D, Hepatit B/BCG yenidoğan uygulamaları (SB Aşı Takvimi)',
  ]},
  { no: 2, etiket: '2. izlem (2.-5. gün)', gunBas: 2, gunSon: 5, maddeler: [
    'Kanama (loşi) miktarı/kokusu, uterus involüsyonu, ateş, perine/insizyon iyileşmesi',
    'Meme/emzirme: tutuş, süt gelişi, meme başı sorunları, tıkanıklık/mastit belirtileri',
    'Demir desteğine devam (SB demir akış şeması), beslenme, sıvı',
    'Duygu durumu, uyku, destek sistemi; tehlike işaretleri eğitimi',
  ]},
  { no: 3, etiket: '3. izlem (13.-17. gün)', gunBas: 13, gunSon: 17, maddeler: [
    'Loşi değişimi, involüsyon, perine/insizyon, idrar/dışkı kontrolü',
    'Emzirme sürdürülüyor mu, bebek kilo alımı (pediatri ile ortak)',
    'Doğum sonrası depresyon açısından sorgulama (EPDS ile taranabilir)',
    'Aile planlaması danışmanlığı başlangıcı',
  ]},
  { no: 4, etiket: '4. izlem (30.-42. gün)', gunBas: 30, gunSon: 42, maddeler: [
    'Genel muayene, tansiyon, Hb (anemi), pelvik muayene gerekirse',
    'Aile planlaması yöntemi seçimi (emzirmeyle uyumlu yöntemler öncelikli)',
    'Cinsel yaşama dönüş, pelvik taban egzersizleri, egzersiz/kilo',
    'Kronik hastalık (GDM/HT) sonrası kontrol; GDM sonrası 6-12. haftada OGTT',
  ]},
]

export type LohusaDurum = 'tamamlandi' | 'zamani' | 'gecikmis' | 'ileride'
export function lohusaDurumlari(dogumSonrasiGun: number, yapilanGunler: number[]): Array<LohusaPenceresi & { durum: LohusaDurum }> {
  return SB_LOHUSA_TAKVIMI.map((p) => {
    const yapildi = yapilanGunler.some((g) => g >= p.gunBas && g <= p.gunSon)
    let durum: LohusaDurum = 'ileride'
    if (yapildi) durum = 'tamamlandi'
    else if (dogumSonrasiGun > p.gunSon) durum = 'gecikmis'
    else if (dogumSonrasiGun >= p.gunBas) durum = 'zamani'
    return { ...p, durum }
  })
}

export interface Tarama { id: 'serviks' | 'meme' | 'kolorektal'; ad: string; yasBas: number; yasSon: number; aralikYil: number; kaynak: string }
export const KETEM_TARAMALARI: Tarama[] = [
  { id: 'serviks', ad: 'Serviks kanseri — HPV/smear', yasBas: 30, yasSon: 65, aralikYil: 5, kaynak: 'SB Kanser Tarama Standartları (KETEM), HPV bazlı program' },
  { id: 'meme', ad: 'Meme kanseri — mamografi', yasBas: 40, yasSon: 69, aralikYil: 2, kaynak: 'SB Kanser Tarama Standartları (KETEM)' },
  { id: 'kolorektal', ad: 'Kolorektal kanser — GGK', yasBas: 50, yasSon: 70, aralikYil: 2, kaynak: 'SB Kanser Tarama Standartları (KETEM)' },
]

export interface TaramaDurumu extends Tarama { uygun: boolean; sonTarih: string | null; sonrakiTarih: string | null; durum: 'gerekli' | 'guncel' | 'yakinda' | 'kapsam-disi' }

export function taramaDurumlari(yas: number | null, sonTarihler: Partial<Record<Tarama['id'], string | null>>, bugun = new Date()): TaramaDurumu[] {
  return KETEM_TARAMALARI.map((t) => {
    const uygun = yas !== null && yas >= t.yasBas && yas <= t.yasSon
    const son = sonTarihler[t.id] || null
    let sonraki: string | null = null, durum: TaramaDurumu['durum'] = 'kapsam-disi'
    if (uygun) {
      if (!son) durum = 'gerekli'
      else {
        const d = new Date(son); d.setFullYear(d.getFullYear() + t.aralikYil); sonraki = d.toISOString().slice(0, 10)
        const kalanGun = (d.getTime() - bugun.getTime()) / 86_400_000
        durum = kalanGun < 0 ? 'gerekli' : kalanGun < 90 ? 'yakinda' : 'guncel'
      }
    }
    return { ...t, uygun, sonTarih: son, sonrakiTarih: sonraki, durum }
  })
}

/** SB Aile Planlaması Danışmanlığı yöntem kataloğu (danışmanlık için — seçim hekim/hastanındır). */
export const KONTRASEPSIYON_YONTEMLERI = [
  { id: 'ria-bakir', ad: 'Bakırlı RİA', emzirmeUyumlu: true, not: '10 yıla kadar; doğum sonrası 4-6. haftadan itibaren' },
  { id: 'ria-hormonlu', ad: 'Levonorgestrelli RİA', emzirmeUyumlu: true, not: '5 yıl' },
  { id: 'implant', ad: 'Deri altı implant', emzirmeUyumlu: true, not: '3 yıl' },
  { id: 'enjeksiyon', ad: 'Aylık/3 aylık enjeksiyon', emzirmeUyumlu: true, not: 'Yalnız progestin içeren form emzirmede uygun' },
  { id: 'mini-hap', ad: 'Yalnız progestin hap (mini hap)', emzirmeUyumlu: true, not: 'Emzirmede ilk seçeneklerden' },
  { id: 'koc', ad: 'Kombine oral kontraseptif', emzirmeUyumlu: false, not: 'Emzirmede ilk 6 ay önerilmez' },
  { id: 'kondom', ad: 'Kondom', emzirmeUyumlu: true, not: 'CYBE koruması' },
  { id: 'lam', ad: 'Laktasyonel amenore (LAM)', emzirmeUyumlu: true, not: 'İlk 6 ay, tam emzirme ve amenore koşuluyla' },
  { id: 'tup-ligasyon', ad: 'Tüp ligasyonu / vazektomi', emzirmeUyumlu: true, not: 'Kalıcı yöntem' },
]

/** Menopoz değerlendirme başlıkları (danışmanlık çerçevesi — TJOD menopoz kılavuzu ile uyumlu, tanı hekimindir). */
export const MENOPOZ_DEGERLENDIRME = [
  'Son adet tarihi ve 12 ay amenore (doğal menopoz tanımı)',
  'Vazomotor semptomlar (sıcak basması, gece terlemesi) — sıklık/şiddet',
  'Genitoüriner sendrom (kuruluk, disparoni, üriner yakınmalar)',
  'Uyku, duygu durumu, bilişsel yakınmalar',
  'Kemik sağlığı: risk faktörleri, DXA endikasyonu (65+ veya risk varsa daha erken)',
  'Kardiyovasküler risk: TA, lipid, glukoz',
  'Hormon tedavisi endikasyon/kontrendikasyonları (meme kanseri, VTE, KAH öyküsü)',
  'KETEM taramaları güncel mi (mamografi, HPV/smear)',
]
