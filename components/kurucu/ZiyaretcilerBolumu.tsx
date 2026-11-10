'use client'

/**
 * ZIYARET-SAYACI-01 (Kaan, 2026-11-10) — the founder console's "Ziyaretçiler" section: public-site visitors per build
 * (TR, AU, UZ, GB, CA, NZ, US) and in total. Loaded lazily by KurucuKonsolu (next/dynamic), so none of it is in any
 * public page's bundle. Charts are inline SVG (no chart library in the repo; none added). English text (founder tool);
 * the console's own cream/pine look (lib/doktor/chromeTheme.ts) — the console has no separate dark theme.
 *
 * Every number comes from the counter (SQL aggregates, migration 194) or the console's own account rows; all maths is
 * in lib/ziyaret/grafik.ts (tested): nothing before the first counted day, no extrapolation, "not enough data yet"
 * until two complete periods exist.
 */
import React, { useMemo, useState } from 'react'
import { CHROME_FONT, CHROME_RENK as R } from '@/lib/doktor/chromeTheme'
import type { KonsolUlkesi } from '@/lib/kurucu/konsol'
import type { ZiyaretOzeti } from '@/lib/ziyaret/tipler'
import {
  aralikBasi, donemKiyas, gunEkle, haftaKiyas, hareketliOrtalama, huni, kayitGunluguBirlestir, kumulatif, ozetKutulari,
  seriDoldur, toplamOzet, type Aralik, type KayitGunu, type Kiyas,
} from '@/lib/ziyaret/grafik'

/** One colour per market, used everywhere in this section. */
export const ULKE_RENK: Record<string, string> = {
  tr: '#b5523b', au: '#2d6e8e', uz: '#3c8a5f', gb: '#6a4c93', ca: '#c48a1c', nz: '#1f8a8a', us: '#8a3b6b', toplam: R.pine,
}
const SIRA = ['tr', 'au', 'uz', 'gb', 'ca', 'nz', 'us'] as const
const ARTI = '#3c7a4a'
const EKSI = '#a45b3e'

type Pazar = { kod: string; ad: string; ozet: ZiyaretOzeti | null; kayitlar: KayitGunu[]; denemeVar: boolean; erisilemez: string | null }

const sayiYaz = (n: number) => n.toLocaleString('en-GB')
const yuzdeYaz = (n: number | null) => (n == null ? '—' : `${n.toFixed(1)}%`)
const buyumeYaz = (n: number | null) => (n == null ? '—' : `${n > 0 ? '+' : ''}${n.toFixed(1)}%`)
const tarihYaz = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
const kisaTarih = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })

const kart: React.CSSProperties = { background: R.paper, border: `1px solid ${R.border}`, borderRadius: 14, padding: '14px 16px' }
const altBaslik: React.CSSProperties = { fontSize: 13, color: R.muted, margin: '0 0 8px', fontWeight: 600 }

// ───────────── charts (inline SVG) ─────────────

type Seri = { ad: string; degerler: (number | null)[]; renk: string; tur: 'alan' | 'cizgi' | 'kesik' }

