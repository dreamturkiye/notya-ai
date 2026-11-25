/**
 * HASTA-PORTALI-GUNLUK — Eğilim Bekçisi + rule engine. Pure functions, no I/O.
 *
 * Levels: bilgi (patient only, friendly) · dikkat (patient, keep measuring) · hekime_bildir (patient + doctor's ONE
 * consolidated Fısıltı and the Ev verisi card) · acil (patient is told to call 112 — Notya is not an emergency service —
 * and the doctor is notified too).
 *
 * The patient text never names a disease, never interprets beyond "higher / lower than your target", and never
 * suggests a dose. The doctor text carries the numbers.
 *
 * Anti-noise: one alert per key while it is cooling down (acil 6 h, hekime_bildir 72 h, dikkat 48 h, bilgi 24 h); a
 * rule fires again inside the cool-down only when its level rises. Trends need ≥4 readings in the last 7 days and ≥4
 * in the 3 weeks before — a single reading never makes a trend.
 */
import type { EvOlcum, UyariDuzeyi } from './tipler'
import { DUZEY_SIRASI } from './tipler'
import type { EsikSeti } from './hedefler'
import { metrikAnahtari, metrikEtiketi, OLCUM_TANIMLARI } from './olcumler'
import { gunEkle, trGun, GUN_MS } from './zaman'

export interface KuralSonucu {
  kural: string
  /** Dedupe key (cool-down applies per key). */
  anahtar: string
  duzey: UyariDuzeyi
  metrik: string
  hastaMetni: string
  hekimMetni: string
  veri: Record<string, unknown>
}

export const ACIL_METNI = "Kendinizi kötü hissediyorsanız, göğüs ağrısı, nefes darlığı, konuşma bozukluğu, güçsüzlük veya bilinç bulanıklığı varsa hemen 112'yi arayın. Notya bir acil yardım hizmeti değildir."
const ILAC_UYARISI = 'İlaçlarınızı kendiniz değiştirmeyin.'

const yuvarla = (x: number, o = 0) => Math.round(x * 10 ** o) / 10 ** o
const fmt = (x: number, o = 0) => yuvarla(x, o).toLocaleString('tr-TR', { maximumFractionDigits: o })

export interface KuralBaglami {
  /** Patient age in months (fever rule for infants); null = unknown. */
  yasAy: number | null
  /** Weight gain notifies the doctor (heart / kidney follow-up). */
  kiloHekimeBildir: boolean
}

