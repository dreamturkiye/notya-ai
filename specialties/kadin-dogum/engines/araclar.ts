/**
 * Araçlar › Kadın Doğum stüdyoları — saf motor (kadın-doğum only; tile'lar BRANS_DOKTOR_ARACLARI ['kadin-hastaliklari-dogum']).
 * Mevcut bölüm motorlarını birleştirir, kopyalamaz: sat-edd (Naegele / Robinson CRL), test-windows (tarama pencereleri),
 * izlem-calendar (DÖBYR 4 izlem + ACOG kadansı), dogum-spine (kaçırılınca alternatifi, C/S endikasyon listesi), sources (çift sütun).
 *
 * Kilitler: tanı / endikasyon / reçete otomatik seçilmez; her çıktı hekimin onaylayacağı TASLAKTIR; hiçbir şey nota yazılmaz.
 * Kaynak kuralı: SB / SGK / kanun = yasal taban; ACOG / SMFM = klinik derinlik sütunu. Doğrulanamayan eşik "öneri — hekim kilitler".
 */
import { addDays, diffDays, daysToGa, type GaWeeksDays } from './dates'
import { naegeleEdd, crlToEdd } from './sat-edd'
import { TEST_WINDOWS, windowStatus, antiDIndicated, aneuploidyScreenDual, type WindowId, type TestWindow } from './test-windows'
import { SB_IZLEM_WINDOWS, completedSbIzlemNos, evaluateCadence } from './izlem-calendar'
import { GOREV_SABLONLARI, CS_ENDIKASYONLARI } from './dogum-spine'
import { UI_HINT_YASAL_VS_KLINIK, type DualRecommendation } from '../protocols/sources'

// ───────────────────────── Esnek girdi (klinikte yazıldığı gibi) ─────────────────────────

/** "45,2" · "45.2" · "45,2 mm" → 45.2 ; boş / anlamsız → null */
export function sayiOku(ham: string | number | null | undefined): number | null {
  if (typeof ham === 'number') return Number.isFinite(ham) ? ham : null
  const s = String(ham ?? '').trim().replace(/\s+/g, '').replace(',', '.').match(/^[-+]?\d+(\.\d+)?/)
  if (!s) return null
  const n = Number(s[0])
  return Number.isFinite(n) ? n : null
}

const AYLAR: Record<string, number> = {
  ocak: 1, subat: 2, şubat: 2, mart: 3, nisan: 4, mayis: 5, mayıs: 5, haziran: 6, temmuz: 7,
  agustos: 8, ağustos: 8, eylul: 9, eylül: 9, ekim: 10, kasim: 11, kasım: 11, aralik: 12, aralık: 12,
}
const iki = (n: number) => String(n).padStart(2, '0')
function gecerliTarih(y: number, a: number, g: number): string | null {
  if (!(y >= 1900 && y <= 2100 && a >= 1 && a <= 12 && g >= 1 && g <= 31)) return null
  const d = new Date(Date.UTC(y, a - 1, g))
  if (d.getUTCFullYear() !== y || d.getUTCMonth() !== a - 1 || d.getUTCDate() !== g) return null
  return `${y}-${iki(a)}-${iki(g)}`
}

/** 2026-03-12 · 12.03.2026 · 12/3/2026 · 12-03-26 · 12 mart 2026 → ISO; geçersiz → null */
export function tarihOku(ham: string | null | undefined): string | null {
  const s = String(ham ?? '').trim().toLocaleLowerCase('tr-TR')
  if (!s) return null
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s)
  if (m) return gecerliTarih(+m[1], +m[2], +m[3])
  m = /^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2}|\d{4})$/.exec(s)
  if (m) { const y = m[3].length === 2 ? 2000 + +m[3] : +m[3]; return gecerliTarih(y, +m[2], +m[1]) }
  m = /^(\d{1,2})\s+([a-zçğıöşü]+)\s+(\d{4})$/.exec(s)
  if (m && AYLAR[m[2]]) return gecerliTarih(+m[3], AYLAR[m[2]], +m[1])
  return null
}

/** "12+2" · "12 hafta 2 gün" · "12hf 2g" · "12w2d" · "12" · "12,5" (hafta kesri) → hafta/gün; geçersiz → null */
export function haftaOku(ham: string | null | undefined): GaWeeksDays | null {
  const s = String(ham ?? '').trim().toLocaleLowerCase('tr-TR')
  if (!s) return null
  let m = /^(\d{1,2})\s*(?:\+|hafta|hf|h|w)\s*(\d)?\s*(?:gün|gun|g|d)?$/.exec(s)
  if (!m) m = /^(\d{1,2})\s*(?:hafta|hf|h|w)?\s*(?:\+|,|\s)?\s*(\d)\s*(?:gün|gun|g|d)$/.exec(s)
  let hafta: number, gun: number
  if (m) { hafta = +m[1]; gun = m[2] ? +m[2] : 0 }
  else {
    const k = /^(\d{1,2})(?:[.,](\d+))?$/.exec(s)
    if (!k) return null
    const toplam = Math.round(Number(`${k[1]}.${k[2] || 0}`) * 7)
    hafta = Math.floor(toplam / 7); gun = toplam % 7
  }
  if (gun > 6 || hafta > 44) return null
  return daysToGa(hafta * 7 + gun)
}

export const haftaYaz = (ga: GaWeeksDays | number) => { const t = typeof ga === 'number' ? ga : ga.totalDays; return `${Math.floor(t / 7)}+${t % 7}` }
export function trTarih(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [y, a, g] = iso.slice(0, 10).split('-')
  return `${g}.${a}.${y}`
}

// ───────────────────────── 1) Gebelik takvimi & tarama pencereleri ─────────────────────────

export type TarihlemeYontemi = 'sat' | 'usg_hafta' | 'usg_crl' | 'edd'

export type EddSonuc =
  | { ok: true; edd: string; lmpEsdeger: string; yontemAd: string }
  | { ok: false; hata: string }

