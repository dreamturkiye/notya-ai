/**
 * HASTA-PORTALI-GUNLUK — composes the patient's "Bugün" state (rings, dial, doses, quick-add tiles, trends, streak,
 * badges, karne) from raw rows, and the doctor's Kontrol Öncesi Özet. Pure: the server route, the doctor's preview and
 * the demo all run the same function, so the three can never disagree.
 */
import type { DozKaydi, DozPlani, EvOlcum, EvTercihler, EvUyari, GlukozBaglami, OlcumTipi, SlotDurumu } from './tipler'
import type { BransGunlukAyari, GunlukKarti } from './bransAyari'
import { etkinOlcumler } from './bransAyari'
import type { EsikSeti, HedefProfili, HekimAyarlari } from './hedefler'
import { etkinEsikler, hedefMetni, hedefteMi } from './hedefler'
import { metrikAnahtari, metrikEtiketi, OLCUM_TANIMLARI, onerilenBaglam } from './olcumler'
import { bugunPlani, gerektikceDurumu, gunSlotlari, kayitHaritasi, planUyumlari, slotDurumu, uyum, type UyumSonucu } from './dozPlani'
import { seriHesapla, type SeriSonucu } from './seri'
import { ROZETLER, rozetDurumlari, type RozetDurumu, type RozetId, type RozetTanimi } from './rozetler'
import { karneHesapla, type Karne } from './karne'
import { pencere } from './kurallar'
import { gunEkle, trDakika, trGun } from './zaman'

export interface HamGunluk {
  simdi: string
  bransAnahtar: string
  ayar: BransGunlukAyari
  hekimAyar: HekimAyarlari | null
  profil: HedefProfili
  olcumler: EvOlcum[]
  toplamOlcum: number
  fotoOlcum: number
  planlar: DozPlani[]
  kayitlar: DozKaydi[]
  uyarilar: EvUyari[]
  kazanilanRozetler: Array<{ rozet: string; kazanildiAt: string; hastaGorduAt: string | null }>
  tercihler: EvTercihler
  ldl: { deger: number; tarih: string } | null
  sorular: Array<{ id: string; metin: string; createdAt: string }>
}

export interface OlcumKarti {
  tip: OlcumTipi
  ad: string
  birim: string
  son: { deger: number; deger2: number | null; baglam: GlukozBaglami | null; olcumAt: string } | null
  onDeger: number
  onDeger2: number | null
  onBaglam: GlukozBaglami | null
  bugunSayi: number
  gunlukHedef: number
  hedef: string | null
}

export interface Egilim {
  anahtar: string
  etiket: string
  birim: string
  hafta: { ort: number | null; ort2: number | null; n: number }
  onceki: { ort: number | null; ort2: number | null; n: number }
  gunluk: Array<{ gun: string; ort: number | null; ort2: number | null }>
  hedefMetni: string | null
  hedefMin: number | null
  hedefMax: number | null
  yon: 'yukari' | 'asagi' | 'sabit' | null
}

export type GunlukRozet = RozetTanimi & RozetDurumu & { kazanildiAt: string | null; yeni: boolean }

export interface GunlukDurum {
  simdi: string
  bugun: string
  brans: string
  vurgu: 'olcum' | 'uyum'
  kartlar: GunlukKarti[]
  olcumKartlari: OlcumKarti[]
  bugunDozlar: ReturnType<typeof bugunPlani>
  gerektikce: ReturnType<typeof gerektikceDurumu>
  planlar: DozPlani[]
  halkalar: { ilac: { yapilan: number; toplam: number }; olcum: { yapilan: number; toplam: number }; hedef: { yuzde: number | null; n: number } }
  /** Dial markers: minute of day + what it is. */
  kadran: Array<{ dakika: number; tur: 'doz' | 'olcum'; durum: 'tamam' | 'bekliyor' | 'kacti'; etiket: string }>
  seri: SeriSonucu
  son14: Array<{ gun: string; aktif: boolean; kalkan: boolean }>
  egilimler: Egilim[]
  uyarilar: Array<Pick<EvUyari, 'id' | 'duzey' | 'metrik' | 'hastaMetni' | 'olusturmaAt' | 'hastaGorduAt'>>
  rozetler: GunlukRozet[]
  /** Badges whose condition is met but are not stored yet (the server stores them). */
  yeniKazanilan: RozetId[]
  karne: { hafta: Karne; ay: Karne }
  uyum7: UyumSonucu
  uyum30: UyumSonucu
  tercihler: EvTercihler
  ldl: { deger: number; tarih: string; hedef: number } | null
  sorular: HamGunluk['sorular']
  siradaki: { tur: 'doz'; saat: string; at: string; planIds: string[]; adlar: string[] } | null
  esikler: Record<string, EsikSeti>
  /** Latest readings, newest first (Günlük list). */
  sonOlcumler: EvOlcum[]
  /** Last 7 days × active scheduled plan: each slot's state (Doz Takvimi week grid). */
  hafta: { gunler: string[]; planlar: Array<{ planId: string; ad: string; gunler: SlotDurumu[][] }> }
}

