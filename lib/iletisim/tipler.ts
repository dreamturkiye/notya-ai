/**
 * NOTYA-ILETISIM-01 — shared types for one-tap patient contact from the doctor's OWN accounts.
 * Pure, client-safe. Rule and contract: lib/iletisim/README.md.
 */

export type IletisimKanali = 'whatsapp' | 'eposta'

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
}
