/**
 * KD-RAPOR-01 (Kaan, 2026-11-05) — DOĞUM EPİKRİZİ: the printable delivery discharge summary of the KD chapter, built
 * ONLY from data the doctor already recorded (the delivery spine: dogum_olaylari, bebek_kartlari, komplikasyonlar,
 * taburcu_checklist; the linked operation note for a caesarean; the patient's active medicines). Nothing clinical is
 * invented: a value that was not recorded prints as "—".
 *
 * The standard advice blocks follow T.C. Sağlık Bakanlığı Doğum Sonu Bakım Yönetim Rehberi (lohusa izlemleri at 2–5,
 * 13–17 and 30–40 days: LOHUSA_ZIYARETLERI) and WHO recommendations on maternal and newborn care for a positive
 * postnatal experience (2022); the contraception lines come from the chapter's WHO-MEC engine
 * (postpartumKontrasepsiyonBaslangic). The doctor edits the printed advice before signing if needed.
 */
import { LOHUSA_ZIYARETLERI } from './dogum-spine'
import { postpartumKontrasepsiyonBaslangic, YONTEM_KATALOG } from './kontrasepsiyon-mec'

export const DOGUM_SEKLI_ETIKET: Record<string, string> = {
  nsd: 'Normal spontan vajinal doğum',
  mudahaleli: 'Müdahaleli vajinal doğum',
  cs_elektif: 'Elektif sezaryen',
  cs_acil: 'Acil sezaryen',
  ssvd: 'Sezaryen sonrası vajinal doğum (SSVD)',
}

export type EpikrizGirdi = {
  gebelik: { sat: string | null; tdt: string | null; kan_grubu?: string | null } | null
  dogum: { dogum_sekli: string | null; dogum_zamani: string | null; cs_endikasyon?: string[] | null; pph?: Record<string, unknown> | null; intraop?: Record<string, unknown> | null } | null
  bebekler: Array<{ sira: number; cinsiyet: string | null; kilo_gram: number | null; apgar1: number | null; apgar5: number | null; gebelik_haftasi: number | null; canli: boolean }>
  komplikasyonlar: Array<{ kime: string; ad: string; ayrinti: string | null }>
  /** The caesarean's operation note (ameliyat_notlari with dogum_id), when there is one. */
  ameliyatNotu?: { kanKaybiMl: number | null; komplikasyon: string; postopOrderlar: string; islem: string } | null
  /** The patient's ACTIVE medicines (hasta_ilaclar). */
  ilaclar: Array<{ ilac_adi: string; doz?: string | null; kullanim_sikli?: string | null }>
  emziriyor: boolean
}

export type Epikriz = {
  sekil: string
  sezaryenMi: boolean
  dogumZamani: string | null
  hafta: string
  endikasyon: string
  bebekler: Array<{ sira: number; cinsiyet: string; kilo: string; apgar: string; durum: string }>
  anneKomplikasyonlari: string[]
  kanKaybi: { ml: number | null; kaynak: 'ameliyat_notu' | 'pph_kaydi' | 'intraop_kaydi' | null }
  ilaclar: string[]
  talimatlar: string[]
  kontroller: Array<{ ad: string; tarihAraligi: string }>
  kontrasepsiyon: Array<{ yontem: string; baslangic: string; not: string }>
  tehlikeIsaretleri: string[]
}

