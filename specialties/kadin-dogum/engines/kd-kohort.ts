/**
 * Araçlar › KD kohort paneli — saf motor. Girdi yalnız hekimin kendi gebelik / lohusa / kadın sağlığı satırlarıdır
 * (sunucu: app/api/doktor/gebelik/_kohort.ts, doctor_id kapsamlı). Bayrak = takip gecikmesi veya yaklaşan pencere;
 * tanı / değer yok. Pencereler bölüm motorlarından: DÖBYR izlemleri (izlem-calendar), tarama pencereleri (test-windows),
 * lohusa izlemleri (dogum-spine LOHUSA_ZIYARETLERI — Doğum Sonu Bakım), serviks taraması (jinekoloji-spine dueHesapla).
 *
 * Lohusa satırları listede en üstte: doğum sonu kontrol en sık atlanan vizittir ve gerçek anne ölümü riski taşır.
 */
import { addDays, diffDays } from './dates'
import { TEST_WINDOWS, windowStatus, type WindowId } from './test-windows'
import { SB_IZLEM_WINDOWS, completedSbIzlemNos } from './izlem-calendar'
import { LOHUSA_ZIYARETLERI } from './dogum-spine'
import { dueHesapla } from './jinekoloji-spine'
import { KAPANIYOR_GUN, trTarih } from './araclar'

export type KdKohortBayrak =
  | 'lohusa_1hf' | 'lohusa_6hf'
  | 'tarama_kapaniyor' | 'izlem_gecikti'
  | 'ogtt_zamani' | 'anti_d_zamani' | 'gbs_zamani'
  | 'serviks_tarama'

export const KD_BAYRAK_AD: Record<KdKohortBayrak, string> = {
  lohusa_1hf: 'Lohusa 1. hafta kontrolü',
  lohusa_6hf: 'Lohusa 6. hafta kontrolü',
  tarama_kapaniyor: 'Tarama penceresi kapanıyor',
  izlem_gecikti: 'Gebelik izlemi gecikti',
  ogtt_zamani: 'OGTT zamanı',
  anti_d_zamani: 'Anti-D zamanı',
  gbs_zamani: 'GBS zamanı',
  serviks_tarama: 'Smear / HPV gecikti',
}

export const LOHUSA_BAYRAKLARI: readonly KdKohortBayrak[] = ['lohusa_1hf', 'lohusa_6hf']

/** Lohusa satırının listede kalma süresi (planlama görünümü): doğumdan sonra 90 gün. */
export const LOHUSA_GORUNUR_GUN = 90

export type KdKohortGirdi = {
  patientId: string
  ad: string
  dogumIso: string | null
  gebelik: null | {
    durum: 'aktif' | 'dogum_yapti'
    sat: string | null
    tdt: string | null
    rhNegatif: boolean
    dogumTarihi: string | null
    izlemHaftalari: number[]
    yapilanlar: WindowId[]
    lohusaGunleri: number[]
  }
  serviks: null | { sonTarama: string | null; histerektomi?: boolean }
  sonVizit: string | null
  portalVar: boolean
}

export type KdKohortSatir = {
  patientId: string
  ad: string
  bayraklar: KdKohortBayrak[]
  lohusa: boolean
  /** en acil olan: lohusa 1. hafta, lohusa 6. hafta, kapanmak üzere pencere, sonra en eski tarih */
  oncelik: number
  enErkenTarih: string | null
  detay: string[]
  sonVizit: string | null
  portalVar: boolean
}

const tokenGun = (t: string) => { const [w, d] = t.split('+').map(Number); return w * 7 + d }
function yasHesap(dob: string | null, bugun: string): number | null {
  if (!dob || !/^\d{4}-\d{2}-\d{2}/.test(dob)) return null
  const [y, m, d] = dob.slice(0, 10).split('-').map(Number), [by, bm, bd] = bugun.split('-').map(Number)
  let yas = by - y
  if (bm < m || (bm === m && bd < d)) yas--
  return yas
}

