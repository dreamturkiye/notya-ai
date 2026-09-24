/**
 * PEDI-ARACLAR-02 — Araçlar › Gelişim taraması paneli: "bu vizitte hangi tarama gerekli?" Pure.
 *
 * Kaynak (birincil, okundu): T.C. SB Bebek, Çocuk, Ergen İzlem Protokolleri 2018 (genelge 2019/12) — izlem takvimi ve
 * pencereleri, kırmızı refle, görme taraması (yenidoğan, 36–48 ay, ilkokul 1. sınıf), GİDR (0–3 yaş; en az 6–9 ay,
 * 18. ay ve 24–36 ay), otizm değerlendirmesi (18 ay, 24 ay, 3 yaş), D vitamini ve demir profilaksisi; HSGM Yenidoğan
 * İşitme Taraması güncel test protokolü (tarama ABR: ≤ 72 saat, 7–15. gün, 15–30. gün; 30. günden sonra tarama yok).
 *
 * Bağlanan motorlar (kopya yok): GİDR maddeleri lib/clinical/gelisimTaramasi.ts (gidrBasamakBul), M-CHAT-R/F
 * lib/clinical/mchatR.ts (panel HastaMchat'i olduğu gibi takar). "Denver II" adı kullanılmaz (telifli; madde/norm yok —
 * NOTYA-GELISIM-01); standart gelişim testi yalnız GİDR'de gecikme varsa "yönlendirme" satırı olarak çıkar.
 *
 * Resmi metinde sayısal pencere bulunmayanlar (30/36/48/60 ay ve yıllık izlem pencereleri, 6 yaş görme penceresi)
 * `dogrulandi: false` — arayüzde "öneri — hekim kilitler".
 */
import { gidrBasamakBul, type GelisimYasBasamagi } from '@/lib/clinical/gelisimTaramasi'
import { gunEkle, gunFarki } from './girdi'

export interface IzlemVizit { id: string; etiket: string; basGun: number; sonGun: number; dogrulandi: boolean }

const ayGun = (ay: number) => Math.round(ay * 30.4375)
const yasGunu = (yil: number) => Math.round(yil * 365.25)

/** SB İzlem Protokolü 2018 — izlem vizitleri ve gün pencereleri (≤ 24 ay protokolde yazılı). */
export const IZLEM_PROTOKOLU: IzlemVizit[] = [
  { id: 'dogum', etiket: 'Doğum', basGun: 0, sonGun: 0, dogrulandi: true },
  { id: 'hafta1', etiket: '1. hafta (1–10. gün)', basGun: 1, sonGun: 10, dogrulandi: true },
  { id: 'gun15', etiket: '15. gün', basGun: 11, sonGun: 29, dogrulandi: true },
  { id: 'gun41', etiket: '41. gün', basGun: 30, sonGun: 59, dogrulandi: true },
  { id: 'ay2', etiket: '2. ay', basGun: 60, sonGun: 89, dogrulandi: true },
  { id: 'ay3', etiket: '3. ay', basGun: 90, sonGun: 115, dogrulandi: true },
  { id: 'ay4', etiket: '4. ay', basGun: 120, sonGun: 150, dogrulandi: true },
  { id: 'ay6', etiket: '6. ay', basGun: 180, sonGun: 210, dogrulandi: true },
  { id: 'ay9', etiket: '9. ay', basGun: 250, sonGun: 290, dogrulandi: true },
  { id: 'ay12', etiket: '12. ay', basGun: 365, sonGun: 394, dogrulandi: true },
  { id: 'ay18', etiket: '18. ay', basGun: 481, sonGun: 570, dogrulandi: true },
  { id: 'ay24', etiket: '24. ay', basGun: 661, sonGun: 760, dogrulandi: true },
  // Protokolde vizit var, gün penceresi yazılı değil → ay başından itibaren 60 gün (öneri — hekim kilitler).
  ...[30, 36, 48, 60].map((ay) => ({ id: `ay${ay}`, etiket: `${ay}. ay`, basGun: ayGun(ay), sonGun: ayGun(ay) + 59, dogrulandi: false })),
  // 6–21 yaş her yıl → yaş gününden itibaren 90 gün (öneri — hekim kilitler).
  ...Array.from({ length: 16 }, (_, i) => i + 6).map((y) => ({ id: `yas${y}`, etiket: `${y} yaş`, basGun: yasGunu(y), sonGun: yasGunu(y) + 89, dogrulandi: false })),
]

