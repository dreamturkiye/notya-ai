/**
 * TR-PROTOKOL-KUTUPHANESI (Kaan, 2026-11-24) — Notya's Turkish protocol library: one entry per official document.
 *
 * Code-level data, reviewed in commits. Nothing here is edited automatically: the monthly edition check
 * (app/api/cron/protokol-surum) only FLAGS a changed / new edition into the founder review queue; a human-reviewed commit
 * then updates `belgeler.ts`. The research log behind every edition claim is docs/kaynak/PROTOKOL-KUTUPHANESI-ARASTIRMA.md.
 *
 * Rule (never broken): `surum` / `yil` / `yayinNo` are filled ONLY when the document itself (its imprint / title page) or an
 * official listing that carries the year in the title was read. Otherwise the entry is `durum: 'dogrulanamadi'` with no
 * edition — the citation lock then refuses any year / number for it.
 */
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import type { KlinikYeniSlug } from '@/lib/specialties/klinikDikey'

/** 30 medical branşlar (lib/doktor/specialties.ts) + 10 Özel Branşlar (lib/specialties/klinikDikey.ts). */
export type BransKodu = SpecialtyKey | KlinikYeniSlug

export type YayinciKodu =
  | 'SB-SHGM' // Sağlık Hizmetleri Genel Müdürlüğü (klinik protokoller, ArGe ve STD Dairesi; kalite)
  | 'SB-HSGM' // Halk Sağlığı Genel Müdürlüğü
  | 'SB-KHGM' // Kamu Hastaneleri Genel Müdürlüğü
  | 'SB' // Sağlık Bakanlığı (birim belirtilmemiş / yönetmelik)
  | 'TİTCK'
  | 'SGK'
  | 'TÜSEB'
  | 'DERNEK'
  | 'ULUSLARARASI' // international society used in Türkiye (ESC — TKD-endorsed —, GOLD / GINA via TTD, KDIGO, EAU via TÜD, ERC)

export type BelgeTuru =
  | 'sb-protokol' // SB klinik protokolü
  | 'sb-rehber' // SB klinik / yönetim / uygulama rehberi
  | 'sb-kilavuz' // SB (HYP) tarama-izlem kılavuzu
  | 'sb-program' // SB ulusal program / tarama programı
  | 'sb-kalite' // SB klinik kalite gösterge kartları
  | 'yonetmelik'
  | 'sut-kurali' // SGK Sağlık Uygulama Tebliği
  | 'dernek-kilavuzu'
  | 'dernek-uzlasi'
  | 'dernek-yayini'
  | 'kurum-raporu'
  | 'uluslararasi-kilavuz' // international society guideline / report (ESC, GOLD, GINA, KDIGO, EAU, ERC)
  | 'uluslararasi-uzlasi' // international consensus document (ESC Universal Definition of MI, ESC clinical consensus statement)

export type BelgeDurumu = 'guncel' | 'yerine-yenisi-geldi' | 'dogrulanamadi'

/**
 * How the edition was confirmed (research log has the URL for each):
 *  kunye        — the document's own imprint / title page was read
 *  resmi-liste  — an official (saglik.gov.tr) listing names the document with its year / revision in the title — or, for an
 *                 international society, the society's own official guideline listing / page names it with its year
 *  repo-kaydi   — read in full earlier and recorded in the repo with its download source (e.g. the SUT)
 */
export type DogrulamaYontemi = 'kunye' | 'resmi-liste' | 'repo-kaydi'

export interface BelgeBolumu {
  /** Stable anchor id, unique within the document. */
  id: string
  /** Heading exactly as in the document's table of contents. */
  baslik: string
  /** Printed page number from the table of contents, when the official text gives it. */
  sayfa?: number
  /** Lower-case TR keywords: a citing text that mentions the document AND one of these points at this section. */
  konu: string[]
}

/** A focused update published on top of a guideline edition (e.g. the 2025 focused update of the 2019 ESC/EAS dyslipidaemia guideline). */
export interface OdakGuncellemesi {
  yil: number
  /** Title exactly as the official listing gives it. */
  baslik: string
  url: string | null
}

export interface ProtokolBelgesi {
  id: string
  /** Title exactly as published (or as the official listing gives it when the imprint could not be read). */
  baslik: string
  /** Original-language title when `baslik` is a Turkish rendering (international guidelines), exactly as the society lists it. */
  ozgunBaslik?: string
  /** Short display name for chips. */
  kisaAd: string
  yayinciKodu: YayinciKodu
  /** Human publisher line, e.g. "T.C. Sağlık Bakanlığı · Sağlık Hizmetleri Genel Müdürlüğü" or the society's name. */
  yayinci: string
  tur: BelgeTuru
  /** Edition / version EXACTLY as published ("Versiyon 1.0", "Revizyon No. 01 (Ağustos 2025)"); null = not confirmed. */
  surum: string | null
  /** Publication year as printed; null = not confirmed. */
  yil: number | null
  /** T.C. Sağlık Bakanlığı Yayın Numarası, when printed. */
  yayinNo?: number
  isbn?: string
  /** Official URL (saglik.gov.tr subdomains, titck, sgk, the society's own site). null = no official copy found. */
  url: string | null
  branslar: BransKodu[]
  /** Lower-case TR scope keywords. */
  konu: string[]
  /**
   * Lower-case names a text uses for this document ("migren klinik protokolü"). A source chip appears only when one of
   * these is in the text; the citation lock also uses them to bind an SB document year to the right document.
   */
  atifAdlari: string[]
  durum: BelgeDurumu
  /** YYYY-MM-DD — when the edition was last confirmed against the official source. */
  sonDogrulama: string
  dogrulamaYontemi?: DogrulamaYontemi
  /** Focused updates that belong to this edition; each year is a confirmed citation year for the citation lock. */
  odakGuncellemeleri?: OdakGuncellemesi[]
  /** id of the newer document when durum === 'yerine-yenisi-geldi'. */
  yerineGelen?: string
  /** Society short code for the citation lock ("TEMD", "TKD", …). SB documents use 'SB-BELGE'. */
  kurumKodlari?: string[]
  bolumler?: BelgeBolumu[]
  /** Extra official pages the monthly check watches for this document (listing pages). The document URL is always watched
   * unless `yalnizTakipUrl` is set. */
  takipUrl?: string[]
  /** The monthly check reads only `takipUrl` (one society listing for many guideline pages — avoids one review item per page). */
  yalnizTakipUrl?: boolean
  /** Short honest note shown on the library page (why unconfirmed, what supersedes it, …). */
  not?: string
}

/** An official listing page the monthly check reads for new / revised documents (no document of its own). */
export interface TakipListesi {
  id: string
  ad: string
  url: string
  /** Lower-case filename / title fragments that mark a protocol / guideline link on the page. */
  belgeIsaretleri: string[]
  not?: string
}