/** EDD — SAT (Naegele), USG haftası, CRL (Robinson 1975) veya bilinen TDT. Motor: sat-edd.ts. */
export function eddHesapla(g: { yontem: TarihlemeYontemi; sat?: string | null; usgTarih?: string | null; usgHafta?: GaWeeksDays | null; crlMm?: number | null; edd?: string | null }): EddSonuc {
  const ok = (edd: string, yontemAd: string): EddSonuc => ({ ok: true, edd, lmpEsdeger: addDays(edd, -280), yontemAd })
  if (g.yontem === 'sat') return g.sat ? ok(naegeleEdd(g.sat), 'SAT (Naegele)') : { ok: false, hata: 'Son adet tarihini girin (ör. 12.03.2026).' }
  if (g.yontem === 'edd') return g.edd ? ok(g.edd, 'Bilinen TDT') : { ok: false, hata: 'Tahmini doğum tarihini girin.' }
  if (!g.usgTarih) return { ok: false, hata: 'Ultrason tarihini girin.' }
  if (g.yontem === 'usg_hafta') {
    if (!g.usgHafta) return { ok: false, hata: 'O günkü gebelik haftasını girin (ör. 8+3 veya "8 hafta 3 gün").' }
    return ok(addDays(g.usgTarih, 280 - g.usgHafta.totalDays), `USG ${haftaYaz(g.usgHafta)}`)
  }
  if (g.crlMm == null || !(g.crlMm > 0)) return { ok: false, hata: 'CRL değerini mm olarak girin (ör. 45,2).' }
  if (g.crlMm > 90) return { ok: false, hata: 'CRL ile tarihleme yalnız birinci trimesterde (CRL ≤ 90 mm) yapılır.' }
  return ok(crlToEdd(g.crlMm, g.usgTarih), `CRL ${String(g.crlMm).replace('.', ',')} mm (Robinson)`)
}

/** Planlama eşiği (klinik aralık değil): pencere kapanışına ≤ 7 gün kala "kapanmak üzere", açılışa ≤ 14 gün kala "yaklaşıyor". */
export const KAPANIYOR_GUN = 7
export const YAKLASIYOR_GUN = 14

export type PencereDurum = 'yapildi' | 'kacirildi' | 'gecti' | 'kapaniyor' | 'acik' | 'yaklasiyor' | 'ileride'

export const PENCERE_DURUM_AD: Record<PencereDurum, string> = {
  yapildi: 'Yapıldı', kacirildi: 'Kaçırıldı', gecti: 'Pencere geçti', kapaniyor: 'Kapanmak üzere', acik: 'Açık', yaklasiyor: 'Yaklaşıyor', ileride: 'İleride',
}

export type TakvimTarama = {
  id: WindowId
  ad: string
  aciklama: string
  acilis: string
  kapanis: string
  pencereHafta: string
  durum: PencereDurum
  /** açık/kapanıyor: kapanışa kalan gün; yaklaşıyor/ileride: açılışa kalan gün */
  kalanGun: number | null
  sut?: string
  cepten?: boolean
  /** Pencere kapanınca bu gebelikte aynı test yapılamaz (ikili, üçlü/dörtlü, detaylı USG) — baskın uyarı yalnız bunlar için. */
  geriAlinamaz: boolean
  kacirilinca?: string
  not?: string
}

/** Araçta gösterilen taramalar — pencereler TEST_WINDOWS'tan (tek kaynak), kısa adlar hekim dilinde. */
const TARAMA_SECIMI: Array<{ id: WindowId; ad: string; gorevKod?: string; geriAlinamaz?: boolean; sadeceBilgi?: boolean }> = [
  { id: 'ikili_nt', ad: 'İkili tarama + NT', gorevKod: 'ikili_nt', geriAlinamaz: true },
  { id: 'nipt_optional', ad: 'NIPT (isteğe bağlı)', sadeceBilgi: true },
  { id: 'triple_quad_afp', ad: 'Üçlü / dörtlü tarama', gorevKod: 'uclu_dortlu', geriAlinamaz: true },
  { id: 'ayrintili_usg', ad: 'Detaylı (2. düzey) USG', gorevKod: 'ayrintili_usg', geriAlinamaz: true },
  { id: 'ogtt_gdm', ad: 'OGTT (GDM taraması)', gorevKod: 'gdm' },
  { id: 'anti_d_28', ad: 'Anti-D profilaksisi', gorevKod: 'rhogam' },
  { id: 'gbs_prezentasyon', ad: 'GBS + prezentasyon', gorevKod: 'gbs' },
]

function tokenGun(tok: string): number { const [w, d] = tok.split('+').map(Number); return w * 7 + d }

function pencereDurumu(win: TestWindow, gaGun: number, yapildi: boolean): { durum: PencereDurum; kalanGun: number | null } {
  const ac = tokenGun(win.open), kap = tokenGun(win.close)
  const s = windowStatus(win, daysToGa(Math.max(0, gaGun)), yapildi)
  if (s === 'done') return { durum: 'yapildi', kalanGun: null }
  if (s === 'overdue') return { durum: 'kacirildi', kalanGun: null }
  if (s === 'open') { const k = kap - gaGun; return { durum: k <= KAPANIYOR_GUN ? 'kapaniyor' : 'acik', kalanGun: k } }
  const k = ac - gaGun
  return { durum: k <= YAKLASIYOR_GUN ? 'yaklasiyor' : 'ileride', kalanGun: k }
}

export type TakvimIzlem = { no: 1 | 2 | 3 | 4; acilis: string; kapanis: string; pencereHafta: string; durum: PencereDurum; kalanGun: number | null; kontrol: string[] }

export type TakvimDual = { baslik: string; sb: string; klinik: string; cakisma: boolean; uiHint: typeof UI_HINT_YASAL_VS_KLINIK }