export type TaramaTur = 'isitme' | 'kirmizi_refle' | 'gorme' | 'rop' | 'otizm' | 'dvit' | 'demir' | 'hb'
export const TARAMA_TURLERI: TaramaTur[] = ['isitme', 'kirmizi_refle', 'gorme', 'rop', 'otizm', 'dvit', 'demir', 'hb']
export type TaramaSonuc = 'yapildi' | 'normal' | 'ileri_degerlendirme' | 'sevk'
export const SONUC_AD: Record<TaramaSonuc, string> = { yapildi: 'yapıldı', normal: 'normal', ileri_degerlendirme: 'ileri değerlendirme', sevk: 'sevk edildi' }

export interface TaramaKaydi { tur: TaramaTur; tarih: string; sonuc: TaramaSonuc; kaynak?: 'panel' | 'bebek_karti' }
export interface MchatKaydi { tarih: string; risk: 'dusuk' | 'orta' | 'yuksek'; puan?: number }
export interface GidrKaydi { tarih: string; sevk?: boolean }

export type KalemDurum = 'simdi' | 'gecikti' | 'dikkat' | 'tamam' | 'yaklasiyor' | 'surekli'
export type KalemKod = TaramaTur | 'gidr' | 'isitme_risk' | 'gelisim_testi'

export interface TaramaKalemi {
  kod: KalemKod
  ad: string
  durum: KalemDurum
  /** "0–30. gün" gibi pencere ya da "her izlemde". */
  pencere: string
  /** Hekime ne yapılacağını söyleyen tek cümle. */
  ne: string
  kaynak: string
  dogrulandi: boolean
  /** Panelde nasıl tamamlanır. */
  arac: 'mchat' | 'gidr' | 'isaret' | 'bilgi'
  /** Tamamlandıysa son kayıt. */
  son?: { tarih: string; sonuc: string } | null
}

export interface VizitGirdisi {
  dogumIso: string
  bugunIso: string
  gebelikHaftasi?: number | null
  dogumKiloGr?: number | null
  taramalar?: TaramaKaydi[]
  mchat?: MchatKaydi[]
  gidr?: GidrKaydi[]
  /** Hasta seçiliyse: muayene (seans) tarihleri — izlem vizitlerini işaretlemek için. */
  seanslar?: string[]
}

export interface IzlemDurumu extends IzlemVizit { durum: 'yapildi' | 'kacirildi' | 'simdi' | 'gelecek' | 'bilinmiyor'; bas: string; son: string }

export interface VizitPlani {
  yasGun: number
  /** ≤ 37 haftada doğanlarda gelişim değerlendirmesi için düzeltilmiş yaş (gün); aşıda KULLANILMAZ. */
  duzeltilmisGun: number | null
  simdikiVizit: IzlemDurumu | null
  sonrakiVizit: IzlemDurumu | null
  izlem: IzlemDurumu[]
  kalemler: TaramaKalemi[]
  gidrBasamak: GelisimYasBasamagi | null
  preterm: boolean
}

const KAYNAK_IZLEM = 'SB Bebek, Çocuk, Ergen İzlem Protokolleri 2018'
const KAYNAK_ISITME = 'HSGM Yenidoğan İşitme Taraması test protokolü'
const pencereMetni = (bas: number, son: number) => (son < 60 ? `${bas}–${son}. gün` : son < 800 ? `${Math.round(bas / 30.4375)}–${Math.round(son / 30.4375)}. ay` : `${Math.round(bas / 30.4375)}–${Math.round(son / 30.4375)} ay`)