export function kdKohortSatiri(g: KdKohortGirdi, bugun: string): KdKohortSatir {
  const bayraklar: KdKohortBayrak[] = []
  const detay: string[] = []
  const tarihler: string[] = []
  let oncelik = 9
  const ekle = (b: KdKohortBayrak, d: string, t: string | null, o: number) => { if (!bayraklar.includes(b)) bayraklar.push(b); detay.push(d); if (t) tarihler.push(t); oncelik = Math.min(oncelik, o) }
  const gb = g.gebelik

  if (gb?.durum === 'dogum_yapti' && gb.dogumTarihi) {
    const pp = diffDays(bugun, gb.dogumTarihi)
    if (pp >= 0 && pp <= LOHUSA_GORUNUR_GUN) {
      const [z1, , z3] = LOHUSA_ZIYARETLERI
      // 1. hafta: DSBYR 1. lohusa izlemi 2–5. gün; ilk hafta içinde (≤ 7. gün) yapılan kayıt kabul edilir.
      if (pp >= z1.gunBas && !gb.lohusaGunleri.some((d) => d >= z1.gunBas && d <= 7)) {
        ekle('lohusa_1hf', pp <= z1.gunBit ? `Doğum sonrası ${pp}. gün — 1. kontrol zamanı (${z1.gunBas}–${z1.gunBit}. gün)` : `Doğum sonrası ${pp}. gün — 1. hafta kontrolü kaydı yok`, addDays(gb.dogumTarihi, z1.gunBas), 0)
      }
      // 6. hafta: DSBYR 3. lohusa izlemi 30–40. gün ("6. hafta kapanış"); 49. güne kadar yapılan kayıt kabul edilir.
      if (pp >= z3.gunBas && !gb.lohusaGunleri.some((d) => d >= z3.gunBas && d <= 49)) {
        ekle('lohusa_6hf', pp <= z3.gunBit ? `Doğum sonrası ${pp}. gün — 6. hafta kontrol zamanı (${z3.gunBas}–${z3.gunBit}. gün)` : `Doğum sonrası ${pp}. gün — 6. hafta kontrolü kaydı yok`, addDays(gb.dogumTarihi, z3.gunBas), 0.5)
      }
    }
  }

  if (gb?.durum === 'aktif' && (gb.tdt || gb.sat)) {
    const lmp = gb.tdt ? addDays(gb.tdt, -280) : gb.sat!
    const ga = diffDays(bugun, lmp)
    if (ga >= 0 && ga <= 43 * 7) {
      const yap = new Set(gb.yapilanlar)
      const hafta = `${Math.floor(ga / 7)}+${ga % 7}`
      // DÖBYR izlemleri: kapanmış, kaydı olmayan pencereler. Geç başvuran gebenin ilk kaydı 1. izlem sayılır;
      // ilk kayıttan önce kapanmış 2–4. pencereler bayrak değildir (hasta o dönemde bu hekimde değildi).
      const ilk = gb.izlemHaftalari.length ? Math.min(...gb.izlemHaftalari) : null
      const tamam = new Set(completedSbIzlemNos(gb.izlemHaftalari))
      if (ilk != null) tamam.add(1)
      for (const w of SB_IZLEM_WINDOWS) {
        const kap = w.week_hi * 7 + 6
        if (tamam.has(w.izlem_no) || ga <= kap) continue
        if (ilk != null && ilk > w.week_hi) continue
        ekle('izlem_gecikti', `DÖBYR ${w.izlem_no}. izlem (${w.week_lo === 0 ? '≤ 14' : `${w.week_lo}–${w.week_hi}`}. hf) kaydı yok — şu an ${hafta}`, addDays(lmp, kap), 3)
      }
      const pen = (id: WindowId) => TEST_WINDOWS.find((w) => w.id === id)!
      const durum = (id: WindowId) => windowStatus(pen(id), { weeks: Math.floor(ga / 7), days: ga % 7, totalDays: ga }, yap.has(id))
      const kalan = (id: WindowId) => tokenGun(pen(id).close) - ga
      const kapanis = (id: WindowId) => addDays(lmp, tokenGun(pen(id).close))
      const KAPANAN: Array<[WindowId, string]> = [['ikili_nt', 'İkili tarama + NT'], ['ayrintili_usg', 'Detaylı USG'], ['ogtt_gdm', 'OGTT']]
      if (!yap.has('ikili_nt')) KAPANAN.splice(1, 0, ['triple_quad_afp', 'Üçlü / dörtlü tarama'])
      for (const [id, ad] of KAPANAN) {
        if (durum(id) === 'open' && kalan(id) <= KAPANIYOR_GUN) ekle('tarama_kapaniyor', `${ad} penceresi ${kalan(id)} gün sonra kapanıyor (${trTarih(kapanis(id))})`, kapanis(id), 1)
      }
      const ogtt = durum('ogtt_gdm')
      if (ogtt === 'open' && kalan('ogtt_gdm') > KAPANIYOR_GUN) ekle('ogtt_zamani', `OGTT penceresi açık (24–28. hf) — kapanış ${trTarih(kapanis('ogtt_gdm'))}`, kapanis('ogtt_gdm'), 4)
      if (ogtt === 'overdue' && ga <= 34 * 7) ekle('ogtt_zamani', 'OGTT penceresi kapandı, kayıt yok — en kısa sürede planlayın', kapanis('ogtt_gdm'), 2)
      if (gb.rhNegatif && !yap.has('anti_d_28') && ga >= tokenGun(pen('anti_d_28').open)) {
        ekle('anti_d_zamani', durum('anti_d_28') === 'overdue' ? `Rh(−): ~28. hafta anti-D kaydı yok — şu an ${hafta}` : `Rh(−): anti-D penceresi açık (${pen('anti_d_28').open}–${pen('anti_d_28').close} hf)`, kapanis('anti_d_28'), 2)
      }
      if (!yap.has('gbs_prezentasyon') && ga >= tokenGun(pen('gbs_prezentasyon').open)) {
        ekle('gbs_zamani', durum('gbs_prezentasyon') === 'overdue' ? `GBS kaydı yok — şu an ${hafta}` : `GBS penceresi açık (35–37. hf) — kapanış ${trTarih(kapanis('gbs_prezentasyon'))}`, kapanis('gbs_prezentasyon'), 4)
      }
    }
  }

  const yas = yasHesap(g.dogumIso, bugun)
  if (g.serviks && yas != null && yas >= 21 && yas <= 65 && !g.serviks.histerektomi) {
    const d = dueHesapla({ dob: g.dogumIso!.slice(0, 10), bugun, sonPap: g.serviks.sonTarama, sonHpv: null, histerektomi: false })
      .find((x) => x.kod === 'pap' || x.kod === 'hpv')
    if (d && !g.serviks.sonTarama) ekle('serviks_tarama', `${yas} yaş — serviks taraması kaydı yok (${d.ad})`, null, 5)
    else if (d && d.due && d.due < bugun) ekle('serviks_tarama', `Son serviks taraması ${trTarih(g.serviks.sonTarama)} — ${d.ad}, ${trTarih(d.due)} itibarıyla gecikti`, d.due, 5)
  }

  return {
    patientId: g.patientId, ad: g.ad, bayraklar,
    lohusa: bayraklar.some((b) => LOHUSA_BAYRAKLARI.includes(b)),
    oncelik, enErkenTarih: tarihler.sort()[0] ?? null, detay,
    sonVizit: g.sonVizit, portalVar: g.portalVar,
  }
}

