/**
 * NOTYA-ILETISIM-04 — the dispatcher: waiting queue items leave by themselves from the doctor's own
 * WhatsApp / mailbox once he has connected them. Doctors who connected nothing keep the one-tap flow unchanged.
 *
 * Who calls it
 *   • app/api/cron/randevu-hatirlatma — right after it fills tomorrow's reminders (07:00 and 17:00 TRT)
 *   • app/api/cron/iletisim-otomatik  — a short sweep every 10 minutes in the daytime for everything else that was
 *     enqueued in between (Sağlığım'da yeni mesaj from the ~35 notifyPatientNewPracticeMessage callers, bookings
 *     made after the morning run, a doctor who connected an account at noon). The enqueue triggers themselves stay
 *     fast: they never wait on Google / Microsoft / Meta.
 *
 * Rules
 *   • Only OTOMATIK_TURLER (randevu, bilgi formu, Sağlığım'da yeni mesaj) — non-clinical by construction.
 *   • Only channels the patient consented to (gonderilebilirMi) and the doctor has a ready sender for.
 *     WhatsApp first when both are ready; e-posta when WhatsApp has no template for the type or fails.
 *   • AT MOST ONCE per item: a conditional claim (otomatik_durum null → gonderiliyor, still bekliyor, not
 *     postponed) before any network call; a person opening the item claims it too (elleSahiplen), so a machine
 *     and a person never both send it. A sender that throws or hangs is NOT followed by the other channel (the
 *     first message may have left) — the item goes to people with a "gitmiş olabilir" note.
 *   • Every channel failed → the item stays bekliyor for the human queue with a short Turkish reason.
 *   • Quiet hours: only 07:00–21:00 TRT. Items of today and yesterday only; older ones are people's.
 *   • One doctor's error never stops the others; a time budget stops starting new sends, the rest waits for the
 *     next run. Doctors run a few at a time, each doctor's items one after another (provider rate limits are
 *     per account).
 *   • Needs migration 098 (the claim columns). Without it nothing is claimed and nothing is sent.
 *
 * HASTA-IZOLASYON-01: every item is re-read through iletisimHazirla with the item's own doctor (queue row,
 * appointment and patient all resolved with doctor_id), and every write carries doctor_id.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeTrPhoneE164 } from '@/lib/doktor/twilioNotify'
import { epostaAdresi } from './baglantilar'
import { hataMi, iletisimHazirla, type Hazirlik } from './hazirlik'
import { gonderilebilirMi } from './izin'
import { gunEkle } from './kuyruk'
import {
  OTOMATIK_TURLER, hazirOtomatikGonderici, otomatikGondericiler, otomatikTurMu, whatsappSablonu,
  type OtomatikGonderici, type OtomatikGonderimIstegi, type OtomatikGonderimSonucu,
} from './otomatik'
import { bugunTrIso } from './sablonlar'
import { doktorIletisimAyari, tabloYokMu } from './sunucu'
import { mesajTuruMu, type IletisimKanali, type MesajTuru } from './tipler'

type Sb = SupabaseClient

export type OtomatikDurum = 'gonderiliyor' | 'gonderildi' | 'gonderilemedi' | 'elle'

/** Daytime window in Turkey (hours, [bas, son)). Nothing leaves at night. */
export const OTOMATIK_SAAT = { bas: 7, son: 21 } as const
/** A claim older than this is considered interrupted (the function died mid-send). */
export const TAKILMA_DK = 10
/** Per-send guard; a provider that does not answer in time counts as "may have left". */
export const GONDERIM_ZAMAN_ASIMI_MS = 20_000

const ESZAMANLI_DOKTOR = 4
const DOKTOR_BASINA_SINIR = 150

export function trSaat(simdi: Date): number {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', hour: '2-digit', hourCycle: 'h23' }).format(simdi))
}

export function sessizSaatMi(simdi: Date): boolean {
  const s = trSaat(simdi)
  return s < OTOMATIK_SAAT.bas || s >= OTOMATIK_SAAT.son
}

