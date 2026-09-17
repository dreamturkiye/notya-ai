/**
 * NOTYA-DAH-WOW C3 — Sigara bırakma paketi: paket-yıl, Heaviness of Smoking Index (HSI) → bağımlılık düzeyi, değişim evresine göre
 * danışmanlık (5A kontrol listesi), farmakoterapi SINIFI (doz yok — hekim dozu yazar), kontrendikasyon/etkileşim uyarıları,
 * bırakma tarihine göre izlem görevleri, sevk ve kaynaklar (ALO 171). SGK/ücretsiz ilaç koşulları uydurulmaz — hekim güncel mevzuattan
 * doğrular; bu kartta SGK ilaç raporu şablonu yok. Motor yalnız taslak üretir; planı hekim kilitler.
 */
import type { Dipnot } from './dahiliye'

export type DegisimEvresi = 'hazir_degil' | 'dusunuyor' | 'hazirlik' | 'eylem' | 'surdurme'
export const EVRE_AD: Record<DegisimEvresi, string> = { hazir_degil: 'Hazır değil (niyet öncesi)', dusunuyor: 'Düşünüyor (niyet)', hazirlik: 'Hazırlık', eylem: 'Eylem (bırakmış, <6 ay)', surdurme: 'Sürdürme (≥6 ay)' }
export const BES_A: { kod: 'sor' | 'oner' | 'degerlendir' | 'yardim' | 'izlem'; ad: string }[] = [
  { kod: 'sor', ad: 'Sor: her vizitte tütün kullanımını sor ve kayda geç' },
  { kod: 'oner', ad: 'Öner: açık, kişiye özgü ve net biçimde bırakmayı öner' },
  { kod: 'degerlendir', ad: 'Değerlendir: şu an bırakmaya istekli mi (değişim evresi)' },
  { kod: 'yardim', ad: 'Yardım et: bırakma planı, davranışsal destek, uygunsa farmakoterapi (hekim)' },
  { kod: 'izlem', ad: 'İzlem planla: bırakma tarihinden sonraki ilk hafta ve ilk ay içinde kontrol' },
]

export interface SigaraGirdi {
  durum: 'iciyor' | 'birakti' | 'hic' | null
  gunlukAdet: number | null; yil: number | null; ilkSigaraDk: number | null /* uyanınca ilk sigaraya kadar dakika */
  evre: DegisimEvresi | null; birakmaTarihi: string | null /* YYYY-MM-DD planlanan/gerçek */
  eGFR: number | null; nobetOyku: boolean; yemeBozuklugu: boolean; gebe: boolean; psikiyatrikOyku: boolean
  ilacMetinleri: string[]; koah: boolean; askvh: boolean; dm: boolean; bugun: string
}
export interface SigaraSonuc {
  paketYil: number | null; hsi: number | null; bagimlilik: 'dusuk' | 'orta' | 'yuksek' | null
  evreAd: string | null; yaklasim: string[]; farmakoterapiSinifi: string[]; uyarilar: string[]
  gorevler: { kod: string; ad: string; due: string }[]; sevk: string[]; kaynaklar: string[]; dipnotlar: Dipnot[]
}

export const SIGARA_KAYNAK = ['ALO 171 — Sağlık Bakanlığı Sigara Bırakma Danışma Hattı', 'Sigara bırakma polikliniği (il sağlık müdürlüğü / hastane) — randevu ALO 182 veya MHRS', 'SGK/ücretsiz ilaç koşulları: hekim güncel mevzuattan doğrular (bu kartta SGK ilaç raporu şablonu yok)']
const NRT = 'Nikotin replasman tedavisi (bant + kısa etkili form kombinasyonu) — hekim dozu yazar', VAR = 'Vareniklin — hekim dozu yazar', BUP = 'Bupropion — hekim dozu yazar'
function ekleAy(t: string, ay: number): string { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10) }
function ekleGun(t: string, gun: number): string { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + gun)).toISOString().slice(0, 10) }

export function paketYil(gunlukAdet: number | null, yil: number | null): number | null {
  if (gunlukAdet == null || yil == null || gunlukAdet < 0 || yil < 0) return null
  return Math.round((gunlukAdet / 20) * yil * 10) / 10
}
export function hsiSkoru(gunlukAdet: number | null, ilkSigaraDk: number | null): number | null {
  if (gunlukAdet == null || ilkSigaraDk == null) return null
  const a = gunlukAdet <= 10 ? 0 : gunlukAdet <= 20 ? 1 : gunlukAdet <= 30 ? 2 : 3
  const b = ilkSigaraDk <= 5 ? 3 : ilkSigaraDk <= 30 ? 2 : ilkSigaraDk <= 60 ? 1 : 0
  return a + b
}