export type TakvimSonuc = {
  edd: string
  lmpEsdeger: string
  yontemAd: string
  ga: GaWeeksDays
  gaMetin: string
  trimester: 1 | 2 | 3
  dogumaKalanGun: number
  izlemler: TakvimIzlem[]
  izlemYapilan: number
  taramalar: TakvimTarama[]
  /** Görsel olarak baskın gösterilecek: kapanmak üzere olan, geri alınamaz pencereler (ikili, üçlü/dörtlü, detaylı USG). */
  kapaniyor: TakvimTarama[]
  /** Bu hafta kapanan diğer pencereler (OGTT, anti-D, GBS, NIPT) — geç de yapılabilir, ikincil uyarı. */
  kapaniyorDiger: TakvimTarama[]
  kacirilan: TakvimTarama[]
  cift: TakvimDual[]
  kadans: DualRecommendation<{ due: boolean; detail: string }>
  analikRaporuBaslangic: { tekil: string; cogul: string }
  uyari: string[]
}

export type TakvimGirdi = {
  edd: string
  yontemAd: string
  bugun: string
  /** null = bilinmiyor (Anti-D satırı "Rh bilinmiyor" notuyla kalır) */
  rhNegatif?: boolean | null
  /** indirekt Coombs negatif mi (bilinmiyorsa null) */
  idcNegatif?: boolean | null
  cogul?: boolean
  risk?: 'dusuk' | 'orta' | 'yuksek'
  yapilanlar?: readonly WindowId[]
  izlemHaftalari?: readonly number[]
}

export function gebelikTakvimi(g: TakvimGirdi): TakvimSonuc {
  const lmp = addDays(g.edd, -280)
  const gaGun = diffDays(g.bugun, lmp)
  const ga = daysToGa(Math.max(0, gaGun))
  const yapilan = new Set(g.yapilanlar || [])
  const uyari: string[] = []
  if (gaGun < 0) uyari.push('Hesaplanan son adet tarihi bugünden sonra — tarihleri kontrol edin.')
  if (gaGun > 44 * 7) uyari.push('Gebelik haftası 44\'ün üzerinde — tarih hatalı olabilir veya gebelik sonlanmış olabilir.')

  const izlemHaftalari = g.izlemHaftalari || []
  const tamamIzlem = new Set(completedSbIzlemNos(izlemHaftalari))
  // DÖBYR: geç başvuran gebenin ilk izlemi 1. izlem sayılır (sbMinimumFour) — herhangi bir kayıt 1. izlemi kapatır.
  if (izlemHaftalari.length) tamamIzlem.add(1)
  const izlemler: TakvimIzlem[] = SB_IZLEM_WINDOWS.map((w) => {
    const ac = w.week_lo * 7, kap = w.week_hi * 7 + 6
    let durum: PencereDurum, kalanGun: number | null = null
    if (tamamIzlem.has(w.izlem_no)) durum = 'yapildi'
    else if (gaGun > kap) durum = 'kacirildi'
    else if (gaGun >= ac) { kalanGun = kap - gaGun; durum = kalanGun <= KAPANIYOR_GUN ? 'kapaniyor' : 'acik' }
    else { kalanGun = ac - gaGun; durum = kalanGun <= YAKLASIYOR_GUN ? 'yaklasiyor' : 'ileride' }
    return { no: w.izlem_no, acilis: addDays(lmp, ac), kapanis: addDays(lmp, kap), pencereHafta: w.week_lo === 0 ? `≤ ${w.week_hi}+6 hf` : `${w.week_lo}–${w.week_hi}+6 hf`, durum, kalanGun, kontrol: [...w.checklist] }
  })

  const taramalar: TakvimTarama[] = []
  for (const sec of TARAMA_SECIMI) {
    const win = TEST_WINDOWS.find((w) => w.id === sec.id)
    if (!win) continue
    if (sec.id === 'anti_d_28' && g.rhNegatif === false) continue
    const pd = pencereDurumu(win, gaGun, yapilan.has(sec.id))
    // NIPT'in pencere sonu birinci trimester planlamasıdır; kapanması testi imkânsız kılmaz → "kaçırıldı" değil, "pencere geçti".
    const durum: PencereDurum = sec.sadeceBilgi && pd.durum === 'kacirildi' ? 'gecti' : pd.durum
    const kalanGun = pd.kalanGun
    const gorev = sec.gorevKod ? GOREV_SABLONLARI.find((x) => x.kod === sec.gorevKod) : undefined
    let not: string | undefined
    if (sec.id === 'anti_d_28') {
      if (g.rhNegatif == null) not = 'Rh bilinmiyor — kan grubu sonucu girilince kesinleşir.'
      else if (g.idcNegatif === false) not = 'İndirekt Coombs pozitif — profilaksi yerine alloimmünizasyon yönetimi (hekim).'
      else if (!antiDIndicated('D-', g.idcNegatif === true ? 'negative' : 'unknown')) not = 'Yalnız Rh(−) ve indirekt Coombs (−) gebede — IDC sonucunu doğrulayın.'
      else not = 'Rh(−), indirekt Coombs (−): ~28. hafta. Uygulamayı hekim yazar; araç yalnız hatırlatır.'
    }
    if (sec.id === 'triple_quad_afp' && yapilan.has('ikili_nt')) not = 'İkili tarama yapıldıysa bu pencerede yalnız AFP (nöral tüp defekti) anlamlıdır.'
    if (sec.id === 'nipt_optional') not = 'Genellikle SGK kapsamı dışında (cepten); yüksek riskte onam ile tanısal test yolu açılır. Bu satır birinci trimester planlaması içindir.'
    taramalar.push({
      id: sec.id, ad: sec.ad, aciklama: win.label,
      acilis: addDays(lmp, tokenGun(win.open)), kapanis: addDays(lmp, tokenGun(win.close)),
      pencereHafta: `${win.open}–${win.close} hf`, durum, kalanGun,
      sut: win.sut_code, cepten: win.out_of_pocket, geriAlinamaz: !!sec.geriAlinamaz, kacirilinca: gorev?.kacirilinca, not,
    })
  }
  taramalar.sort((a, b) => a.acilis.localeCompare(b.acilis))

  const an = aneuploidyScreenDual()
  const cift: TakvimDual[] = [
    { baslik: 'Anöploidi taraması', sb: `SUT öder: ${an.sb_required.tests.join(' · ')} (DÖBYR 2026)`, klinik: 'ACOG Practice Advisory (Ocak 2026) + SMFM #74: hücre dışı DNA (NIPT) birincil tarama olabilir; SGK genellikle ödemez', cakisma: an.conflict, uiHint: an.uiHint },
    { baslik: 'GDM taraması', sb: '24+0–28+0 hf: 75 g OGTT veya 50 g + 100 g (DÖBYR / SUT)', klinik: 'ACOG PB 190: aynı pencere; tarama yöntemi farklı olabilir', cakisma: true, uiHint: UI_HINT_YASAL_VS_KLINIK },
    { baslik: 'GBS taraması', sb: '35+0–37+0 hf, protokole göre (DÖBYR)', klinik: 'ACOG CO 797: ~36–37. haftada evrensel kültür', cakisma: true, uiHint: UI_HINT_YASAL_VS_KLINIK },
    { baslik: 'İzlem sayısı', sb: 'Asgari 4 izlem: ≤14, 18–24, 28–32, 36–38. hafta (DÖBYR 2026)', klinik: 'ACOG Clinical Consensus 8: bireyselleştirilmiş sıklık — klasik şema 28. haftaya dek 4 haftada bir, 28–36 iki haftada bir, 36+ haftalık', cakisma: true, uiHint: UI_HINT_YASAL_VS_KLINIK },
  ]
  const kadans = evaluateCadence({ ga_weeks: gaGun / 7, completed_sb_izlem: [...tamamIzlem] as Array<1 | 2 | 3 | 4>, risk_class: g.risk || 'dusuk' })
  if (g.cogul) uyari.push('Çoğul gebelik: takip sıklığı ve tarama yorumu tekil gebelikten farklıdır — hekim planlar.')

  return {
    edd: g.edd, lmpEsdeger: lmp, yontemAd: g.yontemAd, ga, gaMetin: `${ga.weeks} hafta ${ga.days} gün`,
    trimester: gaGun < 14 * 7 ? 1 : gaGun < 28 * 7 ? 2 : 3,
    dogumaKalanGun: diffDays(g.edd, g.bugun),
    izlemler, izlemYapilan: tamamIzlem.size,
    taramalar,
    kapaniyor: taramalar.filter((t) => t.durum === 'kapaniyor' && t.geriAlinamaz).sort((a, b) => (a.kalanGun ?? 0) - (b.kalanGun ?? 0)),
    kapaniyorDiger: taramalar.filter((t) => t.durum === 'kapaniyor' && !t.geriAlinamaz),
    kacirilan: taramalar.filter((t) => t.durum === 'kacirildi'),
    cift, kadans,
    analikRaporuBaslangic: { tekil: addDays(g.edd, -ANALIK.dogumOncesiHafta * 7), cogul: addDays(g.edd, -(ANALIK.dogumOncesiHafta + ANALIK.cogulEkHafta) * 7) },
    uyari,
  }
}

