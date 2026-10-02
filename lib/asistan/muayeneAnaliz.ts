/**
 * NOTYA-AYSE-ANALIZ-01 (Dr. Gökhan live feedback; Kaan approved 2026-10-02) — analysis across a patient's visits.
 *
 * "Bu hastanın hangi muayenesinde X yapıldı", "son 4 muayeneden sonra eksikler var mı, nelerdir". The pieces already
 * existed and are only WIRED here as three read tools of the single brain (executors: lib/asistan/okumaAraclari.ts):
 *
 *   muayene_ara      which visits a drug, test, vaccine, diagnosis or procedure appears in — from the event index
 *                    (lib/doktor/dosyaOlaylari.ts), matched with the existing term helpers (complaint synonyms,
 *                    vaccine series, lab canonical keys), each line with the STATE the index gives it.
 *   muayeneleri_oku  a bounded digest of N visits: note sections, the measurements bound to the visit
 *                    (dosyaSorgu/vizitOlcum — the same reader as "12 aylık muayenesinde kaç kiloydu"), prescriptions,
 *                    what was planned and whether a later record answers it (lib/doktor/planTakibi.ts). Size-capped;
 *                    says when and what it cut.
 *   eksikler         the patient's gaps. Section A is Fısıltı's own engine for this patient
 *                    (lib/doktor/fisiltiHasta.ts) — what the whisper card says, verbatim. Section B is the open items
 *                    of the clinical file query standard (lib/doktor/acikIsler.ts) for the topics Fısıltı has no rule
 *                    for: something a note planned / asked for whose answer is not in the record.
 *
 * Pure text builders: no database, no model, no clinical rule of its own. Nothing is judged here — a measurement a
 * visit does not have is written "kayıt yok", a plan with no later record is written as the index states it.
 *
 * KVKK: the event index carries no identity or contact value; neither does anything built here.
 */
import type { AnthropicArac } from '@/core/eylemler/araclar'
import { trGun, VIZIT_BOLUM_SINIRI, type DosyaHastasi, type DosyaOlayi } from '@/lib/doktor/dosyaOlaylari'
import { acikIsleriBul, type AcikIs, type AcikIsTuru } from '@/lib/doktor/acikIsler'
import { asiPlanSatiri, durumAdi, labAdlari, planKarsiligi, planOlaylari } from '@/lib/doktor/planTakibi'
import { labAnahtarlariBul } from '@/lib/doktor/planIfadesi'
import type { HastaFisiltisi } from '@/lib/doktor/fisiltiHasta'
import { esanlamGenislet, terimlerdenBiriGeciyor } from '@/lib/klinik/sikayetEsanlam'
import { vizitTuruGruplariBul, vizitYasIfadesiCoz } from '@/lib/klinik/vizitTuruEsanlam'
import { kayitSerisi } from '@/specialties/pediatri/engines/asiPlan'
import { vizitBolumleri } from '@/lib/asistan/kayitTablosu'
import { yasAyHesapla } from '@/lib/asistan/dosyaSorgu/kanit'
import { parametreSec } from '@/lib/asistan/dosyaSorgu/parametreler'
import { OLCUM_ADI, vizitleriSec, vizitOlcumKaniti, type OlcumAnahtari } from '@/lib/asistan/dosyaSorgu/vizitOlcum'
import { trAramaNormalize } from '@/lib/utils/turkceArama'

const HASTA_ADI = { type: 'string', description: 'Hekimin söylediği hasta adı. Soruda ad yoksa boş bırak: açık dosyanın hastası kullanılır.' }