/** Short Turkish reason shown to people when an automatic attempt failed. */
export function kisaNeden(hatalar: string[]): string {
  const ilk = hatalar.find((h) => h && h.trim()) || 'Bilinmeyen bir sorun oldu.'
  // Senders may promise a retry ("birazdan yeniden denenecek"); the dispatcher does not retry — people send it.
  const temiz = ilk.replace(/[;,]?\s*birazdan yeniden dene(necek|nebilir)\.?/i, '.').replace(/\.\.$/, '.').trim()
  return `Kendiliğinden gönderilemedi: ${temiz}`.slice(0, 200)
}

/**
 * How a waiting queue row looks to PEOPLE (kuyruk GET / hazırla):
 *   'gizle'   — it is being sent automatically right now (fresh claim): not shown, not openable
 *   { not }   — show it, with a short line (automatic attempt failed / was interrupted)
 *   { }       — show it as usual
 */
export function insanGorunumu(
  s: { otomatik_durum?: string | null; otomatik_deneme_at?: string | null; otomatik_hata?: string | null },
  simdi: Date = new Date(),
): 'gizle' | { not?: string } {
  if (s.otomatik_durum === 'gonderiliyor') {
    const t = Date.parse(String(s.otomatik_deneme_at || ''))
    if (Number.isFinite(t) && simdi.getTime() - t < TAKILMA_DK * 60e3) return 'gizle'
    return { not: 'Kendiliğinden gönderim yarıda kaldı; mesaj gitmiş olabilir. Hastayla kontrol edin.' }
  }
  if (s.otomatik_durum === 'gonderildi') return 'gizle'
  if (s.otomatik_durum === 'gonderilemedi' && s.otomatik_hata) return { not: s.otomatik_hata }
  return {}
}

/**
 * A person opened this queue item (send flow). Claims it for people so the dispatcher never sends it as well.
 * → 'otomatik' when the machine got there first (being sent / already sent); the flow skips it as done.
 * Fails soft before 098 ('tamam').
 */
export async function elleSahiplen(sb: Sb, doktorId: string, kuyrukId: string, simdi: Date = new Date()): Promise<'tamam' | 'otomatik'> {
  try {
    const { data: k, error } = await sb.from('iletisim_kuyrugu')
      .select('id, durum, otomatik_durum, otomatik_deneme_at')
      .eq('id', kuyrukId).eq('doctor_id', doktorId).maybeSingle()
    if (error || !k) return 'tamam'
    if (k.otomatik_durum === 'gonderildi') return 'otomatik'
    if (insanGorunumu(k, simdi) === 'gizle') return 'otomatik'
    if (k.otomatik_durum == null && k.durum === 'bekliyor') {
      const { data } = await sb.from('iletisim_kuyrugu')
        .update({ otomatik_durum: 'elle' })
        .eq('id', kuyrukId).eq('doctor_id', doktorId).eq('durum', 'bekliyor').is('otomatik_durum', null)
        .select('id')
      if (!data?.length) {
        // lost the race: re-read who won
        const { data: y } = await sb.from('iletisim_kuyrugu').select('otomatik_durum, otomatik_deneme_at').eq('id', kuyrukId).eq('doctor_id', doktorId).maybeSingle()
        if (y && (y.otomatik_durum === 'gonderildi' || insanGorunumu(y, simdi) === 'gizle')) return 'otomatik'
      }
    }
    return 'tamam'
  } catch {
    return 'tamam'
  }
}

export type DagitimOzeti = {
  /** false: quiet hours / 098 not applied / nothing to do — nothing was attempted */
  calisti: boolean
  neden?: 'sessiz_saat' | 'kolon_yok' | 'okunamadi'
  doktor: number
  gonderilen: number
  basarisiz: number
  /** left for people without an attempt (no ready channel, no consent, time budget) */
  dokunulmadi: number
}

export type DagitimSecenekleri = {
  /** Only these doctors (e.g. the ones the cron just enqueued for). Default: every doctor with waiting items. */
  doktorIds?: string[]
  /** Test seam; default: the registry (otomatikGondericiler). */
  gondericiler?: OtomatikGonderici[]
  simdi?: () => Date
  /** Stop starting new sends after this many ms (the cron's maxDuration is 60 s). */
  sureButcesiMs?: number
  /** Pause between two sends of the same doctor. */
  aralikMs?: number
}

