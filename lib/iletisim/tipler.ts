/**
 * NOTYA-ILETISIM-01 — shared types for one-tap patient contact from the doctor's OWN accounts.
 * Pure, client-safe. Rule and contract: lib/iletisim/README.md.
 */

/**
 * NOTYA-HASTA-ILETISIMI-01 (2026-10-16): 'sms' is the third channel, added for the bulk patient
 * communication feature only (lib/iletisim/toplu/, lib/iletisim/sms/) — the doctor's own phone
 * number via a pluggable gateway, never Twilio. The original one-tap/automatic system (this
 * file's `kanalMi`, baglantilar.ts, otomatik.ts) is deliberately untouched and still only
 * recognises whatsapp/eposta; do not widen those without checking every call site.
 */
export type IletisimKanali = 'whatsapp' | 'eposta' | 'sms'

/** Where an email opens on THIS device: the device mail app (mailto:), Gmail web or Outlook web. */
export type EpostaAcilis = 'uygulama' | 'gmail' | 'outlook'

/**
 * Every message Notya prepares for a patient. None of them carries clinical information
 * (no diagnosis, drug, test name or result) — details stay behind the PIN-protected Sağlığım link.
 */
export type MesajTuru =
  | 'randevu_hatirlatma'
  | 'randevu_degisikligi'
  | 'randevu_iptali'
  | 'tetkik_getirin'
  | 'saglikim_yeni_mesaj'
  | 'saglikim_baglanti'
  | 'bilgi_formu'
  | 'asi_hatirlatma'
  | 'kontrol_hatirlatma'
  | 'serbest'
  // NOTYA-ASI-ONAM-01 (2026-10-16): a vaccine informed-consent form is ready to review in Sağlığım
  // (Pediatri only). Same "no clinical content" rule as every other template here — this notice
  // never names a vaccine; it only points at the PIN-gated Sağlığım link where the parent reviews
  // and confirms. Deliberately absent from OTOMATIK_TURLER (lib/iletisim/otomatik.ts) — like
  // asi_hatirlatma, always one-tap, never sent by a cron.
  | 'asi_onam_hazir'
  // NOTYA-ACCOUNTING-COMPLIANCE-01 (2026-10-15): AR late-payment reminder draft. Financial, not
  // clinical, content — the one exception to "no amounts in a message" is amounts ARE allowed
  // here (lib/accounting/ar/reminders.ts), the "no clinical info" rule this module exists for is
  // untouched. Deliberately absent from OTOMATIK_TURLER (lib/iletisim/otomatik.ts) — see that
  // file; this type can never be sent without a human tap, structurally, not just by default.
  | 'odeme_hatirlatma'
  // NOTYA-HASTA-ILETISIMI-01 (2026-10-16): a bulk campaign message (lib/iletisim/toplu/) — audience
  // filter → template/compose → preview → send. Free text the doctor/sekreter wrote or edited from
  // a preset; unlike the rest of this file it is NOT auto-generated per patient from a fixed
  // template, so the "no clinical content" rule here is enforced by UI guidance + the preset
  // library (lib/iletisim/toplu/sablonlar.ts), not by construction. Never in OTOMATIK_TURLER —
  // every bulk send requires an explicit human confirmation (lib/iletisim/toplu/kampanya.ts).
  | 'toplu_mesaj'

export const MESAJ_TURLERI: readonly MesajTuru[] = [
  'randevu_hatirlatma',
  'randevu_degisikligi',
  'randevu_iptali',
  'tetkik_getirin',
  'saglikim_yeni_mesaj',
  'saglikim_baglanti',
  'bilgi_formu',
  'asi_hatirlatma',
  'kontrol_hatirlatma',
  'serbest',
  'odeme_hatirlatma',
  'asi_onam_hazir',
  'toplu_mesaj',
]

export function mesajTuruMu(x: unknown): x is MesajTuru {
  return typeof x === 'string' && (MESAJ_TURLERI as readonly string[]).includes(x)
}

export function kanalMi(x: unknown): x is IletisimKanali {
  return x === 'whatsapp' || x === 'eposta'
}

export function epostaAcilisMi(x: unknown): x is EpostaAcilis {
  return x === 'uygulama' || x === 'gmail' || x === 'outlook'
}

/** Durum of a row in iletisim_kayitlari. */
export type KayitDurumu = 'acildi' | 'gonderildi'

/** Durum of a row in iletisim_kuyrugu. */
export type KuyrukDurumu = 'bekliyor' | 'gonderildi' | 'atlandi'

export const KANAL_ETIKETI: Record<IletisimKanali, string> = {
  whatsapp: 'WhatsApp',
  eposta: 'E-posta',
  sms: 'SMS',
}

export const TUR_ETIKETI: Record<MesajTuru, string> = {
  randevu_hatirlatma: 'Randevu hatırlatma',
  randevu_degisikligi: 'Randevu değişikliği',
  randevu_iptali: 'Randevu iptali',
  tetkik_getirin: 'Tetkik ve raporlarınızı getirin',
  saglikim_yeni_mesaj: 'Sağlığım’da yeni mesaj',
  saglikim_baglanti: 'Sağlığım bağlantısı',
  bilgi_formu: 'Hasta bilgi formu',
  asi_hatirlatma: 'Aşı hatırlatma',
  kontrol_hatirlatma: 'Kontrol hatırlatma',
  serbest: 'Mesaj',
  odeme_hatirlatma: 'Ödeme hatırlatma',
  asi_onam_hazir: 'Aşı onam formu hazır',
  toplu_mesaj: 'Toplu mesaj',
}