export function CizgiGrafik({ gunler, seriler, yukseklik = 220, yEtiketi, ust }: { gunler: string[]; seriler: Seri[]; yukseklik?: number; yEtiketi: string; ust?: number }) {
  const [imlec, setImlec] = useState<number | null>(null)
  const G = 640
  const sol = 44, sag = 10, ustB = 10, alt = 26
  const ic = G - sol - sag
  const yic = yukseklik - ustB - alt
  const enBuyuk = Math.max(1, ust ?? 0, ...seriler.flatMap((s) => s.degerler.filter((v): v is number => v != null)))
  const n = gunler.length
  const x = (i: number) => sol + (n <= 1 ? ic / 2 : (i / (n - 1)) * ic)
  const y = (v: number) => ustB + yic - (v / enBuyuk) * yic
  const yol = (d: (number | null)[]) => {
    let s = ''
    let acik = false
    d.forEach((v, i) => {
      if (v == null) { acik = false; return }
      s += `${acik ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`
      acik = true
    })
    return s
  }
  const isaretler = [0, Math.round(enBuyuk / 2), enBuyuk]
  const hareket = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const gx = ((e.clientX - r.left) / r.width) * G
    setImlec(n <= 1 ? 0 : Math.max(0, Math.min(n - 1, Math.round(((gx - sol) / ic) * (n - 1)))))
  }
  if (!n) return null
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${G} ${yukseklik}`} width="100%" role="img" aria-label={yEtiketi} onMouseMove={hareket} onMouseLeave={() => setImlec(null)} style={{ display: 'block', touchAction: 'pan-y' }}>
        {isaretler.map((t, i) => (
          <g key={i}>
            <line x1={sol} x2={G - sag} y1={y(t)} y2={y(t)} stroke={R.border} />
            <text x={sol - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill={R.muted}>{sayiYaz(t)}</text>
          </g>
        ))}
        <text x={12} y={ustB + yic / 2} fontSize="11" fill={R.muted} transform={`rotate(-90 12 ${ustB + yic / 2})`} textAnchor="middle">{yEtiketi}</text>
        {[0, Math.floor((n - 1) / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i).map((i) => (
          <text key={i} x={x(i)} y={yukseklik - 8} fontSize="11" fill={R.muted} textAnchor={i === 0 && n > 1 ? 'start' : i === n - 1 && n > 1 ? 'end' : 'middle'}>{kisaTarih(gunler[i])}</text>
        ))}
        {seriler.map((s) => s.tur === 'alan' && n > 1 ? (
          <path key={`a-${s.ad}`} d={`${yol(s.degerler)}L${x(n - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`} fill={s.renk} opacity={0.14} />
        ) : null)}
        {seriler.map((s) => (
          <path key={`c-${s.ad}`} d={yol(s.degerler)} fill="none" stroke={s.renk} strokeWidth={s.tur === 'kesik' ? 1.6 : 2} strokeDasharray={s.tur === 'kesik' ? '5 4' : undefined} />
        ))}
        {n === 1 && seriler.map((s) => s.degerler[0] != null ? <circle key={`n-${s.ad}`} cx={x(0)} cy={y(s.degerler[0] as number)} r={3.5} fill={s.renk} /> : null)}
        {imlec != null && <line x1={x(imlec)} x2={x(imlec)} y1={ustB} y2={ustB + yic} stroke={R.muted} strokeDasharray="2 3" />}
      </svg>
      {imlec != null && (
        <div style={{ position: 'absolute', top: 4, left: `${Math.min(70, (x(imlec) / G) * 100)}%`, background: R.paper, border: `1px solid ${R.border}`, borderRadius: 8, padding: '6px 8px', fontSize: 12, pointerEvents: 'none', boxShadow: '0 2px 8px rgba(58,44,34,0.08)' }}>
          <div style={{ fontWeight: 600 }}>{tarihYaz(gunler[imlec])}</div>
          {seriler.map((s) => (
            <div key={s.ad} style={{ color: s.renk }}>{s.ad}: {s.degerler[imlec] == null ? '—' : s.tur === 'kesik' ? (s.degerler[imlec] as number).toFixed(1) : sayiYaz(s.degerler[imlec] as number)}</div>
          ))}
        </div>
      )}
    </div>
  )
}

export function HaftaCubuklari({ haftalar, renk }: { haftalar: { w: string; bas: string; v: number }[]; renk: string }) {
  const [imlec, setImlec] = useState<number | null>(null)
  const G = 640, H = 180, sol = 44, alt = 26, ust = 10
  const enBuyuk = Math.max(1, ...haftalar.map((h) => h.v))
  const n = haftalar.length
  const gen = (G - sol - 10) / Math.max(n, 1)
  const yic = H - alt - ust
  if (!n) return null
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${G} ${H}`} width="100%" role="img" aria-label="Visitors per ISO week" style={{ display: 'block' }} onMouseLeave={() => setImlec(null)}>
        {[0, Math.round(enBuyuk / 2), enBuyuk].map((t, i) => (
          <g key={i}>
            <line x1={sol} x2={G - 10} y1={ust + yic - (t / enBuyuk) * yic} y2={ust + yic - (t / enBuyuk) * yic} stroke={R.border} />
            <text x={sol - 6} y={ust + yic - (t / enBuyuk) * yic + 4} textAnchor="end" fontSize="11" fill={R.muted}>{sayiYaz(t)}</text>
          </g>
        ))}
        {haftalar.map((h, i) => {
          const yuk = (h.v / enBuyuk) * yic
          return (
            <g key={h.w} onMouseEnter={() => setImlec(i)}>
              <rect x={sol + i * gen + gen * 0.15} y={ust + yic - yuk} width={gen * 0.7} height={Math.max(yuk, 0.5)} fill={renk} opacity={imlec === i ? 1 : 0.8} rx={3} />
              <rect x={sol + i * gen} y={ust} width={gen} height={yic} fill="transparent" />
              {(n <= 12 || i % Math.ceil(n / 12) === 0) && <text x={sol + i * gen + gen / 2} y={H - 8} fontSize="10" fill={R.muted} textAnchor="middle">{h.w.slice(5)}</text>}
            </g>
          )
        })}
      </svg>
      {imlec != null && (
        <div style={{ position: 'absolute', top: 4, left: `${Math.min(70, ((sol + imlec * gen) / G) * 100)}%`, background: R.paper, border: `1px solid ${R.border}`, borderRadius: 8, padding: '6px 8px', fontSize: 12, pointerEvents: 'none' }}>
          <div style={{ fontWeight: 600 }}>{haftalar[imlec].w} (from {tarihYaz(haftalar[imlec].bas)})</div>
          <div>{sayiYaz(haftalar[imlec].v)} visitors</div>
        </div>
      )}
    </div>
  )
}