/** Days with any log: a reading, or a dose taken. */
export function aktifGunler(olcumler: EvOlcum[], kayitlar: DozKaydi[]): Set<string> {
  const s = new Set<string>()
  for (const o of olcumler) s.add(trGun(o.olcumAt))
  for (const k of kayitlar) if (k.durum === 'alindi') s.add(trGun(k.kayitAt))
  return s
}

export function gunlukOzeti(h: HamGunluk): GunlukDurum {
  const simdi = h.simdi
  const bugun = trGun(simdi)
  const esikler = etkinEsikler(h.profil, h.hekimAyar)
  const son90Tipler = new Set(h.olcumler.map((o) => o.tip))
  const tipler = etkinOlcumler(h.ayar, h.hekimAyar, son90Tipler)
  const gunlukHedef: Partial<Record<OlcumTipi, number>> = {}
  for (const t of tipler) gunlukHedef[t] = h.ayar.gunlukHedef[t] ?? (h.ayar.olcumler.includes(t) ? OLCUM_TANIMLARI[t].gunlukHedef : 0)
  const aktifPlanlar = h.planlar.filter((p) => p.aktif)

  const sirali = [...h.olcumler].sort((a, b) => b.olcumAt.localeCompare(a.olcumAt))
  const olcumKartlari: OlcumKarti[] = tipler.map((t) => {
    const def = OLCUM_TANIMLARI[t]
    const baglam = t === 'glukoz' ? onerilenBaglam(h.olcumler, simdi) : null
    // Prefill: the last value of the same context (glucose), else the last value of the kind, else the catalog start.
    const son = sirali.find((o) => o.tip === t) || null
    const ayni = t === 'glukoz' ? sirali.find((o) => o.tip === t && o.baglam === baglam) || son : son
    const anahtar = t === 'glukoz' ? `glukoz:${baglam}` : t
    return {
      tip: t, ad: def.ad, birim: def.birim,
      son: son ? { deger: son.deger, deger2: son.deger2, baglam: son.baglam, olcumAt: son.olcumAt } : null,
      onDeger: t === 'su' ? 1 : ayni?.deger ?? def.ilkDeger,
      onDeger2: t === 'kb' ? ayni?.deger2 ?? def.ilkDeger2 ?? null : null,
      onBaglam: baglam,
      bugunSayi: h.olcumler.filter((o) => o.tip === t && trGun(o.olcumAt) === bugun).reduce((a, o) => a + (t === 'su' ? o.deger : 1), 0),
      gunlukHedef: gunlukHedef[t] ?? 0,
      hedef: hedefMetni(anahtar, esikler[anahtar]),
    }
  })

  const bugunDozlar = bugunPlani(aktifPlanlar, h.kayitlar, simdi)
  const gerektikce = gerektikceDurumu(h.planlar, h.kayitlar, simdi)
  const olcumToplam = olcumKartlari.reduce((a, k) => a + k.gunlukHedef, 0)
  const olcumYapilan = olcumKartlari.reduce((a, k) => a + Math.min(k.bugunSayi, k.gunlukHedef), 0)
  const son7 = h.olcumler.filter((o) => trGun(o.olcumAt) >= gunEkle(bugun, -6))
  const hedefDeg = son7.map((o) => hedefteMi(esikler[metrikAnahtari(o)], o.deger, o.deger2)).filter((x): x is boolean => x != null)

  const kadran: GunlukDurum['kadran'] = [
    ...bugunDozlar.map((s) => ({ dakika: trDakika(s.at), tur: 'doz' as const, durum: (s.durum === 'alindi' ? 'tamam' : s.durum === 'kacirildi' || s.durum === 'atlandi' ? 'kacti' : 'bekliyor') as 'tamam' | 'bekliyor' | 'kacti', etiket: `${s.saat} ${s.ad}` })),
    ...h.olcumler.filter((o) => trGun(o.olcumAt) === bugun).map((o) => ({ dakika: trDakika(o.olcumAt), tur: 'olcum' as const, durum: 'tamam' as const, etiket: OLCUM_TANIMLARI[o.tip].kisaAd })),
  ]

  const aktif = aktifGunler(h.olcumler, h.kayitlar)
  const seri = seriHesapla(aktif, bugun)
  const kalkanSet = new Set(seri.kalkanGunleri)
  const son14 = Array.from({ length: 14 }, (_, i) => { const g = gunEkle(bugun, -13 + i); return { gun: g, aktif: aktif.has(g), kalkan: kalkanSet.has(g) } })

  const anahtarlar = [...new Set(h.olcumler.map(metrikAnahtari))].filter((a) => !a.startsWith('su'))
  const egilimler: Egilim[] = anahtarlar.map((a): Egilim => {
    const p = pencere(h.olcumler, a, simdi, 14)
    const e = esikler[a]
    const fark = p.hafta.ort != null && p.onceki.ort != null ? p.hafta.ort - p.onceki.ort : null
    const esik = a === 'kb' ? 3 : a.startsWith('glukoz') ? 8 : a === 'kilo' ? 0.5 : 2
    return {
      anahtar: a, etiket: metrikEtiketi(a), birim: OLCUM_TANIMLARI[a.split(':')[0] as OlcumTipi].birim,
      hafta: p.hafta, onceki: p.onceki, gunluk: p.gunluk.map((x) => ({ gun: x.gun, ort: x.ort, ort2: x.ort2 })),
      hedefMetni: hedefMetni(a, e), hedefMin: e?.hedefMin ?? null, hedefMax: e?.hedefMax ?? null,
      yon: fark == null ? null : fark > esik ? 'yukari' : fark < -esik ? 'asagi' : 'sabit',
    }
  }).sort((x, y) => y.hafta.n - x.hafta.n)

  const ilkGun = [...aktif].sort()[0] ?? null
  const karneGirdi = { olcumler: h.olcumler, planlar: aktifPlanlar, kayitlar: h.kayitlar, esikler, olcumTipleri: tipler, gunlukHedef, aktifGunler: aktif, ilkGun, simdi }
  const durumlar = rozetDurumlari({ olcumler: h.olcumler, toplamOlcum: h.toplamOlcum, fotoOlcum: h.fotoOlcum, planlar: aktifPlanlar, kayitlar: h.kayitlar, esikler, olcumTipleri: tipler, gunlukHedef, seri, aktifGunSayisi: aktif.size, simdi })
  const kayitli = new Map(h.kazanilanRozetler.map((r) => [r.rozet, r]))
  const rozetler: GunlukRozet[] = durumlar.map((d) => {
    const t = ROZETLER.find((r) => r.id === d.id) as RozetTanimi
    const k = kayitli.get(d.id)
    // A stored badge stays earned even when the 90-day window no longer shows it.
    return { ...t, ...d, kazanildi: d.kazanildi || !!k, deger: k ? d.hedef : d.deger, kazanildiAt: k?.kazanildiAt ?? null, yeni: (!!k && !k.hastaGorduAt) || (!k && d.kazanildi) }
  })
  const yeniKazanilan = durumlar.filter((d) => d.kazanildi && !kayitli.has(d.id)).map((d) => d.id)

  const bekleyen = bugunDozlar.filter((s) => s.durum === 'zamani' || s.durum === 'bekliyor' || s.durum === 'ertelendi')
  const ilk = bekleyen[0]
  const siradaki = ilk ? { tur: 'doz' as const, saat: ilk.saat, at: ilk.at, planIds: bekleyen.filter((s) => s.at === ilk.at).map((s) => s.planId), adlar: bekleyen.filter((s) => s.at === ilk.at).map((s) => s.ad) } : null

  const ldlHedef = h.hekimAyar?.ldlHedef
  const haftaGunleri = Array.from({ length: 7 }, (_, i) => gunEkle(bugun, -6 + i))
  const harita = kayitHaritasi(h.kayitlar)
  const hafta = { gunler: haftaGunleri, planlar: aktifPlanlar.filter((p) => !p.gerektikce).map((p) => ({ planId: p.id, ad: p.ad, gunler: haftaGunleri.map((g) => gunSlotlari(p, g).map((sl) => slotDurumu(p.id, sl, harita, simdi))) })) }
  return {
    simdi, bugun, brans: h.bransAnahtar, vurgu: h.ayar.vurgu, kartlar: h.ayar.kartlar,
    olcumKartlari, bugunDozlar, gerektikce, planlar: h.planlar,
    halkalar: {
      ilac: { yapilan: bugunDozlar.filter((s) => s.durum === 'alindi').length, toplam: bugunDozlar.length },
      olcum: { yapilan: olcumYapilan, toplam: olcumToplam },
      hedef: { yuzde: hedefDeg.length >= 3 ? Math.round((hedefDeg.filter(Boolean).length / hedefDeg.length) * 100) : null, n: hedefDeg.length },
    },
    kadran, seri, son14, egilimler,
    uyarilar: h.uyarilar.map((u) => ({ id: u.id, duzey: u.duzey, metrik: u.metrik, hastaMetni: u.hastaMetni, olusturmaAt: u.olusturmaAt, hastaGorduAt: u.hastaGorduAt })),
    rozetler, yeniKazanilan,
    karne: { hafta: karneHesapla(karneGirdi, 'hafta'), ay: karneHesapla(karneGirdi, 'ay') },
    uyum7: uyum(aktifPlanlar, h.kayitlar, gunEkle(bugun, -6), bugun, simdi),
    uyum30: uyum(aktifPlanlar, h.kayitlar, gunEkle(bugun, -29), bugun, simdi),
    tercihler: h.tercihler,
    ldl: h.ldl && ldlHedef && h.ayar.kartlar.includes('ldl') ? { ...h.ldl, hedef: ldlHedef } : null,
    sorular: h.sorular,
    siradaki,
    esikler,
    sonOlcumler: sirali.slice(0, 40),
    hafta,
  }
}

