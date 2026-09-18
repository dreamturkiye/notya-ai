/**
 * PEDI-ARACLAR-02 — Pediatri kohort paneli (Araçlar › Pediatri kohort). Pure.
 * Girdi yalnız hekimin kendi satırları (sunucu doctor_id ile süzer). Bayraklar diğer pediatri motorlarından gelir — kopya yok:
 *   aşı → asiPlan.asiPlani · izlem / tarama → gelisimPlan.vizitPlani · persentil kayması → buyume.persentilKaymalari (Neyzi).
 * Gürültü kuralları (ürün kararı, klinik eşik değil): aşı bayrağı yalnız kaydı tutulan serilerde (seri başlamış, sıradaki doz
 * gecikmiş — ASM'de yapılıp kayda girmemiş seriler herkesi "gecikmiş" göstermesin); izlem bayrağı yalnız daha önce muayene edilmiş ve son 180 günde
 * penceresi kapanmış vizit için; işitme bayrağı 31–180. gün (tarama 30. günden sonra yapılmaz — yönlendirme hâlâ anlamlı).
 * Hatırlatma metni hasta-güvenli: tanı, ölçüm, persentil, ilaç adı YOK; acil belirtilerde 112.
 */
import { asiPlani, onerilenDonem, dozKisa, type AsiKaydi } from './asiPlan'
import { vizitPlani, type TaramaKaydi, type MchatKaydi, type GidrKaydi } from './gelisimPlan'
import { olcumSatirlari, persentilKaymalari, persentilKisa, PARAM_AD, type Olcum } from './buyume'
import { gunFarki, tarihGoster, yasMetni } from './girdi'
import type { Cinsiyet } from '@/lib/clinical/buyumeEgrisi'

export type PediKohortBayrak = 'asi_gecikti' | 'izlem_kacti' | 'persentil_kaymasi' | 'profilaksi' | 'tarama_gecikti'

export const PEDI_BAYRAK_AD: Record<PediKohortBayrak, string> = {
  asi_gecikti: 'Aşı gecikmiş',
  izlem_kacti: 'Sağlam çocuk izlemi kaçmış',
  persentil_kaymasi: 'Persentil kayması',
  profilaksi: 'D vitamini / demir',
  tarama_gecikti: 'İşitme · görme · otizm taraması',
}

export interface PediKohortGirdi {
  patientId: string
  ad: string
  dogumIso: string
  cinsiyet: Cinsiyet | null
  asilar: AsiKaydi[]
  taramalar: TaramaKaydi[]
  mchat: MchatKaydi[]
  gidr: GidrKaydi[]
  seanslar: string[]
  olcumler: Olcum[]
  ilaclar: Array<{ ad: string; aktif: boolean; baslangic: string | null; bitis: string | null }>
  /** KD taburcu paketinden bebek görevleri (izlem / dvit / demir). */
  bebekGorevleri: Array<{ kind: string; due: string; dueEnd: string | null; status: string; title: string }>
  gebelikHaftasi: number | null
  dogumKiloGr: number | null
  portalVar: boolean
}

export type PediSekme = 'asilar' | 'buyume' | 'mchat' | 'gelisim' | 'ozet'

export interface PediKohortSatir {
  patientId: string
  ad: string
  yas: string
  bayraklar: PediKohortBayrak[]
  detay: string[]
  enErkenTarih: string | null
  sonVizit: string | null
  portalVar: boolean
  /** Dosyayı aç → en ilgili sekme. */
  sekme: PediSekme
}

const DVIT_RE = /d\s*-?\s*vit|vitamin\s*d|\bd3\b|kolekalsiferol|cholecalciferol|devit/i
const DEMIR_RE = /demir|ferr|maltofer|\biron\b/i

