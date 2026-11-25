/**
 * HASTA-PORTALI-GUNLUK — the doctor's "Ev verisi" card, computed from rows (pure; the server route and the internal
 * demo run the same function). Without the patient's KVKK consent the card carries no home data at all.
 */
import type { DozKaydi, DozPlani, EvOlcum, EvTercihler, EvUyari, IsaretliOlcum, OlcumIsareti, OlcumTipi } from './tipler'
import { bransGunlukAyari, hedefProfili } from './bransAyari'
import { hastaModulleri, type KlinikGirdi, type ModulSecenegi } from './moduller'
import { etkinEsikler, hekimAyarlariniTemizle, varsayilanEsikler, type HekimAyarlari } from './hedefler'
import { metrikAnahtari, metrikEtiketi, OLCUM_TANIMLARI } from './olcumler'
import { planUyumlari, uyum } from './dozPlani'
import { pencere } from './kurallar'
import type { KontrolOzeti } from './ozet'
import { gunEkle, trGun, GUN_MS } from './zaman'

export interface EvVerisiKarti {
  onay: boolean
  onayAt: string | null
  /** Portal used at all (any reading / dose mark / plan). */
  kullaniyor: boolean
  /** isaretler: glucometer HI / LO entries (EV-ACIL-SEKER) — off-scale markers, never part of the averages. acilUst / acilAlt:
   *  the effective urgent thresholds (UYARI-RENKLERI: each reading in the list is coloured by its level). */
  metrikler: Array<{ anahtar: string; etiket: string; birim: string; noktalar: Array<{ at: string; deger: number; deger2: number | null }>; isaretler?: Array<{ at: string; isaret: OlcumIsareti }>; hafta: { ort: number | null; ort2: number | null; n: number }; onceki: { ort: number | null; ort2: number | null; n: number }; hedefMin: number | null; hedefMax: number | null; hedefMax2: number | null; esik?: { dikkatUst?: number; dikkatAlt?: number; bildirUst?: number; bildirAlt?: number; acilUst?: number; acilAlt?: number; dikkatUst2?: number; bildirUst2?: number; acilUst2?: number } }>
  /** ilaclar: 14-day figure per plan, plus (display only) its last-7-day figure and one status per day for the 14-day strip. */
  uyum: { hafta: ReturnType<typeof uyum>; ay: ReturnType<typeof uyum>; ilaclar: Array<ReturnType<typeof planUyumlari>[number] & { hafta: ReturnType<typeof uyum>; gunler: DozGunu[] }> }
  planlar: Array<{ id: string; ad: string; doz: string | null; saatler: string[]; gerektikce: boolean; kaynak: 'hekim' | 'hasta'; kritik: boolean; minAralikSaat: number | null }>
  /** metrik / kural / deger: display only (the card's status sentence names the metric and the reading that fired). */
  uyarilar: Array<{ id: string; duzey: string; metin: string; tarih: string; goruldu: boolean; metrik: string; kural: string; deger: number | null; deger2: number | null; isaret?: OlcumIsareti }>
  acikUyari: number
  esikler: Record<string, unknown>
  varsayilan: Record<string, unknown>
  hekimAyar: HekimAyarlari
  olcumTipleri: OlcumTipi[]
  /** HASTA-MODULLERI: the doctor's Modüller control — every switchable module, on / off, and why (doctor-side only). */
  moduller: ModulSecenegi[]
  /** Readings (last 28 days) of kinds this patient is not followed for — stored, shown as one line, never as tiles. */
  takipDisi: Array<{ tip: OlcumTipi; ad: string; n: number }>
  brans: string
  kontrolOzeti: { id: string; olusturmaAt: string; randevuAt: string | null; ozet: KontrolOzeti; metin: string } | null
  sorular: Array<{ metin: string; tarih: string }>
}

/** One day of one medicine on the 14-day strip: nothing due · all taken · some taken · none taken. */
export type DozGunu = 'yok' | 'tam' | 'kismi' | 'alinmadi'

export interface EvVerisiGirdisi {
  simdiMs: number
  brans: string | null
  gebelikAktif: boolean
  tercih: EvTercihler
  hekimAyarHam: unknown
  olcumler: EvOlcum[]
  /** EV-ACIL-SEKER: HI / LO flags (kept apart from the numeric readings). */
  isaretliOlcumler?: IsaretliOlcum[]
  planlar: DozPlani[]
  kayitlar: DozKaydi[]
  uyarilar: EvUyari[]
  kontrolOzeti: EvVerisiKarti['kontrolOzeti']
  sorular: EvVerisiKarti['sorular']
  klinik?: KlinikGirdi | null
}