/** Hekimin hastaya verebileceği sade takvim (taslak; tanı / değer yok). */
export function takvimHastaMetni(t: TakvimSonuc): string {
  const sat = t.taramalar.filter((x) => x.durum !== 'yapildi' && x.durum !== 'kacirildi' && x.durum !== 'gecti')
  return [
    `Tahmini doğum tarihiniz: ${trTarih(t.edd)} (bugün ${t.gaMetin}).`,
    sat.length ? 'Önümüzdeki test ve kontrol aralıkları:' : 'Planlanan tarama aralığı kalmadı; kontrol randevularınıza devam edin.',
    ...sat.map((x) => `• ${x.ad}: ${trTarih(x.acilis)} – ${trTarih(x.kapanis)}`),
    '',
    'Kanama, su gelmesi, şiddetli baş ağrısı, görme bozukluğu, bebek hareketlerinde azalma olursa beklemeden başvurun; acil durumda 112.',
  ].join('\n')
}

// ───────────────────────── 2) Doğum & analık rapor asistanı ─────────────────────────

/**
 * Analık süreleri — 7578 sayılı Kanun (RG 01.05.2026, sayı 33240) ile değişik 5510 s.K. md. 18 ve 4857 s.K. md. 74; SGK Genelgesi 2026/13.
 * Tekil: doğum öncesi 8 + doğum sonrası 16 hafta (168 gün). Çoğul: öncesine 2 hafta eklenir (182 gün).
 * Hekim onayıyla doğuma 2 hafta kalana kadar çalışılabilir; çalışılan süre doğum sonrasına eklenir (İş K. 74).
 */
export const ANALIK = { dogumOncesiHafta: 8, cogulEkHafta: 2, dogumSonrasiHafta: 16, calismaSonHafta: 2, emzirmePrimGun: 120, analikPrimGun: 90 } as const

export type AnalikGirdi = {
  edd: string
  cogul: boolean
  /** Doğum gerçekleştiyse gerçek doğum tarihi — erken / geç doğumda süreler yeniden hesaplanır. */
  dogumTarihi?: string | null
  /** Hekim onayıyla doğum öncesi dönemde çalışılan gün (0 … öncesi − 14). */
  calismaGun?: number
  bugun: string
}

export type AnalikSonuc = {
  oncesiPlanGun: number
  sonrasiTemelGun: number
  calismaGun: number
  calismaUstSinir: number
  raporBaslangic: string
  raporBaslangicHafta: string
  dogum: string
  dogumGercek: boolean
  sapmaGun: number
  sapma: 'zamaninda' | 'erken' | 'gec' | 'bekleniyor'
  kullanilanOncesiGun: number
  sonrasiEklenenGun: number
  sonrasiGun: number
  sonrasiBaslangic: string
  sonrasiBitis: string
  isBasi: string
  toplamGun: number
  aciklama: string[]
  bugunDurum: string
}