type Oge = { id: string; doctor_id: string; patient_id: string; tur: MesajTuru; randevu_id: string | null }

const bekle = (ms: number) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve())

async function zamanAsimli(p: Promise<OtomatikGonderimSonucu>, ms: number): Promise<OtomatikGonderimSonucu | 'belirsiz'> {
  let t: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      p.catch(() => 'belirsiz' as const),
      new Promise<'belirsiz'>((r) => { t = setTimeout(() => r('belirsiz'), ms) }),
    ])
  } finally {
    if (t) clearTimeout(t)
  }
}

/** Why an item cannot go automatically right now (→ untouched, stays with people), or null when it can. */
function engel(h: Hazirlik, simdi: Date): string | null {
  if (!otomatikTurMu(h.tur)) return 'tur'
  if (h.tur === 'randevu_hatirlatma' || h.tur === 'randevu_degisikligi') {
    const r = h.randevu
    if (!r || !['planlandi', 'onaylandi'].includes(r.durum)) return 'randevu_gecersiz'
    if (Date.parse(r.baslangic) <= simdi.getTime()) return 'randevu_gecti'
    // a person already sent this reminder from the randevu screen
    if (h.tur === 'randevu_hatirlatma' && r.hatirlatmaGonderildi) return 'zaten_hatirlatildi'
  }
  return null
}

/** Build the request for one channel, or null when that channel cannot carry this message. */
function istekKur(h: Hazirlik, kanal: IletisimKanali, doktorId: string, doktorAdi: string): OtomatikGonderimIstegi | null {
  if (!gonderilebilirMi(h.hasta, kanal)) return null
  const temel = { doktorId, patientId: h.hasta.id, tur: h.tur, kuyrukId: h.kuyrukId, konu: h.mesaj?.konu || '', metin: h.mesaj?.metin || '' }
  if (kanal === 'whatsapp') {
    const alici = normalizeTrPhoneE164(h.hasta.telefon)
    const sablon = whatsappSablonu(h.tur, {
      hastaAdi: h.hasta.ad, veliDili: h.hasta.veliDili, doktorAdi, randevuIso: h.randevu?.baslangic ?? null, link: h.link,
    })
    return alici && sablon ? { ...temel, alici, sablon } : null
  }
  const alici = epostaAdresi(h.hasta.eposta)
  return alici && h.mesaj ? { ...temel, alici } : null
}

type DoktorSonucu = { gonderilen: number; basarisiz: number; dokunulmadi: number }

