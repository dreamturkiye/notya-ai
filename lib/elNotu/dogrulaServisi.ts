/**
 * ESNEK-MUAYENE-A — answering Doğrula questions. Every answer:
 *  - closes the question (who / when — audit trail);
 *  - fills its ⟦key⟧ placeholder in the source text AND in the visit's draft note (never anything else);
 *  - teaches: an abbreviation answer goes into the doctor's lexicon (asked once, then known); a word answer with its masked
 *    crop goes into the doctor's personal handwriting memory (the next page is read with it as an example).
 * The secretary answers READING questions only; a conflict between sources (which value is right) is the doctor's.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PratikRol } from '@/lib/doktor/personelYetki'
import { yerTutuculariDoldur, YER_TUTUCU } from '@/core/elNotu/okuyucu'
import type { KaynakOkuma } from '@/core/elNotu/tipler'
import { denetimYaz, hafizayaEkle, sozlugeEkle, type KaynakSatiri } from './sunucu'

export type Cevap = {
  anahtar: string
  /** The confirmed reading; null = "unreadable". */
  cevap: string | null
  ogrenme?: { tanimlayici: number[]; enBoy: number; kirpinti?: { mime: string; base64: string } | null } | null
}

const NOT_ALANLARI = ['content_subjektif', 'content_objektif', 'content_degerlendirme', 'content_plan', 'content_anamnez', 'content_fizik_muayene', 'content_tani', 'content_tedavi'] as const

function kelimeDegistir(metin: string, kisaltma: string, anlam: string): string {
  const kac = kisaltma.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // outside placeholders only
  return metin.split(/(⟦[^⟧]*⟧)/g).map((p) => (p.startsWith('⟦') ? p : p.replace(new RegExp(`(^|[\\s(,;:])${kac}(?=$|[\\s),;:.])`, 'g'), `$1${anlam}`))).join('')
}

export async function cevaplariUygula(sb: SupabaseClient, g: {
  doktorId: string; kaynak: KaynakSatiri; cevaplar: Cevap[]; aktor: { userId: string; rol: PratikRol }; brans: string | null; okunamadiMetni: string
}): Promise<{ uygulanan: number; acik: number; korumaliAcik: number; reddedilen: string[] }> {
  const anahtarlar = [...new Set(g.cevaplar.map((c) => String(c.anahtar || '')).filter((a) => /^[a-z0-9-]{1,64}$/.test(a)))].slice(0, 200)
  if (!anahtarlar.length) return { uygulanan: 0, acik: g.kaynak.acik_dogrula, korumaliAcik: g.kaynak.korumali_acik, reddedilen: [] }
  const { data: sorular } = await sb.from('okuma_dogrulamalari').select('id, soru_anahtari, sinif, korumali_tur, okunan, durum').eq('doctor_id', g.doktorId).eq('kaynak_id', g.kaynak.id).in('soru_anahtari', anahtarlar)
  const harita = new Map((sorular || []).map((s) => [String(s.soru_anahtari), s]))
  const doldur = new Map<string, string>()
  const kisaltmalar: { kisaltma: string; anlam: string }[] = []
  const reddedilen: string[] = []
  let uygulanan = 0
  const simdi = new Date().toISOString()
  for (const c of g.cevaplar) {
    const s = harita.get(String(c.anahtar))
    if (!s || s.durum !== 'acik') continue
    if (s.sinif === 'celiski' && g.aktor.rol !== 'doktor') { reddedilen.push(String(c.anahtar)); continue }
    const cevap = c.cevap === null ? null : String(c.cevap ?? '').replace(/[⟦⟧]/g, '').replace(/\s+/g, ' ').trim().slice(0, 400)
    if (cevap === '') continue
    await sb.from('okuma_dogrulamalari').update({ durum: cevap === null ? 'atlandi' : 'cevaplandi', cevap, cevaplayan_user_id: g.aktor.userId, cevaplayan_rol: g.aktor.rol, cevap_at: simdi }).eq('id', s.id).eq('doctor_id', g.doktorId)
    uygulanan++
    if (s.sinif === 'kisaltma') {
      if (cevap) { await sozlugeEkle(sb, g.doktorId, String(s.okunan || ''), cevap, 'dogrulama', g.brans); kisaltmalar.push({ kisaltma: String(s.okunan || ''), anlam: cevap }) }
      continue
    }
    doldur.set(String(c.anahtar), cevap === null ? `[${g.okunamadiMetni}]` : cevap)
    if (cevap && c.ogrenme && g.kaynak.patient_id && (s.sinif === 'kelime' || s.sinif === 'korumali')) {
      await hafizayaEkle(sb, {
        doktorId: g.doktorId, patientId: g.kaynak.patient_id, sessionId: g.kaynak.session_id, kaynakId: g.kaynak.id, metin: cevap, okunan: String(s.okunan || ''),
        tanimlayici: c.ogrenme.tanimlayici, enBoy: Number(c.ogrenme.enBoy) || 1, kirpinti: c.ogrenme.kirpinti ?? null, korumali: s.sinif === 'korumali',
        sinif: /-w\d+$/.test(String(c.anahtar)) ? 'kelime' : 'satir', aktor: g.aktor,
      })
    }
  }

  // source text + reading: fill placeholders, apply learned abbreviations
  const okuma = (g.kaynak.okuma || null) as KaynakOkuma | null
  let metin = yerTutuculariDoldur(String(g.kaynak.metin || ''), doldur)
  for (const k of kisaltmalar) metin = kelimeDegistir(metin, k.kisaltma, k.anlam)
  if (okuma?.sayfalar) {
    for (const sayfa of okuma.sayfalar) {
      for (const l of sayfa.satirlar) {
        l.normal = yerTutuculariDoldur(l.normal, doldur)
        for (const k of kisaltmalar) l.normal = kelimeDegistir(l.normal, k.kisaltma, k.anlam)
        l.kelimeler.forEach((w, i) => {
          const v = doldur.get(`s${sayfa.sayfa}-l${l.no}-w${i}`)
          if (v !== undefined) { w.metin = v; w.kabul = true; w.guven = 1 }
        })
      }
      for (const c of sayfa.cizimler) { const v = doldur.get(`s${sayfa.sayfa}-b${c.bolgeId}`); if (v !== undefined) { c.bulgu = v; c.kabul = true } }
    }
    okuma.metin = metin
  }
  const { data: aciklar } = await sb.from('okuma_dogrulamalari').select('sinif').eq('doctor_id', g.doktorId).eq('kaynak_id', g.kaynak.id).eq('durum', 'acik')
  const acik = (aciklar || []).length, korumaliAcik = (aciklar || []).filter((r) => r.sinif === 'korumali').length
  await sb.from('muayene_kaynaklari').update({ metin, okuma, acik_dogrula: acik, korumali_acik: korumaliAcik, durum: acik ? 'dogrulama' : 'okundu', updated_at: simdi }).eq('id', g.kaynak.id).eq('doctor_id', g.doktorId)

  // the visit's draft note (not yet approved): same placeholders, same abbreviations
  if (g.kaynak.session_id && (doldur.size || kisaltmalar.length)) {
    const { data: notlar } = await sb.from('notes').select(`id, approved_at, ${NOT_ALANLARI.join(', ')}`).eq('doctor_id', g.doktorId).eq('session_id', g.kaynak.session_id).is('approved_at', null)
    for (const n of (notlar || []) as unknown as Record<string, string | null>[]) {
      const guncelle: Record<string, string> = {}
      for (const a of NOT_ALANLARI) {
        const v = n[a]
        if (typeof v !== 'string' || !v) continue
        let y = YER_TUTUCU.test(v) ? yerTutuculariDoldur(v, doldur) : v
        YER_TUTUCU.lastIndex = 0
        for (const k of kisaltmalar) y = kelimeDegistir(y, k.kisaltma, k.anlam)
        if (y !== v) guncelle[a] = y
      }
      if (Object.keys(guncelle).length) await sb.from('notes').update(guncelle).eq('id', String(n.id)).eq('doctor_id', g.doktorId)
    }
  }
  if (uygulanan) await denetimYaz(sb, { doktorId: g.doktorId, patientId: g.kaynak.patient_id, sessionId: g.kaynak.session_id, kaynakId: g.kaynak.id, eylem: 'dogrulama', aktor: g.aktor, ayrinti: { cevap: uygulanan } })
  return { uygulanan, acik, korumaliAcik, reddedilen }
}

