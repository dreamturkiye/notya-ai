/**
 * AU-CANLI-02 — THE DESK of the live assistant: what the signed-in doctor's own account holds that the assistant may read
 * in a turn. Türkiye's Ayşe reads the doctor's calendar, patient list, a named patient's file, waiting notes, messages,
 * consultations and report numbers (lib/asistan/okumaAraclari.ts, ayseCevapla.ts); this is the same reach for a country,
 * built on the country's own tables and read helpers (lib/ulke/uygulama/*), as ONE per-turn block of text instead of
 * a tool round trip (a tool call adds a full model call to the spoken reply).
 *
 * HASTA-IZOLASYON (.cursor/skills/hasta-izolasyon/SKILL.md):
 *   - the only identity is `doktorId`, from the verified session (typed turn) or the signed call token (voice);
 *   - NO patient, note, session or appointment id is read from a request: a patient is found by NAME among the patients
 *     of THIS doctor (hastalariListele: doctor_id in the query), and everything read afterwards uses ids that query
 *     returned, through helpers that carry doctor_id in every statement (hastaninMuayeneleri, notGetir, hastaninRandevulari);
 *   - READ ONLY. Nothing is written, sent or changed from here.
 *   - never read for the model: national identity number, telephone, address. Names, age, sex, language, visits and note
 *     text only, the same set Türkiye gives its assistant when a file is open.
 *   - nothing here is logged (no names, no text).
 *
 * Every part fails soft: a part that cannot be read is left out and the block says so, so the assistant never claims it
 * "cannot see" something it merely could not read this time.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { konsultasyonAcik, gelenKonsultasyonlar } from '../konsultasyon/konsultasyon'
import { hekimOkunmamislari, mesajAcik } from '../mesaj/mesaj'
import { ozellikAcik } from '../ulke'
import { hastalariListele, type Hasta } from '../uygulama/hastalar'
import { bugunkuMuayeneler, hastaninMuayeneleri } from '../uygulama/muayeneler'
import { notGetir } from '../uygulama/notlar'
import { randevulariListele, hastaninRandevulari, type Randevu } from '../uygulama/randevular'
import { raporOzeti } from '../uygulama/raporlar'
import { hesapSaatDilimi } from '../uygulama/saatDilimi'
import { yerelAn, saatYazDk } from '../uygulama/zaman'

/** The desk is read within this budget; what is not back by then is left out (a voice turn must not wait for a slow table). */
export const MASA_BUTCESI_MS = 2_500
const TAKVIM_GUNU = 7
const TAKVIM_SATIRI = 25
const NOT_SAYISI = 2
const NOT_BOLUMU_AZAMI = 700
const ADAY_AZAMI = 5
const LISTE_AZAMI = 15

const katla = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const sozcukler = (s: string): string[] => katla(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean)

/** Ownership-free pure part: which of THIS doctor's patients does the doctor's sentence name? */
export function adiGecenHastalar<T extends Pick<Hasta, 'id' | 'ad'>>(mesaj: string, hastalar: readonly T[]): { tam: T[]; adaylar: T[] } {
  const kelimeler = new Set(sozcukler(mesaj))
  if (!kelimeler.size) return { tam: [], adaylar: [] }
  const tam: T[] = []
  const adaylar: T[] = []
  for (const h of hastalar) {
    const parcalar = sozcukler(h.ad).filter((p) => p.length >= 2)
    if (!parcalar.length) continue
    if (parcalar.length >= 2 && parcalar.every((p) => kelimeler.has(p))) { tam.push(h); continue }
    const ilk = parcalar[0]
    if (ilk.length >= 3 && kelimeler.has(ilk)) adaylar.push(h)
  }
  // A given name that matches one patient only is that patient; several = ask which.
  if (!tam.length && adaylar.length === 1) return { tam: adaylar, adaylar: [] }
  return { tam: tam.slice(0, 2), adaylar: tam.length ? [] : adaylar.slice(0, ADAY_AZAMI) }
}

const yasHesapla = (dogum: string, bugun: Date): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dogum)
  if (!m) return ''
  let yas = bugun.getUTCFullYear() - Number(m[1])
  if (bugun.getUTCMonth() + 1 < Number(m[2]) || (bugun.getUTCMonth() + 1 === Number(m[2]) && bugun.getUTCDate() < Number(m[3]))) yas -= 1
  return yas >= 0 && yas < 131 ? `${yas}y` : ''
}

