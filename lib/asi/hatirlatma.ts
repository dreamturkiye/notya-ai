/**
 * ASI-KARNESI-01 (D) — hekim onaylı aşı hatırlatması. Saf + istemci-güvenli.
 *
 * Kaan'ın kararı (2026-09-19): hatırlatma HEKİM ONAYIYLA gönderilir. Yaklaşan / tarihi geçen aşılar hekime LİSTELENİR,
 * hekim satırı açıp gidecek metni görür, onaylayıp gönderir. OTOMATİK GÖNDERİM YOK — eski günlük cron
 * (app/api/cron/asi-hatirlatma, WhatsApp) bu yüzden kaldırıldı.
 *
 * Kaynak: `asilar.sonraki_doz_tarihi` — HEKİMİN girdiği tarih. Takvim hesaplanmaz, doz önerilmez.
 * Metin sade ve klinik iddiasız: aşı adı, doz, tıbbi öneri yok; yalnız "kayıtlı bir sonraki aşı tarihi" + randevu yolu.
 * Gönderim MEVCUT Sağlığım mesaj yolundan (hasta_mesaj_konulari + hasta_mesajlar + gövdesiz bildirim) — yeni kanal yok.
 */
import { kayitSerisi } from '@/specialties/pediatri/engines/asiPlan'
import { trTarih } from './karneOkuma'

export const ASI_HATIRLATMA_KONU = 'Aşı hatırlatması'
/** Bugünden bu kadar gün sonrasına kadar olan tarihler "yaklaşıyor". */
export const YAKLASAN_PENCERE_GUN = 30
/** Tarihi bu kadar günden fazla geçmiş satır listede gösterilmez (eski, başka yerde yapılmış olabilir). */
export const GECMIS_PENCERE_GUN = 90

export type HatirlatmaDurumu = 'gecikti' | 'yaklasiyor'

const ISO = /^\d{4}-\d{2}-\d{2}$/
const gunEkle = (iso: string, n: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400e3).toISOString().slice(0, 10)
export const gunFarkiIso = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400e3)

/** Liste penceresi: [bugün − 90, bugün + 30]. */
export function hatirlatmaPenceresi(bugunIso: string): { bas: string; son: string } {
  return { bas: gunEkle(bugunIso, -GECMIS_PENCERE_GUN), son: gunEkle(bugunIso, YAKLASAN_PENCERE_GUN) }
}

export function hatirlatmaDurumu(sonrakiIso: string | null | undefined, bugunIso: string): HatirlatmaDurumu | null {
  const s = String(sonrakiIso || '').slice(0, 10)
  if (!ISO.test(s)) return null
  const { bas, son } = hatirlatmaPenceresi(bugunIso)
  if (s < bas || s > son) return null
  return s < bugunIso ? 'gecikti' : 'yaklasiyor'
}

export function durumEtiketi(sonrakiIso: string, bugunIso: string): string {
  const f = gunFarkiIso(bugunIso, sonrakiIso)
  if (f === 0) return 'bugün'
  return f > 0 ? `${f} gün sonra` : `tarihi ${-f} gün geçti`
}

interface AsiSatiri { id: string; patient_id: string; asi_adi: string | null; uygulama_tarihi: string | null; sonraki_doz_tarihi?: string | null }
const seriAnahtari = (ad: string | null) => {
  const a = String(ad || '').trim()
  return kayitSerisi(a) || a.toLocaleLowerCase('tr-TR')
}

/**
 * Bu satırın "sonraki dozu" aynı hastada DAHA SONRA kaydedilmiş bir dozla karşılanmış mı? (aynı seri/aynı ad, daha yeni
 * uygulama tarihi). Karşılanmışsa hatırlatma listesine alınmaz — yapılmış aşı için veliye mesaj gitmesin.
 */
export function sonrakiDozKarsilandiMi(satir: AsiSatiri, hastaninTumSatirlari: AsiSatiri[]): boolean {
  const u = String(satir.uygulama_tarihi || '').slice(0, 10)
  const anahtar = seriAnahtari(satir.asi_adi)
  return hastaninTumSatirlari.some((d) => d.id !== satir.id && d.patient_id === satir.patient_id && seriAnahtari(d.asi_adi) === anahtar
    && ISO.test(String(d.uygulama_tarihi || '').slice(0, 10)) && (!u || String(d.uygulama_tarihi).slice(0, 10) > u))
}

const ACIL = "Bu mesaj kanalı acil durumlar için değildir; acil bir durumda 112'yi arayın ya da en yakın acil servise başvurun."

/**
 * Hastaya/veliye giden metin. `cocuk` yalnız yaş kuralından (18 yaş altı — VELI-YASAL-ONAM), branştan değil.
 * Aşı adı, doz ve tıbbi öneri YOK — ayrıntı Sağlığım › Aşı Karnesi'nde.
 */
export function asiHatirlatmaMesaji(g: { tarihIso: string; cocuk: boolean }): { konu: string; metin: string } {
  const kimin = g.cocuk ? 'Çocuğunuzun kayıtlı bir sonraki aşı tarihi' : 'Kayıtlı bir sonraki aşı tarihiniz'
  return {
    konu: ASI_HATIRLATMA_KONU,
    metin: `Merhaba, ${kimin} ${trTarih(g.tarihIso)}. Randevu için muayenehanemizi arayabilir ya da bu mesaja yanıt yazabilirsiniz. Aşı kayıtlarınızı Sağlığım › Aşı Karnesi bölümünde görebilirsiniz.\n\n${ACIL}`,
  }
}

export interface AsiHatirlatmaSatiri {
  asiId: string
  patientId: string
  hastaAdi: string
  asiAdi: string
  dozNo: number | null
  sonrakiDozTarihi: string
  durum: HatirlatmaDurumu
  durumEtiketi: string
  gonderildi: boolean
  /** Hastanın geçerli Sağlığım bağlantısı var mı (yoksa mesaj bağlantı açılınca görünür) */
  portalVar: boolean
  /** Hekimin onaydan önce göreceği metnin AYNISI */
  onizleme: { konu: string; metin: string }
}

/** Liste sırası: tarihi geçenler önce (en eski), sonra yaklaşanlar (en yakın); gönderilmişler en sonda. */
export function hatirlatmaSirala(a: AsiHatirlatmaSatiri, b: AsiHatirlatmaSatiri): number {
  return Number(a.gonderildi) - Number(b.gonderildi) || a.sonrakiDozTarihi.localeCompare(b.sonrakiDozTarihi) || a.hastaAdi.localeCompare(b.hastaAdi, 'tr')
}