export const ANALIZ_ARACLARI: AnthropicArac[] = [
  {
    name: 'muayene_ara',
    description:
      'Bir hastanın HANGİ MUAYENESİNDE bir ilaç, tetkik, aşı, tanı ya da işlemin geçtiğini bulur: "hangi muayenede X yapıldı / yazıldı / istendi / uygulandı", "X ne zaman verildi", "daha önce X aldı mı". Dönen her satırda tarih, muayene ve kaydın DURUMU vardır (planlandı / istendi / reçete edildi ≠ uygulandı / sonuçlandı) — durumu AYNEN aktar. Tek bir terim gönder.',
    input_schema: {
      type: 'object',
      properties: {
        terim: { type: 'string', description: 'Aranan tek ad. Örn: "Augmentin", "hemogram", "Hepatit B aşısı", "otit", "EEG".' },
        hasta_adi: HASTA_ADI,
      },
      required: ['terim'],
    },
  },
  {
    name: 'muayeneleri_oku',
    description:
      'Bir hastanın birden çok muayenesini BİRLİKTE okumak için: son N muayene, belirli tarihlerdeki muayeneler ya da bir türdeki muayeneler. Her muayene için şikayet, bulgu, değerlendirme, tanı, plan, o muayeneye bağlı ölçümler, reçeteler ve planlananların sonraki kayıttaki karşılığı döner. Muayeneler arasında karşılaştırma, seyir, "N muayenede ne yapıldı / ne değişti" soruları için çağır. Boyutu sınırlıdır; kestiyse söyler.',
    input_schema: {
      type: 'object',
      properties: {
        adet: { type: 'integer', description: 'Son kaç muayene. Örn 4. Hiçbir seçim verilmezse son 4 muayene okunur.' },
        tarihler: { type: 'array', items: { type: 'string' }, description: 'Belirli muayene tarihleri (YYYY-AA-GG ya da GG.AA.YYYY).' },
        tur: { type: 'string', description: 'Muayene türü ya da yaş dönümü. Örn: "sağlam çocuk", "12 aylık", "ilk", "kontrol".' },
        hasta_adi: HASTA_ADI,
      },
    },
  },
  {
    name: 'eksikler',
    description:
      'Bir hastanın eksiklerini ve açık işlerini verir: "eksik var mı", "nelerdir", "açık iş", "takip edilmeyen", "gözden kaçan". A bölümü Fısıltı hatırlatmalarıyla AYNI motordan gelir (Fısıltı kartında görünenle aynıdır); B bölümü notlarda planlanıp / istenip karşılığı kayıtta görünmeyenlerdir. Listeyi AYNEN aktar; madde ekleme, çıkarma.',
    input_schema: {
      type: 'object',
      properties: { hasta_adi: HASTA_ADI },
    },
  },
]

/** Prompt rule for the single brain's tail. */
export const ANALIZ_KURALI = `MUAYENELER ARASI ANALİZ (dosyası açık ya da adı söylenen hasta):
• "Hangi muayenesinde / ne zaman X yapıldı, yazıldı, istendi, uygulandı", "daha önce X aldı mı" → muayene_ara (terim: ilacın, tetkikin, aşının, tanının ya da işlemin adı — tek terim; iki şey soruluyorsa iki kez çağır).
• Birden çok muayeneyi birlikte okuman gerekiyorsa ("son 3 muayenede ne yapıldı", "muayeneler arasında ne değişti", "o iki muayeneyi karşılaştır") → muayeneleri_oku (son N muayene, tarihler ya da tür).
• "Eksik var mı, nelerdir", "açık iş", "takip edilmeyen / gözden kaçan" → eksikler. "Son N muayeneden sonra eksikler" gibi bir aralık söylendiyse eksikler ile birlikte muayeneleri_oku'yu (o N muayene) da çağır ve ikisini birleştir.
Kurallar: aracın yazdığı DURUMU aynen aktar — planlandı / önerildi / istendi / reçete edildi, uygulandı / sonuçlandı demek DEĞİLDİR; "kayıt yok" yazan şeye "yapılmadı" deme. Eksik listesini araçtan AYNEN al: A bölümü Fısıltı ile aynı kaynaktır, madde ekleme ve çıkarma; B bölümünü ayrı söyle. Araç "KESİLDİ" dediyse hekime neyin gösterilmediğini söyle. Araç bulamadıysa "dosyada bu kayıt yok Hocam" de, tahmin yürütme.`

/* ───────────────────────────── shared ───────────────────────────── */

const katla = (s: unknown) => trAramaNormalize(String(s ?? ''))
const vizitler = (o: DosyaOlayi[]) => o.filter((x) => x.kaynak === 'not' && x.tur === 'vizit').sort((a, b) => a.tarih.localeCompare(b.tarih))
const kisa = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)

/** The visit's type as its note states it (lib/klinik/vizitTuruEsanlam.ts); a note that names none is a plain exam. */
function vizitTuru(v: DosyaOlayi): string {
  const g = vizitTuruGruplariBul(v.metin)
  return g.length ? g.map((x) => x.ad).join(', ') : 'muayene'
}