const kes = (s: string, n: number): string => { const t = s.replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n)}...` : t }

const DURUM: Record<string, string> = { planlandi: 'booked', geldi: 'arrived', tamamlandi: 'completed', gelmedi: 'did not attend', iptal: 'cancelled' }
const NOT_DURUMU: Record<string, string> = { taslak: 'draft, not yet approved', onayli: 'approved', notsuz: 'no note yet' }

export function randevuSatiri(r: Randevu, gunEtiketi = false): string {
  const kim = r.hastaAdi || '(no patient record)'
  const ek = [DURUM[r.durum] ?? r.durum, r.neden ? kes(r.neden, 80) : ''].filter(Boolean).join('; ')
  return `- ${gunEtiketi ? `${r.gun} ` : ''}${r.saat} (${r.sureDk} min) ${kim}${ek ? ` — ${ek}` : ''}`
}

async function takvim(sb: SupabaseClient, doktorId: string, bugun: string): Promise<string[]> {
  const liste = await randevulariListele(sb, doktorId, bugun, TAKVIM_GUNU)
  if (!liste) return ['CALENDAR: could not be read this turn. Say so; do not say you have no access.']
  const gecerli = liste.filter((r) => r.durum !== 'iptal')
  const bugunku = gecerli.filter((r) => r.gun === bugun)
  const sonraki = gecerli.filter((r) => r.gun !== bugun)
  return [
    `CALENDAR TODAY (${bugun}): ${bugunku.length ? `${bugunku.length} appointment${bugunku.length === 1 ? '' : 's'}` : 'no appointments'}`,
    ...bugunku.slice(0, TAKVIM_SATIRI).map((r) => randevuSatiri(r)),
    `CALENDAR NEXT ${TAKVIM_GUNU - 1} DAYS: ${sonraki.length ? `${sonraki.length} appointment${sonraki.length === 1 ? '' : 's'}` : 'none'}`,
    ...sonraki.slice(0, TAKVIM_SATIRI).map((r) => randevuSatiri(r, true)),
  ]
}

async function bugunMuayene(sb: SupabaseClient, doktorId: string): Promise<string[]> {
  const m = await bugunkuMuayeneler(sb, doktorId)
  if (!m) return ['TODAY\'S VISITS: could not be read this turn.']
  const taslak = m.filter((x) => x.durum === 'taslak')
  const notsuz = m.filter((x) => x.durum === 'notsuz')
  return [
    `TODAY'S VISITS: ${m.length} (notes: ${m.filter((x) => x.durum === 'onayli').length} approved, ${taslak.length} drafts waiting for approval, ${notsuz.length} without a note)`,
    ...taslak.slice(0, 10).map((x) => `- draft waiting: ${x.hastaAdi || '(no patient)'}`),
  ]
}

async function mesajlar(sb: SupabaseClient, doktorId: string): Promise<string[]> {
  if (!mesajAcik()) return []
  const o = await hekimOkunmamislari(sb, doktorId)
  const toplam = o.reduce((t, x) => t + x.adet, 0)
  return [`UNREAD PATIENT MESSAGES: ${toplam ? `${toplam} from ${o.length} patient${o.length === 1 ? '' : 's'}` : 'none'}`, ...o.slice(0, 8).map((x) => `- ${x.hastaAdi}: ${x.adet}`)]
}

async function konsultasyonlar(sb: SupabaseClient, doktorId: string): Promise<string[]> {
  if (!konsultasyonAcik()) return []
  const g = await gelenKonsultasyonlar(sb, doktorId)
  const bekleyen = g.filter((k) => !k.cevap && !k.kapandi)
  return [`CONSULTATIONS WAITING FOR YOUR REPLY: ${bekleyen.length ? `${bekleyen.length} (${bekleyen.filter((k) => !k.okundu).length} unread)` : 'none'}`]
}

async function raporlar(sb: SupabaseClient, doktorId: string): Promise<string[]> {
  if (!ozellikAcik('cekirdekMuayene')) return []
  const r = await raporOzeti(sb, doktorId, 'ay')
  if (!r) return ['REPORT NUMBERS: could not be read this turn.']
  return [`REPORT NUMBERS: ${r.hastaToplam} patients in total (${r.hastaYeniAy} new in the last month); ${r.muayeneHafta} visits in the last 7 days, ${r.muayeneAy} in the last month, ${r.muayeneToplam} overall; notes ${r.notOnayli} approved, ${r.notBekleyen} waiting; appointments last month ${r.randevuAy} (${r.randevuTamam} completed, ${r.randevuIptal} cancelled)`]
}