export function sigaraDegerlendir(g: SigaraGirdi): SigaraSonuc {
  const dip: Dipnot[] = [
    { ref: 'HYP', not: 'Tütün bağımlılığı yönetimi: her vizitte kullanımı sor, kısa danışmanlık (5A), isteksiz hastada motivasyonel görüşme, bırakma tarihi ve izlem' },
    { ref: 'TIHUD2023', not: 'Farmakoterapi sınıfları: nikotin replasmanı (uzun + kısa etkili form kombinasyonu tek formdan etkili), vareniklin, bupropion; davranışsal destekle birlikte başarı artar' },
    { ref: 'HARRISON', not: 'Bupropion nöbet eşiğini düşürür (nöbet / yeme bozukluğu öyküsünde kontrendike); vareniklin ileri böbrek yetmezliğinde doz ayarı; her ikisinde nöropsikiyatrik belirti izlemi; sigara bırakınca CYP1A2 indüksiyonu kalkar' },
  ]
  const r: SigaraSonuc = { paketYil: null, hsi: null, bagimlilik: null, evreAd: null, yaklasim: [], farmakoterapiSinifi: [], uyarilar: [], gorevler: [], sevk: [], kaynaklar: [], dipnotlar: dip }
  if (g.durum === 'hic' || g.durum == null) return r
  r.paketYil = paketYil(g.gunlukAdet, g.yil)
  r.hsi = hsiSkoru(g.gunlukAdet, g.ilkSigaraDk)
  if (r.hsi != null) r.bagimlilik = r.hsi <= 1 ? 'dusuk' : r.hsi <= 4 ? 'orta' : 'yuksek'
  r.kaynaklar = [...SIGARA_KAYNAK]
  const cyp = ['klozapin', 'olanzapin', 'teofilin', 'varfarin'].filter((a) => g.ilacMetinleri.some((x) => x.toLocaleLowerCase('tr').includes(a))) // yalnız etken adı — ham metin (doz) çıktıya sızmaz
  const cypUyari = () => { if (cyp.length) r.uyarilar.push(`${cyp.join(', ')}: sigara bırakılınca CYP1A2 indüksiyonu kalkar, ilaç düzeyi değişebilir — hekim düzey/klinik izlem planlar`) }
  const komorb = () => {
    if (g.koah) r.yaklasim.push('KOAH: bırakmak akciğer fonksiyon kaybının hızını yavaşlatan en etkili müdahale')
    if (g.askvh) r.yaklasim.push('Aterosklerotik KVH: bırakma yeni koroner/serebrovasküler olay riskini belirgin azaltır')
    if (g.dm) r.yaklasim.push('Diyabet: sigara mikro/makrovasküler komplikasyon riskini ve insülin direncini artırır — bırakma glisemik ve KV yarar sağlar')
  }
  if (g.durum === 'birakti') {
    r.evreAd = EVRE_AD.surdurme
    r.yaklasim.push('Nüks önleme: yüksek riskli durumları (stres, alkol, sigara içilen ortam) ve baş etme yollarını konuş; "bir tane" kaymasının nükse dönmemesi için plan')
    r.yaklasim.push('Kilo artışı kaygısı: beslenme ve fiziksel aktivite desteği; kayma olursa utanmadan yeniden destek iste (ALO 171)')
    komorb(); cypUyari()
    if (g.birakmaTarihi) r.gorevler.push({ kod: 'sigara_12ay', ad: 'Bırakmanın 12. ayı: sürdürme kontrolü', due: ekleAy(g.birakmaTarihi, 12) })
    return r
  }
  // durum === 'iciyor'
  r.evreAd = g.evre ? EVRE_AD[g.evre] : null
  const y = r.yaklasim
  switch (g.evre) {
    case 'hazir_degil':
      y.push('Kısa motivasyonel görüşme: hastanın kendi sağlığıyla ilişkili riskleri, bırakmanın ona özgü kazançlarını ve önündeki engelleri birlikte konuş; baskı yok')
      y.push('Bir sonraki vizitte bırakma isteğini yeniden sor')
      break
    case 'dusunuyor':
      y.push('Bırakma tarihi belirlemeye teşvik et; kararsızlığın iki yanını (içme nedenleri / bırakma nedenleri) konuş')
      y.push('Engelleri (yoksunluk kaygısı, kilo, stres, çevre) ve önceki denemelerden öğrenilenleri konuş')
      break
    case 'hazirlik':
      y.push('Önümüzdeki 2 hafta içinde bırakma tarihi belirle; o gün tamamen bırak')
      y.push('Tetikleyici planı: sigarayı çağıran durumları listele, her biri için alternatif davranış; evde/araçta sigara ve çakmak bırakma')
      y.push('ALO 171 danışma hattını ve bırakma polikliniği seçeneğini tanıt')
      y.push('Farmakoterapi seçeneklerini konuş (sınıf düzeyinde — hekim seçer ve dozu yazar)')
      break
    case 'eylem':
      y.push('Yoksunluk yönetimi: huzursuzluk, sinirlilik, uyku ve iştah değişikliği birkaç haftada azalır; baş etme yolları')
      y.push('Sık izlem: ilk hafta ve ilk ay içinde temas; kayma olursa planı yeniden düzenle')
      break
    case 'surdurme':
      y.push('Nüks önleme: yüksek riskli durumlar ve baş etme planı; kayma nükse dönmeden destek')
      break
    default:
      y.push('Değişim evresini sor (5A: değerlendir) — yaklaşım evreye göre seçilir')
  }
  komorb()
  const farmaUygun = g.evre === 'hazirlik' || g.evre === 'eylem' || (g.evre == null && (r.bagimlilik === 'orta' || r.bagimlilik === 'yuksek'))
  if (farmaUygun) {
    if (g.gebe) {
      r.farmakoterapiSinifi.push('Nikotin replasman tedavisi — gebelikte yalnız hekim kararıyla (hekim dozu yazar)')
      r.uyarilar.push('Gebelik: farmakoterapi yerine davranışsal destek öncelikli; NRT yalnız hekim kararıyla; vareniklin ve bupropion önerilmez')
    } else {
      r.farmakoterapiSinifi.push(NRT, VAR)
      if (g.nobetOyku || g.yemeBozuklugu) r.uyarilar.push(`Bupropion: ${[g.nobetOyku && 'nöbet öyküsü', g.yemeBozuklugu && 'yeme bozukluğu (bulimia/anoreksiya)'].filter(Boolean).join(' + ')} — kontrendike (nöbet eşiğini düşürür); listeden çıkarıldı`)
      else r.farmakoterapiSinifi.push(BUP)
      if (g.eGFR != null && g.eGFR < 30) r.uyarilar.push(`Vareniklin: eGFR ${g.eGFR} (<30) — böbrek fonksiyonuna göre doz ayarı hekim`)
    }
    if (g.psikiyatrikOyku) r.uyarilar.push('Psikiyatrik öykü: farmakoterapi sırasında duygu durum, ajitasyon, uyku ve intihar düşüncesi açısından nöropsikiyatrik izlem — hekim')
  } else if (g.psikiyatrikOyku) r.uyarilar.push('Psikiyatrik öykü: bırakma sürecinde duygu durum değişikliği izlenir — hekim')
  cypUyari()
  if (g.birakmaTarihi) {
    const b = g.birakmaTarihi
    r.gorevler.push({ kod: 'sigara_1hafta', ad: 'Bırakma sonrası 1. hafta: yoksunluk ve kayma kontrolü', due: ekleGun(b, 7) }, { kod: 'sigara_1ay', ad: 'Bırakma sonrası 1. ay kontrolü', due: ekleAy(b, 1) }, { kod: 'sigara_3ay', ad: 'Bırakma sonrası 3. ay kontrolü', due: ekleAy(b, 3) }, { kod: 'sigara_6ay', ad: 'Bırakma sonrası 6. ay: sürdürme kontrolü', due: ekleAy(b, 6) })
  } else if (g.evre === 'hazirlik') r.gorevler.push({ kod: 'sigara_tarih', ad: 'Bırakma tarihini belirle', due: ekleGun(g.bugun, 14) })
  if (r.bagimlilik === 'yuksek') r.sevk.push('Sigara bırakma polikliniği (yüksek bağımlılık) — hekim değerlendirir')
  if (g.psikiyatrikOyku && r.farmakoterapiSinifi.length) r.sevk.push('Psikiyatri ile ortak izlem (hekim kararı)')
  return r
}
