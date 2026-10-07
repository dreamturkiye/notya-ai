/**
 * NOTYA-INTAKE-EPOSTA-02 (2026-10-07) — the intake invitation (bilgi_formu) leaves from the doctor's own connected
 * Gmail / Outlook mailbox when the doctor taps "E-posta ile gönder", with the designed template (bilgiFormuEpostasi:
 * text + HTML). No compose window opens. A doctor without a connected mailbox keeps the compose-link flow unchanged
 * (the send button only takes this path when /hazirla said `epostaKutusu: true`).
 *
 * Rules
 *   • bilgi_formu only. Every other message type keeps its own path.
 *   • Same consent rule as the automatic sender: gonderilebilirMi(hasta, 'eposta') — an address AND consent.
 *   • One send per click: the browser locks the button, and the server refuses a second send of the same invitation
 *     (same doctor + patient + link) within TEKRAR_PENCERE_MS — answered as "already sent", never sent twice.
 *   • HASTA-IZOLASYON-01: the patient / appointment / queue item are resolved through iletisimHazirla with the
 *     caller's doctor id; the log row carries doctor_id and that patient.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PratikRol } from '@/lib/doktor/pratikOturum'
import { epostaAdresi } from './baglantilar'
import { bilgiFormuEpostasi } from './bilgiFormuEposta'
import { hataMi, iletisimHazirla, type Hazirlik, type HazirlikGirdisi, type HazirlikHatasi } from './hazirlik'
import { gonderilebilirMi } from './izin'
import { hazirOtomatikGonderici, type OtomatikGonderici, type OtomatikGonderimIstegi } from './otomatik'
import { tabloYokMu } from './sunucu'

export const TEKRAR_PENCERE_MS = 2 * 60_000

export type KutudanSonuc =
  | { ok: true; alici: string; saglayici: string | null; tekrar: boolean }
  | { ok: false; durum: 400 | 403 | 404 | 409 | 502; hata: string }

/** The request for the doctor's mailbox, or why this invitation cannot go from it. Pure. */
export function bilgiFormuIstegi(h: Hazirlik, doktorId: string, doktorAdi: string): { istek: OtomatikGonderimIstegi } | { durum: 400 | 409; hata: string } {
  if (h.tur !== 'bilgi_formu') return { durum: 400, hata: 'Bu mesaj e-posta hesabından gönderilemez.' }
  if (!h.link || !h.mesaj) return { durum: 400, hata: 'Form bağlantısı eksik.' }
  if (!gonderilebilirMi(h.hasta, 'eposta')) return { durum: 409, hata: 'Hasta e-posta ile iletişime izin vermedi.' }
  const alici = epostaAdresi(h.hasta.eposta)
  if (!alici) return { durum: 409, hata: 'E-posta adresi anlaşılamadı.' }
  const e = bilgiFormuEpostasi({ hastaAdi: h.hasta.ad, veliDili: h.hasta.veliDili, doktorAdi, link: h.link })
  return {
    istek: {
      doktorId, patientId: h.hasta.id, tur: h.tur, kuyrukId: h.kuyrukId, alici,
      konu: h.mesaj.konu, metin: e.metin, ...(e.html ? { html: e.html } : {}),
    },
  }
}

/** Same invitation = same doctor, patient and form link. */
export const tekrarAnahtari = (doktorId: string, patientId: string, link: string) => `${doktorId}|${patientId}|${link}`

/**
 * In-flight / just-sent guard of this server instance. A second tap (double click, retry after a slow answer) of the
 * same invitation inside the window gets the first answer back instead of a second email.
 */
export class TekrarKilidi {
  private m = new Map<string, { t: number; sonuc: Promise<KutudanSonuc> }>()
  constructor(private pencereMs = TEKRAR_PENCERE_MS) {}
  calistir(anahtar: string, simdi: number, is: () => Promise<KutudanSonuc>): Promise<KutudanSonuc> {
    for (const [k, v] of Array.from(this.m)) if (simdi - v.t > this.pencereMs) this.m.delete(k)
    const var_ = this.m.get(anahtar)
    if (var_) return var_.sonuc.then((s) => (s.ok ? { ...s, tekrar: true } : s))
    const sonuc = is().then((s) => {
      // only a successful send blocks a repeat; a failure can be retried right away
      if (!s.ok) this.m.delete(anahtar)
      return s
    }, (e) => { this.m.delete(anahtar); throw e })
    this.m.set(anahtar, { t: simdi, sonuc })
    return sonuc
  }
}

const kilit = new TekrarKilidi()

