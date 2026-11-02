/**
 * AU-GAP-CLOSE-01 — shapes for letter studio, MBS assist and the PMS export pack. Client-safe types.
 */
import type { MektupTuru } from './sabitler'

export type MektupTurSecenegi = { tur: MektupTuru; ad: string; aciklama: string }

/** Pack-owned UI copy for the letter studio card (uzanti.mektup). Absent = card not drawn. */
export type MektupMetni = {
  baslik: string
  aciklama: string
  turler: readonly MektupTurSecenegi[]
  yaz: string
  yaziliyor: string
  yenidenYaz: string
  etiket: string
  kopyala: string
  kopyalandi: string
  indir: string
  yazdir: string
  makine: string
  yazilamadi: string
  onayliDegil: string
  bos: string
  /** Never claims lodgement, referral transmission, or PMS sync. */
  uyari: string
  /** AU-GAP-CLOSE-02 — doctor attests they reviewed this letter before export/queue. */
  onayla: string
  onaylandi: string
  onayBekliyor: string
}

export type MbsOneriMetni = {
  baslik: string
  aciklama: string
  oner: string
  oneriliyor: string
  kopyala: string
  kopyalandi: string
  bos: string
  yazilamadi: string
  /** Hard rule shown every time: suggest only, never lodge. */
  uyari: string
  kaynak: string
  /** AU-GAP-CLOSE-02 — confirm selected MBS suggestions for export/queue. */
  onayla: string
  onaylandi: string
  onayBekliyor: string
}

export type PmsEntegrasyonKalemi = {
  anahtar: string
  ad: string
  /** kimlik-kayitli = credentials saved, partner still pending — never a Synced state. */
  durum: 'hazir-export' | 'yol-haritasi' | 'partner-api' | 'kimlik-kayitli'
  aciklama: string
}

export type PmsEntegrasyonMetni = {
  baslik: string
  aciklama: string
  exportBaslik: string
  exportAciklama: string
  exportDugme: string
  exportIndiriliyor: string
  kalemler: readonly PmsEntegrasyonKalemi[]
  /** Honest: no live write-back without a partner API. */
  uyari: string
}

export type MektupTaslak = {
  tur: MektupTuru
  metin: string
  /** Doctor attested they read/edited this draft (export/queue gate). */
  hekimOnayi?: boolean
}

export type MbsOneri = {
  item: string
  aciklama: string
  gerekce: string
  /** Always false in this product — never a claim. */
  lodgeEdilmez: true
  /** Doctor confirmed this suggestion for export/queue. */
  hekimOnayi?: boolean
}

export type PmsExportPaket = {
  surum: string
  ulke: string
  notId: string
  onayTarihi: string | null
  sablon: string
  not: { s: string; o: string; a: string; p: string }
  mektuplar?: Partial<Record<MektupTuru, string>>
  mbsOnerileri?: readonly MbsOneri[]
  /** Explicit: this file is for the doctor to import or paste. No PMS was contacted. */
  uyari: string
}