function pencereliKalem(
  yasGun: number, dogumIso: string, kayitTarihleri: string[], bas: number, son: number, yaklasGun = 60,
): { durum: KalemDurum; son: string | null } {
  const basT = gunEkle(dogumIso, bas), sonT = gunEkle(dogumIso, son)
  const icinde = kayitTarihleri.filter((t) => t >= gunEkle(basT, -15) && t <= gunEkle(sonT, 30)).sort()
  if (icinde.length) return { durum: 'tamam', son: icinde[icinde.length - 1] }
  if (yasGun < bas) return { durum: bas - yasGun <= yaklasGun ? 'yaklasiyor' : 'surekli', son: null }
  if (yasGun <= son) return { durum: 'simdi', son: null }
  return { durum: 'gecikti', son: null }
}

interface Pencere { bas: number; son: number; ad: string; mchat?: boolean }
/**
 * Çok pencereli tarama (GİDR, otizm): bugün bir pencerenin içindeyse o; değilse en son kaçırılan; o da yoksa sıradaki.
 * `tolerans`: pencere bitiminden sonra kaydı hâlâ o pencereye sayma süresi (gün).
 */
function pencereSec(yasGun: number, dogumIso: string, tarihler: string[], pencereler: Pencere[], tolerans = 30) {
  const yapildi = (p: Pencere) => tarihler.some((t) => t >= gunEkle(dogumIso, p.bas - 15) && t <= gunEkle(dogumIso, p.son + tolerans))
  const icinde = pencereler.find((p) => yasGun >= p.bas && yasGun <= p.son + tolerans)
  const kacan = pencereler.filter((p) => p.son + tolerans < yasGun && !yapildi(p))
  if (icinde) return { pencere: icinde, durum: (yapildi(icinde) ? 'tamam' : 'simdi') as KalemDurum, kacan }
  const sonKacan = kacan[kacan.length - 1]
  const sonraki = pencereler.find((p) => p.bas > yasGun)
  if (sonKacan) return { pencere: sonKacan, durum: 'gecikti' as KalemDurum, kacan }
  if (sonraki) return { pencere: sonraki, durum: (sonraki.bas - yasGun <= 60 ? 'yaklasiyor' : 'surekli') as KalemDurum, kacan }
  return { pencere: pencereler[pencereler.length - 1], durum: 'tamam' as KalemDurum, kacan }
}