export type KutudanBagimliliklar = {
  hazirla?: typeof iletisimHazirla
  /** Test seam; default: the connected-mailbox sender when it is ready. */
  gonderici?: (doktorId: string) => Promise<OtomatikGonderici | null>
  kilit?: TekrarKilidi
  simdi?: () => number
}

type Oturum = { doktorId: string; rol: PratikRol; userId: string; personelId?: string | null }

/** Does this doctor have a connected, ready mailbox? Never throws. */
export async function epostaKutusuHazirMi(doktorId: string): Promise<boolean> {
  try {
    return !!(await hazirOtomatikGonderici(doktorId, 'eposta'))
  } catch {
    return false
  }
}

/** A send of the same invitation from the mailbox already logged in the window (other server instances). */
async function yakindaGonderildiMi(sb: SupabaseClient, doktorId: string, patientId: string, simdi: number): Promise<boolean> {
  try {
    const { data, error } = await sb.from('iletisim_kayitlari').select('id')
      .eq('doctor_id', doktorId).eq('patient_id', patientId).eq('tur', 'bilgi_formu').eq('kanal', 'eposta')
      .eq('durum', 'gonderildi').not('saglayici', 'is', null)
      .gte('created_at', new Date(simdi - TEKRAR_PENCERE_MS).toISOString())
      .limit(1)
    return !error && !!data?.length
  } catch {
    return false
  }
}

async function kaydet(sb: SupabaseClient, o: Oturum, h: Hazirlik, saglayici: string | null, mesajId: string | null) {
  const temel = {
    doctor_id: o.doktorId,
    patient_id: h.hasta.id,
    kanal: 'eposta',
    tur: h.tur,
    durum: 'gonderildi',
    gonderen_user_id: o.userId,
    gonderen_personel_id: o.rol === 'sekreter' ? o.personelId ?? null : null,
    kuyruk_id: h.kuyrukId,
    randevu_id: h.randevuId,
  }
  try {
    const { error } = await sb.from('iletisim_kayitlari').insert({ ...temel, otomatik: false, saglayici, saglayici_mesaj_id: mesajId })
    // before migration 098 the provider columns do not exist: log without them
    if (error && tabloYokMu(error)) await sb.from('iletisim_kayitlari').insert(temel)
  } catch { /* the email already left; the log is best effort */ }
  if (h.kuyrukId) {
    await Promise.resolve(sb.from('iletisim_kuyrugu').update({ durum: 'gonderildi', updated_at: new Date().toISOString() })
      .eq('id', h.kuyrukId).eq('doctor_id', o.doktorId)).catch(() => {})
  }
}

export async function bilgiFormuKutudanGonder(
  sb: SupabaseClient,
  o: Oturum,
  girdi: HazirlikGirdisi,
  secenek: { doktorAdi: string; doktorBransi: string | null },
  d: KutudanBagimliliklar = {},
): Promise<KutudanSonuc> {
  const hazirla = d.hazirla || iletisimHazirla
  const simdi = (d.simdi || Date.now)()
  const h: Hazirlik | HazirlikHatasi = await hazirla(sb, { doktorId: o.doktorId, rol: o.rol }, { ...girdi, tur: 'bilgi_formu' }, secenek)
  if (hataMi(h)) return { ok: false, durum: h.durum, hata: h.hata }
  const plan = bilgiFormuIstegi(h, o.doktorId, secenek.doktorAdi)
  if ('hata' in plan) return { ok: false, durum: plan.durum, hata: plan.hata }
  const istek = plan.istek

  return (d.kilit || kilit).calistir(tekrarAnahtari(o.doktorId, h.hasta.id, h.link || ''), simdi, async () => {
    if (await yakindaGonderildiMi(sb, o.doktorId, h.hasta.id, simdi)) return { ok: true, alici: istek.alici, saglayici: null, tekrar: true }
    const g = await (d.gonderici || ((id: string) => hazirOtomatikGonderici(id, 'eposta')))(o.doktorId)
    if (!g) return { ok: false, durum: 409, hata: 'Bağlı e-posta hesabı bulunamadı.' }
    let s
    try {
      s = await g.gonder(istek)
    } catch {
      return { ok: false, durum: 502, hata: 'E-posta gönderilemedi. Lütfen yeniden deneyin.' }
    }
    if (!s.ok) return { ok: false, durum: 502, hata: s.hata || 'E-posta gönderilemedi.' }
    await kaydet(sb, o, h, s.saglayici || g.saglayici || null, s.saglayiciMesajId ?? null)
    return { ok: true, alici: istek.alici, saglayici: s.saglayici || g.saglayici || null, tekrar: false }
  })
}
