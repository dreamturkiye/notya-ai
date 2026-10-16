/**
 * NOTYA-ILETISIM-01 — Turkish message templates. Pure, client-safe.
 *
 * Hard rule: NO clinical information in any template — no diagnosis, drug, test name, result or
 * vaccine name. A message says "you have an appointment / a new message / a form to fill" and
 * points to the PIN-protected Sağlığım link for anything more. That is also what the patient's
 * KVKK consent covers (randevu + bilgilendirme), see lib/iletisim/izin.ts.
 *
 * Wording is reused where the product already had it:
 *   • bilgi_formu        ← app/api/doktor/intake-formlari (the old Twilio text)
 *   • asi_hatirlatma     ← lib/asi/hatirlatma.ts asiHatirlatmaMesaji (exact text, incl. the 112 line)
 *   • saglikim_yeni_mesaj← lib/portal/notifyPatientEmail.ts (the old Resend text, incl. the 112 line)
 *   • kontrol_hatirlatma ← app/doktor-tools/hatirlatma "Kontrol Zamanı"
 *   • randevu_hatirlatma ← app/api/cron/randevu-hatirlatma ("… saat 14:00 için randevunuz …")
 *
 * Guardian wording follows the patient's AGE (VELI-YASAL-ONAM, every branş): the caller passes
 * `veliDili` from veliDiliMi / veliOnamGerekliMi. An adult never gets guardian wording.
 */
import { asiHatirlatmaMesaji } from '@/lib/asi/hatirlatma'
import type { MesajTuru } from './tipler'

/** Same sentence the Sağlığım portal and the aşı reminder already carry. */
export const ACIL_SATIRI = 'Bu mesaj kanalı acil durumlar için değildir; acil bir durumda 112’yi arayın ya da en yakın acil servise başvurun.'

export type SablonGirdisi = {
  /** Patient's name as the practice knows it (full name or first name). */
  hastaAdi?: string | null
  /** true → the patient is a minor; the message speaks to the parent/guardian. */
  veliDili?: boolean
  /** "Dr. Gökhan Yılmaz" — signs the message and names whose appointment it is. */
  doktorAdi?: string | null
  /** Appointment start (ISO). */
  randevuIso?: string | null
  /** YYYY-MM-DD in Turkey — "bugün / yarın" is decided against it. Defaults to today in TRT. */
  bugunIso?: string | null
  /** Sağlığım / intake link. */
  link?: string | null
  /** YYYY-MM-DD, e.g. the next vaccine date the doctor recorded. */
  tarihIso?: string | null
  /** Only for 'serbest': the text the doctor wrote. */
  metin?: string | null
  /** Only for 'odeme_hatirlatma' (NOTYA-ACCOUNTING-COMPLIANCE-01): open balance, in kuruş. */
  odemeTutarKurus?: number | null
  /** Only for 'odeme_hatirlatma': short display reference for the invoice (doc number or id tail). */
  odemeFaturaRef?: string | null
  /** Only for 'odeme_hatirlatma': 1 = gentle (first reminder), 2 = firm (follow-up). */
  odemeKademe?: 1 | 2 | null
}

export type HazirMesaj = { konu: string; metin: string }

const TZ = 'Europe/Istanbul'

/** Today's date in Turkey as YYYY-MM-DD. */
export function bugunTrIso(simdi: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(simdi)
}

function trGunIso(iso: string): string {
  return bugunTrIso(new Date(iso))
}

function gunEkleIso(iso: string, n: number): string {
  return new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400e3).toISOString().slice(0, 10)
}

/** "yarın", "bugün" or "26 Eylül Cuma" for an appointment start. */
export function gunIfadesi(randevuIso: string, bugunIso: string = bugunTrIso()): string {
  const gun = trGunIso(randevuIso)
  if (gun === bugunIso) return 'bugün'
  if (gun === gunEkleIso(bugunIso, 1)) return 'yarın'
  return new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, day: 'numeric', month: 'long', weekday: 'long' }).format(new Date(randevuIso))
}