const KAYNAK_ADI: Record<string, string> = { asi: 'aşı kaydı', lab: 'lab sonucu', ilac: 'ilaç kaydı', belge: 'belge', cihaz: 'cihaz ölçümü', randevu: 'randevu', konsultasyon: 'konsültasyon', intake: 'ilk kayıt formu / hasta kartı', olcum: 'kayıt', not: 'not' }
const DURUM_EK: Record<string, string> = { uygulandi: 'uygulandı', sonuclandi: 'sonuçlandı', aktif: 'aktif', kesildi: 'kesildi', tamamlandi: 'tamamlandı', belirsiz: 'durumu belirsiz' }
const durumYaz = (d: string) => DURUM_EK[d] || durumAdi(d)

/* ───────────────────────────── muayene_ara ───────────────────────────── */

export const ARAMA_SATIR_TAVANI = 30

/** Does this event mention the term — by its text (with complaint synonyms), its vaccine series or its lab key? */
function eslesir(o: DosyaOlayi, a: { terimler: string[]; seri: string | null; lab: string[] }): boolean {
  if (terimlerdenBiriGeciyor(o.metin, a.terimler)) return true
  if (a.seri && o.anahtar === a.seri && (o.kaynak === 'asi' || o.tur === 'asi')) return true
  if (a.lab.length && ((o.kaynak === 'lab' && a.lab.includes(String(o.anahtar))) || (o.tur === 'lab' && (o.anahtarlar || []).some((x) => a.lab.includes(x))))) return true
  return false
}

export function muayeneAra(terimHam: string, olaylar: DosyaOlayi[], hastaAdi: string): string {
  const ad = String(hastaAdi || '').trim() || 'Hasta'
  const terim = String(terimHam || '').replace(/\s+/g, ' ').trim().slice(0, 80)
  if (katla(terim).replace(/[^a-z0-9]/g, '').length < 2) return 'Aranacak terimi anlayamadım. Tek bir ilaç, tetkik, aşı, tanı ya da işlem adı gönder.'
  const tum = vizitler(olaylar)
  const arama = { terimler: esanlamGenislet(terim), seri: kayitSerisi(terim), lab: labAnahtarlariBul(terim) }
  const eslesen = olaylar.filter((o) => o.tur !== 'olcum-metin' && eslesir(o, arama))
  const kapsam = `Arama: onaylı muayene notları, reçeteler, aşı / lab / ilaç kayıtları, konsültasyon ve belgeler${arama.terimler.length > 1 ? `; eşdeğer terimlerle (${arama.terimler.slice(0, 8).join(', ')}${arama.terimler.length > 8 ? '…' : ''})` : ''}.`
  if (!eslesen.length) {
    return `${ad} — "${terim}" dosyadaki ${tum.length} onaylı muayenenin hiçbirinde ve diğer kayıtlarda geçmiyor. ${kapsam} Kayıt yok demek yapılmadı demek değildir.`
  }

  const sira = new Map(tum.map((v, i) => [String(v.vizitId), i + 1]))
  const gunVizit = new Map<string, DosyaOlayi>()
  for (const v of tum) if (!gunVizit.has(v.tarih)) gunVizit.set(v.tarih, v)
  const vizitSatirlari = new Map<string, string[]>()
  const disSatirlar: { tarih: string; metin: string }[] = []
  // One sentence can carry several plan events ("Hemogram ve ferritin istendi"): the same line is written once.
  const vizitEkle = (v: DosyaOlayi, s: string) => {
    const var_ = vizitSatirlari.get(String(v.vizitId)) || []
    if (!var_.includes(s)) vizitSatirlari.set(String(v.vizitId), [...var_, s])
  }

  for (const o of eslesen) {
    if (o.kaynak === 'not' && o.tur === 'vizit') continue // the note itself — handled below, section by section
    const kendi = o.vizitId ? tum.find((v) => v.vizitId === o.vizitId) : undefined
    const satir = o.kaynak === 'ilac' && o.tur === 'recete' ? `reçete edildi — ${o.metin}`
      : o.kaynak === 'not' ? `not metni — ${durumYaz(o.durum)}: "${kisa(o.metin, 200)}"`
      : `${KAYNAK_ADI[o.kaynak] || o.kaynak} — ${kisa(o.metin, 200)} — ${durumYaz(o.durum)}`
    if (kendi) { vizitEkle(kendi, satir); continue }
    const ayniGun = gunVizit.get(o.tarih)
    if (ayniGun) vizitEkle(ayniGun, `aynı günlü ${satir}`)
    else disSatirlar.push({ tarih: o.tarih, metin: satir })
  }
  // The note text of a visit: the sections the term is in. The Plan section is skipped when a plan / prescription
  // event of that visit already carries it with its state.
  for (const v of eslesen.filter((o) => o.kaynak === 'not' && o.tur === 'vizit')) {
    const var_ = vizitSatirlari.get(String(v.vizitId)) || []
    for (const [bolum, metin] of Object.entries(vizitBolumleri(v.metin))) {
      if (!terimlerdenBiriGeciyor(metin, arama.terimler) || (bolum === 'Plan' && var_.length)) continue
      vizitEkle(v, `notun ${bolum.toLocaleLowerCase('tr-TR')} bölümü: "${kisa(metin, 200)}"`)
    }
  }

  const bloklar: string[] = []
  for (const v of tum) {
    const s = vizitSatirlari.get(String(v.vizitId))
    if (s?.length) bloklar.push(`- ${trGun(v.tarih)} — ${sira.get(String(v.vizitId))}. muayene (${vizitTuru(v)}): ${s.join(' | ')}`)
  }
  const disBlok = disSatirlar.sort((a, b) => a.tarih.localeCompare(b.tarih)).map((d) => `- ${trGun(d.tarih === '0000-00-00' ? null : d.tarih)} — ${d.metin}`)
  const hepsi = [...bloklar, ...(disBlok.length ? ['MUAYENE GÜNÜ DIŞINDAKİ KAYITLAR:', ...disBlok] : [])]
  const kesildi = hepsi.length > ARAMA_SATIR_TAVANI
  return [
    `${ad} — "${terim}": ${bloklar.length ? `${tum.length} onaylı muayenenin ${bloklar.length} tanesinde geçiyor` : `onaylı muayene notlarında geçmiyor`}${disBlok.length ? `; muayene günü dışında ${disBlok.length} kayıt` : ''}.`,
    ...hepsi.slice(0, ARAMA_SATIR_TAVANI),
    ...(kesildi ? [`KESİLDİ: ${hepsi.length} satırın ilk ${ARAMA_SATIR_TAVANI} tanesi gösterildi.`] : []),
    kapsam,
    'Durumlar kayıttaki gibidir: planlandı / istendi / reçete edildi, uygulandı / sonuçlandı ile aynı değildir.',
  ].join('\n')
}