/** Yalnız bayraklı hastalar; lohusa en üstte, sonra kapanmak üzere olan pencere, sonra en eski tarih. */
export function kdKohortSatirlari(girdiler: KdKohortGirdi[], bugun: string): KdKohortSatir[] {
  return girdiler.map((g) => kdKohortSatiri(g, bugun)).filter((s) => s.bayraklar.length > 0)
    .sort((a, b) => a.oncelik - b.oncelik || String(a.enErkenTarih || '9999').localeCompare(String(b.enErkenTarih || '9999')) || a.ad.localeCompare(b.ad, 'tr'))
}

export const KD_HATIRLATMA_KONU = 'Kontrol hatırlatması'

/** Hasta-güvenli hatırlatma: tanı, değer, ilaç yok — yalnız "zamanı geldi / randevu alın" + acil yönlendirmesi. */
export function kdHatirlatmaMesaji(bayraklar: readonly KdKohortBayrak[]): { konu: string; metin: string } {
  const s: string[] = []
  if (bayraklar.some((b) => LOHUSA_BAYRAKLARI.includes(b))) s.push('Doğum sonrası kontrolünüzün zamanı geldi. Bu kontrol, doğumdan sonraki haftalarda sizin sağlığınız için önemlidir.')
  if (bayraklar.includes('izlem_gecikti')) s.push('Gebelik kontrol randevunuzun zamanı geçti.')
  if (bayraklar.includes('tarama_kapaniyor')) s.push('Gebeliğinizde belirli bir haftaya kadar yapılabilen bir testin süresi dolmak üzere; lütfen en kısa sürede randevu alın.')
  if (bayraklar.includes('ogtt_zamani') || bayraklar.includes('gbs_zamani')) s.push('Gebelik haftanıza uygun test zamanınız geldi.')
  if (bayraklar.includes('anti_d_zamani')) s.push('Gebelik haftanıza göre planlanan uygulamanın zamanı geldi.')
  if (bayraklar.includes('serviks_tarama')) s.push('Rahim ağzı tarama testinizin zamanı geldi.')
  if (!s.length) s.push('Kontrol randevunuzun zamanı geldi.')
  return {
    konu: KD_HATIRLATMA_KONU,
    metin: `Merhaba, ${s.join(' ')} Randevu için muayenehanemizi arayabilir veya bu mesaja yanıt yazabilirsiniz.\n\nBu mesaj kanalı acil durumlar için değildir. Yoğun kanama, yüksek ateş, şiddetli baş ağrısı, nefes darlığı veya kendinizi çok kötü hissettiğiniz bir durumda beklemeden 112'yi arayın ya da en yakın acil servise başvurun.`,
  }
}