async function doktoruIsle(sb: Sb, doktorId: string, ogeler: Oge[], liste: OtomatikGonderici[], o: Required<Pick<DagitimSecenekleri, 'simdi' | 'aralikMs'>> & { bitis: number }): Promise<DoktorSonucu> {
  const sonuc: DoktorSonucu = { gonderilen: 0, basarisiz: 0, dokunulmadi: 0 }
  const hazir: Partial<Record<IletisimKanali, OtomatikGonderici>> = {}
  for (const kanal of ['whatsapp', 'eposta'] as const) {
    const g = await hazirOtomatikGonderici(doktorId, kanal, liste)
    if (g) hazir[kanal] = g
  }
  if (!hazir.whatsapp && !hazir.eposta) return { ...sonuc, dokunulmadi: ogeler.length }

  const ayar = await doktorIletisimAyari(sb, doktorId)
  // Same rule as the queue screen: a passive (archived) patient gets nothing.
  const { data: hastalar, error: hHata } = await sb.from('patients').select('id, is_active')
    .eq('doctor_id', doktorId).in('id', Array.from(new Set(ogeler.map((x) => x.patient_id))))
  if (hHata) return { ...sonuc, dokunulmadi: ogeler.length }
  const aktif = new Set((hastalar || []).filter((p) => p.is_active !== false).map((p) => String(p.id)))
  let ilk = true
  for (const oge of ogeler.slice(0, DOKTOR_BASINA_SINIR)) {
    if (Date.now() >= o.bitis) { sonuc.dokunulmadi++; continue }
    if (!aktif.has(oge.patient_id)) { sonuc.dokunulmadi++; continue }
    try {
      const h = await iletisimHazirla(sb, { doktorId, rol: 'doktor' }, { kuyrukId: oge.id }, { doktorAdi: ayar.doktorAdi, doktorBransi: ayar.brans })
      if (hataMi(h)) { sonuc.dokunulmadi++; continue }
      const simdi = o.simdi()
      if (engel(h, simdi)) { sonuc.dokunulmadi++; continue }

      // WhatsApp first, then e-posta — only channels with a ready sender, consent and a buildable message.
      const plan: { g: OtomatikGonderici; istek: OtomatikGonderimIstegi }[] = []
      for (const kanal of ['whatsapp', 'eposta'] as const) {
        const g = hazir[kanal]
        const istek = g ? istekKur(h, kanal, doktorId, ayar.doktorAdi) : null
        if (g && istek) plan.push({ g, istek })
      }
      if (!plan.length) { sonuc.dokunulmadi++; continue }

      // Claim: exactly one automatic attempt per item, never one a person has opened or postponed.
      const { data: alinan, error: alHata } = await sb.from('iletisim_kuyrugu')
        .update({ otomatik_durum: 'gonderiliyor', otomatik_deneme_at: simdi.toISOString() })
        .eq('id', oge.id).eq('doctor_id', doktorId).eq('durum', 'bekliyor').is('otomatik_durum', null).is('ertelendi_at', null)
        .select('id')
      if (alHata || !alinan?.length) { sonuc.dokunulmadi++; continue }

      if (!ilk) await bekle(o.aralikMs)
      ilk = false

      const hatalar: string[] = []
      let basari: { g: OtomatikGonderici; istek: OtomatikGonderimIstegi; s: Extract<OtomatikGonderimSonucu, { ok: true }> } | null = null
      let belirsiz = false
      for (const adim of plan) {
        const s = await zamanAsimli(adim.g.gonder(adim.istek), GONDERIM_ZAMAN_ASIMI_MS)
        if (s === 'belirsiz') { belirsiz = true; break }
        if (s.ok) { basari = { ...adim, s }; break }
        hatalar.push(s.hata)
      }

      const zaman = new Date().toISOString()
      if (basari) {
        await sb.from('iletisim_kuyrugu')
          .update({ durum: 'gonderildi', otomatik_durum: 'gonderildi', otomatik_hata: null, updated_at: zaman })
          .eq('id', oge.id).eq('doctor_id', doktorId)
        await sb.from('iletisim_kayitlari').insert({
          doctor_id: doktorId,
          patient_id: h.hasta.id,
          kanal: basari.g.kanal,
          tur: h.tur,
          durum: 'gonderildi',
          gonderen_user_id: null,
          gonderen_personel_id: null,
          kuyruk_id: oge.id,
          randevu_id: h.randevuId,
          otomatik: true,
          saglayici: basari.s.saglayici || basari.g.saglayici,
          saglayici_mesaj_id: basari.s.saglayiciMesajId ?? null,
        })
        if (h.tur === 'randevu_hatirlatma' && h.randevuId) {
          await sb.from('randevular').update({ hatirlatma_gonderildi: true }).eq('id', h.randevuId).eq('doktor_id', doktorId).eq('patient_id', h.hasta.id)
        }
        sonuc.gonderilen++
      } else {
        const not = belirsiz
          ? 'Kendiliğinden gönderim yanıt vermedi; mesaj gitmiş olabilir. Hastayla kontrol edin.'
          : kisaNeden(hatalar)
        await sb.from('iletisim_kuyrugu')
          .update({ otomatik_durum: 'gonderilemedi', otomatik_hata: not, updated_at: zaman })
          .eq('id', oge.id).eq('doctor_id', doktorId)
        sonuc.basarisiz++
      }
    } catch {
      // one item's surprise never stops the doctor's other items
      sonuc.dokunulmadi++
    }
  }
  sonuc.dokunulmadi += Math.max(0, ogeler.length - DOKTOR_BASINA_SINIR)
  return sonuc
}