/* ───────────────────────────── muayeneleri_oku ───────────────────────────── */

/** One call reads at most this many visits. */
export const MUAYENE_ADET_TAVANI = 8
/** Size cap of the digest in characters (Turkish runs at roughly 3 characters per token: about 2 300 tokens). */
export const MUAYENE_OZET_TAVANI = 7000
const VARSAYILAN_ADET = 4

export interface MuayeneSecimi { adet?: unknown; tarihler?: unknown; tur?: unknown }

function isoTarih(ham: string): string | null {
  const s = ham.trim()
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null
}

/** The visits a selection names, oldest first, and how the selection reads. Unknown input never widens the selection silently. */
function sec(s: MuayeneSecimi, olaylar: DosyaOlayi[], hasta: Pick<DosyaHastasi, 'dogumIso'>): { secili: DosyaOlayi[]; etiket: string; not: string } {
  const tum = vizitler(olaylar)
  const tarihHam = Array.isArray(s.tarihler) ? s.tarihler.map(String) : typeof s.tarihler === 'string' ? s.tarihler.split(/[,;]+|\s+ve\s+/) : []
  const tarihler = tarihHam.map(isoTarih).filter((x): x is string => Boolean(x))
  if (tarihHam.filter((x) => x.trim()).length) {
    const bulunmayan = tarihler.filter((t) => !tum.some((v) => v.tarih === t))
    return {
      secili: tum.filter((v) => tarihler.includes(v.tarih)), etiket: `tarihler: ${tarihler.map(trGun).join(', ') || 'okunamadı'}`,
      not: bulunmayan.length ? `Bu tarihlerde onaylı muayene yok: ${bulunmayan.map(trGun).join(', ')}.` : '',
    }
  }
  const tur = String(s.tur ?? '').replace(/\s+/g, ' ').trim().slice(0, 80)
  if (tur) {
    const n = katla(tur)
    if (/^(ilk|birinci)\b/.test(n)) return { secili: tum.slice(0, 1), etiket: 'ilk muayene', not: '' }
    if (/^(son|en son)\b/.test(n)) return { secili: tum.slice(-1), etiket: 'son muayene', not: '' }
    const yas = vizitYasIfadesiCoz(tur), gruplar = vizitTuruGruplariBul(tur)
    if (yas || gruplar.length) {
      // The same selection as the one-exam measurement answer: an age must match, no silent fall to another visit.
      const r = vizitleriSec(olaylar, hasta, { tip: 'vizit', yas, gruplar })
      return { secili: r.vizitler, etiket: `tür: ${tur}`, not: r.secim === 'yas-tarih' ? 'Notta bu yaş yazmıyor; muayene tarihindeki yaşa göre seçildi.' : '' }
    }
    return { secili: tum.filter((v) => terimlerdenBiriGeciyor(v.metin, esanlamGenislet(tur))), etiket: `notunda "${tur}" geçen muayeneler`, not: '' }
  }
  const adetHam = Number(String(s.adet ?? '').replace(',', '.'))
  const adet = Number.isFinite(adetHam) && adetHam >= 1 ? Math.floor(adetHam) : VARSAYILAN_ADET
  return { secili: tum.slice(-adet), etiket: `son ${adet} muayene`, not: adet > tum.length ? `Dosyada yalnız ${tum.length} onaylı muayene var.` : '' }
}

