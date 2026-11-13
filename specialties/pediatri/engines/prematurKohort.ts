/**
 * PREMATURE-MODUL — Pediatri › Prematüre takip planı girdisi + kohort satırları. Pure (veritabanı yok).
 *
 * Plan motoru ülkeden bağımsızdır (lib/clinical/prematur/takipPlani.ts) ve protokol tablosu ENJEKTE edilir; burası yalnız
 * Notya kayıtlarını motorun girdisine çevirir:
 *   - gestasyon haftası / doğum ağırlığı: hekimin elle girdiği profil önceliklidir, yoksa KD taburcu paketinin bebek kartı;
 *   - antenatal steroid / PPROM / magnezyum: hekimin işareti önceliklidir, yoksa bebek kartının erken_dogum_ozeti özeti (kayıt);
 *   - mevcut kayıtlar: pedi_taramalar satırları (ROP, işitme, demir) → ilgili kuralın öğesi "yapıldı (kayıt)" görünür.
 * Kohort = hekimin kendi hastaları arasında kapsamda olan (gestasyon < 37 hf ya da ≤ 1500 g) ve kronolojik yaşı plan üst sınırının
 * altında olan bebekler. Hiçbir şey otomatik istenmez, hiçbir mesaj otomatik gönderilmez.
 */
import { takipPlani, type OgeKaydi, type TakipOgesi, type TakipPlani } from '@/lib/clinical/prematur/takipPlani'
import { gestasyonGunu, gestasyonMetni, duzeltilmisYasMetni } from '@/lib/clinical/prematur/duzeltilmisYas'
import type { PrematurProfil, PrematurProtokol } from '@/lib/clinical/prematur/protokol'

/** bebek_kartlari.erken_dogum_ozeti (KD tarafı yazar; burada yalnız okunur). */
export interface ErkenDogumOzeti {
  gestasyonHafta?: number | null
  steroidKuru?: boolean | null
  pprom?: boolean | null
  magnezyum?: boolean | null
}

export interface PrematurKaynakVeri {
  dogumIso: string
  /** bebek_kartlari.gebelik_haftasi (ondalık hafta) */
  kartGestasyonHafta: number | null
  kartDogumKiloGr: number | null
  kartOzet: ErkenDogumOzeti | null
  /** pedi_prematur_kayit.profil (temizlenmiş) */
  profil: PrematurProfil
  /** pedi_prematur_kayit.ogeler */
  durumlar: Record<string, OgeKaydi>
  /** pedi_taramalar: tür → tarihler */
  taramalar: Array<{ tur: string; tarih: string }>
}

export interface EtkinGirdi {
  gestasyonGun: number | null
  dogumKiloGr: number | null
  profil: PrematurProfil
  gestasyonKaynagi: 'elle' | 'kd-taburcu' | null
}

/** Hekimin girdisi ile KD taburcu özetini birleştirir (hekim önceliklidir). */
export function etkinGirdi(v: Pick<PrematurKaynakVeri, 'kartGestasyonHafta' | 'kartDogumKiloGr' | 'kartOzet' | 'profil'>): EtkinGirdi {
  const p = v.profil || {}
  const elleGest = p.gestasyonHafta ?? null
  const gestHafta = elleGest ?? v.kartGestasyonHafta ?? v.kartOzet?.gestasyonHafta ?? null
  const profil: PrematurProfil = { ...p }
  const o = v.kartOzet
  if (o) {
    if (profil.antenatalSteroid == null && o.steroidKuru != null) profil.antenatalSteroid = o.steroidKuru
    if (profil.pprom == null && o.pprom != null) profil.pprom = o.pprom
    if (profil.magnezyum == null && o.magnezyum != null) profil.magnezyum = o.magnezyum
    if (profil.kaynak == null && (o.steroidKuru != null || o.pprom != null || o.magnezyum != null)) profil.kaynak = 'kd-taburcu'
  }
  return {
    gestasyonGun: gestasyonGunu(gestHafta),
    dogumKiloGr: p.dogumKiloGr ?? v.kartDogumKiloGr ?? null,
    profil,
    gestasyonKaynagi: elleGest != null ? 'elle' : gestHafta != null ? 'kd-taburcu' : null,
  }
}