export function Kivilcim({ degerler, renk }: { degerler: number[]; renk: string }) {
  const G = 64, H = 18
  if (degerler.length < 2) return <svg width={G} height={H} aria-hidden="true" />
  const m = Math.max(1, ...degerler)
  const d = degerler.map((v, i) => `${i ? 'L' : 'M'}${((i / (degerler.length - 1)) * G).toFixed(1)},${(H - 1 - (v / m) * (H - 2)).toFixed(1)}`).join('')
  return <svg width={G} height={H} aria-hidden="true" style={{ display: 'block' }}><path d={d} fill="none" stroke={renk} strokeWidth={1.5} /></svg>
}

// ───────────── pieces ─────────────

function KiyasKarti({ baslik, k, yuzdeMi = false }: { baslik: string; k: Kiyas; yuzdeMi?: boolean }) {
  return (
    <div style={kart}>
      <div style={{ fontSize: 12, color: R.muted }}>{baslik}</div>
      {k.durum === 'yetersiz' ? (
        <div style={{ fontSize: 14, color: R.muted, marginTop: 8 }}>Not enough data yet</div>
      ) : (() => {
        const yon = k.fark > 0 ? 'up' : k.fark < 0 ? 'down' : 'flat'
        const renk = yon === 'up' ? ARTI : yon === 'down' ? EKSI : R.muted
        const ok = yon === 'up' ? '▲' : yon === 'down' ? '▼' : '■'
        return (
          <>
            <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 26, color: renk, marginTop: 4 }} data-yon={yon}>
              {ok} {yuzdeMi ? buyumeYaz(k.yuzde) : `${k.fark > 0 ? '+' : ''}${sayiYaz(k.fark)}`}
            </div>
            <div style={{ fontSize: 12, color: R.muted, marginTop: 2 }}>
              {sayiYaz(k.bu)} vs {sayiYaz(k.onceki)}{!yuzdeMi && k.yuzde != null ? ` (${k.yuzde > 0 ? '+' : ''}${k.yuzde.toFixed(1)}%)` : ''}{yuzdeMi && k.yuzde == null ? ' (no visitors the week before)' : ''}
            </div>
          </>
        )
      })()}
    </div>
  )
}