export function saatIfadesi(randevuIso: string): string {
  return new Date(randevuIso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
}

const temiz = (s: string | null | undefined) => String(s || '').replace(/\s+/g, ' ').trim()

function merhaba(g: SablonGirdisi): string {
  const ad = temiz(g.hastaAdi)
  return g.veliDili || !ad ? 'Merhaba,' : `Merhaba ${ad},`
}

/** Adult: "randevunuz". Minor: "Ali adına randevunuz" / "çocuğunuz adına randevunuz". */
function kiminRandevusu(g: SablonGirdisi): string {
  if (!g.veliDili) return 'randevunuz'
  const ad = temiz(g.hastaAdi)
  return `${ad || 'çocuğunuz'} adına randevunuz`
}

function zaman(g: SablonGirdisi): string | null {
  if (!g.randevuIso || Number.isNaN(Date.parse(g.randevuIso))) return null
  return `${gunIfadesi(g.randevuIso, g.bugunIso || bugunTrIso())} saat ${saatIfadesi(g.randevuIso)}`
}

function doktorIle(g: SablonGirdisi): string {
  const d = temiz(g.doktorAdi)
  return d ? `${d} ile ` : ''
}

function imzala(govde: string[], g: SablonGirdisi): string {
  const d = temiz(g.doktorAdi)
  return [...govde, ...(d ? ['', d] : [])].join('\n')
}

function konuYap(konu: string, g: SablonGirdisi): string {
  const d = temiz(g.doktorAdi)
  return d ? `${konu} · ${d}` : konu
}

/**
 * NOTYA-INTAKE-EPOSTA (2026-10-07) — the intake invitation, one piece per line. The compose links (mailto / Gmail /
 * Outlook web) carry `metin` as is; the connected mailbox sends the same pieces as the text part of a
 * multipart/alternative mail next to an HTML part (lib/iletisim/bilgiFormuEposta.ts). No duration is promised.
 */
export type BilgiFormuSatirlari = {
  selam: string
  giris: string
  link: string
  neden: string
  gizlilik: string
  /** "Dr. Ad Soyad", or '' when the practice has no doctor name */
  doktor: string
  metin: string
}

export function bilgiFormuSatirlari(g: SablonGirdisi, link: string): BilgiFormuSatirlari {
  const doktor = temiz(g.doktorAdi)
  const ad = temiz(g.hastaAdi)
  const kimIcin = ad ? `${ad} için` : g.veliDili ? 'çocuğunuz için' : 'sizin için'
  const selam = merhaba(g)
  const giris = `${doktor || 'Muayenehanemiz'}, ${kimIcin} hazırlanan Hasta Bilgi Formu’nu randevudan önce doldurmanızı rica ediyor.`
  const neden = 'Bilgileri önceden almamız, muayene süresini asıl konuya ayırmamızı sağlar.'
  const gizlilik = 'Bu bağlantı size özeldir; lütfen başkalarıyla paylaşmayın.'
  const metin = [selam, '', giris, '', link, '', neden, gizlilik, '', 'Saygılarımızla,', ...(doktor ? [doktor] : [])].join('\n')
  return { selam, giris, link, neden, gizlilik, doktor, metin }
}

/**
 * The prepared message for a patient, or null when a required piece is missing (no appointment
 * time for a reminder, no link for a form, no text for a free message). Never throws.
 */
export function mesajHazirla(tur: MesajTuru, g: SablonGirdisi): HazirMesaj | null {
  const z = zaman(g)
  const link = temiz(g.link)
  switch (tur) {
    case 'randevu_hatirlatma': {
      if (!z) return null
      const kim = g.veliDili ? `${kiminRandevusu(g)} var` : `${doktorIle(g)}randevunuz var`
      return {
        konu: konuYap('Randevu hatırlatması', g),
        metin: imzala([`${merhaba(g)} ${z} için ${kim}. Gelemeyecekseniz lütfen bize haber verin, size yeni bir saat ayarlayalım.`], g),
      }
    }
    case 'randevu_degisikligi': {
      if (!z) return null
      return {
        konu: konuYap('Randevunuz güncellendi', g),
        metin: imzala([`${merhaba(g)} ${kiminRandevusu(g)} ${z} olarak güncellendi. Bu saat size uymuyorsa lütfen bize haber verin.`], g),
      }
    }
    case 'randevu_iptali': {
      const ne = z ? `${z} için olan ${kiminRandevusu(g)}` : kiminRandevusu(g)
      return {
        konu: konuYap('Randevunuz iptal edildi', g),
        metin: imzala([`${merhaba(g)} ${ne} iptal edildi. Yeni bir randevu için bize ulaşabilirsiniz.`], g),
      }
    }
    case 'tetkik_getirin': {
      const hangi = z ? `${z} için olan ${kiminRandevusu(g)}a` : `bir sonraki ${kiminRandevusu(g)}a`
      return {
        konu: konuYap('Randevunuz için küçük bir rica', g),
        metin: imzala([`${merhaba(g)} ${hangi} gelirken elinizdeki tetkik sonuçlarını ve raporları da getirmenizi rica ederiz. Teşekkürler.`], g),
      }
    }
    case 'saglikim_yeni_mesaj': {
      const kimeMesaj = g.veliDili && temiz(g.hastaAdi) ? `${temiz(g.hastaAdi)} için ` : ''
      const nasil = link
        ? ['Mesaj içeriği güvenliğiniz için burada gösterilmez. Okumak ve yanıtlamak için bağlantıya dokunun (muayenehanemizin verdiği 6 haneli PIN gerekir):', link]
        : ['Mesaj içeriği güvenliğiniz için burada gösterilmez. Okumak için Sağlığım’a muayenehanemizin verdiği bağlantı ve PIN ile girebilirsiniz.']
      return {
        konu: konuYap('Sağlığım’da yeni mesajınız var', g),
        metin: imzala([`${merhaba(g)} Sağlığım’da ${kimeMesaj}size yeni bir mesaj var.`, ...nasil, '', ACIL_SATIRI], g),
      }
    }
    case 'saglikim_baglanti': {
      if (!link) return null
      const kimin = g.veliDili && temiz(g.hastaAdi) ? `${temiz(g.hastaAdi)} için ` : ''
      return {
        konu: konuYap('Sağlığım bağlantınız', g),
        metin: imzala([`${merhaba(g)} ${kimin}belgelerinize, mesajlarınıza ve kayıtlarınıza Sağlığım’dan güvenle ulaşabilirsiniz:`, link, 'Giriş için muayenehanemizin size verdiği 6 haneli PIN gerekir.', '', ACIL_SATIRI], g),
      }
    }
    case 'asi_onam_hazir': {
      // NOTYA-ASI-ONAM-01: no vaccine name, no content — only a generic notice + the Sağlığım link,
      // same as saglikim_baglanti / bilgi_formu. veliDili is always true here in practice (Pediatri-only feature).
      if (!link) return null
      const kimin = temiz(g.hastaAdi) ? `${temiz(g.hastaAdi)} için ` : ''
      return {
        konu: konuYap('Aşı bilgilendirme ve onay formu hazır', g),
        metin: imzala([
          `${merhaba(g)} ${kimin}bir aşı bilgilendirme ve onay formu hazırlandı. İçeriği okumak ve onaylamak için Sağlığım’a girin:`,
          link,
          'Giriş için muayenehanemizin size verdiği 6 haneli PIN gerekir.',
          '',
          ACIL_SATIRI,
        ], g),
      }
    }
    case 'bilgi_formu': {
      if (!link) return null
      const b = bilgiFormuSatirlari(g, link)
      return { konu: konuYap('Hasta bilgi formu', g), metin: b.metin }
    }
    case 'asi_hatirlatma': {
      const t = String(g.tarihIso || '').slice(0, 10)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null
      const m = asiHatirlatmaMesaji({ tarihIso: t, cocuk: !!g.veliDili })
      return { konu: konuYap(m.konu, g), metin: imzala([m.metin], g) }
    }
    case 'kontrol_hatirlatma': {
      const ne = g.veliDili ? `${temiz(g.hastaAdi) || 'çocuğunuz'} için kontrol zamanı` : 'kontrol zamanınız'
      return {
        konu: konuYap('Kontrol hatırlatması', g),
        metin: imzala([`${merhaba(g)} ${ne} geldi. Randevu için bizi arayabilir ya da bu mesaja yanıt yazabilirsiniz.`], g),
      }
    }
    case 'serbest': {
      const metin = String(g.metin || '').trim()
      if (!metin) return null
      return { konu: konuYap('Muayenehanemizden mesaj', g), metin: imzala([metin], g) }
    }
    case 'odeme_hatirlatma': {
      // NOTYA-ACCOUNTING-COMPLIANCE-01. One template body serves both channels in this system
      // (the one-tap flow uses the same `metin` for the WhatsApp link and the mailto/Gmail/Outlook
      // link — see lib/iletisim/README.md; there is no per-channel body anywhere else in this
      // module either, 'bilgi_formu' included). Kept short enough to read naturally on WhatsApp,
      // with the amount + invoice reference included so it also stands on its own as an email body
      // — not two independent template sets, by the architecture's own existing constraint; see
      // docs/ARCH-NOTYA-ACCOUNTING.md §4.6.6 for this disclosed explicitly.
      const tutar = odemeTutarYaz(g.odemeTutarKurus)
      if (!tutar) return null
      const ref = temiz(g.odemeFaturaRef)
      const kime = g.veliDili ? `${temiz(g.hastaAdi) || 'Hastamız'} için` : ''
      const faturaSatiri = ref ? ` (${ref})` : ''
      if (g.odemeKademe === 2) {
        return {
          konu: konuYap('Ödemenizi hatırlatmak isteriz', g),
          metin: imzala(
            [
              `${merhaba(g)} ${kime ? `${kime} ` : ''}${tutar} tutarındaki${faturaSatiri} ödemeniz hâlâ bekliyor. Mümkün olan en kısa sürede tamamlamanızı rica ederiz; ödeme yapıldıysa lütfen bize bildirin, kaydımızı güncelleyelim.`,
            ],
            g,
          ),
        }
      }
      return {
        konu: konuYap('Küçük bir ödeme hatırlatması', g),
        metin: imzala(
          [
            `${merhaba(g)} ${kime ? `${kime} ` : ''}${tutar} tutarındaki${faturaSatiri} ödemenizi henüz göremedik. Uygun olduğunuzda tamamlarsanız seviniriz; bir sorun varsa bize yazabilirsiniz.`,
          ],
          g,
        ),
      }
    }
    case 'toplu_mesaj':
      // Bulk campaigns are generated by lib/iletisim/toplu/kampanya.ts, not by this per-patient
      // generator — this type exists on MesajTuru only so iletisim_kayitlari/kuyrugu can carry it.
      return null
  }
}

/** "1.250,00 TL", or null for a missing/invalid amount (never shows "NaN" or "0,00" for a gap). */
function odemeTutarYaz(kurus: number | null | undefined): string | null {
  if (typeof kurus !== 'number' || !Number.isFinite(kurus) || kurus <= 0) return null
  return `${(kurus / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`
}

/** Short one-line preview for lists (queue, contact log). */
export function onizleme(metin: string, uzunluk = 90): string {
  const tek = metin.replace(/\s+/g, ' ').trim()
  return tek.length > uzunluk ? `${tek.slice(0, uzunluk - 1).trimEnd()}…` : tek
}