const sayiOku = (x: unknown): number | null => {
  const n = typeof x === 'number' ? x : Number(String(x ?? '').replace(/[^\d.,]/g, '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null
}
const gunEkle = (iso: string, gun: number) => { const d = new Date(iso); d.setUTCDate(d.getUTCDate() + gun); return d.toISOString().slice(0, 10) }
const trGun = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split('-'); return `${d}.${m}.${y}` }

/** Gestational age at delivery: the newborn card's week first; otherwise from the LMP (SAT). */
function dogumHaftasi(g: EpikrizGirdi): string {
  const kart = g.bebekler.find((b) => typeof b.gebelik_haftasi === 'number')?.gebelik_haftasi
  if (typeof kart === 'number') return `${kart} hafta`
  if (g.gebelik?.sat && g.dogum?.dogum_zamani) {
    const gun = Math.floor((Date.parse(g.dogum.dogum_zamani) - Date.parse(g.gebelik.sat)) / 86400000)
    if (gun > 0 && gun < 320) return `${Math.floor(gun / 7)} hafta ${gun % 7} gün`
  }
  return '—'
}

export const TABURCU_TALIMATLARI_GENEL: readonly string[] = [
  'Kanama (loşia) giderek azalır ve rengi açılır; ani artış, pıhtı veya kötü koku olursa başvurun.',
  'Perine / yara bölgesini temiz ve kuru tutun; her tuvalet sonrası önden arkaya temizleyin.',
  'Erken ve sık emzirme (bebek istedikçe) önerilir; meme başı çatlağı veya ağrılı sertlikte başvurun.',
  'Bol sıvı alın, lifli beslenin; kabızlıktan kaçının. Demir desteği ve ilaçlar hekimin yazdığı şekilde sürdürülür.',
  'Erken ve düzenli hareket edin; uzun süre hareketsiz kalmayın.',
  'Ruh hâlinizdeki değişiklikleri (sürekli üzüntü, uyuyamama, kaygı) ekibinizle paylaşın.',
  'Cinsel ilişki, ağır kaldırma ve egzersize dönüş zamanı kontrol muayenesinde konuşulur.',
]
export const TABURCU_TALIMATLARI_SEZARYEN: readonly string[] = [
  'Sezaryen yarası: pansuman ve dikiş / klips alınma zamanı hekiminizin belirttiği şekildedir; yarada kızarıklık, akıntı, açılma olursa başvurun.',
  'Karın içi basıncı artıran zorlayıcı hareketlerden ve ağır kaldırmaktan kaçının.',
  'Araç kullanmaya, acil frenlemeyi ağrısız yapabildiğinizde dönülür; hekiminize danışın.',
]
export const DOGUM_SONU_TEHLIKE_ISARETLERI: readonly string[] = [
  'Yoğun vaginal kanama (ped çok hızlı doluyorsa) veya büyük pıhtılar',
  'Ateş, titreme',
  'Kötü kokulu akıntı, şiddetli karın ağrısı',
  'Şiddetli baş ağrısı, bulanık görme, nöbet',
  'Nefes darlığı, göğüs ağrısı',
  'Bacakta tek taraflı ağrılı şişlik, kızarıklık',
  'Yarada kızarıklık, akıntı, açılma',
  'Memede ağrılı kızarıklık ve ateş',
  'İdrar yaparken yanma veya idrar yapamama',
  'Kendinize ya da bebeğinize zarar verme düşüncesi, ağır umutsuzluk',
]

export function dogumEpikriziKur(g: EpikrizGirdi): Epikriz {
  const d = g.dogum
  const sekilKod = String(d?.dogum_sekli || '')
  const sezaryenMi = sekilKod.startsWith('cs_')
  const ppDogum = d?.dogum_zamani || null

  // Blood loss: the operation note (the surgeon's EBL) → the PPH record → the legacy free-text intraop record.
  let kanKaybi: Epikriz['kanKaybi'] = { ml: null, kaynak: null }
  if (g.ameliyatNotu?.kanKaybiMl != null) kanKaybi = { ml: g.ameliyatNotu.kanKaybiMl, kaynak: 'ameliyat_notu' }
  else if (sayiOku(d?.pph?.tahmin_ml) != null) kanKaybi = { ml: sayiOku(d?.pph?.tahmin_ml), kaynak: 'pph_kaydi' }
  else {
    const legacy = d?.intraop ? Object.entries(d.intraop).find(([k]) => /kanama|kan kayb/i.test(k)) : undefined
    if (legacy && sayiOku(legacy[1]) != null) kanKaybi = { ml: sayiOku(legacy[1]), kaynak: 'intraop_kaydi' }
  }

  const anneKomplikasyonlari = g.komplikasyonlar.filter((k) => k.kime === 'anne').map((k) => (k.ayrinti ? `${k.ad} — ${k.ayrinti}` : k.ad))
  if (g.ameliyatNotu?.komplikasyon && !/^(yok|yoktur|-|—)$/i.test(g.ameliyatNotu.komplikasyon.trim())) anneKomplikasyonlari.push(`Ameliyat notu: ${g.ameliyatNotu.komplikasyon}`)
  if (d?.pph && (d.pph as { siniflama?: unknown }).siniflama) anneKomplikasyonlari.push(`Postpartum kanama: ${String((d.pph as { siniflama?: unknown }).siniflama)}`)

  const ilaclar = g.ilaclar.map((i) => [i.ilac_adi, i.doz, i.kullanim_sikli].filter(Boolean).join(' — '))
  if (d?.pph && (d.pph as { uterotonik?: unknown }).uterotonik) ilaclar.push(`Uterotonik (doğumda): ${String((d.pph as { uterotonik?: unknown }).uterotonik)}`)

  const kontroller = ppDogum
    ? LOHUSA_ZIYARETLERI.map((z) => ({ ad: z.ad, tarihAraligi: `${trGun(gunEkle(ppDogum, z.gunBas))} – ${trGun(gunEkle(ppDogum, z.gunBit))}` }))
    : LOHUSA_ZIYARETLERI.map((z) => ({ ad: z.ad, tarihAraligi: '—' }))

  const ad = (kod: string) => YONTEM_KATALOG.find((y) => y.kod === kod)?.ad || kod
  // All methods and their EARLIEST postpartum start (the engine at 42 days lists every method with its start rule).
  const kontrasepsiyon = postpartumKontrasepsiyonBaslangic(42, g.emziriyor).map((p) => ({ yontem: ad(p.yontem), baslangic: p.baslangic, not: p.not }))

  return {
    sekil: DOGUM_SEKLI_ETIKET[sekilKod] || (sekilKod ? sekilKod : '—'),
    sezaryenMi,
    dogumZamani: ppDogum,
    hafta: dogumHaftasi(g),
    endikasyon: sezaryenMi ? ((d?.cs_endikasyon || []).filter(Boolean).join(', ') || '—') : '',
    bebekler: g.bebekler.map((b) => ({
      sira: b.sira,
      cinsiyet: b.cinsiyet === 'E' ? 'Erkek' : b.cinsiyet === 'K' ? 'Kız' : '—',
      kilo: b.kilo_gram != null ? `${b.kilo_gram} g` : '—',
      apgar: `${b.apgar1 ?? '—'} / ${b.apgar5 ?? '—'}`,
      durum: b.canli ? 'Canlı' : 'Ölü doğum',
    })),
    anneKomplikasyonlari,
    kanKaybi,
    ilaclar,
    talimatlar: [...TABURCU_TALIMATLARI_GENEL, ...(sezaryenMi ? TABURCU_TALIMATLARI_SEZARYEN : [])],
    kontroller,
    kontrasepsiyon,
    tehlikeIsaretleri: [...DOGUM_SONU_TEHLIKE_ISARETLERI],
  }
}