function planSatiri(p: DosyaOlayi, olaylar: DosyaOlayi[]): string {
  const k = planKarsiligi(p, olaylar)
  const ad = p.tur === 'asi' ? asiPlanSatiri(p) : p.tur === 'lab' ? `${labAdlari(p.anahtarlar)} — ${durumAdi(p.durum)} ("${kisa(p.metin, 120)}")` : `${p.tur} — ${durumAdi(p.durum)} ("${kisa(p.metin, 120)}")`
  return `${ad} → ${k ? `karşılığı: ${k.guven === 'metin' ? 'yalnız sonraki not metninde' : 'kayıt'} (${trGun(k.tarih)})` : 'sonraki kayıtta karşılığı yok'}`
}

export function muayeneOzeti(s: MuayeneSecimi, olaylar: DosyaOlayi[], hasta: DosyaHastasi, hastaAdi: string): string {
  const ad = String(hastaAdi || '').trim() || 'Hasta'
  const tum = vizitler(olaylar)
  if (!tum.length) return `${ad} için onaylı muayene notu yok.`
  const { secili: istenen, etiket, not } = sec(s, olaylar, hasta)
  if (!istenen.length) return `${ad} — ${etiket}: eşleşen onaylı muayene yok. ${not} Dosyada ${tum.length} onaylı muayene var (${trGun(tum[0].tarih)} – ${trGun(tum[tum.length - 1].tarih)}).`.replace(/\s+/g, ' ')
  // Newest first when something has to go: the older visits are the ones cut.
  const secili = istenen.slice(-MUAYENE_ADET_TAVANI)
  const sira = new Map(tum.map((v, i) => [String(v.vizitId), i + 1]))
  const temel: OlcumAnahtari[] = parametreSec(hasta.brans, hasta.dogumIso, hasta.bugunIso).anahtar === 'pediatri' ? ['kilo', 'boy', 'basCevresi'] : ['kilo', 'boy', 'tansiyon']
  const seri = vizitOlcumKaniti({ olcumler: ['kilo', 'boy', 'basCevresi', 'tansiyon', 'ates', 'nabiz', 'spo2'], genel: true, hedef: { tip: 'seri' }, degerlendirme: false, kesin: true }, olaylar, hasta).seri || []
  /** Per measurement: the dates of the shown visits that have no record of it. */
  const olcumsuz = new Map<OlcumAnahtari, string[]>()

  const blok = (v: DosyaOlayi): string => {
    const b = vizitBolumleri(v.metin)
    const bolum = (etiketi: string, anahtar: keyof typeof VIZIT_BOLUM_SINIRI) => {
      const m = b[anahtar]
      if (!m) return `${etiketi}: kayıt yok`
      return `${etiketi}: ${m}${m.length >= VIZIT_BOLUM_SINIRI[anahtar] ? ' … [bu bölüm kayıtta daha uzun; burada kısaltıldı]' : ''}`
    }
    const kayitlar = Object.values(seri.find((x) => x.tur === 'muayene' && x.tarih === v.tarih)?.kayitlar || {})
    const eksik = temel.filter((o) => !kayitlar.some((k) => k.olcum === o))
    for (const o of eksik) olcumsuz.set(o, [...(olcumsuz.get(o) || []), v.tarih])
    const olcum = [
      ...kayitlar.map((k) => `${OLCUM_ADI[k.olcum]} ${k.metin}${k.kaynak === 'alan' ? '' : ` (${k.kaynak === 'metin' ? 'not metninden' : 'cihaz ölçümü'})`}`),
      ...eksik.map((o) => `${OLCUM_ADI[o]}: kayıt yok`),
    ]
    const recete = olaylar.filter((o) => o.tur === 'recete' && o.vizitId === v.vizitId).map((o) => o.metin)
    const planlar = planOlaylari(olaylar).filter((o) => o.vizitId === v.vizitId)
    const ayniGun = olaylar.filter((o) => o.tarih === v.tarih && (o.kaynak === 'asi' || o.kaynak === 'lab')).map((o) => `${KAYNAK_ADI[o.kaynak]}: ${o.metin} — ${durumYaz(o.durum)}`)
    return [
      `### ${sira.get(String(v.vizitId))}. muayene — ${trGun(v.tarih)} (${vizitTuru(v)})`,
      bolum('Şikayet / öykü', 'Şikayet'), bolum('Bulgu', 'Bulgu'), bolum('Değerlendirme', 'Değerlendirme'), bolum('Tanı', 'Tanı'), bolum('Plan', 'Plan'),
      `Ölçümler: ${olcum.join('; ')}`,
      `Reçete: ${recete.length ? recete.join('; ') : 'yok'}`,
      ...(planlar.length ? ['Planlananlar ve sonraki kayıttaki karşılığı:', ...planlar.map((p) => `- ${planSatiri(p, olaylar)}`)] : []),
      ...(ayniGun.length ? [`Aynı günlü kayıtlar: ${ayniGun.join('; ')}`] : []),
    ].join('\n')
  }

  // Fill from the newest back, within the size cap; show oldest first.
  const bloklar: string[] = []
  let boyut = 0
  for (const v of [...secili].reverse()) {
    const m = blok(v)
    if (bloklar.length && boyut + m.length > MUAYENE_OZET_TAVANI) break
    bloklar.unshift(m.length > MUAYENE_OZET_TAVANI ? `${m.slice(0, MUAYENE_OZET_TAVANI)}… [KESİLDİ]` : m)
    boyut += m.length
  }
  const gosterilen = secili.slice(-bloklar.length)
  const kesilen = istenen.filter((v) => !gosterilen.includes(v))
  const kesildi = kesilen.length
    ? `KESİLDİ: ${istenen.length} muayeneden ${gosterilen.length} tanesi gösterildi (${istenen.length > MUAYENE_ADET_TAVANI ? `bir çağrıda en çok ${MUAYENE_ADET_TAVANI} muayene` : 'boyut sınırı'}). Gösterilmeyenler: ${kesilen.map((v) => trGun(v.tarih)).join(', ')} — tarih vererek yeniden çağır.`
    : ''
  // Only the visits actually shown count in the closing line; oldest first.
  const gosterilenTarih = new Set(gosterilen.map((v) => v.tarih))
  const olcumsuzGosterilen = temel
    .map((o) => ({ o, t: (olcumsuz.get(o) || []).filter((t) => gosterilenTarih.has(t)).sort() }))
    .filter((x) => x.t.length)
    .map((x) => `${OLCUM_ADI[x.o]} — ${x.t.map(trGun).join(', ')}`)
  return [
    `${ad} — ${etiket}: ${gosterilen.length} muayene (dosyada toplam ${tum.length} onaylı muayene; bugün ${trGun(hasta.bugunIso)}).${not ? ` ${not}` : ''}`,
    ...(kesildi ? [kesildi] : []),
    '',
    bloklar.join('\n\n'),
    '',
    olcumsuzGosterilen.length ? `Ölçüm kaydı olmayan muayeneler: ${olcumsuzGosterilen.join('; ')}.` : 'Bu muayenelerin hepsinde temel ölçümler kayıtlı.',
    'Yalnız onaylı notlar ve kayıtlı değerler. "Karşılığı yok" = sonraki kayıtta bulunamadı; yapılmadı demek değildir.',
  ].join('\n')
}