/** Conflict answer (doctor only): the chosen value is written into the draft note's section; the question closes. */
export async function celiskiCevapla(sb: SupabaseClient, g: { doktorId: string; noteId: string; anahtar: string; secim: string; aktor: { userId: string; rol: PratikRol } }): Promise<boolean> {
  if (g.aktor.rol !== 'doktor') return false
  const { data: s } = await sb.from('okuma_dogrulamalari').select('id, okunan, kutu, durum').eq('doctor_id', g.doktorId).eq('kaynak_id', g.noteId).eq('soru_anahtari', g.anahtar).maybeSingle()
  if (!s || s.durum !== 'acik') return false
  const alan = (s.kutu as { alan?: string } | null)?.alan
  const kolon = alan === 'subjektif' ? 'content_subjektif' : alan === 'degerlendirme' ? 'content_degerlendirme' : alan === 'plan' ? 'content_plan' : 'content_objektif'
  const { data: n } = await sb.from('notes').select(`id, approved_at, ${kolon}`).eq('id', g.noteId).eq('doctor_id', g.doktorId).maybeSingle()
  if (!n || (n as Record<string, unknown>).approved_at) return false
  const secim = g.secim.replace(/[⟦⟧]/g, '').trim().slice(0, 300)
  if (!secim) return false
  const eski = String((n as Record<string, unknown>)[kolon] || '')
  await sb.from('notes').update({ [kolon]: [eski, `${String(s.okunan || '').trim()}: ${secim}`].filter(Boolean).join('\n') }).eq('id', g.noteId).eq('doctor_id', g.doktorId)
  await sb.from('okuma_dogrulamalari').update({ durum: 'cevaplandi', cevap: secim, cevaplayan_user_id: g.aktor.userId, cevaplayan_rol: g.aktor.rol, cevap_at: new Date().toISOString() }).eq('id', s.id).eq('doctor_id', g.doktorId)
  return true
}
