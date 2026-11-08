/**
 * ULKE-BRANS-DERINLIK-09 (Kaan, 2026-11-08) — THE SPECIALTY TAB OF THE PATIENT'S FILE, worked out (pure). Türkiye's patient
 * file has a tab per specialty behind the branch gate (lib/doktor/hastaDosyaSekmeleri.ts: Pediatri's growth, M-CHAT-R/F and
 * development tabs). A country build has one such tab for the account's role: the role's OWN scores and calculators (a
 * tool visible to at most three roles, a scale or a formula) whose results were kept on this patient, one section per
 * tool, newest first, with the change of the first number against the time before.
 *
 * GATED BY THE ROLE, NOTHING ELSE: the tools come from `hesabinAraclari(icerik, rol).rol` — another role's tools are never
 * listed, even when a result of one was kept on this patient by an earlier role of the account. A shared tool (base, or
 * visible to more than three roles) is not a specialty view and stays on the "Tools" tab.
 *
 * Reads nothing: the caller hands it the records the file already loaded (one read for both cards). No sentence here.
 */
import type { AracKaydi } from './kayitTipleri'
import { hesabinAraclari, type GorunurArac } from './paket'
import type { AracSayisi, UlkeAraclari } from './tipler'

/** A tool is a specialty tool when at most this many roles see it (the depth audit's rule). */
export const UZMANLIK_ROL_AZAMI = 3
/** How many results of one tool the tab lists. */
export const UZMANLIK_SATIR_AZAMI = 12

export type UzmanlikSatiri = { id: string; gun: string; sayilar: readonly AracSayisi[]; bant: string | null; uyarilar: readonly string[]; /** first number minus the same number of the result before; null = none before */ fark: number | null }
export type UzmanlikBolumu = { arac: GorunurArac; satirlar: readonly UzmanlikSatiri[] }

/** The role's own specialty tools (scores and calculators), in the pack's order. */
export function uzmanlikAraclari(icerik: UlkeAraclari | null | undefined, rol: string | null | undefined): GorunurArac[] {
  if (!icerik || !rol) return []
  return hesabinAraclari(icerik, rol).rol.filter((x) => Array.isArray(x.paket.roller) && x.paket.roller.length <= UZMANLIK_ROL_AZAMI && x.paket.roller.includes(rol) && (x.tanim.tur === 'olcek' || x.tanim.tur === 'hesap'))
}

/** true = the role has a specialty tab at all (it has its own scores or calculators). */
export const uzmanlikSekmesiVar = (icerik: UlkeAraclari | null | undefined, rol: string | null | undefined): boolean => uzmanlikAraclari(icerik, rol).length > 0

/** The sections of the tab: only tools with at least one complete kept result. */
export function uzmanlikBolumleri(icerik: UlkeAraclari | null | undefined, rol: string | null | undefined, kayitlar: readonly AracKaydi[] | null | undefined): UzmanlikBolumu[] {
  const araclar = uzmanlikAraclari(icerik, rol)
  if (!araclar.length || !kayitlar?.length) return []
  const out: UzmanlikBolumu[] = []
  for (const arac of araclar) {
    const kendi = kayitlar
      .filter((k) => k.arac === arac.tanim.anahtar && k.sonuc?.tamam)
      .sort((a, b) => (a.olusturuldu < b.olusturuldu ? 1 : a.olusturuldu > b.olusturuldu ? -1 : 0))
    if (!kendi.length) continue
    const satirlar = kendi.slice(0, UZMANLIK_SATIR_AZAMI).map((k, i): UzmanlikSatiri => {
      const s = k.sonuc!
      const once = kendi[i + 1]?.sonuc
      const ilk = s.sayilar[0]
      const onceki = ilk && once ? once.sayilar.find((x) => x.anahtar === ilk.anahtar) : undefined
      return { id: k.id, gun: k.gun || k.olusturuldu.slice(0, 10), sayilar: s.sayilar, bant: s.bant, uyarilar: s.uyarilar, fark: ilk && onceki ? ilk.deger - onceki.deger : null }
    })
    out.push({ arac, satirlar })
  }
  return out
}