/* ───────────────────────────── eksikler ───────────────────────────── */

/**
 * Open-item types the branch PARAMETERS compute from a schedule (vaccine calendar, growth curve, screening window).
 * In a branch whose Fısıltı engine is connected these topics are Fısıltı's: its lines are shown (section A) and the
 * standard's own schedule lines are not, so the two never say different things about the same schedule.
 */
const FISILTI_KONUSU = new Set<AcikIsTuru>(['asi-eksik', 'buyume', 'tarama-zamani'])

export interface EksiklerGirdisi {
  hastaAdi: string
  hasta: DosyaHastasi
  olaylar: DosyaOlayi[]
  fisilti: HastaFisiltisi
}

/** The Fısıltı lines exactly as the card carries them (`detay`; the title when the engine gives no detail line). */
export function fisiltiSatirlari(f: HastaFisiltisi): string[] {
  if (!f.oge) return []
  return f.oge.detay.length ? [...f.oge.detay] : [f.oge.baslik]
}

export function eksiklerMetni(g: EksiklerGirdisi): string {
  const ad = String(g.hastaAdi || '').trim() || 'Hasta'
  const { hasta, olaylar, fisilti: f } = g
  const isler = acikIsleriBul(olaylar, yasAyHesapla(hasta.dogumIso, hasta.bugunIso), hasta.brans, hasta)
  // Fısıltı's schedule lines replace the standard's only when they can actually be shown.
  const suz = (l: AcikIs[]) => (f.bagli ? l.filter((i) => !FISILTI_KONUSU.has(i.tur)) : l)
  const bugun = suz(isler.bugun), yakinda = suz(isler.yakinda), rutin = suz(isler.rutin)
  const satir = (i: AcikIs) => `- ${i.guvenlik ? '⚠ ' : ''}${i.metin}`

  const a: string[] = ['A) FISILTI — hatırlatma motoruyla aynı kural, aynı kayıt (Fısıltı kartında görünenle aynıdır):']
  if (!f.destekli) a.push('- Bu branş için Fısıltı kuralı tanımlı değil; takvime dayalı kalemler B bölümündedir.')
  else if (!f.bagli) a.push('- Bu branşın Fısıltı kuralları buradan okunamıyor; bu bölüm BİLİNMİYOR ("eksik yok" anlamına gelmez). Hatırlatmalar için Fısıltı kartına bakın.')
  else if (f.hata) a.push('- Fısıltı motoruna şu an ulaşılamadı; bu bölüm BİLİNMİYOR ("eksik yok" anlamına gelmez).')
  else if (!f.oge) a.push('- Fısıltı bu hasta için bir uyarı üretmiyor.')
  else {
    a.push(...fisiltiSatirlari(f).map((d) => `- ${d}`))
    if (f.oge.enErkenTarih) a.push(`  (en eski gecikme: ${trGun(f.oge.enErkenTarih)})`)
    if (f.gizli || f.sessiz) a.push(`  Not: ${f.sessiz ? 'bu hastanın Fısıltı hatırlatmaları sessize alınmış' : 'bu uyarı Fısıltı kartında gizlenmiş'}; kartta görünmez, eksik yine de kayıtta duruyor.`)
  }

  const b: string[] = [`B) NOTLARDA PLANLANIP / İSTENİP KARŞILIĞI KAYITTA GÖRÜNMEYENLER — dosya sorgu standardı${f.bagli ? ' (bu konularda Fısıltı kuralı yok)' : ''}:`]
  if (!bugun.length && !yakinda.length && !rutin.length) b.push('- Açık iş saptanmadı.')
  if (bugun.length) b.push('Bugün bakılacaklar:', ...bugun.map(satir))
  if (yakinda.length) b.push('Yakın zamanda:', ...yakinda.map(satir))
  if (rutin.length) b.push('Rutin:', ...rutin.map(satir))

  return [
    `${ad} — eksikler ve açık işler (bugün ${trGun(hasta.bugunIso)}; ${vizitler(olaylar).length} onaylı muayene).`,
    ...a, ...b,
    '"Kayıt yok" = dosyada karşılığı bulunamadı; yapılmadı demek değildir. Bir muayenede ölçüm kaydı olup olmadığı muayene dökümünde yazar.',
  ].join('\n')
}
