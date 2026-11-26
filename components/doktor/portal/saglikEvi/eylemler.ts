/**
 * HASTA-PORTALI-GUNLUK — the action contract between the shared daily-health-home views and whoever hosts them
 * (Türkiye's live portal, the example/preview mode, later a country build). Views call these; they never fetch.
 */
import type { DozDurumu, DozSecimi, GlukozBaglami, KayitTutma, OlcumIsareti, OlcumTipi, UyariDuzeyi } from '@/lib/saglikEvi/tipler'
import type { FotoOneri } from '@/lib/saglikEvi/fotoOku'
import type { ModulAnahtari } from '@/lib/saglikEvi/moduller'

export type PushDurumu = 'yukleniyor' | 'yok' | 'acik' | 'kapali' | 'reddedildi' | 'desteklenmiyor'

/** EV-ACIL-SEKER: `isaret` = the meter showed HI / LO (glucose only; `deger` is then ignored and nothing numeric is stored). */
export interface OlcumGirdisi { tip: OlcumTipi; deger: number; deger2?: number | null; baglam?: GlukozBaglami | null; olcumAt?: string; foto?: boolean; isaret?: OlcumIsareti }
/** The patient-facing note after a save; sekerAcil / keton open the acil glucose symptom check. */
export interface KayitNotu { duzey: UyariDuzeyi; metrik: string; hastaMetni: string; kural?: string; sekerAcil?: 'yuksek' | 'dusuk'; keton?: boolean }
export type EylemSonucu = { ok: true } | { ok: false; hata: string }

export interface GunlukEylemleri {
  olcumEkle: (g: OlcumGirdisi) => Promise<EylemSonucu & { uyarilar?: KayitNotu[] }>
  olcumSil: (id: string) => Promise<EylemSonucu>
  doz: (planIds: string[], planlananAt: string | null, durum: DozDurumu | 'geri') => Promise<EylemSonucu>
  /** DOZ-KAYDI-ISTEGE-BAGLI: 'kayit' = per-medicine İşaretle switch (kayitTutma); 'hatirlatma' = per-medicine Hatırlat switch. */
  plan: (g: { tur: 'ekle' | 'saat' | 'kaldir' | 'kayit' | 'hatirlatma'; planId?: string; saatler?: string[]; ad?: string; doz?: string; gerektikce?: boolean; kayitTutma?: KayitTutma; hatirlatmaAcik?: boolean }) => Promise<EylemSonucu>
  /** dozSecimi = the one-time three-option answer; dozKaydi = Tercihler's logging default. */
  tercih: (g: { sessizBas?: string; sessizBit?: string; hatirlatmaAcik?: boolean; paylasimOnayi?: boolean; modul?: { anahtar: ModulAnahtari; acik: boolean }; dozSecimi?: DozSecimi; dozKaydi?: KayitTutma }) => Promise<EylemSonucu>
  soru: (metin: string) => Promise<EylemSonucu>
  soruSil: (id: string) => Promise<EylemSonucu>
  rozetGoruldu: () => Promise<void>
  uyariGoruldu: (idler: string[]) => Promise<void>
  fotoOku: (dosya: File) => Promise<{ ok: true; oneriler: FotoOneri[]; okunamadi: boolean } | { ok: false; hata: string }>
  push: { durum: PushDurumu; ac: () => Promise<EylemSonucu>; kapat: () => Promise<void> }
  /** Download links (null in example mode). */
  indirJson: string | null
  indirCsv: string | null
  veriSil: () => Promise<EylemSonucu>
}
