/**
 * HASTA-PORTALI-GUNLUK — the action contract between the shared daily-health-home views and whoever hosts them
 * (Türkiye's live portal, the example/preview mode, later a country build). Views call these; they never fetch.
 */
import type { DozDurumu, GlukozBaglami, OlcumTipi, UyariDuzeyi } from '@/lib/saglikEvi/tipler'
import type { FotoOneri } from '@/lib/saglikEvi/fotoOku'

export type PushDurumu = 'yukleniyor' | 'yok' | 'acik' | 'kapali' | 'reddedildi' | 'desteklenmiyor'

export interface OlcumGirdisi { tip: OlcumTipi; deger: number; deger2?: number | null; baglam?: GlukozBaglami | null; olcumAt?: string; foto?: boolean }
export type EylemSonucu = { ok: true } | { ok: false; hata: string }

export interface GunlukEylemleri {
  olcumEkle: (g: OlcumGirdisi) => Promise<EylemSonucu & { uyarilar?: Array<{ duzey: UyariDuzeyi; metrik: string; hastaMetni: string }> }>
  olcumSil: (id: string) => Promise<EylemSonucu>
  doz: (planIds: string[], planlananAt: string | null, durum: DozDurumu | 'geri') => Promise<EylemSonucu>
  plan: (g: { tur: 'ekle' | 'saat' | 'kaldir'; planId?: string; saatler?: string[]; ad?: string; doz?: string; gerektikce?: boolean }) => Promise<EylemSonucu>
  tercih: (g: { sessizBas?: string; sessizBit?: string; hatirlatmaAcik?: boolean; paylasimOnayi?: boolean }) => Promise<EylemSonucu>
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