/** Rules on one new reading (thresholds). */
export function tekDegerKurallari(o: EvOlcum, esikler: Record<string, EsikSeti>, b: KuralBaglami): KuralSonucu[] {
  const m = metrikAnahtari(o)
  const e = esikler[m]
  const t = OLCUM_TANIMLARI[o.tip]
  const out: KuralSonucu[] = []
  const deg = o.tip === 'kb' ? `${Math.round(o.deger)}/${Math.round(o.deger2 ?? 0)} mmHg` : `${fmt(o.deger, t.ondalik)} ${t.birim}`
  const ekle = (kural: string, duzey: UyariDuzeyi, hasta: string, hekim: string) =>
    out.push({ kural, anahtar: `${kural}:${m}`, duzey, metrik: m, hastaMetni: hasta, hekimMetni: hekim, veri: { deger: o.deger, deger2: o.deger2, olcumAt: o.olcumAt, olcumId: o.id } })

  // Fever under 3 months of age is urgent whatever the threshold settings say.
  if (o.tip === 'ates' && b.yasAy != null && b.yasAy < 3 && o.deger >= 38) {
    ekle('ates_bebek', 'acil', `Bebeğinizin ateşi ${deg}. 3 aydan küçük bebeklerde ateş hemen değerlendirilmelidir: doktorunuzu arayın ya da en yakın acil servise başvurun. ${ACIL_METNI}`, `3 aydan küçük hastada ateş ${deg}.`)
    return out
  }
  if (!e) return out
  const v = o.deger, v2 = o.deger2

  const ust = (esik?: number, esik2?: number) => (esik != null && v >= esik) || (esik2 != null && v2 != null && v2 >= esik2)
  const alt = (esik?: number) => esik != null && v < esik

  if (ust(e.acilUst, e.acilUst2)) {
    ekle('cok_yuksek', 'acil', `${t.ad} değeriniz çok yüksek (${deg}). 5 dakika oturup dinlenin ve yeniden ölçün. Doktorunuza da bildirdik. ${ACIL_METNI}`, `${t.ad} ${deg} — acil eşiğin üstünde.`)
  } else if (alt(e.acilAlt)) {
    const hasta = o.tip === 'glukoz'
      ? `Kan şekeriniz çok düşük (${deg}). Doktorunuzun size verdiği düşük şeker planını hemen uygulayın. Doktorunuza da bildirdik. ${ACIL_METNI}`
      : `${t.ad} değeriniz çok düşük (${deg}). Doktorunuza da bildirdik. ${ACIL_METNI}`
    ekle('cok_dusuk', 'acil', hasta, `${t.ad} ${deg} — acil alt eşiğin altında.`)
  } else if (ust(e.bildirUst, e.bildirUst2)) {
    ekle('yuksek_bildir', 'hekime_bildir', `${t.ad} değeriniz yüksek (${deg}). Bu ölçümü doktorunuza ilettik. ${ILAC_UYARISI} Şikâyetiniz varsa Mesajlar'dan yazabilirsiniz; ağır bir belirtiniz varsa 112'yi arayın.`, `${t.ad} ${deg} — hekime bildir eşiğinin üstünde.`)
  } else if (alt(e.bildirAlt)) {
    ekle('dusuk_bildir', 'hekime_bildir', `${t.ad} değeriniz düşük (${deg}). Bu ölçümü doktorunuza ilettik. Halsizlik, baş dönmesi veya ağır bir belirtiniz varsa 112'yi arayın.`, `${t.ad} ${deg} — hekime bildir alt eşiğinin altında.`)
  } else if (ust(e.dikkatUst, e.dikkatUst2)) {
    ekle('yuksek_dikkat', 'dikkat', `${t.ad} değeriniz hedefinizin belirgin üstünde (${deg}). Biraz dinlenip yeniden ölçebilirsiniz; ölçmeye düzenli devam edin. Yüksek değerler sürerse doktorunuza haber verilecek.`, `${t.ad} ${deg} — dikkat eşiğinin üstünde.`)
  } else if (alt(e.dikkatAlt)) {
    const hasta = o.tip === 'glukoz'
      ? `Kan şekeriniz düşük (${deg}). Doktorunuzun size verdiği düşük şeker planını uygulayın ve 15 dakika sonra yeniden ölçün.`
      : `${t.ad} değeriniz hedefinizin altında (${deg}). Bir süre sonra yeniden ölçün; kendinizi kötü hissederseniz doktorunuza haber verin.`
    ekle('dusuk_dikkat', 'dikkat', hasta, `${t.ad} ${deg} — dikkat alt eşiğinin altında.`)
  } else if (o.tip === 'ates' && o.deger >= 38) {
    ekle('ates_var', 'bilgi', `Ateş ${deg}. Doktorunuzun önerdiği şekilde takip edin ve birkaç saat sonra yeniden ölçün.`, `Ateş ${deg}.`)
  }
  return out
}

export interface Pencere {
  /** Average over the last 7 days (today included). */
  hafta: { ort: number | null; ort2: number | null; n: number }
  /** Average over the 21 days before that. */
  onceki: { ort: number | null; ort2: number | null; n: number }
  /** Daily averages for the last `gunSayisi` days, oldest first (null = no reading that day). */
  gunluk: Array<{ gun: string; ort: number | null; ort2: number | null; n: number }>
}