export function pediKohortSatiri(g: PediKohortGirdi, bugun: string): PediKohortSatir {
  const yasGun = gunFarki(g.dogumIso, bugun)
  const bayraklar: PediKohortBayrak[] = []
  const detay: string[] = []
  const tarihler: string[] = []
  const sonVizit = [...g.seanslar].sort().pop() || null

  // ─── Aşı ─────────────────────────────────────────────────────────────────────────────────────
  const plan = asiPlani({ dogumIso: g.dogumIso, bugunIso: bugun, donem: onerilenDonem(g.dogumIso, g.asilar), dogumKiloGr: g.dogumKiloGr, gebelikHaftasi: g.gebelikHaftasi, kayitlar: g.asilar })
  // Yalnız kaydı tutulan seriler: seri başlamışsa sıradaki dozun gecikmesi anlamlıdır; hiç kaydı olmayan seri ASM'de
  // yapılmış olabilir (aşı planı ekranında ayrıca görünür).
  const izlenen = new Set(plan.seriler.filter((s) => s.dozlar.some((d) => d.durum === 'yapildi')).map((s) => s.seri))
  const gecikmis = plan.gecikmis.filter((d) => izlenen.has(d.seri))
  if (gecikmis.length) {
    bayraklar.push('asi_gecikti')
    const g3 = [...gecikmis].sort((a, b) => a.onerilen.localeCompare(b.onerilen))
    detay.push(`Aşı: ${g3.slice(0, 3).map((d) => `${dozKisa(d)} (${tarihGoster(d.onerilen)})`).join(', ')}${g3.length > 3 ? ` +${g3.length - 3}` : ''}`)
    tarihler.push(g3[0].onerilen)
  }

  // ─── İzlem + tarama ──────────────────────────────────────────────────────────────────────────
  const vp = vizitPlani({ dogumIso: g.dogumIso, bugunIso: bugun, gebelikHaftasi: g.gebelikHaftasi, dogumKiloGr: g.dogumKiloGr, taramalar: g.taramalar, mchat: g.mchat, gidr: g.gidr, seanslar: g.seanslar })
  const ilkSeans = [...g.seanslar].sort()[0]
  const kacan = vp.izlem.filter((v) => v.durum === 'kacirildi' && ilkSeans && ilkSeans < v.bas && gunFarki(v.son, bugun) <= 180)
  const gorevIzlem = g.bebekGorevleri.filter((x) => x.kind === 'izlem' && x.status === 'bekliyor' && (x.dueEnd || x.due) < bugun && gunFarki(x.dueEnd || x.due, bugun) <= 180)
  if (kacan.length || gorevIzlem.length) {
    bayraklar.push('izlem_kacti')
    const son = kacan[kacan.length - 1]
    if (son) { detay.push(`İzlem: ${son.etiket} (${tarihGoster(son.bas)}–${tarihGoster(son.son)}) muayene yok`); tarihler.push(son.son) }
    else { detay.push(`İzlem: ${gorevIzlem[0].title}`); tarihler.push(gorevIzlem[0].dueEnd || gorevIzlem[0].due) }
  }
  const tarama: string[] = []
  for (const k of vp.kalemler) {
    if (k.durum !== 'gecikti') continue
    if (k.kod === 'isitme' && yasGun > 180) continue
    if (k.kod === 'isitme' || k.kod === 'gorme' || k.kod === 'otizm') tarama.push(k.kod === 'isitme' ? 'işitme' : k.kod === 'gorme' ? 'görme' : 'otizm / M-CHAT')
  }
  if (tarama.length) { bayraklar.push('tarama_gecikti'); detay.push(`Tarama: ${tarama.join(', ')}`) }

  // ─── Persentil kayması (Neyzi) ───────────────────────────────────────────────────────────────
  if (g.cinsiyet && g.olcumler.length >= 2) {
    const satirlar = olcumSatirlari('neyzi', g.cinsiyet, g.dogumIso, g.olcumler)
    const sonT = satirlar[satirlar.length - 1]?.tarih
    const kaymalar = persentilKaymalari(satirlar).filter((k) => k.sonTarih === sonT && gunFarki(k.sonTarih, bugun) <= 365)
    if (kaymalar.length) {
      bayraklar.push('persentil_kaymasi')
      detay.push(kaymalar.map((k) => `${PARAM_AD[k.param]} persentili ${persentilKisa(k.pOnce)} → ${persentilKisa(k.pSon)} (${Math.abs(k.cizgi)} majör çizgi ${k.cizgi < 0 ? 'aşağı' : 'yukarı'}, Neyzi)`).join(' · '))
      tarihler.push(sonT!)
    }
  }

  // ─── Profilaksi (SB: D vit ilk günden 12. ay sonuna; demir term 4–12. ay, preterm/< 2500 g 2. aydan 5 ay) ─────────────
  const aktifIlac = (re: RegExp) => g.ilaclar.find((i) => i.aktif && re.test(i.ad))
  const herhangiIlac = (re: RegExp) => g.ilaclar.some((i) => re.test(i.ad))
  const kayit = (tur: 'dvit' | 'demir') => g.taramalar.some((t) => t.tur === tur) || g.bebekGorevleri.some((x) => x.kind === tur && x.status === 'yapildi')
  const dusuk = (g.gebelikHaftasi != null && g.gebelikHaftasi < 37) || (g.dogumKiloGr != null && g.dogumKiloGr < 2500)
  const demirBas = dusuk ? 60 : 120, demirSon = dusuk ? 212 : 365
  const prof: string[] = []
  if (yasGun >= 15 && yasGun <= 365 && !herhangiIlac(DVIT_RE) && !kayit('dvit')) prof.push('D vitamini kayıtta yok')
  if (yasGun > 395 && aktifIlac(DVIT_RE)) prof.push('D vitamini profilaksi süresi doldu (12. ay) — devam kararı')
  if (yasGun >= demirBas + 14 && yasGun <= demirSon && !herhangiIlac(DEMIR_RE) && !kayit('demir')) prof.push(`Demir kayıtta yok (${dusuk ? '2. aydan' : '4. aydan'})`)
  if (yasGun > demirSon + 30 && yasGun < 3 * 365 && aktifIlac(DEMIR_RE)) prof.push('Demir profilaksi süresi doldu — devam kararı')
  if (prof.length) { bayraklar.push('profilaksi'); detay.push(prof.join(' · ')) }

  const sekme: PediSekme = bayraklar.includes('asi_gecikti') ? 'asilar' : bayraklar.includes('persentil_kaymasi') ? 'buyume'
    : tarama.includes('otizm / M-CHAT') ? 'mchat' : 'ozet'
  return { patientId: g.patientId, ad: g.ad, yas: yasMetni(g.dogumIso, bugun), bayraklar, detay, enErkenTarih: tarihler.sort()[0] ?? null, sonVizit, portalVar: g.portalVar, sekme }
}

