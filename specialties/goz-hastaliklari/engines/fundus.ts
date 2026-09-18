/**
 * GOZ-FUNDUS — Türk poliklinik göz dibi kaydı (hekim girişi).
 * Sıra (TR pratik / direkt oftalmoskopi eğitimi): dilatasyon → ortam →
 * optik disk (3C: renk, kenar, C/D) → damarlar → makula → perifer.
 * OD ve OS ayrı. Tanı/DR evresi burada üretilmez — hekim DR kartında kilitler.
 * Fotoğraf AI (Belge › Asistana raporla) ayrı kanal; bu motor metin üretir.
 */
export type FundusGozBulgu = {
  disk?: string | null
  cd?: string | null
  damar?: string | null
  makula?: string | null
  perifer?: string | null
  not?: string | null
}

export type FundusKayit = {
  tarih: string
  dilate: boolean | null
  ortam?: string | null
  sag: FundusGozBulgu
  sol: FundusGozBulgu
}

const temiz = (s: string | null | undefined) => String(s || '').trim().slice(0, 240) || null

/** Hekim "her iki göz normal" kısayolu — poliklinikte en sık satır. */
export function normalFundusGoz(): FundusGozBulgu {
  return {
    disk: 'pembe, kenar net',
    cd: 'fizyolojik',
    damar: 'A/V kalibre normal, AV çaprazlaşma yok',
    makula: 'foveal refle doğal, kanama/eksuda yok',
    perifer: 'görünen alanda patoloji yok',
    not: null,
  }
}

export function fundusNormalize(g: Partial<FundusKayit> & { tarih?: string }): FundusKayit {
  const goz = (x: FundusGozBulgu | undefined): FundusGozBulgu => ({
    disk: temiz(x?.disk),
    cd: temiz(x?.cd),
    damar: temiz(x?.damar),
    makula: temiz(x?.makula),
    perifer: temiz(x?.perifer),
    not: temiz(x?.not),
  })
  return {
    tarih: /^\d{4}-\d{2}-\d{2}$/.test(String(g.tarih || '')) ? String(g.tarih) : new Date().toISOString().slice(0, 10),
    dilate: g.dilate === true ? true : g.dilate === false ? false : null,
    ortam: temiz(g.ortam),
    sag: goz(g.sag),
    sol: goz(g.sol),
  }
}

function gozDolu(g: FundusGozBulgu): boolean {
  return !!(g.disk || g.cd || g.damar || g.makula || g.perifer || g.not)
}

/** SOAP / epikriz Objectif satırı — Türk hekim dikte stili. */
export function fundusMetni(k: FundusKayit): string {
  const n = fundusNormalize(k)
  const dil = n.dilate === true ? 'dilate' : n.dilate === false ? 'dilate değil' : 'dilatasyon belirtilmedi'
  const ortam = n.ortam ? `; ortam: ${n.ortam}` : ''
  const taraf = (ad: string, g: FundusGozBulgu) => {
    if (!gozDolu(g)) return `${ad}: kaydedilmedi`
    const parca = [
      g.disk || g.cd ? `disk ${[g.disk, g.cd ? `C/D ${g.cd}` : null].filter(Boolean).join(', ')}` : null,
      g.damar ? `damarlar ${g.damar}` : null,
      g.makula ? `makula ${g.makula}` : null,
      g.perifer ? `perifer ${g.perifer}` : null,
      g.not || null,
    ].filter(Boolean)
    return `${ad}: ${parca.join('; ') || '—'}`
  }
  return `Göz dibi (${dil}${ortam}) — ${taraf('OD', n.sag)}; ${taraf('OS', n.sol)}.`
}

export function fundusBosMu(k: FundusKayit): boolean {
  const n = fundusNormalize(k)
  return !gozDolu(n.sag) && !gozDolu(n.sol) && n.dilate == null && !n.ortam
}