/** Rolling windows for one metric key (e.g. 'glukoz:tokluk2'). */
export function pencere(olcumler: EvOlcum[], anahtar: string, simdi: Date | number | string, gunSayisi = 14): Pencere {
  const bugun = trGun(simdi)
  const hBas = gunEkle(bugun, -6), oBas = gunEkle(bugun, -27)
  const ilgili = olcumler.filter((o) => metrikAnahtari(o) === anahtar)
  const topla = (bas: string, bit: string) => {
    const s = ilgili.filter((o) => { const g = trGun(o.olcumAt); return g >= bas && g <= bit })
    const ort = s.length ? s.reduce((a, o) => a + o.deger, 0) / s.length : null
    const d2 = s.filter((o) => o.deger2 != null)
    const ort2 = d2.length ? d2.reduce((a, o) => a + (o.deger2 as number), 0) / d2.length : null
    return { ort, ort2, n: s.length }
  }
  const gunluk = []
  for (let i = gunSayisi - 1; i >= 0; i--) { const g = gunEkle(bugun, -i); gunluk.push({ gun: g, ...topla(g, g) }) }
  return { hafta: topla(hBas, bugun), onceki: topla(oBas, gunEkle(hBas, -1)), gunluk }
}

/** Trend rules (Eğilim Bekçisi) across all metric keys present in the readings. */
export function egilimKurallari(olcumler: EvOlcum[], esikler: Record<string, EsikSeti>, simdi: Date | number | string, b: KuralBaglami): KuralSonucu[] {
  const out: KuralSonucu[] = []
  const anahtarlar = [...new Set(olcumler.map((o) => metrikAnahtari(o)))]
  for (const m of anahtarlar) {
    const e = esikler[m]
    if (!e || e.trendDelta == null) continue
    const p = pencere(olcumler, m, simdi, 7)
    if (p.hafta.n < 4 || p.onceki.n < 4 || p.hafta.ort == null || p.onceki.ort == null) continue
    const artis = p.hafta.ort - p.onceki.ort
    const taban = e.trendTaban ?? e.hedefMax ?? Infinity
    const ad = metrikEtiketi(m)
    const birim = OLCUM_TANIMLARI[m.split(':')[0] as keyof typeof OLCUM_TANIMLARI].birim
    const metin = m === 'kb' ? `${fmt(p.hafta.ort)}/${fmt(p.hafta.ort2 ?? 0)}` : fmt(p.hafta.ort)
    const once = m === 'kb' ? `${fmt(p.onceki.ort)}/${fmt(p.onceki.ort2 ?? 0)}` : fmt(p.onceki.ort)
    if (artis >= e.trendDelta && p.hafta.ort >= taban) {
      out.push({
        kural: 'egilim_artis', anahtar: `egilim:${m}`, duzey: 'hekime_bildir', metrik: m,
        hastaMetni: `Son 7 günde ${ad.toLocaleLowerCase('tr-TR')} ortalamanız ${metin} ${birim}; önceki haftalarda ${once} ${birim} idi. Bu değişikliği doktorunuza ilettik. ${ILAC_UYARISI} Ölçmeye düzenli devam edin; sorunuz varsa Mesajlar'dan yazabilirsiniz.`,
        hekimMetni: `${ad}: 7 günlük ortalama ${metin} ${birim} (n=${p.hafta.n}), önceki 3 hafta ${once} ${birim} (n=${p.onceki.n}) — +${fmt(artis)} ${birim}.`,
        veri: { hafta: p.hafta, onceki: p.onceki },
      })
    } else if (m === 'kb' && p.hafta.n >= 6 && (p.hafta.ort >= (e.trendTaban ?? 135) || (p.hafta.ort2 ?? 0) >= (e.hedefMax2 ?? 80) + 5)) {
      out.push({
        kural: 'haftalik_yuksek', anahtar: `haftalik:${m}`, duzey: 'dikkat', metrik: m,
        hastaMetni: `Bu hafta tansiyon ortalamanız (${metin} mmHg) hedefinizin üstünde. Sabah ve akşam ölçmeye devam edin; doktorunuz kontrolde bu ölçümlere bakacak.`,
        hekimMetni: `Tansiyon 7 günlük ortalama ${metin} mmHg (n=${p.hafta.n}) — hedef üstü.`,
        veri: { hafta: p.hafta },
      })
    }
  }

  // Weight: +2 kg within 3 days (heart-failure self-care rule). Doctor-notify only where the branş / doctor asks.
  const kilolar = olcumler.filter((o) => o.tip === 'kilo').sort((a, c) => a.olcumAt.localeCompare(c.olcumAt))
  const son = kilolar[kilolar.length - 1]
  if (son && Date.parse(son.olcumAt) > new Date(simdi).getTime() - GUN_MS) {
    const bas = Date.parse(son.olcumAt) - 3 * GUN_MS
    const onceki = kilolar.filter((o) => o !== son && Date.parse(o.olcumAt) >= bas)
    const enAz = onceki.length ? Math.min(...onceki.map((o) => o.deger)) : null
    if (enAz != null && son.deger - enAz >= 2) {
      out.push({
        kural: 'kilo_artis', anahtar: 'kilo_artis:kilo', duzey: b.kiloHekimeBildir ? 'hekime_bildir' : 'dikkat', metrik: 'kilo',
        hastaMetni: `Son 3 günde kilonuz ${fmt(son.deger - enAz, 1)} kg arttı.${b.kiloHekimeBildir ? ' Bunu doktorunuza ilettik.' : ''} Ayak bileklerinizde şişlik veya nefes darlığı varsa doktorunuza haber verin; ağır nefes darlığında 112'yi arayın.`,
        hekimMetni: `Kilo 3 günde +${fmt(son.deger - enAz, 1)} kg (${fmt(enAz, 1)} → ${fmt(son.deger, 1)}).`,
        veri: { once: enAz, son: son.deger },
      })
    }
  }

  // Fever on 3 consecutive days.
  const bugun = trGun(simdi)
  const atesGunleri = new Set(olcumler.filter((o) => o.tip === 'ates' && o.deger >= 38).map((o) => trGun(o.olcumAt)))
  if ([0, 1, 2].every((i) => atesGunleri.has(gunEkle(bugun, -i)))) {
    out.push({ kural: 'ates_3gun', anahtar: 'ates_3gun:ates', duzey: 'hekime_bildir', metrik: 'ates', hastaMetni: '3 gündür ateş ölçüyorsunuz. Bunu doktorunuza ilettik; doktorunuz sizi değerlendirmek isteyebilir.', hekimMetni: '3 ardışık günde ≥38 °C ateş.', veri: {} })
  }

  // Repeated low glucose: two readings < 70 within 7 days → doctor.
  const dusukler = olcumler.filter((o) => o.tip === 'glukoz' && o.deger < 70 && trGun(o.olcumAt) >= gunEkle(bugun, -6))
  if (dusukler.length >= 2) {
    out.push({ kural: 'tekrar_dusuk_seker', anahtar: 'tekrar_dusuk:glukoz', duzey: 'hekime_bildir', metrik: 'glukoz', hastaMetni: `Son 7 günde ${dusukler.length} kez düşük şeker ölçtünüz. Bunu doktorunuza ilettik. ${ILAC_UYARISI}`, hekimMetni: `Son 7 günde ${dusukler.length} kez glukoz <70 mg/dL (en düşük ${Math.min(...dusukler.map((d) => d.deger))}).`, veri: { n: dusukler.length } })
  }
  return out
}