export function evVerisiHesapla(g: EvVerisiGirdisi): EvVerisiKarti {
  const { simdiMs } = g
  const bugun = trGun(simdiMs)
  const b = bransGunlukAyari(g.brans)
  const hekimAyar = hekimAyarlariniTemizle(g.hekimAyarHam)
  const profil = hedefProfili(b.anahtar, g.gebelikAktif)
  const esikler = etkinEsikler(profil, hekimAyar)
  const mod = hastaModulleri({ bransAnahtar: b.anahtar, ayar: b.ayar, hekim: hekimAyar, klinik: g.klinik, hasta: g.tercih.moduller })
  const olcumler = [...g.olcumler].sort((x, y) => x.olcumAt.localeCompare(y.olcumAt))
  const planlar = g.planlar.filter((p) => p.aktif)
  const kayitlar = g.kayitlar
  const isaretli = [...(g.isaretliOlcumler || [])].sort((x, y) => x.olcumAt.localeCompare(y.olcumAt))
  const kullaniyor = olcumler.length > 0 || isaretli.length > 0 || kayitlar.length > 0 || planlar.some((p) => p.kaynak === 'hasta')
  const bos: EvVerisiKarti = {
    onay: g.tercih.paylasimOnayi, onayAt: g.tercih.onayAt, kullaniyor, metrikler: [], uyum: { hafta: { alinan: 0, beklenen: 0, yuzde: null }, ay: { alinan: 0, beklenen: 0, yuzde: null }, ilaclar: [] },
    planlar: planlar.map((p) => ({ id: p.id, ad: p.ad, doz: p.doz, saatler: p.saatler, gerektikce: p.gerektikce, kaynak: p.kaynak, kritik: p.kritik, minAralikSaat: p.minAralikSaat })),
    uyarilar: [], acikUyari: 0, esikler, varsayilan: varsayilanEsikler(profil), hekimAyar, olcumTipleri: mod.olcumler, moduller: mod.secenekler, takipDisi: [], brans: b.anahtar, kontrolOzeti: null, sorular: [],
  }
  // Without consent the doctor may still set thresholds / kritik flags (his own clinical settings), but sees no home data.
  if (!g.tercih.paylasimOnayi) return bos
  const takip = new Set(mod.olcumler)
  const anahtarlar = [...new Set([...olcumler.filter((o) => takip.has(o.tip)), ...isaretli].map(metrikAnahtari))]
  const d28Ms = simdiMs - 28 * GUN_MS
  const disiSay = new Map<OlcumTipi, number>()
  for (const o of olcumler) if (!takip.has(o.tip) && Date.parse(o.olcumAt) >= d28Ms) disiSay.set(o.tip, (disiSay.get(o.tip) || 0) + 1)
  const uyarilar = g.uyarilar.filter((u) => u.duzey !== 'bilgi').sort((x, y) => y.olusturmaAt.localeCompare(x.olusturmaAt))
  const d28 = new Date(simdiMs - 28 * GUN_MS).toISOString()
  return {
    ...bos,
    takipDisi: [...disiSay].map(([tip, n]) => ({ tip, ad: OLCUM_TANIMLARI[tip].ad, n })),
    metrikler: anahtarlar.map((a) => {
      const p = pencere(olcumler, a, simdiMs, 7)
      const e = esikler[a]
      const esik = e ? { dikkatUst: e.dikkatUst, dikkatAlt: e.dikkatAlt, bildirUst: e.bildirUst, bildirAlt: e.bildirAlt, acilUst: e.acilUst, acilAlt: e.acilAlt, dikkatUst2: e.dikkatUst2, bildirUst2: e.bildirUst2, acilUst2: e.acilUst2 } : {}
      return { anahtar: a, etiket: metrikEtiketi(a), birim: OLCUM_TANIMLARI[a.split(':')[0] as OlcumTipi].birim, noktalar: olcumler.filter((o) => metrikAnahtari(o) === a && o.olcumAt >= d28).map((o) => ({ at: o.olcumAt, deger: o.deger, deger2: o.deger2 })), isaretler: isaretli.filter((o) => metrikAnahtari(o) === a && o.olcumAt >= d28).map((o) => ({ at: o.olcumAt, isaret: o.isaret })), hafta: p.hafta, onceki: p.onceki, hedefMin: e?.hedefMin ?? null, hedefMax: e?.hedefMax ?? null, hedefMax2: e?.hedefMax2 ?? null, esik }
    }).filter((m) => m.noktalar.length > 0 || (m.isaretler?.length ?? 0) > 0),
    uyum: { hafta: uyum(planlar, kayitlar, gunEkle(bugun, -6), bugun, simdiMs), ay: uyum(planlar, kayitlar, gunEkle(bugun, -29), bugun, simdiMs), ilaclar: planUyumlari(planlar, kayitlar, gunEkle(bugun, -13), bugun, simdiMs).map((i) => {
      const p = planlar.filter((x) => x.id === i.planId)
      const gunler = Array.from({ length: 14 }, (_, k): DozGunu => {
        const gun = gunEkle(bugun, k - 13)
        const u = uyum(p, kayitlar, gun, gun, simdiMs)
        return !u.beklenen ? 'yok' : u.alinan === u.beklenen ? 'tam' : u.alinan ? 'kismi' : 'alinmadi'
      })
      return { ...i, hafta: uyum(p, kayitlar, gunEkle(bugun, -6), bugun, simdiMs), gunler }
    }) },
    uyarilar: uyarilar.map((u) => ({ id: u.id, duzey: u.duzey, metin: u.hekimMetni, tarih: u.olusturmaAt, goruldu: !!u.hekimGorduAt, metrik: u.metrik, kural: u.kural, deger: typeof u.veri?.deger === 'number' ? u.veri.deger : null, deger2: typeof u.veri?.deger2 === 'number' ? u.veri.deger2 : null, ...(u.veri?.isaret === 'hi' || u.veri?.isaret === 'lo' ? { isaret: u.veri.isaret as OlcumIsareti } : {}) })),
    acikUyari: uyarilar.filter((u) => !u.hekimGorduAt && (u.duzey === 'hekime_bildir' || u.duzey === 'acil')).length,
    kontrolOzeti: g.kontrolOzeti,
    sorular: g.sorular,
  }
}