/** Send what can go automatically. Never throws. */
export async function otomatikGonder(sb: Sb, secenek: DagitimSecenekleri = {}): Promise<DagitimOzeti> {
  const simdiF = secenek.simdi || (() => new Date())
  const bos: DagitimOzeti = { calisti: false, doktor: 0, gonderilen: 0, basarisiz: 0, dokunulmadi: 0 }
  try {
    const simdi = simdiF()
    if (sessizSaatMi(simdi)) return { ...bos, neden: 'sessiz_saat' }
    if (secenek.doktorIds && !secenek.doktorIds.length) return bos

    const bugun = bugunTrIso(simdi)
    let q = sb.from('iletisim_kuyrugu')
      .select('id, doctor_id, patient_id, tur, randevu_id, created_at')
      .eq('durum', 'bekliyor')
      .is('otomatik_durum', null)
      .is('ertelendi_at', null)
      .in('tur', [...OTOMATIK_TURLER])
      .gte('planlanan_gun', gunEkle(bugun, -1))
      .lte('planlanan_gun', bugun)
    if (secenek.doktorIds) q = q.in('doctor_id', secenek.doktorIds)
    const { data, error } = await q.order('created_at', { ascending: true }).limit(3000)
    if (error) return { ...bos, neden: tabloYokMu(error) ? 'kolon_yok' : 'okunamadi' }

    const ogeler = (data || [])
      .filter((s) => mesajTuruMu(s.tur))
      .map((s) => ({ id: String(s.id), doctor_id: String(s.doctor_id), patient_id: String(s.patient_id), tur: s.tur as MesajTuru, randevu_id: s.randevu_id ? String(s.randevu_id) : null }))
    if (!ogeler.length) return { ...bos, calisti: true }

    const liste = secenek.gondericiler || otomatikGondericiler()
    const doktorlar = Array.from(new Set(ogeler.map((x) => x.doctor_id)))
    const bitis = Date.now() + (secenek.sureButcesiMs ?? 45_000)
    const ozet: DagitimOzeti = { calisti: true, doktor: doktorlar.length, gonderilen: 0, basarisiz: 0, dokunulmadi: 0 }

    let sira = 0
    const isci = async () => {
      while (sira < doktorlar.length) {
        const doktorId = doktorlar[sira++]
        const buDoktor = ogeler.filter((x) => x.doctor_id === doktorId)
        try {
          const s = await doktoruIsle(sb, doktorId, buDoktor, liste, { simdi: simdiF, aralikMs: secenek.aralikMs ?? 250, bitis })
          ozet.gonderilen += s.gonderilen
          ozet.basarisiz += s.basarisiz
          ozet.dokunulmadi += s.dokunulmadi
        } catch {
          // one doctor's error never blocks the cron for the others
          ozet.dokunulmadi += buDoktor.length
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(ESZAMANLI_DOKTOR, doktorlar.length) }, isci))
    return ozet
  } catch {
    return { ...bos, neden: 'okunamadi' }
  }
}

/**
 * "Bugün N mesaj kendiliğinden gönderildi" — automatic sends of today (TRT) for this practice. A secretary counts
 * appointment types only. 0 before migration 098.
 */
export async function bugunOtomatikSayisi(sb: Sb, doktorId: string, turler?: readonly MesajTuru[], simdi: Date = new Date()): Promise<number> {
  try {
    const bugun = bugunTrIso(simdi)
    const bas = new Date(Date.parse(`${bugun}T00:00:00+03:00`)).toISOString()
    let q = sb.from('iletisim_kayitlari').select('id').eq('doctor_id', doktorId).eq('otomatik', true).gte('created_at', bas)
    if (turler) q = q.in('tur', [...turler])
    const { data, error } = await q.limit(1000)
    if (error) return 0
    return data?.length || 0
  } catch {
    return 0
  }
}