export function vizitPlani(g: VizitGirdisi): VizitPlani {
  const yasGun = gunFarki(g.dogumIso, g.bugunIso)
  const preterm = g.gebelikHaftasi != null && g.gebelikHaftasi < 37
  const duzeltilmisGun = g.gebelikHaftasi != null && g.gebelikHaftasi <= 37 && yasGun < 3 * 365
    ? Math.max(0, yasGun - Math.round((40 - g.gebelikHaftasi) * 7)) : null
  const taramalar = g.taramalar || []
  const tarihleri = (tur: TaramaTur) => taramalar.filter((t) => t.tur === tur).map((t) => t.tarih)
  const sonKayit = (tur: TaramaTur) => taramalar.filter((t) => t.tur === tur).sort((a, b) => a.tarih.localeCompare(b.tarih)).pop() || null
  const seanslar = g.seanslar || null

  // ─── İzlem takvimi ────────────────────────────────────────────────────────────────────────────
  const izlem: IzlemDurumu[] = IZLEM_PROTOKOLU.filter((v) => v.basGun <= yasGun + 400).map((v) => {
    const bas = gunEkle(g.dogumIso, v.basGun), son = gunEkle(g.dogumIso, v.sonGun)
    let durum: IzlemDurumu['durum']
    const seansVar = seanslar ? seanslar.some((t) => t >= bas && t <= son) : false
    if (seansVar) durum = 'yapildi'
    else if (yasGun < v.basGun) durum = 'gelecek'
    else if (yasGun <= v.sonGun) durum = 'simdi'
    else durum = seanslar ? 'kacirildi' : 'bilinmiyor'
    return { ...v, durum, bas, son }
  })
  const simdikiVizit = izlem.find((v) => yasGun >= v.basGun && yasGun <= v.sonGun) || null
  const sonrakiVizit = izlem.find((v) => v.basGun > yasGun) || null

  const kalemler: TaramaKalemi[] = []

  // ─── İşitme ───────────────────────────────────────────────────────────────────────────────────
  if (yasGun <= 3 * 365) {
    const s = sonKayit('isitme')
    // 6. aydan sonra kayıt yoksa "gecikti" değil bilgi: tarama çoğunlukla doğumhanede yapılmıştır — sonucu teyit edin.
    const durum: KalemDurum = s ? (s.sonuc === 'ileri_degerlendirme' || s.sonuc === 'sevk' ? 'dikkat' : 'tamam') : yasGun <= 30 ? 'simdi' : yasGun <= 180 ? 'gecikti' : 'surekli'
    kalemler.push({
      kod: 'isitme', ad: 'Yenidoğan işitme taraması', durum, pencere: '0–30. gün (tarama ABR: ≤ 72 saat, 7–15. gün, 15–30. gün)',
      ne: s ? (durum === 'dikkat' ? 'Tarama geçemedi — tanısal odyolojik değerlendirme sonucunu izleyin.' : 'Tarama kayıtlı.')
        : yasGun <= 30 ? 'Tarama yapıldı mı? Sonucu işaretleyin.' : yasGun <= 180 ? 'Kayıtta tarama yok; 30. günden sonra tarama yapılmaz — tanısal değerlendirme yönlendirmesi hekim kararı.'
          : 'Kayıtta yenidoğan işitme taraması yok — sonucu aileden / e-Nabız\'dan teyit edip işaretleyin; risk faktörü ya da ebeveyn kaygısı varsa odyolojik değerlendirme.',
      kaynak: KAYNAK_ISITME, dogrulandi: true, arac: 'isaret', son: s ? { tarih: s.tarih, sonuc: SONUC_AD[s.sonuc] } : null,
    })
  }
  // NOTYA-TARAMA-KAPSAM-01 (Kaan, 2026-09-24): İşitme risk faktörleri hatırlatıcısı kaldırıldı — tarama
  // listesinden çıkarılması istendi. Yenidoğan işitme taramasının kendisi (yukarıdaki blok) etkilenmedi.

  // ─── Görme ────────────────────────────────────────────────────────────────────────────────────
  const ropRiski = (g.gebelikHaftasi != null && g.gebelikHaftasi <= 32) || (g.dogumKiloGr != null && g.dogumKiloGr <= 1500)
  if (ropRiski && yasGun <= 180) {
    const r = pencereliKalem(yasGun, g.dogumIso, tarihleri('rop'), 21, 35, 21)
    kalemler.push({ kod: 'rop', ad: 'ROP muayenesi yönlendirmesi', durum: r.durum, pencere: '4. hafta', ne: '≤ 32 hafta ya da ≤ 1500 g: 4. haftada göz muayenesine yönlendirin.', kaynak: KAYNAK_IZLEM, dogrulandi: true, arac: 'isaret', son: r.son ? { tarih: r.son, sonuc: 'yapıldı' } : null })
  }
  // NOTYA-TARAMA-KAPSAM-01 (Kaan, 2026-09-24): Kırmızı refle hatırlatıcısı kaldırıldı — tarama
  // listesinden çıkarılması istendi. 'kirmizi_refle' TaramaTur olarak (başka bir yüzeyde kayıt
  // desteği varsa diye) dokunulmadan kaldı; yalnız bu otomatik hatırlatıcı çıkarıldı.
  for (const p of [
    { bas: ayGun(36), son: ayGun(48) - 1, ad: 'Görme taraması (36–48 ay)', ne: 'Lea sembolleriyle görme keskinliği; < 0,5 ya da iki göz arasında 2 sıra fark → sevk.', dogrulandi: true },
    { bas: yasGunu(6), son: yasGunu(7) - 1, ad: 'Görme taraması (ilkokul 1. sınıf / 6 yaş)', ne: 'Görme keskinliği ≤ 0,7 ya da iki göz arasında 2 sıra fark → sevk.', dogrulandi: false },
  ]) {
    if (yasGun < p.bas - 120 || yasGun > p.son + 365) continue
    const r = pencereliKalem(yasGun, g.dogumIso, tarihleri('gorme'), p.bas, p.son, 120)
    const s = r.son ? taramalar.find((t) => t.tur === 'gorme' && t.tarih === r.son) : null
    kalemler.push({ kod: 'gorme', ad: p.ad, durum: s && (s.sonuc === 'sevk' || s.sonuc === 'ileri_degerlendirme') ? 'dikkat' : r.durum, pencere: pencereMetni(p.bas, p.son), ne: p.ne, kaynak: KAYNAK_IZLEM, dogrulandi: p.dogrulandi, arac: 'isaret', son: s ? { tarih: s.tarih, sonuc: SONUC_AD[s.sonuc] } : null })
  }

  // ─── Gelişim (GİDR) ───────────────────────────────────────────────────────────────────────────
  const gelisimYasi = duzeltilmisGun ?? yasGun
  const gidrBasamak = gelisimYasi < 3 * 365 ? gidrBasamakBul(Math.floor(gelisimYasi / 30.4375)) : null
  const gidrTarihleri = (g.gidr || []).map((x) => x.tarih)
  if (yasGun <= 3 * 365 + 180) {
    const secim = pencereSec(yasGun, g.dogumIso, gidrTarihleri, [
      { bas: 183, son: 290, ad: '6–9 ay' },
      { bas: 481, son: 570, ad: '18. ay' },
      { bas: 730, son: 3 * 365, ad: '24–36 ay' },
    ])
    const son = (g.gidr || []).slice().sort((a, b) => a.tarih.localeCompare(b.tarih)).pop()
    const oncekiKacan = secim.kacan.filter((p) => p !== secim.pencere)
    kalemler.push({
      kod: 'gidr', ad: `Gelişim değerlendirmesi — GİDR (${secim.pencere.ad}${secim.durum === 'gecikti' ? ' penceresi kaçtı' : ''})`,
      durum: yasGun < 183 ? 'surekli' : secim.durum === 'simdi' && oncekiKacan.length ? 'gecikti' : secim.durum,
      pencere: 'en az 3 kez: 6–9 ay · 18. ay · 24–36 ay',
      ne: yasGun < 183 ? 'İlk 6 ayda destekleyici kullanım; ailenin gözlemini sorun.'
        : `${secim.durum === 'gecikti' ? `${secim.pencere.ad} değerlendirmesi kayıtta yok — bu vizitte GİDR ile değerlendirin. ` : oncekiKacan.length ? `Kaçırılan: ${oncekiKacan.map((p) => p.ad).join(', ')}. ` : ''}${duzeltilmisGun != null ? 'Prematüre: düzeltilmiş yaşla değerlendirin. ' : ''}${secim.durum === 'gecikti' ? '' : secim.durum === 'tamam' ? 'Bu pencerede kayıtlı.' : 'GİDR ile değerlendirin.'}`.trim(),
      kaynak: KAYNAK_IZLEM, dogrulandi: true, arac: 'gidr', son: son ? { tarih: son.tarih, sonuc: son.sevk ? 'sevk önerisi' : 'kayıtlı' } : null,
    })
    if ((g.gidr || []).some((x) => x.sevk)) {
      kalemler.push({ kod: 'gelisim_testi', ad: 'Standart gelişim değerlendirmesine yönlendirme', durum: 'dikkat', pencere: 'GİDR\'de gecikme', ne: 'Son GİDR\'de gecikme işaretli — çocuk gelişim birimine / standart teste yönlendirme hekim kararı.', kaynak: KAYNAK_IZLEM, dogrulandi: true, arac: 'bilgi' })
    }
  }

  // ─── Otizm (SB: 18 ay, 24 ay, 3 yaş) — araç M-CHAT-R/F (16–30 ay) ───────────────────────────────
  if (yasGun >= ayGun(15) && yasGun <= ayGun(42)) {
    const mchatTarih = (g.mchat || []).map((m) => m.tarih)
    const otizmTarih = [...mchatTarih, ...tarihleri('otizm')]
    const secim = pencereSec(yasGun, g.dogumIso, otizmTarih, [
      { bas: 481, son: 570, ad: '18. ay', mchat: true },
      { bas: 661, son: 760, ad: '24. ay', mchat: true },
      { bas: ayGun(36), son: ayGun(36) + 59, ad: '3 yaş', mchat: false },
    ])
    const aktif = secim.pencere
    // M-CHAT-R/F 16–30 ay geçerli: kaçırılan 18/24. ay penceresi 30. aya kadar M-CHAT ile telafi edilir.
    const mchatUygun = yasGun <= ayGun(30) + 15
    const kacan = secim.kacan.filter((p) => p !== aktif)
    const sonM = (g.mchat || []).slice().sort((a, b) => a.tarih.localeCompare(b.tarih)).pop()
    const riskli = sonM && sonM.risk !== 'dusuk'
    kalemler.push({
      kod: 'otizm', ad: `Otizm değerlendirmesi (${aktif.ad}${secim.durum === 'gecikti' ? ' penceresi kaçtı' : ''})`,
      durum: riskli ? 'dikkat' : secim.durum === 'simdi' && kacan.length ? 'gecikti' : secim.durum,
      pencere: 'SB: 18 ay · 24 ay · 3 yaş',
      ne: riskli ? `Son M-CHAT-R/F: ${sonM!.risk === 'yuksek' ? 'yüksek' : 'orta'} risk — ileri değerlendirme / sevk hekim kararı.`
        : secim.durum === 'tamam' ? 'Bu pencerede kayıtlı.'
          : mchatUygun ? `${secim.durum === 'gecikti' ? `${aktif.ad} değerlendirmesi kayıtta yok. ` : kacan.length ? `Kaçırılan: ${kacan.map((p) => p.ad).join(', ')}. ` : ''}M-CHAT-R/F uygulayın (16–30 ay).`
            : 'M-CHAT-R/F 30 ay üstünde geçerli değil — SB izlem protokolündeki otizm değerlendirmesini klinik olarak yapıp işaretleyin.',
      kaynak: `${KAYNAK_IZLEM} (zamanlama) · M-CHAT-R/F (Robins, Fein, Barton — resmi Türkçe çeviri)`, dogrulandi: true,
      arac: mchatUygun ? 'mchat' : 'isaret', son: sonM ? { tarih: sonM.tarih, sonuc: `M-CHAT ${sonM.puan ?? ''}${sonM.puan != null ? '/20 · ' : ''}${sonM.risk === 'dusuk' ? 'düşük risk' : sonM.risk === 'orta' ? 'orta risk' : 'yüksek risk'}` } : null,
    })
  }

  // ─── Profilaksi ───────────────────────────────────────────────────────────────────────────────
  if (yasGun <= 400) {
    const d = sonKayit('dvit')
    kalemler.push({
      kod: 'dvit', ad: 'D vitamini profilaksisi', durum: yasGun > 365 ? 'surekli' : d ? 'tamam' : 'simdi', pencere: 'ilk günden 12. ayın sonuna',
      ne: yasGun > 365 ? '12. ay doldu: program 400 IU/gün profilaksisi sona erer; 1 yaş sonrası ihtiyaç 600 IU/gün (besin ve/veya takviye) — hekim kararı.' : 'SB programı: 400 IU/gün (3 damla), beslenme şeklinden bağımsız; koruma amaçlı ampul/yüksek doz verilmez. Başlandı mı?',
      kaynak: `${KAYNAK_IZLEM} — Bebeğe Destek Programı`, dogrulandi: true, arac: 'isaret', son: d ? { tarih: d.tarih, sonuc: 'başlandı' } : null,
    })
  }
  const dusukDogum = preterm || (g.dogumKiloGr != null && g.dogumKiloGr < 2500)
  const demirBas = dusukDogum ? 60 : 120
  const demirSon = dusukDogum ? 60 + 152 : 365
  if (yasGun >= demirBas - 30 && yasGun <= demirSon + 30) {
    const d = sonKayit('demir')
    kalemler.push({
      kod: 'demir', ad: 'Demir profilaksisi', durum: d ? 'tamam' : yasGun < demirBas ? 'yaklasiyor' : yasGun <= demirBas + 30 ? 'simdi' : 'gecikti',
      pencere: dusukDogum ? '2. aydan başlayarak 5 ay (preterm / < 2500 g)' : '4. aydan 12. aya',
      ne: dusukDogum ? 'SB programı: preterm / < 2500 g — 2 mg/kg/gün, 2. aydan başlayarak 5 ay. Başlandı mı?' : 'SB programı: 4. ayda anemi kontrolü; anemi yoksa 10 mg/gün (sabit doz) 12. aya kadar. Başlandı mı?',
      kaynak: `${KAYNAK_IZLEM} — Demir Gibi Türkiye`, dogrulandi: true, arac: 'isaret', son: d ? { tarih: d.tarih, sonuc: 'başlandı' } : null,
    })
  }
  if (yasGun >= 220 && yasGun <= 330) {
    const r = pencereliKalem(yasGun, g.dogumIso, tarihleri('hb'), 250, 290, 30)
    kalemler.push({ kod: 'hb', ad: 'Hb / Htc (9. ay)', durum: r.durum, pencere: '9. ay izlemi', ne: 'Anemi taraması: Hb/Htc. Hb < 7 g/dL ya da Htc < %21 → acil hastaneye sevk.', kaynak: `${KAYNAK_IZLEM} — Demir Gibi Türkiye`, dogrulandi: true, arac: 'isaret', son: r.son ? { tarih: r.son, sonuc: 'bakıldı' } : null })
  }

  const sira: Record<KalemDurum, number> = { dikkat: 0, gecikti: 1, simdi: 2, yaklasiyor: 3, surekli: 4, tamam: 5 }
  kalemler.sort((a, b) => sira[a.durum] - sira[b.durum])
  return { yasGun, duzeltilmisGun, simdikiVizit, sonrakiVizit, izlem, kalemler, gidrBasamak, preterm }
}