export function analikIzni(g: AnalikGirdi): AnalikSonuc {
  const oncesi = (ANALIK.dogumOncesiHafta + (g.cogul ? ANALIK.cogulEkHafta : 0)) * 7
  const sonrasiTemel = ANALIK.dogumSonrasiHafta * 7
  const ust = oncesi - ANALIK.calismaSonHafta * 7
  const calisma = Math.max(0, Math.min(ust, Math.round(g.calismaGun || 0)))
  const raporBaslangic = addDays(g.edd, -oncesi + calisma)
  const planOncesi = oncesi - calisma
  const dogum = g.dogumTarihi || g.edd
  const sapmaGun = diffDays(dogum, g.edd)
  const kullanilanOncesi = Math.max(0, diffDays(dogum, raporBaslangic))
  const kullanilamayan = Math.max(0, planOncesi - kullanilanOncesi)
  const eklenen = kullanilamayan + calisma
  const sonrasi = sonrasiTemel + eklenen
  const sonrasiBitis = addDays(dogum, sonrasi - 1)
  const aciklama: string[] = [
    `Doğum öncesi ${oncesi / 7} hafta (${oncesi} gün)${g.cogul ? ' — çoğul gebelikte 8 haftaya 2 hafta eklenir' : ''}; doğum sonrası ${ANALIK.dogumSonrasiHafta} hafta (${sonrasiTemel} gün).`,
  ]
  if (calisma) aciklama.push(`Hekim onayıyla doğum öncesi ${calisma} gün çalışma: bu süre doğum sonrasına eklenir (doğuma en az 2 hafta kala istirahat başlar).`)
  let sapma: AnalikSonuc['sapma'] = 'bekleniyor'
  if (g.dogumTarihi) {
    if (sapmaGun < 0) {
      sapma = 'erken'
      aciklama.push(`Erken doğum (${-sapmaGun} gün önce): doğum öncesi kullanılamayan ${kullanilamayan} gün doğum sonrası süreye eklenir.`)
    } else if (sapmaGun > 0) {
      sapma = 'gec'
      aciklama.push(`Geç doğum (${sapmaGun} gün sonra): doğum öncesi istirahat gerçek doğuma kadar uzar; doğum sonrası ${ANALIK.dogumSonrasiHafta} hafta kısalmaz. SGK süreleri raporlara göre yeniden hesaplar.`)
    } else sapma = 'zamaninda'
  }
  const toplam = kullanilanOncesi + sonrasi
  let bugunDurum: string
  if (g.bugun < raporBaslangic) bugunDurum = `Doğum öncesi istirahat ${trTarih(raporBaslangic)} tarihinde başlar (${diffDays(raporBaslangic, g.bugun)} gün sonra).`
  else if (g.bugun < dogum) bugunDurum = `Doğum öncesi istirahatin ${diffDays(g.bugun, raporBaslangic) + 1}. günü.`
  else if (g.bugun <= sonrasiBitis) bugunDurum = `Doğum sonrası istirahatin ${diffDays(g.bugun, dogum) + 1}. günü; ${diffDays(sonrasiBitis, g.bugun)} gün kaldı.`
  else bugunDurum = 'Analık istirahati tamamlandı.'
  return {
    oncesiPlanGun: oncesi, sonrasiTemelGun: sonrasiTemel, calismaGun: calisma, calismaUstSinir: ust,
    raporBaslangic, raporBaslangicHafta: haftaYaz(280 - oncesi + calisma),
    dogum, dogumGercek: !!g.dogumTarihi, sapmaGun, sapma,
    kullanilanOncesiGun: kullanilanOncesi, sonrasiEklenenGun: eklenen, sonrasiGun: sonrasi,
    sonrasiBaslangic: dogum, sonrasiBitis, isBasi: addDays(sonrasiBitis, 1), toplamGun: toplam,
    aciklama, bugunDurum,
  }
}

/** Hekimin hastaya söyleyebileceği kritik not — SGK "Analık Halinde Geçici İş Göremezlik Ödeneği Ödenmesi". */
export const RAPORSUZ_ISTIRAHAT_UYARISI =
  'Doğum öncesi istirahat raporunu almadan işten ayrılıp istirahate başlarsanız, doğuma kadar geçen günler için SGK geçici iş göremezlik ödeneği ÖDENMEZ. İstirahate başlamadan önce raporunuzu alın. Raporlu olduğunuz günlerde hekim onayı olmadan çalışırsanız o günler için de ödenek ödenmez.'

export const EMZIRME_ODENEGI_NOTU =
  `Emzirme ödeneği: doğumdan önceki 1 yıl içinde en az ${ANALIK.emzirmePrimGun} gün kısa vadeli sigorta primi bildirilmiş sigortalı kadına, canlı doğan her çocuk için bir kez ödenir. Tutar SGK tarafından her yıl belirlenir; başvuru SGK'ya yapılır. Analık ödeneği için ayrıca doğumdan önceki 1 yıl içinde en az ${ANALIK.analikPrimGun} gün prim şartı aranır.`

export function istirahatRaporuTaslagi(a: AnalikSonuc, g: { cogul: boolean; eddYontemi: string; hekimNotu?: string }): string {
  const satirlar = [
    'ANALIK İSTİRAHAT RAPORU — TASLAK (hekim onaylar; Medula\'da e-imza ile düzenlenir)',
    '',
    `Gebelik: ${g.cogul ? 'Çoğul' : 'Tekil'} · Tahmini doğum tarihi: ${trTarih(addDays(a.raporBaslangic, a.oncesiPlanGun - a.calismaGun))} (${g.eddYontemi})`,
    `Doğum öncesi istirahat: ${trTarih(a.raporBaslangic)} tarihinden itibaren (gebelik ${a.raporBaslangicHafta} hafta)`,
  ]
  if (a.dogumGercek) {
    satirlar.push(`Doğum tarihi: ${trTarih(a.dogum)}${a.sapma === 'erken' ? ` (tahmini tarihten ${-a.sapmaGun} gün önce)` : a.sapma === 'gec' ? ` (tahmini tarihten ${a.sapmaGun} gün sonra)` : ''}`)
    satirlar.push(`Doğum sonrası istirahat: ${trTarih(a.sonrasiBaslangic)} – ${trTarih(a.sonrasiBitis)} (${a.sonrasiGun} gün${a.sonrasiEklenenGun ? `; ${a.sonrasiEklenenGun} gün eklenmiş` : ''})`)
  } else {
    satirlar.push(`Doğum sonrası istirahat: doğum tarihinden itibaren ${a.sonrasiGun} gün${a.sonrasiEklenenGun ? ` (${a.sonrasiEklenenGun} gün eklenmiş)` : ''}`)
  }
  satirlar.push(`İşbaşı (öngörülen): ${trTarih(a.isBasi)}`)
  if (g.hekimNotu?.trim()) satirlar.push('', `Hekim notu: ${g.hekimNotu.trim()}`)
  satirlar.push('', 'Dayanak: 5510 s.K. md. 18 ve 4857 s.K. md. 74 (7578 s.K. ile değişik, RG 01.05.2026); SGK Genelgesi 2026/13.', 'T.C. kimlik no ve hasta adı Medula\'da doldurulur.')
  return satirlar.join('\n')
}