export const SOGUMA_SAAT: Record<UyariDuzeyi, number> = { acil: 6, hekime_bildir: 72, dikkat: 48, bilgi: 24 }

/** Drop candidates whose key fired recently at the same or a higher level; keep one candidate per key (the highest). */
export function gurultuSuz(adaylar: KuralSonucu[], oncekiler: Array<{ anahtar: string; duzey: UyariDuzeyi; olusturmaAt: string }>, simdi: Date | number | string): KuralSonucu[] {
  const t = new Date(simdi).getTime()
  const enYuksek = new Map<string, KuralSonucu>()
  for (const a of adaylar) {
    const v = enYuksek.get(a.anahtar)
    if (!v || DUZEY_SIRASI[a.duzey] > DUZEY_SIRASI[v.duzey]) enYuksek.set(a.anahtar, a)
  }
  return [...enYuksek.values()].filter((a) => {
    const yakin = oncekiler.filter((o) => o.anahtar === a.anahtar && t - Date.parse(o.olusturmaAt) < SOGUMA_SAAT[o.duzey] * 3600_000)
    return yakin.every((o) => DUZEY_SIRASI[a.duzey] > DUZEY_SIRASI[o.duzey])
  })
}

/** Does this level reach the doctor? */
export function hekimeGiderMi(d: UyariDuzeyi): boolean {
  return d === 'hekime_bildir' || d === 'acil'
}