/** Kural.kayitTuru (pedi_taramalar.tur) → kural kodu başına tarih listesi. */
export function mevcutKayitlarKur(protokol: PrematurProtokol, taramalar: Array<{ tur: string; tarih: string }>): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const k of protokol.kurallar) {
    if (!k.kayitTuru) continue
    out[k.kod] = taramalar.filter((t) => t.tur === k.kayitTuru && /^\d{4}-\d{2}-\d{2}/.test(t.tarih)).map((t) => t.tarih.slice(0, 10))
  }
  return out
}

export function prematurPlanHesapla(v: PrematurKaynakVeri, bugunIso: string, protokol: PrematurProtokol): { plan: TakipPlani; etkin: EtkinGirdi } {
  const etkin = etkinGirdi(v)
  const plan = takipPlani({
    dogumIso: v.dogumIso, bugunIso, gestasyonGun: etkin.gestasyonGun, dogumKiloGr: etkin.dogumKiloGr, profil: etkin.profil,
    mevcutKayitlar: mevcutKayitlarKur(protokol, v.taramalar), durumlar: v.durumlar,
  }, protokol)
  return { plan, etkin }
}

/* ───────────────────────────── kohort ───────────────────────────── */

export interface PrematurKohortGirdi extends PrematurKaynakVeri { patientId: string; ad: string }

export interface PrematurKohortSatiri {
  patientId: string
  ad: string
  dogumIso: string
  gestasyon: string
  dogumKiloGr: number | null
  /** "düzeltilmiş 2 aylık" — düzeltme uygulanmıyorsa boş. */
  duzeltilmisYas: string
  kronolojikAy: number
  ozet: TakipPlani['ozet']
  /** En acil karşılanmış kriterli açık öğe (gecikti > zamanı geldi > yaklaşıyor > kayıt eksik). */
  siradaki: { baslik: string; etiket: string; hedef: string | null; durum: TakipOgesi['durum'] } | null
  veriEksik: string[]
  gecikti: boolean
}

const ACILIYET: Record<string, number> = { gecikti: 0, 'zamani-geldi': 1, yaklasiyor: 2, 'kayit-eksik': 3 }

export function siradakiOge(plan: TakipPlani): TakipOgesi | null {
  const adaylar = plan.ogeler.filter((o) => o.kriter.durum === 'karsilandi' && o.durum in ACILIYET)
  adaylar.sort((a, b) => ACILIYET[a.durum] - ACILIYET[b.durum] || String(a.hedef || '9999').localeCompare(String(b.hedef || '9999')))
  return adaylar[0] || null
}

export interface PrematurKohortSonuc {
  satirlar: PrematurKohortSatiri[]
  /** Kronolojik yaşı kapsamda ama gestasyon haftası / doğum ağırlığı hiçbir kayıtta olmayan çocuk sayısı (plan kurulamaz). */
  bilinmeyenSayisi: number
}

export function prematurKohortSatirlari(girdiler: PrematurKohortGirdi[], bugunIso: string, protokol: PrematurProtokol): PrematurKohortSonuc {
  const satirlar: PrematurKohortSatiri[] = []
  let bilinmeyen = 0
  for (const g of girdiler) {
    const { plan, etkin } = prematurPlanHesapla(g, bugunIso, protokol)
    if (!plan.kapsamda) {
      if (etkin.gestasyonGun == null && etkin.dogumKiloGr == null && plan.yas.kronolojikAy < protokol.urun.planUstAy) bilinmeyen++
      continue
    }
    const s = siradakiOge(plan)
    satirlar.push({
      patientId: g.patientId, ad: g.ad, dogumIso: g.dogumIso,
      gestasyon: gestasyonMetni(etkin.gestasyonGun), dogumKiloGr: etkin.dogumKiloGr,
      duzeltilmisYas: plan.yas.buyume.duzeltilmis ? duzeltilmisYasMetni(plan.yas, bugunIso) : '',
      kronolojikAy: plan.yas.kronolojikAy, ozet: plan.ozet,
      siradaki: s ? { baslik: s.baslik, etiket: s.etiket, hedef: s.hedef, durum: s.durum } : null,
      veriEksik: plan.eksikVeri, gecikti: plan.ozet.gecikti > 0,
    })
  }
  satirlar.sort((a, b) => b.ozet.gecikti - a.ozet.gecikti || b.ozet.zamaniGeldi - a.ozet.zamaniGeldi
    || String(a.siradaki?.hedef || '9999').localeCompare(String(b.siradaki?.hedef || '9999')) || a.ad.localeCompare(b.ad, 'tr'))
  return { satirlar, bilinmeyenSayisi: bilinmeyen }
}