export const KALEM_DURUM_AD: Record<KalemDurum, string> = {
  simdi: 'Bu vizitte', gecikti: 'Gecikti', dikkat: 'Dikkat', tamam: 'Tamam', yaklasiyor: 'Yaklaşıyor', surekli: 'Bilgi',
}

/** Nota eklenecek tek satır — hekim onayıyla gununNotunaEkle'ye gider. */
export function taramaNotSatiri(tur: TaramaTur, sonuc: TaramaSonuc, tarihIso: string, ek?: string): string {
  const ad: Record<TaramaTur, string> = {
    isitme: 'Yenidoğan işitme taraması', kirmizi_refle: 'Kırmızı refle', gorme: 'Görme taraması', rop: 'ROP muayenesi yönlendirmesi',
    otizm: 'Otizm değerlendirmesi (SB izlem)', dvit: 'D vitamini profilaksisi', demir: 'Demir profilaksisi', hb: 'Hb/Htc (9. ay)',
  }
  const sonucMetni: Record<TaramaSonuc, string> = { yapildi: tur === 'dvit' || tur === 'demir' ? 'başlandı' : 'yapıldı', normal: 'normal', ileri_degerlendirme: 'ileri değerlendirme gerekli', sevk: 'sevk edildi' }
  const [y, m, d] = tarihIso.split('-')
  return `${ad[tur]}: ${sonucMetni[sonuc]} (${d}.${m}.${y})${ek ? ` — ${ek.slice(0, 200)}` : ''}.`
}

/** Kopyalanacak vizit özeti (deterministik — yapay zekâ yok). */
export function vizitOzetMetni(p: VizitPlani): string {
  const satir = [`İzlem: ${p.simdikiVizit ? p.simdikiVizit.etiket : 'izlem penceresi dışında'}${p.sonrakiVizit ? ` · sonraki: ${p.sonrakiVizit.etiket}` : ''}`]
  for (const k of p.kalemler.filter((x) => x.durum !== 'surekli')) satir.push(`• ${k.ad}: ${KALEM_DURUM_AD[k.durum].toLocaleLowerCase('tr-TR')}${k.son ? ` (${k.son.sonuc}, ${k.son.tarih.split('-').reverse().join('.')})` : ''}`)
  return satir.join('\n')
}