function SiraTablosu({ baslik, satirlar, bos, sutun }: { baslik: string; satirlar: { ad: string; v: number; p: number }[]; bos: string; sutun: 'v' | 'p' }) {
  return (
    <div style={kart}>
      <div style={altBaslik}>{baslik}</div>
      {!satirlar.length ? <div style={{ fontSize: 13, color: R.muted }}>{bos}</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {satirlar.map((s) => (
              <tr key={s.ad}><td style={{ padding: '4px 0', borderBottom: `1px solid ${R.borderSoft}`, wordBreak: 'break-all' }}>{s.ad || '—'}</td><td style={{ padding: '4px 0', textAlign: 'right', borderBottom: `1px solid ${R.borderSoft}`, whiteSpace: 'nowrap' }}>{sayiYaz(s[sutun])}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

const dugme = (secili: boolean): React.CSSProperties => ({
  border: `1px solid ${secili ? R.pine : R.border}`, background: secili ? R.pine : R.paper, color: secili ? R.paper : R.ink,
  borderRadius: 10, padding: '6px 10px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
})

// ───────────── the section ─────────────

export function pazarlariKur(ulkeler: readonly KonsolUlkesi[]): Pazar[] {
  return SIRA.map((kod) => {
    const u = ulkeler.find((x) => x.ulke === kod)
    if (!u) return { kod, ad: kod.toUpperCase(), ozet: null, kayitlar: [], denemeVar: false, erisilemez: 'not reported' }
    if (u.durum !== 'tamam') return { kod, ad: u.ad, ozet: null, kayitlar: [], denemeVar: false, erisilemez: u.neden }
    return { kod, ad: u.ad, ozet: u.veri.ziyaret ?? null, kayitlar: u.kayitlar ?? [], denemeVar: u.veri.denemeVar === true, erisilemez: u.veri.ziyaret ? null : 'visit counter not reporting yet' }
  })
}

export default function ZiyaretcilerBolumu({ ulkeler }: { ulkeler: readonly KonsolUlkesi[] }) {
  const [secim, setSecim] = useState<string>('toplam')
  const [aralik, setAralik] = useState<Aralik>('30')
  const pazarlar = useMemo(() => pazarlariKur(ulkeler), [ulkeler])
  const toplam = useMemo<Pazar>(() => ({
    kod: 'toplam', ad: 'Total', ozet: toplamOzet(pazarlar.map((p) => p.ozet)), kayitlar: kayitGunluguBirlestir(pazarlar.filter((p) => p.ozet).map((p) => p.kayitlar)),
    denemeVar: pazarlar.some((p) => p.ozet && p.denemeVar), erisilemez: null,
  }), [pazarlar])
  const p = secim === 'toplam' ? toplam : pazarlar.find((x) => x.kod === secim) || toplam
  const o = p.ozet
  const renk = ULKE_RENK[p.kod] || R.pine
  const ilk = o?.ilkGun ?? null
  const kivilcim = (oz: ZiyaretOzeti | null) => (oz?.ilkGun ? seriDoldur(oz.gunluk, gunEkle(oz.bugun, -29) < oz.ilkGun ? oz.ilkGun : gunEkle(oz.bugun, -29), oz.bugun).map((g) => g.v) : [])

  const gorunum = useMemo(() => {
    if (!o || !ilk) return null
    const bas = aralikBasi(aralik, ilk, o.bugun)
    const gunler = seriDoldur(o.gunluk, bas, o.bugun)
    const tum = seriDoldur(o.gunluk, ilk, o.bugun)
    const ortTum = hareketliOrtalama(tum.map((g) => g.v), 7)
    const ort = ortTum.slice(tum.length - gunler.length)
    return { bas, gunler, tum, ort, kum: kumulatif(tum.map((g) => g.v)), huni: huni(o.gunluk, p.kayitlar, bas, o.bugun) }
  }, [o, ilk, aralik, p.kayitlar])
  const kutular = ozetKutulari(o)
  const enCok = useMemo(() => {
    if (secim !== 'toplam' || !gorunum) return 0
    return Math.max(1, ...pazarlar.flatMap((x) => (x.ozet?.ilkGun ? seriDoldur(x.ozet.gunluk, gorunum.bas, x.ozet.bugun).map((g) => g.v) : [])))
  }, [secim, gorunum, pazarlar])

  return (
    <section style={{ marginTop: 28 }} data-bolum="ziyaretciler">
      <h2 style={{ fontFamily: CHROME_FONT.serif, fontSize: 22, color: R.ink, margin: '0 0 6px' }}>Ziyaretçiler</h2>
      <p style={{ fontSize: 13, color: R.muted, margin: '0 0 12px' }}>Public-site visitors, counted by our own cookie-free counter (no IP stored, daily-rotating salt). Visitors = unique visitors per day; views = page views.</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }} role="tablist" aria-label="Market">
        {[...pazarlar, toplam].map((x) => (
          <button key={x.kod} type="button" role="tab" aria-selected={secim === x.kod} onClick={() => setSecim(x.kod)} style={{ ...dugme(secim === x.kod), display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: ULKE_RENK[x.kod] }} />
            <span>{x.ad}</span>
            <span style={{ background: R.paper, borderRadius: 4, padding: 1 }}><Kivilcim degerler={kivilcim(x.ozet)} renk={ULKE_RENK[x.kod]} /></span>
          </button>
        ))}
      </div>

      {p.erisilemez && !o ? (
        <p style={{ color: R.warn, fontSize: 14 }} data-durum="erisilemez">{p.ad}: unavailable ({p.erisilemez}).</p>
      ) : !ilk ? (
        <p style={{ color: R.muted, fontSize: 14 }} data-durum="bos">No visits counted yet{p.kod === 'toplam' ? '' : ` for ${p.ad}`}. Counting started with this release; there is no earlier history.</p>
      ) : (
        <>
          <p style={{ fontSize: 13, color: R.ink, margin: '0 0 12px' }} data-sayim-basi={ilk}>
            Counting since <strong>{tarihYaz(ilk)}</strong> (UTC days).{p.kod === 'toplam' ? ' Total = the sum of the markets; a person visiting two country sites counts once in each.' : ''}
            {p.kod === 'toplam' && pazarlar.some((x) => !x.ozet) ? ` Not included: ${pazarlar.filter((x) => !x.ozet).map((x) => x.ad).join(', ')}.` : ''}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            {([['Today', kutular.bugun], ['Yesterday', kutular.dun], ['Last 7 days', kutular.yedi], ['Last 30 days', kutular.otuz]] as const).map(([e, d]) => (
              <div key={e} style={kart}>
                <div style={{ fontSize: 12, color: R.muted }}>{e}</div>
                <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 28, color: R.pine, marginTop: 4 }}>{sayiYaz(d.v)}</div>
                <div style={{ fontSize: 12, color: R.muted }}>{sayiYaz(d.p)} views</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 10 }}>
            <KiyasKarti baslik="This week vs last week (last 7 complete days)" k={donemKiyas(o, 7)} />
            <KiyasKarti baslik="This month vs last month (last 30 complete days)" k={donemKiyas(o, 30)} />
            <KiyasKarti baslik="Week-over-week growth (last two complete ISO weeks)" k={haftaKiyas(o)} yuzdeMi />
          </div>

          {gorunum && (
            <>
              <div style={{ ...kart, marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                  <div style={altBaslik}>Daily unique visitors, with 7-day moving average</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['7', '30', '90', 'hepsi'] as Aralik[]).map((a) => (
                      <button key={a} type="button" onClick={() => setAralik(a)} style={dugme(aralik === a)} aria-pressed={aralik === a}>{a === 'hepsi' ? 'All time' : `${a}d`}</button>
                    ))}
                  </div>
                </div>
                <CizgiGrafik gunler={gorunum.gunler.map((g) => g.d)} yEtiketi="Visitors / day" seriler={[
                  { ad: 'Visitors', degerler: gorunum.gunler.map((g) => g.v), renk, tur: 'alan' },
                  { ad: '7-day average', degerler: gorunum.ort, renk: R.ink, tur: 'kesik' },
                ]} />
                {gorunum.gunler.length < 7 && <div style={{ fontSize: 12, color: R.muted }}>The 7-day average appears once seven days have been counted.</div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 10, marginTop: 10 }}>
                <div style={kart}>
                  <div style={altBaslik}>Visitors per ISO week</div>
                  <HaftaCubuklari haftalar={o!.haftalik} renk={renk} />
                  {o!.haftalik.length > 0 && haftaKiyas(o!).durum === 'yetersiz' && <div style={{ fontSize: 12, color: R.muted }}>The first and the current week are partial.</div>}
                </div>
                <div style={kart}>
                  <div style={altBaslik}>Cumulative visitors since counting started</div>
                  <CizgiGrafik gunler={gorunum.tum.map((g) => g.d)} yEtiketi="Total visitors" yukseklik={180} seriler={[{ ad: 'Cumulative', degerler: gorunum.kum, renk, tur: 'cizgi' }]} />
                  <div style={{ fontSize: 12, color: R.muted }}>Sum of daily unique visitors (someone returning on another day counts again).</div>
                </div>
              </div>

              <div style={{ ...kart, marginTop: 10 }} data-huni="1">
                <div style={altBaslik}>Funnel, {aralik === 'hepsi' ? 'all time' : `last ${aralik} days`} ({tarihYaz(gorunum.bas)} – {tarihYaz(o!.bugun)})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', fontSize: 14 }}>
                  <div><div style={{ fontFamily: CHROME_FONT.serif, fontSize: 24, color: R.pine }}>{sayiYaz(gorunum.huni.ziyaretci)}</div><div style={{ color: R.muted, fontSize: 12 }}>Visitors</div></div>
                  <div style={{ color: R.muted }}>→ {yuzdeYaz(gorunum.huni.kayitOrani)} →</div>
                  <div><div style={{ fontFamily: CHROME_FONT.serif, fontSize: 24, color: R.pine }}>{sayiYaz(gorunum.huni.kayit)}</div><div style={{ color: R.muted, fontSize: 12 }}>Signups</div></div>
                  <div style={{ color: R.muted }}>→ {p.denemeVar ? yuzdeYaz(gorunum.huni.denemeOrani) : '—'} →</div>
                  <div><div style={{ fontFamily: CHROME_FONT.serif, fontSize: 24, color: R.pine }}>{p.denemeVar ? sayiYaz(gorunum.huni.deneme) : '—'}</div><div style={{ color: R.muted, fontSize: 12 }}>Trials started</div></div>
                </div>
                <div style={{ fontSize: 12, color: R.muted, marginTop: 6 }}>
                  Signups are new doctor accounts on the counted days only (test accounts excluded).{p.denemeVar ? ' Trials = accounts with a trial clock or a paid plan.' : ' This market runs no trial model.'}
                  {p.kod === 'toplam' ? ' Total trials cover only markets with a trial model (TR, AU).' : ''}
                </div>
              </div>

              {secim === 'toplam' && (
                <div style={{ ...kart, marginTop: 10 }} data-ulke-kiyas="1">
                  <div style={altBaslik}>By market (same scale), {aralik === 'hepsi' ? 'all time' : `last ${aralik} days`}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                    {pazarlar.map((x) => (
                      <div key={x.kod}>
                        <div style={{ fontSize: 13, color: ULKE_RENK[x.kod], fontWeight: 600 }}>{x.ad}{x.ozet?.ilkGun ? ` · since ${kisaTarih(x.ozet.ilkGun)}` : ''}</div>
                        {x.ozet?.ilkGun ? (
                          <CizgiGrafik gunler={seriDoldur(x.ozet.gunluk, gorunum.bas < x.ozet.ilkGun ? x.ozet.ilkGun : gorunum.bas, x.ozet.bugun).map((g) => g.d)} yEtiketi="Visitors" yukseklik={120} ust={enCok}
                            seriler={[{ ad: x.ad, degerler: seriDoldur(x.ozet.gunluk, gorunum.bas < x.ozet.ilkGun ? x.ozet.ilkGun : gorunum.bas, x.ozet.bugun).map((g) => g.v), renk: ULKE_RENK[x.kod], tur: 'alan' }]} />
                        ) : <div style={{ fontSize: 12, color: R.muted, padding: '20px 0' }}>{x.erisilemez ? `Unavailable (${x.erisilemez})` : 'No visits counted yet'}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginTop: 10 }}>
            <SiraTablosu baslik="Top pages (views, last 30 days)" satirlar={o!.sayfalar} bos="No page views in the last 30 days." sutun="p" />
            <SiraTablosu baslik="Top referrers (visitors, last 30 days)" satirlar={o!.kaynaklar} bos="No external referrers yet (direct visits and internal links are not listed)." sutun="v" />
            <SiraTablosu baslik="Device (visitors, last 30 days)" satirlar={o!.cihazlar} bos="—" sutun="v" />
          </div>
        </>
      )}
    </section>
  )
}