// ───────────────────────── 4) Obstetrik risk & sezaryen endikasyon notu ─────────────────────────

export type RiskFaktoru = { kod: string; ad: string }

/** Preeklampsi risk faktörleri — SMFM 2021 kontrol listesi / USPSTF 2021 (ACOG Practice Advisory ile teyitli). Klinik derinlik sütunu. */
export const PE_YUKSEK: RiskFaktoru[] = [
  { kod: 'onceki_pe', ad: 'Önceki gebelikte preeklampsi' },
  { kod: 'cogul', ad: 'Çoğul gebelik' },
  { kod: 'kronik_ht', ad: 'Kronik hipertansiyon' },
  { kod: 'dm', ad: 'Tip 1 / tip 2 diyabet (gebelik öncesi)' },
  { kod: 'bobrek', ad: 'Böbrek hastalığı' },
  { kod: 'otoimmun', ad: 'Otoimmün hastalık (SLE, antifosfolipid sendromu)' },
]
export const PE_ORTA: RiskFaktoru[] = [
  { kod: 'nullipar', ad: 'Nulliparite' },
  { kod: 'obezite', ad: 'Obezite (VKİ > 30)' },
  { kod: 'aile_pe', ad: 'Anne veya kız kardeşte preeklampsi' },
  { kod: 'yas35', ad: 'Anne yaşı ≥ 35' },
  { kod: 'aralik10', ad: 'Gebelikler arası > 10 yıl' },
  { kod: 'onceki_olumsuz', ad: 'Önceki DDA / SGA / olumsuz gebelik sonucu' },
  { kod: 'ivf', ad: 'IVF gebeliği' },
  { kod: 'dusuk_gelir', ad: 'Düşük gelir / sosyal dezavantaj' },
]

export type AspirinKarar = 'onerilir' | 'dusunulebilir' | 'tek_orta' | 'yok'
export type AspirinPencere = 'henuz' | 'ideal' | 'ideal_kapaniyor' | 'gec' | 'kapandi' | 'bilinmiyor'

export type AspirinSonuc = {
  karar: AspirinKarar
  kararMetni: string
  yuksek: string[]
  orta: string[]
  pencere: AspirinPencere
  pencereMetni: string
  baslangic: string | null
  idealSon: string | null
  son: string | null
  cift: TakvimDual
}

/** Başlama: 12+0 – 28+0 hf, en iyisi 16+0 öncesi (ACOG / SMFM, USPSTF 2021). Doz ve ürün hekimindir — araç yazmaz. */
export const ASPIRIN_PENCERE = { baslaGun: 12 * 7, idealSonGun: 16 * 7, sonGun: 28 * 7 } as const

export function aspirinProfilaksisi(g: { secili: readonly string[]; edd: string | null; bugun: string }): AspirinSonuc {
  const yuksek = PE_YUKSEK.filter((f) => g.secili.includes(f.kod)).map((f) => f.ad)
  const ortaK = PE_ORTA.filter((f) => g.secili.includes(f.kod))
  const orta = ortaK.map((f) => f.ad)
  let karar: AspirinKarar = 'yok'
  if (yuksek.length || orta.length >= 2) karar = 'onerilir'
  else if (ortaK.length === 1 && ortaK[0].kod === 'dusuk_gelir') karar = 'dusunulebilir'
  else if (orta.length === 1) karar = 'tek_orta'
  const kararMetni = {
    onerilir: 'Düşük doz aspirin profilaksisi endikasyon ölçütünü karşılıyor (≥ 1 yüksek veya > 1 orta risk faktörü).',
    dusunulebilir: 'Tek orta risk faktörü (düşük gelir) — profilaksi düşünülebilir; hekim değerlendirir.',
    tek_orta: 'Tek orta risk faktörü — ölçüt karşılanmıyor; klinik tabloya göre hekim değerlendirir.',
    yok: 'İşaretli risk faktörü yok.',
  }[karar]
  let pencere: AspirinPencere = 'bilinmiyor', pencereMetni = 'Gebelik haftası için TDT girin veya hasta seçin.'
  let baslangic: string | null = null, idealSon: string | null = null, son: string | null = null
  if (g.edd) {
    const lmp = addDays(g.edd, -280)
    const ga = diffDays(g.bugun, lmp)
    baslangic = addDays(lmp, ASPIRIN_PENCERE.baslaGun); idealSon = addDays(lmp, ASPIRIN_PENCERE.idealSonGun - 1); son = addDays(lmp, ASPIRIN_PENCERE.sonGun)
    if (ga < ASPIRIN_PENCERE.baslaGun) { pencere = 'henuz'; pencereMetni = `Başlama penceresi ${trTarih(baslangic)} (12+0) tarihinde açılır; en iyisi ${trTarih(idealSon)} (15+6) öncesi.` }
    else if (ga < ASPIRIN_PENCERE.idealSonGun) {
      const k = ASPIRIN_PENCERE.idealSonGun - ga
      pencere = k <= KAPANIYOR_GUN ? 'ideal_kapaniyor' : 'ideal'
      pencereMetni = `İdeal başlama dönemi: 16+0 öncesi — ${k} gün kaldı (${trTarih(idealSon)}).`
    } else if (ga <= ASPIRIN_PENCERE.sonGun) { pencere = 'gec'; pencereMetni = `16. hafta geçti; başlama penceresi 28+0'a (${trTarih(son)}) kadar açık — yarar erken başlamada daha belirgin.` }
    else { pencere = 'kapandi'; pencereMetni = '28. hafta geçti — profilaksiye yeni başlama penceresi kapandı.' }
  }
  return {
    karar, kararMetni, yuksek, orta, pencere, pencereMetni, baslangic, idealSon, son,
    cift: {
      baslik: 'Preeklampsi profilaksisi',
      sb: 'SB Riskli Gebelikler Yönetim Rehberi / DÖBYR: her izlemde TA ölçümü. Doğrulanmış bir Türk rehberi aspirin eşiği bu araçta yer almıyor — öneri, hekim kilitler.',
      klinik: 'ACOG / SMFM (USPSTF 2021): ≥ 1 yüksek veya > 1 orta risk → 12–28. hafta arası başla, en iyisi 16. hafta öncesi; doğuma dek sürdür.',
      cakisma: true, uiHint: UI_HINT_YASAL_VS_KLINIK,
    },
  }
}

