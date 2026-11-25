/**
 * HASTA-PORTALI-GUNLUK — the doctor's "Ev verisi" card, computed from rows (pure; the server route and the internal
 * demo run the same function). Without the patient's KVKK consent the card carries no home data at all.
 */
import type { DozKaydi, DozPlani, EvOlcum, EvTercihler, EvUyari, OlcumTipi } from './tipler'
import { bransGunlukAyari, etkinOlcumler, hedefProfili } from './bransAyari'
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
  metrikler: Array<{ anahtar: string; etiket: string; birim: string; noktalar: Array<{ at: string; deger: number; deger2: number | null }>; hafta: { ort: number | null; ort2: number | null; n: number }; onceki: { ort: number | null; ort2: number | null; n: number }; hedefMin: number | null; hedefMax: number | null; hedefMax2: number | null }>
  uyum: { hafta: ReturnType<typeof uyum>; ay: ReturnType<typeof uyum>; ilaclar: ReturnType<typeof planUyumlari> }
  planlar: Array<{ id: string; ad: string; doz: string | null; saatler: string[]; gerektikce: boolean; kaynak: 'hekim' | 'hasta'; kritik: boolean; minAralikSaat: number | null }>
  uyarilar: Array<{ id: string; duzey: string; metin: string; tarih: string; goruldu: boolean }>
  acikUyari: number
  esikler: Record<string, unknown>
  varsayilan: Record<string, unknown>
  hekimAyar: HekimAyarlari
  olcumTipleri: OlcumTipi[]
  brans: string
  kontrolOzeti: { id: string; olusturmaAt: string; randevuAt: string | null; ozet: KontrolOzeti; metin: string } | null
  sorular: Array<{ metin: string; tarih: string }>
}

export interface EvVerisiGirdisi {
  simdiMs: number
  brans: string | null
  gebelikAktif: boolean
  tercih: EvTercihler
  hekimAyarHam: unknown
  olcumler: EvOlcum[]
  planlar: DozPlani[]
  kayitlar: DozKaydi[]
  uyarilar: EvUyari[]
  kontrolOzeti: EvVerisiKarti['kontrolOzeti']
  sorular: EvVerisiKarti['sorular']
}

export function evVerisiHesapla(g: EvVerisiGirdisi): EvVerisiKarti {
  const { simdiMs } = g
  const bugun = trGun(simdiMs)
  const b = bransGunlukAyari(g.brans)
  const hekimAyar = hekimAyarlariniTemizle(g.hekimAyarHam)
  const profil = hedefProfili(b.anahtar, g.gebelikAktif)
  const esikler = etkinEsikler(profil, hekimAyar)
  const olcumler = [...g.olcumler].sort((x, y) => x.olcumAt.localeCompare(y.olcumAt))
  const planlar = g.planlar.filter((p) => p.aktif)
  const kayitlar = g.kayitlar
  const kullaniyor = olcumler.length > 0 || kayitlar.length > 0 || planlar.some((p) => p.kaynak === 'hasta')
  const bos: EvVerisiKarti = {
    onay: g.tercih.paylasimOnayi, onayAt: g.tercih.onayAt, kullaniyor, metrikler: [], uyum: { hafta: { alinan: 0, beklenen: 0, yuzde: null }, ay: { alinan: 0, beklenen: 0, yuzde: null }, ilaclar: [] },
    planlar: planlar.map((p) => ({ id: p.id, ad: p.ad, doz: p.doz, saatler: p.saatler, gerektikce: p.gerektikce, kaynak: p.kaynak, kritik: p.kritik, minAralikSaat: p.minAralikSaat })),
    uyarilar: [], acikUyari: 0, esikler, varsayilan: varsayilanEsikler(profil), hekimAyar, olcumTipleri: etkinOlcumler(b.ayar, hekimAyar), brans: b.anahtar, kontrolOzeti: null, sorular: [],
  }
  // Without consent the doctor may still set thresholds / kritik flags (his own clinical settings), but sees no home data.
  if (!g.tercih.paylasimOnayi) return bos
  const anahtarlar = [...new Set(olcumler.map(metrikAnahtari))]
  const uyarilar = g.uyarilar.filter((u) => u.duzey !== 'bilgi').sort((x, y) => y.olusturmaAt.localeCompare(x.olusturmaAt))
  const d28 = new Date(simdiMs - 28 * GUN_MS).toISOString()
  return {
    ...bos,
    olcumTipleri: etkinOlcumler(b.ayar, hekimAyar, new Set(olcumler.map((o) => o.tip))),
    metrikler: anahtarlar.map((a) => {
      const p = pencere(olcumler, a, simdiMs, 7)
      const e = esikler[a]
      return { anahtar: a, etiket: metrikEtiketi(a), birim: OLCUM_TANIMLARI[a.split(':')[0] as OlcumTipi].birim, noktalar: olcumler.filter((o) => metrikAnahtari(o) === a && o.olcumAt >= d28).map((o) => ({ at: o.olcumAt, deger: o.deger, deger2: o.deger2 })), hafta: p.hafta, onceki: p.onceki, hedefMin: e?.hedefMin ?? null, hedefMax: e?.hedefMax ?? null, hedefMax2: e?.hedefMax2 ?? null }
    }).filter((m) => m.noktalar.length > 0),
    uyum: { hafta: uyum(planlar, kayitlar, gunEkle(bugun, -6), bugun, simdiMs), ay: uyum(planlar, kayitlar, gunEkle(bugun, -29), bugun, simdiMs), ilaclar: planUyumlari(planlar, kayitlar, gunEkle(bugun, -13), bugun, simdiMs) },
    uyarilar: uyarilar.map((u) => ({ id: u.id, duzey: u.duzey, metin: u.hekimMetni, tarih: u.olusturmaAt, goruldu: !!u.hekimGorduAt })),
    acikUyari: uyarilar.filter((u) => !u.hekimGorduAt && (u.duzey === 'hekime_bildir' || u.duzey === 'acil')).length,
    kontrolOzeti: g.kontrolOzeti,
    sorular: g.sorular,
  }
}
