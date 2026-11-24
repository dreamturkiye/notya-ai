'use client'

/**
 * ESNEK-GELISIM (Kaan, 2026-11-24) — the founder's El Notu quality dashboard (/kurucu/el-notu). English (Kaan's rule:
 * everything outside the Notya product copy is English). The founder console's look (shared cream / pine tokens and fonts,
 * lib/doktor/chromeTheme.ts). Numbers only — no patient text or identity is in anything it receives
 * (GET /api/kurucu/el-notu-kalite). One write: the branş lexicon proposal decision.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { kurucuVerisiniAl } from '@/lib/kurucu/oturumBekle'
import { doktorFetch } from '@/lib/doktor/oturumFetch'
import { CHROME_FONT, CHROME_FONT_HREF, CHROME_RENK as R } from '@/lib/doktor/chromeTheme'
import type { ElNotuKaliteVerisi } from '@/lib/kurucu/elNotuKalite'
import type { Metrik } from '@/lib/kurucu/elNotuKaliteHesap'

type Durum = { tur: 'yukleniyor' } | { tur: 'yok' } | { tur: 'hata' } | { tur: 'tamam'; veri: ElNotuKaliteVerisi }

const GOSTERILEN_HAFTA = 8
const hucre: React.CSSProperties = { padding: '7px 9px', borderBottom: `1px solid ${R.borderSoft}`, whiteSpace: 'nowrap', textAlign: 'right', fontSize: 13, fontVariantNumeric: 'tabular-nums' }
const solHucre: React.CSSProperties = { ...hucre, textAlign: 'left' }
const kutu: React.CSSProperties = { background: R.paper, border: `1px solid ${R.border}`, borderRadius: 14 }
const baslik = (t: string) => <h2 style={{ fontFamily: CHROME_FONT.serif, fontSize: 22, color: R.ink, margin: '28px 0 10px' }}>{t}</h2>
const haftaEtiketi = (h: string) => new Date(`${h}T00:00:00Z`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })
const sayi = (n: number | null | undefined, ek = '') => (n === null || n === undefined ? '—' : `${n}${ek}`)

/** The five measures Kaan asked for; lower is better for questions and corrections. */
const OLCULER: { ad: string; deger: (m: Metrik) => string; not: string }[] = [
  { ad: 'Doğrula questions / page', deger: (m) => sayi(m.dogrulaSayfaBasina), not: 'lower is better' },
  { ad: 'Corrections / approved note', deger: (m) => sayi(m.duzeltmeNotBasina), not: 'fields changed at approval; lower is better' },
  { ad: 'Auto-accepted words', deger: (m) => sayi(m.otomatikKabulYuzde, '%'), not: 'read without a question' },
  { ad: 'Shadow-mode match', deger: (m) => sayi(m.golgeEslesmeYuzde, '%'), not: 'same clinical content as the secretary' },
  { ad: 'Time saved (min)', deger: (m) => sayi(m.kazancDk), not: 'only doctors with an honest baseline' },
  { ad: 'Pages read', deger: (m) => String(m.sayfa), not: '' },
  { ad: 'Approved El Notu notes', deger: (m) => String(m.onayliNot), not: '' },
]