/** Yalnız bayraklı çocuklar; en eski gecikme üstte. */
export function pediKohortSatirlari(girdiler: PediKohortGirdi[], bugun: string): PediKohortSatir[] {
  return girdiler.map((g) => pediKohortSatiri(g, bugun)).filter((s) => s.bayraklar.length > 0)
    .sort((a, b) => String(a.enErkenTarih || '9999').localeCompare(String(b.enErkenTarih || '9999')) || a.ad.localeCompare(b.ad, 'tr'))
}

export const PEDI_HATIRLATMA_KONU = 'Çocuğunuzun kontrol hatırlatması'

export const PEDI_ACIL_METNI = 'Bu mesaj kanalı acil durumlar için değildir. Çocuğunuzda yüksek ateş, nefes almada zorluk, havale, bilinç değişikliği ya da sizi endişelendiren ani bir durum olursa beklemeden 112\'yi arayın veya en yakın acil servise başvurun.'

/** Veliye giden hasta-güvenli metin: tanı, ölçüm, persentil, ilaç adı içermez. */
export function pediHatirlatmaMesaji(bayraklar: PediKohortBayrak[]): { konu: string; metin: string } {
  const s: string[] = []
  if (bayraklar.includes('asi_gecikti')) s.push('Çocuğunuzun aşı zamanı geldi.')
  if (bayraklar.includes('izlem_kacti')) s.push('Çocuğunuzun sağlam çocuk (izlem) muayenesinin zamanı geldi.')
  if (bayraklar.includes('persentil_kaymasi')) s.push('Çocuğunuzun büyüme kontrolü için muayene zamanı geldi.')
  if (bayraklar.includes('tarama_gecikti')) s.push('Çocuğunuzun tarama kontrolünün (işitme / görme / gelişim) zamanı geldi.')
  if (bayraklar.includes('profilaksi')) s.push('Çocuğunuzun vitamin ve demir desteği için kontrol zamanı geldi.')
  if (!s.length) s.push('Çocuğunuzun kontrol zamanı geldi.')
  return { konu: PEDI_HATIRLATMA_KONU, metin: `Merhaba, ${s.join(' ')} Randevu için muayenehanemizi arayabilir veya bu mesaja yanıt yazabilirsiniz.\n\n${PEDI_ACIL_METNI}` }
}