// ─── Kontrol Öncesi Özet (doctor) ─────────────────────────────────────────────────────────────────────────────────

export interface KontrolOzeti {
  donemBas: string
  donemBit: string
  randevuAt: string | null
  metrikler: Array<{ anahtar: string; etiket: string; birim: string; n: number; ort: string | null; min: string | null; max: string | null; hedefteYuzde: number | null; ilkHafta: string | null; sonHafta: string | null }>
  uyum: { genel: UyumSonucu; ilaclar: ReturnType<typeof planUyumlari> }
  uyarilar: Array<{ duzey: string; metin: string; tarih: string }>
  sorular: Array<{ metin: string; tarih: string }>
  aktifGun: number
  metin: string
}

const f = (x: number | null, o = 0) => (x == null ? null : (Math.round(x * 10 ** o) / 10 ** o).toLocaleString('tr-TR', { maximumFractionDigits: o }))

/** Last 4 weeks of home data, adherence, alerts and the patient's questions — one printable page for the doctor. */
export function kontrolOncesiOzet(g: { olcumler: EvOlcum[]; planlar: DozPlani[]; kayitlar: DozKaydi[]; uyarilar: EvUyari[]; sorular: Array<{ metin: string; createdAt: string }>; esikler: Record<string, EsikSeti>; simdi: string; randevuAt: string | null }): KontrolOzeti {
  const bit = trGun(g.simdi)
  const bas = gunEkle(bit, -27)
  const ol = g.olcumler.filter((o) => { const d = trGun(o.olcumAt); return d >= bas && d <= bit })
  const anahtarlar = [...new Set(ol.map(metrikAnahtari))]
  const metrikler = anahtarlar.map((a) => {
    const s = ol.filter((o) => metrikAnahtari(o) === a)
    const tip = a.split(':')[0] as OlcumTipi
    const o = OLCUM_TANIMLARI[tip].ondalik
    const ort = s.reduce((x, y) => x + y.deger, 0) / s.length
    const ort2 = s.some((y) => y.deger2 != null) ? s.reduce((x, y) => x + (y.deger2 ?? 0), 0) / s.length : null
    const metin = (v: number, v2: number | null) => (tip === 'kb' ? `${f(v)}/${f(v2)}` : (f(v, o) as string))
    const enB = s.reduce((x, y) => (y.deger > x.deger ? y : x)), enK = s.reduce((x, y) => (y.deger < x.deger ? y : x))
    const hedef = s.map((y) => hedefteMi(g.esikler[a], y.deger, y.deger2)).filter((x): x is boolean => x != null)
    const hafta = (b: string, e: string) => { const w = s.filter((y) => { const d = trGun(y.olcumAt); return d >= b && d <= e }); if (!w.length) return null; const m = w.reduce((x, y) => x + y.deger, 0) / w.length; const m2 = tip === 'kb' ? w.reduce((x, y) => x + (y.deger2 ?? 0), 0) / w.length : null; return metin(m, m2) }
    return {
      anahtar: a, etiket: metrikEtiketi(a), birim: OLCUM_TANIMLARI[tip].birim, n: s.length,
      ort: metin(ort, ort2), min: metin(enK.deger, enK.deger2), max: metin(enB.deger, enB.deger2),
      hedefteYuzde: hedef.length ? Math.round((hedef.filter(Boolean).length / hedef.length) * 100) : null,
      ilkHafta: hafta(bas, gunEkle(bas, 6)), sonHafta: hafta(gunEkle(bit, -6), bit),
    }
  })
  const aktifP = g.planlar.filter((p) => p.aktif)
  const genel = uyum(aktifP, g.kayitlar, bas, bit, g.simdi)
  const ilaclar = planUyumlari(aktifP, g.kayitlar, bas, bit, g.simdi)
  const uyarilar = g.uyarilar.filter((u) => trGun(u.olusturmaAt) >= bas).map((u) => ({ duzey: u.duzey, metin: u.hekimMetni, tarih: u.olusturmaAt }))
  const sorular = g.sorular.map((s) => ({ metin: s.metin, tarih: s.createdAt }))
  const aktifGun = aktifGunler(ol, g.kayitlar.filter((k) => trGun(k.kayitAt) >= bas)).size

  const satirlar: string[] = [`Kontrol öncesi ev verisi özeti — ${bas} / ${bit} (son 4 hafta, ${aktifGun} gün kayıt)`]
  if (metrikler.length) {
    satirlar.push('', 'Ölçümler:')
    for (const m of metrikler) satirlar.push(`- ${m.etiket}: ort ${m.ort} ${m.birim} (n=${m.n}; en düşük ${m.min}, en yüksek ${m.max}${m.hedefteYuzde != null ? `; hedefte %${m.hedefteYuzde}` : ''}${m.ilkHafta && m.sonHafta ? `; ilk hafta ${m.ilkHafta} → son hafta ${m.sonHafta}` : ''})`)
  } else satirlar.push('', 'Bu dönemde ev ölçümü yok.')
  if (ilaclar.length) {
    satirlar.push('', `İlaç uyumu: ${genel.yuzde == null ? '—' : `%${genel.yuzde}`} (${genel.alinan}/${genel.beklenen} doz)`)
    for (const i of ilaclar) satirlar.push(`- ${i.ad}${i.kritik ? ' (kritik)' : ''}${i.kaynak === 'hasta' ? ' (hastanın eklediği)' : ''}: ${i.yuzde == null ? '—' : `%${i.yuzde}`} (${i.alinan}/${i.beklenen})`)
  }
  if (uyarilar.length) { satirlar.push('', 'Uyarılar:'); for (const u of uyarilar) satirlar.push(`- [${u.duzey}] ${trGun(u.tarih)} — ${u.metin}`) }
  if (sorular.length) { satirlar.push('', 'Hastanın soruları:'); for (const s of sorular) satirlar.push(`- ${s.metin}`) }
  satirlar.push('', 'Ev ölçümleri hastanın kendi cihazıyla girilmiştir; değerlendirme hekime aittir.')
  return { donemBas: bas, donemBit: bit, randevuAt: g.randevuAt, metrikler, uyum: { genel, ilaclar }, uyarilar, sorular, aktifGun, metin: satirlar.join('\n') }
}