async function hastaDosyasi(sb: SupabaseClient, doktorId: string, h: Hasta, bugun: Date): Promise<string[]> {
  const satir: string[] = [`PATIENT FILE (${h.ad}${[yasHesapla(h.dogumTarihi, bugun), h.cinsiyet].filter(Boolean).length ? `, ${[yasHesapla(h.dogumTarihi, bugun), h.cinsiyet].filter(Boolean).join(', ')}` : ''}${h.dil ? `, language ${h.dil}` : ''}) — the doctor named this patient:`]
  const [muayeneler, randevular] = await Promise.all([hastaninMuayeneleri(sb, doktorId, h.id), hastaninRandevulari(sb, doktorId, h.id)])
  if (muayeneler) {
    satir.push(`Visits: ${muayeneler.length}${muayeneler.length ? '; newest first:' : ''}`)
    for (const m of muayeneler.slice(0, 6)) satir.push(`- ${m.baslangic.slice(0, 10)} (${NOT_DURUMU[m.durum] ?? m.durum})`)
    for (const m of muayeneler.filter((x) => x.notId).slice(0, NOT_SAYISI)) {
      const n = await notGetir(sb, doktorId, m.notId as string)
      if (!n) continue
      const b = n.icerik
      satir.push(`Note of ${m.baslangic.slice(0, 10)} (${n.onayli ? 'approved' : 'draft'}): S: ${kes(b.s, NOT_BOLUMU_AZAMI)} | O: ${kes(b.o, NOT_BOLUMU_AZAMI)} | A: ${kes(b.a, NOT_BOLUMU_AZAMI)} | P: ${kes(b.p, NOT_BOLUMU_AZAMI)}`)
    }
  } else satir.push('Visits: could not be read this turn.')
  if (randevular) satir.push(`Upcoming appointments: ${randevular.filter((r) => r.durum !== 'iptal').length ? randevular.filter((r) => r.durum !== 'iptal').slice(0, 5).map((r) => `${r.gun} ${r.saat}`).join(', ') : 'none'}`)
  return satir
}

const LISTE_SORUSU = /\b(?:patients?|list|who(?:'s| is| are)?|clients?|caseload)\b/i

/**
 * The block of this turn. `doktorSozu` is the doctor's sentence; it is only matched against the doctor's own patient names.
 * Returns '' when nothing could be read at all (the prompt then says the desk was unavailable).
 */
export async function masaBlogu(sb: SupabaseClient, doktorId: string, doktorSozu: string, simdi: Date = new Date()): Promise<string> {
  const dilim = await hesapSaatDilimi(sb, doktorId)
  const an = yerelAn(simdi, dilim)
  const parcalar = await Promise.all([
    takvim(sb, doktorId, an.gun),
    bugunMuayene(sb, doktorId),
    mesajlar(sb, doktorId),
    konsultasyonlar(sb, doktorId),
    raporlar(sb, doktorId),
    (async (): Promise<string[]> => {
      const tumu = await hastalariListele(sb, doktorId)
      if (!tumu) return ['PATIENT LIST: could not be read this turn.']
      const { tam, adaylar } = adiGecenHastalar(doktorSozu, tumu)
      const cikti = [`PATIENTS ON FILE: ${tumu.length}`]
      if (!tam.length && !adaylar.length && LISTE_SORUSU.test(doktorSozu)) cikti.push(`Most recently added: ${tumu.slice().sort((a, b) => b.olusturuldu.localeCompare(a.olusturuldu)).slice(0, LISTE_AZAMI).map((h) => h.ad).join('; ')}`)
      if (adaylar.length) cikti.push(`The doctor's words fit more than one patient (${adaylar.map((h) => h.ad).join('; ')}): ask which one before saying anything about a file.`)
      for (const h of tam) cikti.push(...(await hastaDosyasi(sb, doktorId, h, simdi)))
      return cikti
    })(),
  ].map((p) => p.catch(() => [] as string[])))
  const govde = parcalar.flat()
  if (!govde.length) return ''
  return [`DESK — read from the signed-in doctor's own account, read-only, as of ${an.gun} ${saatYazDk(an.dakika)} (${dilim}). Use it to answer; never read out more than was asked.`, ...govde].join('\n')
}

/** masaBlogu within the budget: '' when it is not back in time. */
export async function masaBlogunuAl(sb: SupabaseClient, doktorId: string, doktorSozu: string, butceMs = MASA_BUTCESI_MS): Promise<string> {
  let sayac: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([masaBlogu(sb, doktorId, doktorSozu), new Promise<string>((coz) => { sayac = setTimeout(() => coz(''), butceMs) })])
  } catch { return '' } finally { if (sayac) clearTimeout(sayac) }
}