/** GDM risk faktörleri — öneri listesi (hekim kilitler); eşikler bu repoda bir kaynaktan doğrulanmadı. 24–28 hf OGTT herkes için (DÖBYR). */
export const GDM_RISK: RiskFaktoru[] = [
  { kod: 'onceki_gdm', ad: 'Önceki gebelikte GDM' },
  { kod: 'makrozomi', ad: 'Önceki iri bebek (makrozomi)' },
  { kod: 'obezite', ad: 'Gebelik öncesi obezite' },
  { kod: 'aile_dm', ad: 'Birinci derece akrabada diyabet' },
  { kod: 'pkos', ad: 'PKOS' },
  { kod: 'prediyabet', ad: 'Bilinen bozulmuş glukoz toleransı / prediyabet' },
]

export function gdmDegerlendir(g: { secili: readonly string[]; edd: string | null; bugun: string }) {
  const faktorler = GDM_RISK.filter((f) => g.secili.includes(f.kod)).map((f) => f.ad)
  let pencere: string | null = null
  if (g.edd) { const lmp = addDays(g.edd, -280); pencere = `${trTarih(addDays(lmp, 24 * 7))} – ${trTarih(addDays(lmp, 28 * 7))}` }
  return {
    faktorler,
    metin: faktorler.length
      ? 'Risk faktörü var: ilk vizitte erken glukoz değerlendirmesi hekimle tartışılır (öneri — hekim kilitler). 24–28. hafta OGTT yine yapılır.'
      : 'İşaretli GDM risk faktörü yok — 24–28. hafta OGTT tüm gebelerde (DÖBYR).',
    pencere,
  }
}

// VBAC / SSVD tartışması — yapılandırılmış alanlar. Karar hekim + hastanındır; araç yalnız tartışma notlarını listeler.
export type VbacGirdi = {
  oncekiSezaryen: number
  kesiTipi: 'alt_transvers' | 'alt_vertikal' | 'klasik_t' | 'bilinmiyor' | ''
  sonSezaryenAy: number | null
  oncekiVajinal: boolean
  oncekiRuptur: boolean
  kaviteMyomektomi: boolean
  previaAkreta: boolean
  prezentasyon: 'bas' | 'makat' | 'transvers' | ''
  tercih: 'ssvd' | 'elektif_cs' | 'kararsiz' | ''
}

export function vbacTartisma(g: VbacGirdi): { engel: string[]; dikkat: string[]; lehte: string[]; eksik: string[] } {
  const engel: string[] = [], dikkat: string[] = [], lehte: string[] = [], eksik: string[] = []
  if (g.oncekiSezaryen <= 0) return { engel, dikkat, lehte, eksik: ['Önceki sezaryen sayısı girilmedi.'] }
  if (g.kesiTipi === 'klasik_t') engel.push('Önceki klasik veya T kesi — SSVD genellikle aday değil (ACOG PB 205).')
  if (g.oncekiRuptur) engel.push('Önceki uterus rüptürü — SSVD genellikle aday değil (ACOG PB 205).')
  if (g.kaviteMyomektomi) dikkat.push('Kaviteye ulaşan / geniş fundal uterus cerrahisi öyküsü — rüptür riski açısından hekim değerlendirir.')
  if (g.previaAkreta) dikkat.push('Plasenta previa / akreta şüphesi — doğum yolu ve merkez planı öncelikli.')
  if (g.oncekiSezaryen >= 2) dikkat.push(`${g.oncekiSezaryen} önceki sezaryen — aday olabilir ancak danışmanlık ayrıntılı yapılmalı (ACOG PB 205).`)
  if (g.sonSezaryenAy != null && g.sonSezaryenAy < 18) dikkat.push(`Doğumlar arası süre kısa (son sezaryenden ${g.sonSezaryenAy} ay) — rüptür riski artışıyla ilişkili; tartışılmalı.`)
  if (g.prezentasyon === 'makat' || g.prezentasyon === 'transvers') dikkat.push('Baş dışı prezentasyon — doğum yolu kararını etkiler.')
  if (g.oncekiVajinal) lehte.push('Önceki vajinal doğum öyküsü SSVD başarısıyla ilişkili.')
  if (g.kesiTipi === 'alt_transvers') lehte.push('Alt segment transvers kesi.')
  if (!g.kesiTipi || g.kesiTipi === 'bilinmiyor') eksik.push('Önceki kesi tipi — ameliyat notu istenmeli.')
  if (g.sonSezaryenAy == null) eksik.push('Son sezaryenden bu yana geçen süre.')
  if (!g.tercih) eksik.push('Hastanın bilgilendirilmiş tercihi.')
  return { engel, dikkat, lehte, eksik }
}

/** Robson (WHO 2017) on grup — alanlardan türetilir; hekim doğrular. */
export type RobsonGirdi = {
  parite: 'nullipar' | 'multipar' | ''
  oncekiCs: boolean
  fetus: 'tekil' | 'cogul' | ''
  prezentasyon: 'bas' | 'makat' | 'transvers' | ''
  hafta: number | null
  eylem: 'spontan' | 'induksiyon' | 'eylem_oncesi_cs' | ''
}