function OlcuTablosu({ haftalar, metrikler }: { haftalar: string[]; metrikler: Metrik[] }) {
  const son = haftalar.slice(-GOSTERILEN_HAFTA)
  const mm = metrikler.slice(-GOSTERILEN_HAFTA)
  return (
    <div style={{ ...kutu, overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead><tr><th style={{ ...solHucre, color: R.muted }}>Week of</th>{son.map((h) => <th key={h} style={{ ...hucre, color: R.muted, fontWeight: 600 }}>{haftaEtiketi(h)}</th>)}</tr></thead>
        <tbody>
          {OLCULER.map((o) => (
            <tr key={o.ad}>
              <td style={solHucre} title={o.not}>{o.ad}</td>
              {mm.map((m) => <td key={m.hafta} style={hucre}>{o.deger(m)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RegresyonBolumu({ v }: { v: ElNotuKaliteVerisi }) {
  const r = v.regresyon
  return (
    <section>
      {baslik('Regression set (weekly re-read on the production reader)')}
      <p style={{ color: R.muted, fontSize: 13, margin: '0 0 10px' }}>
        {r.set.hazir} consented pages from {r.set.doktor} doctor{r.set.doktor === 1 ? '' : 's'} ({Object.entries(r.set.brans).map(([b, n]) => `${b}: ${n}`).join(', ') || 'none yet'}) · {r.set.bekliyor} waiting for the doctor's approval · {v.onayliDoktor} doctor{v.onayliDoktor === 1 ? '' : 's'} consented.
      </p>
      {!r.haftalar.length ? <p style={{ color: R.muted, fontSize: 14 }}>No weekly run yet.</p> : (
        <div style={{ ...kutu, overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead><tr>{['Week of', 'Pages', 'Facts', 'After Doğrula', 'Accepted without a question', 'Questions / page', 'Invented words', 'Errors', 'Reader build'].map((b, i) => <th key={b} style={{ ...(i ? hucre : solHucre), color: R.muted }}>{b}</th>)}</tr></thead>
            <tbody>
              {r.haftalar.slice(-GOSTERILEN_HAFTA).map((h) => (
                <tr key={h.hafta}>
                  <td style={solHucre}>{haftaEtiketi(h.hafta)}</td><td style={hucre}>{h.sayfa}</td><td style={hucre}>{h.toplam.gercek}</td>
                  <td style={hucre}>{h.sayfa ? `${h.toplam.dogrulaIleYuzde}%` : '—'}</td><td style={hucre}>{h.sayfa ? `${h.toplam.kesinYuzde}%` : '—'}</td>
                  <td style={hucre}>{h.sayfa ? h.toplam.dogrulaSayfaBasina : '—'}</td><td style={{ ...hucre, color: h.toplam.uydurma ? R.warn : R.ink }}>{h.toplam.uydurma}</td>
                  <td style={hucre}>{h.hata}</td><td style={hucre}>{h.surumler.join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function OneriBolumu({ v, karar }: { v: ElNotuKaliteVerisi; karar: (id: string, k: 'onayli' | 'reddedildi' | 'oneri') => Promise<string | null> }) {
  const [mesaj, setMesaj] = useState<Record<string, string>>({})
  const dugme = (renk: string): React.CSSProperties => ({ border: `1px solid ${renk}`, color: renk, background: 'transparent', borderRadius: 999, padding: '4px 12px', fontSize: 13, cursor: 'pointer', marginLeft: 6 })
  const durumAdi = { oneri: 'Proposed', onayli: 'Approved', reddedildi: 'Rejected' } as const
  return (
    <section>
      {baslik('Branş lexicon proposals')}
      <p style={{ color: R.muted, fontSize: 13, margin: '0 0 10px' }}>An abbreviation confirmed independently by 3 or more doctors of the same branş. Approved pairs are used for every doctor of that branş; a doctor's own lexicon still wins. Sides, doses, numbers, allergies, negation and identity are never proposed.</p>
      {!v.oneriler.length ? <p style={{ color: R.muted, fontSize: 14 }}>No proposals yet.</p> : (
        <div style={{ ...kutu, overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead><tr>{['Branş', 'Abbreviation', 'Meaning', 'Doctors', 'Status', ''].map((b, i) => <th key={i} style={{ ...(i === 3 ? hucre : solHucre), color: R.muted }}>{b}</th>)}</tr></thead>
            <tbody>
              {v.oneriler.map((o) => (
                <tr key={o.id}>
                  <td style={solHucre}>{o.bransEtiketi}</td><td style={{ ...solHucre, fontWeight: 600 }}>{o.kisaltma}</td><td style={solHucre}>{o.anlam}</td>
                  <td style={hucre}>{o.doktorSayisi}</td><td style={solHucre}>{durumAdi[o.durum]}</td>
                  <td style={solHucre}>
                    {o.durum !== 'onayli' && <button type="button" style={dugme(R.pine)} onClick={async () => setMesaj({ ...mesaj, [o.id]: (await karar(o.id, 'onayli')) || '' })}>Approve</button>}
                    {o.durum !== 'reddedildi' && <button type="button" style={dugme(R.warn)} onClick={async () => setMesaj({ ...mesaj, [o.id]: (await karar(o.id, 'reddedildi')) || '' })}>Reject</button>}
                    {mesaj[o.id] && <span style={{ color: R.warn, fontSize: 12, marginLeft: 8 }}>{mesaj[o.id]}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function KaliteGorunumu({ v, karar }: { v: ElNotuKaliteVerisi; karar: (id: string, k: 'onayli' | 'reddedildi' | 'oneri') => Promise<string | null> }) {
  return (
    <div>
      <section>
        {baslik('All doctors')}
        <OlcuTablosu haftalar={v.haftalar} metrikler={v.toplam} />
      </section>
      <RegresyonBolumu v={v} />
      <OneriBolumu v={v} karar={karar} />
      {baslik('By branş')}
      {v.branslar.length ? v.branslar.map((b) => (
        <section key={b.brans} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, margin: '0 0 6px' }}>{b.bransEtiketi} <span style={{ color: R.muted, fontWeight: 400 }}>· {b.doktorSayisi} doctor{b.doktorSayisi === 1 ? '' : 's'}</span></div>
          <OlcuTablosu haftalar={v.haftalar} metrikler={b.metrikler} />
        </section>
      )) : <p style={{ color: R.muted, fontSize: 14 }}>No El Notu activity yet.</p>}
      {baslik('By doctor')}
      {v.doktorlar.map((d) => (
        <section key={d.anahtar} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, margin: '0 0 6px' }}>{d.ad} <span style={{ color: R.muted, fontWeight: 400 }}>· {d.bransEtiketi}</span></div>
          <OlcuTablosu haftalar={v.haftalar} metrikler={d.metrikler} />
        </section>
      ))}
      <p style={{ marginTop: 28, fontSize: 12, color: R.muted }}>
        Weeks start on Monday (Türkiye time). Counts only; no patient text or identity is shown. Founder and test accounts are not counted ({v.haricHesap}). Generated {new Date(v.uretildi).toLocaleString('en-GB')}.
      </p>
    </div>
  )
}

export default function ElNotuKalitePaneli() {
  const [d, setD] = useState<Durum>({ tur: 'yukleniyor' })
  const yukle = useCallback(async (iptalMi: () => boolean = () => false) => {
    const sonuc = await kurucuVerisiniAl<ElNotuKaliteVerisi>({
      tokenAl: (o) => ensureDoctorAccessToken(o),
      getir: () => doktorFetch('/api/kurucu/el-notu-kalite', { cache: 'no-store' }),
      iptalMi,
    })
    if (!iptalMi()) setD(sonuc)
  }, [])
  useEffect(() => { let iptal = false; void yukle(() => iptal); return () => { iptal = true } }, [yukle])

  const karar = useCallback(async (id: string, k: 'onayli' | 'reddedildi' | 'oneri'): Promise<string | null> => {
    const r = await doktorFetch('/api/kurucu/el-notu-kalite', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, karar: k }) }).catch(() => null)
    if (!r) return 'Not saved.'
    if (!r.ok) { const j = (await r.json().catch(() => ({}))) as { error?: string }; return j.error || 'Not saved.' }
    await yukle()
    return null
  }, [yukle])

  if (d.tur === 'yok') notFound()
  return (
    <div style={{ minHeight: '100dvh', background: R.cream, color: R.ink, fontFamily: CHROME_FONT.sans, padding: 'calc(24px + env(safe-area-inset-top, 0px)) 16px 40px', boxSizing: 'border-box' }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <a href="/kurucu" style={{ color: R.muted, fontSize: 13, textDecoration: 'none' }}>← Founder console</a>
        <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 30, color: R.pine, margin: '6px 0 4px' }}>El Notu quality</div>
        <p style={{ color: R.muted, fontSize: 14, margin: 0 }}>Is the handwriting reader getting better as more doctors use it? Weekly trend per doctor and per branş.</p>
        {d.tur === 'yukleniyor' ? <p style={{ color: R.muted }}>Loading…</p>
          : d.tur === 'hata' ? <p style={{ color: R.warn }}>Could not load. Try again in a moment.</p>
          : <KaliteGorunumu v={d.veri} karar={karar} />}
      </div>
    </div>
  )
}