export function robsonGrubu(g: RobsonGirdi): { grup: number | null; alt?: 'a' | 'b'; tanim: string; eksik: string[] } {
  const eksik: string[] = []
  if (!g.fetus) eksik.push('fetüs sayısı')
  if (!g.prezentasyon) eksik.push('prezentasyon')
  if (!g.parite) eksik.push('parite')
  if (g.hafta == null) eksik.push('gebelik haftası')
  if (!g.eylem) eksik.push('eylem başlangıcı')
  if (g.fetus === 'cogul') return { grup: 8, tanim: 'Çoğul gebelik (önceki sezaryen dahil)', eksik: [] }
  if (g.prezentasyon === 'transvers') return { grup: 9, tanim: 'Tekil, transvers / oblik (önceki sezaryen dahil)', eksik: [] }
  if (g.prezentasyon === 'makat') {
    if (!g.parite) return { grup: null, tanim: '', eksik }
    return g.parite === 'nullipar' ? { grup: 6, tanim: 'Nullipar, tekil makat', eksik: [] } : { grup: 7, tanim: 'Multipar, tekil makat (önceki sezaryen dahil)', eksik: [] }
  }
  if (eksik.length) return { grup: null, tanim: '', eksik }
  if ((g.hafta as number) < 37) return { grup: 10, tanim: 'Tekil baş, < 37 hafta (önceki sezaryen dahil)', eksik: [] }
  if (g.oncekiCs) return { grup: 5, tanim: 'Önceki sezaryen, tekil baş, ≥ 37 hafta', eksik: [] }
  const alt = g.eylem === 'induksiyon' ? 'a' as const : g.eylem === 'eylem_oncesi_cs' ? 'b' as const : undefined
  if (g.parite === 'nullipar') return g.eylem === 'spontan' ? { grup: 1, tanim: 'Nullipar, tekil baş, ≥ 37 hafta, spontan eylem', eksik: [] } : { grup: 2, alt, tanim: `Nullipar, tekil baş, ≥ 37 hafta, ${alt === 'a' ? 'indüksiyon' : 'eylem öncesi sezaryen'}`, eksik: [] }
  return g.eylem === 'spontan' ? { grup: 3, tanim: 'Multipar (önceki sezaryen yok), tekil baş, ≥ 37 hafta, spontan eylem', eksik: [] } : { grup: 4, alt, tanim: `Multipar (önceki sezaryen yok), tekil baş, ≥ 37 hafta, ${alt === 'a' ? 'indüksiyon' : 'eylem öncesi sezaryen'}`, eksik: [] }
}

export { CS_ENDIKASYONLARI }

export type CsNotGirdi = {
  endikasyonlar: string[]
  digerAciklama: string
  aciliyet: 'elektif' | 'acil' | ''
  kararZamani: string
  bulgular: string
  hafta: string
  alternatiflerKonusuldu: boolean
  onamAlindi: boolean
  anneIstegiBelgelendi: boolean
  robson: { grup: number | null; alt?: 'a' | 'b'; tanim: string }
  vbacOzet?: string
}

/** Kilitlemeden önce eksikler — savunulabilir bir kayıt için. Endikasyon ASLA araç tarafından seçilmez. */
export function csNotEksikleri(g: CsNotGirdi): string[] {
  const e: string[] = []
  if (!g.endikasyonlar.length) e.push('En az bir endikasyonu siz seçin.')
  if (g.endikasyonlar.some((x) => x.startsWith('Diğer')) && g.digerAciklama.trim().length < 5) e.push('"Diğer" endikasyonu açıklayın.')
  if (!g.aciliyet) e.push('Aciliyeti seçin (planlı / acil).')
  if (g.bulgular.trim().length < 10) e.push('Endikasyonu destekleyen bulguyu yazın (ör. KTG paterni, açıklık ve saat, ölçüm).')
  if (!g.kararZamani) e.push('Karar zamanını girin.')
  if (!g.alternatiflerKonusuldu) e.push('Alternatiflerin ve risklerin konuşulduğunu işaretleyin.')
  if (g.endikasyonlar.some((x) => x.startsWith('Anne isteği')) && !g.anneIstegiBelgelendi) e.push('Anne isteği: 39+ hafta ve bilgilendirmenin belgelendiğini işaretleyin.')
  return e
}

export function csNotMetni(g: CsNotGirdi): string {
  const end = g.endikasyonlar.map((x) => (x.startsWith('Diğer') ? `Diğer: ${g.digerAciklama.trim()}` : x))
  const zaman = g.kararZamani ? `${trTarih(g.kararZamani.slice(0, 10))} ${g.kararZamani.slice(11, 16)}`.trim() : '—'
  return [
    'SEZARYEN ENDİKASYON NOTU — hekim tarafından seçildi ve kilitlendi',
    '',
    `Endikasyon: ${end.join('; ') || '—'}`,
    `Aciliyet: ${g.aciliyet === 'acil' ? 'Acil' : g.aciliyet === 'elektif' ? 'Planlı (elektif)' : '—'} · Karar zamanı: ${zaman}${g.hafta ? ` · Gebelik haftası: ${g.hafta}` : ''}`,
    `Destekleyici bulgular: ${g.bulgular.trim() || '—'}`,
    g.robson.grup ? `Robson grubu: ${g.robson.grup}${g.robson.alt || ''} — ${g.robson.tanim}` : 'Robson grubu: belirlenmedi',
    ...(g.vbacOzet ? [`Önceki sezaryen / SSVD değerlendirmesi: ${g.vbacOzet}`] : []),
    `Alternatifler ve riskler hastayla konuşuldu: ${g.alternatiflerKonusuldu ? 'Evet' : 'Hayır'} · Sezaryen onamı (ayrı belge): ${g.onamAlindi ? 'Alındı' : 'Alınmadı'}`,
  ].join('\n')
}

export type { WindowId, GaWeeksDays, DualRecommendation }
