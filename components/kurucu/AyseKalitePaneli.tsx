'use client'

/**
 * AKKS — the founder's "Ayşe Kalite" dashboard (/kurucu/ayse-kalite). English chrome (Kaan's rule); clinical text stays in
 * Turkish as written. Same look as the founder console and the El Notu dashboard. Data: GET /api/kurucu/ayse-kalite
 * (founder allowlist, 404 otherwise). Internal quality standard — never a certification; scores are labelled
 * "kılavuz-altın-cevaba göre" (vs guideline gold answers) until blind Prof. comparisons exist.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { kurucuVerisiniAl } from '@/lib/kurucu/oturumBekle'
import { doktorFetch } from '@/lib/doktor/oturumFetch'
import { CHROME_FONT, CHROME_FONT_HREF, CHROME_RENK as R } from '@/lib/doktor/chromeTheme'
import type { AkksPanoVerisi } from '@/lib/akks/veri'

type Durum = { tur: 'yukleniyor' } | { tur: 'yok' } | { tur: 'hata' } | { tur: 'tamam'; veri: AkksPanoVerisi }
type Ozet = { n?: number; genelPuan?: number | null; kilavuzUyumu?: number | null; zararli?: number; atifDogrulugu?: number | null; bar?: { durum: string; nedenler: string[] } } | null

const OLCUT_ADI: Record<string, string> = { dogruluk: 'Correctness', kilavuz: 'Guideline', guvenlik: 'Safety', butunluk: 'Completeness', tr_uygunluk: 'TR fit', atif: 'Citation', aciklik: 'Clarity' }
const hucre: React.CSSProperties = { padding: '7px 9px', borderBottom: `1px solid ${R.borderSoft}`, whiteSpace: 'nowrap', textAlign: 'right', fontSize: 13, fontVariantNumeric: 'tabular-nums' }
const solHucre: React.CSSProperties = { ...hucre, textAlign: 'left' }
const kutu: React.CSSProperties = { background: R.paper, border: `1px solid ${R.border}`, borderRadius: 14 }
const dugme: React.CSSProperties = { border: `1px solid ${R.border}`, background: R.cream, color: R.ink, borderRadius: 8, padding: '4px 10px', fontSize: 13, cursor: 'pointer' }
const baslik = (t: string, alt?: string) => (
  <div style={{ margin: '28px 0 10px' }}>
    <h2 style={{ fontFamily: CHROME_FONT.serif, fontSize: 22, color: R.ink, margin: 0 }}>{t}</h2>
    {alt && <p style={{ color: R.muted, fontSize: 13, margin: '4px 0 0' }}>{alt}</p>}
  </div>
)
const yz = (x: number | null | undefined) => (x === null || x === undefined ? '—' : `${Math.round(x * 1000) / 10}%`)
const tarih = (s: string | null | undefined) => (s ? new Date(s).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')
const barRengi = (d?: string) => (d === 'gecti' ? R.pine : d === 'kaldi' ? R.warn : R.muted)
const barAdi = (d?: string) => (d === 'gecti' ? 'meets bar' : d === 'kaldi' ? 'below bar' : 'not enough items')

async function gonder(govde: Record<string, unknown>): Promise<{ hata: string | null; veri?: Record<string, unknown> }> {
  const r = await doktorFetch('/api/kurucu/ayse-kalite', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(govde) }).catch(() => null)
  if (!r) return { hata: 'Not saved.' }
  const j = (await r.json().catch(() => ({}))) as Record<string, unknown>
  return r.ok ? { hata: null, veri: j } : { hata: String(j.error || 'Not saved.') }
}

function BransTablosu({ v }: { v: AkksPanoVerisi }) {
  return (
    <div style={{ ...kutu, overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead><tr>{['Branş', 'Items', 'Clinician-approved', 'Last run', 'Answers', 'Overall', 'Guideline', 'Harmful', 'Citation acc.', 'Bar', 'Trend (overall)'].map((b, i) => <th key={b} style={{ ...(i ? hucre : solHucre), color: R.muted }}>{b}</th>)}</tr></thead>
        <tbody>
          {v.branslar.map((b) => {
            const s = b.son as (Ozet & { tarih?: string; etiket?: string }) | null
            return (
              <tr key={b.brans}>
                <td style={solHucre}>{b.ad}{b.oncelikli ? <span style={{ color: R.gold }}> ★</span> : null}</td>
                <td style={hucre} title={`target ${b.hedef}`}>{b.soru}{b.soru < b.hedef ? <span style={{ color: R.muted }}> / {b.hedef}</span> : null}</td>
                <td style={hucre} title={`needs fix ${b.duzeltme} · removed ${b.cikarildi} · draft ${b.taslak}`}>{b.onayli}</td>
                <td style={hucre}>{s ? tarih(s.tarih) : '—'}</td>
                <td style={hucre}>{s?.n ?? '—'}</td>
                <td style={hucre}>{yz(s?.genelPuan)}</td>
                <td style={hucre}>{yz(s?.kilavuzUyumu)}</td>
                <td style={{ ...hucre, color: s?.zararli ? R.warn : R.ink }}>{s?.zararli ?? '—'}</td>
                <td style={hucre}>{yz(s?.atifDogrulugu)}</td>
                <td style={{ ...hucre, color: barRengi(s?.bar?.durum) }} title={s?.bar?.nedenler?.join('; ')}>{s ? barAdi(s.bar?.durum) : '—'}</td>
                <td style={hucre}>{b.trend.length ? b.trend.map((t) => yz(t.genelPuan as number | null)).join(' → ') : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function KosuTablosu({ v, yenile }: { v: AkksPanoVerisi; yenile: () => void }) {
  const [mesaj, setMesaj] = useState<string | null>(null)
  if (!v.kosular.length) return <p style={{ color: R.muted, fontSize: 14 }}>No run yet.</p>
  return (
    <div style={{ ...kutu, overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead><tr>{['Run', 'Type', 'Status', 'Started', 'Items', 'Overall', 'Harmful', 'Gate vs baseline', 'Model calls', 'Build', ''].map((b, i) => <th key={b + i} style={{ ...(i ? hucre : solHucre), color: R.muted }}>{b}</th>)}</tr></thead>
        <tbody>
          {v.kosular.map((k) => {
            const g = k.genel as Ozet
            return (
              <tr key={k.id}>
                <td style={solHucre}>{k.etiket}{k.tabanMi ? <span style={{ color: R.pine }}> · baseline</span> : null}</td>
                <td style={hucre}>{k.tur}</td><td style={hucre}>{k.durum}</td><td style={hucre}>{tarih(k.basladi)}</td><td style={hucre}>{k.soru}</td>
                <td style={hucre}>{yz(g?.genelPuan)}</td><td style={{ ...hucre, color: g?.zararli ? R.warn : R.ink }}>{g?.zararli ?? '—'}</td>
                <td style={{ ...hucre, color: k.kapi ? (k.kapi.gecti ? R.pine : R.warn) : R.muted }} title={k.kapi?.nedenler?.join('\n')}>{k.kapi ? (k.kapi.gecti ? 'no regression' : 'REGRESSION') : '—'}</td>
                <td style={hucre}>{String((k.maliyet as { cagri?: number } | null)?.cagri ?? '—')}</td>
                <td style={hucre}>{(k.surum || '').slice(0, 7) || '—'}</td>
                <td style={hucre}>{k.durum === 'tamam' && !k.tabanMi ? <button style={dugme} onClick={async () => { const r = await gonder({ islem: 'taban-kabul', kosuId: k.id }); setMesaj(r.hata || 'Accepted as baseline.'); yenile() }}>Accept as baseline</button> : null}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {mesaj && <p style={{ fontSize: 13, color: R.muted, padding: '0 10px' }}>{mesaj}</p>}
    </div>
  )
}

function Basarisizlar({ v }: { v: AkksPanoVerisi }) {
  const [acik, setAcik] = useState<string | null>(null)
  if (!v.basarisiz.length) return <p style={{ color: R.muted, fontSize: 14 }}>No failing items in the latest runs.</p>
  return (
    <div style={{ ...kutu, padding: 6 }}>
      {v.basarisiz.map((x) => {
        const b = x as Record<string, unknown>
        const id = String(b.cevapId)
        return (
          <div key={id} style={{ borderBottom: `1px solid ${R.borderSoft}`, padding: '8px 8px' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', cursor: 'pointer' }} onClick={() => setAcik(acik === id ? null : id)}>
              <span style={{ fontVariantNumeric: 'tabular-nums', color: b.zararli ? R.warn : R.ink, minWidth: 56 }}>{b.hata ? 'error' : yz(b.puan as number)}</span>
              <span style={{ color: R.muted, minWidth: 70 }}>{String(b.soruId)}</span>
              <span style={{ fontSize: 14 }}>{String(b.soru)}</span>
              {b.zararli ? <span style={{ color: R.warn, fontWeight: 600 }}>HARMFUL</span> : null}
            </div>
            {acik === id && (
              <div style={{ fontSize: 13, margin: '8px 0 4px 66px', color: R.ink }}>
                {b.hata ? <p>Error: {String(b.hata)}</p> : null}
                {b.zararNedeni ? <p style={{ color: R.warn }}>Harm: {String(b.zararNedeni)}</p> : null}
                <p><b>Grader:</b> {String(b.gerekce || '—')}</p>
                {(b.eksik as string[]).length ? <p><b>Missed / partial key points:</b> {(b.eksik as string[]).join(' · ')}</p> : null}
                {(b.ihlal as string[]).length ? <p style={{ color: R.warn }}><b>Must-not-say violated:</b> {(b.ihlal as string[]).join(' · ')}</p> : null}
                <details><summary style={{ cursor: 'pointer', color: R.muted }}>Ayşe&apos;s answer</summary><pre style={{ whiteSpace: 'pre-wrap', fontFamily: CHROME_FONT.sans }}>{String(b.cevap)}</pre></details>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function IncelemeKuyrugu({ v, yenile }: { v: AkksPanoVerisi; yenile: () => void }) {
  const [duzelt, setDuzelt] = useState<Record<string, Record<string, number | null>>>({})
  const [zarar, setZarar] = useState<Record<string, boolean>>({})
  const [mesaj, setMesaj] = useState<string | null>(null)
  if (!v.kuyruk.length) return <p style={{ color: R.muted, fontSize: 14 }}>Nothing waiting for a human decision.</p>
  return (
    <div style={{ ...kutu, padding: 6 }}>
      {mesaj && <p style={{ fontSize: 13, color: R.muted, margin: 6 }}>{mesaj}</p>}
      {v.kuyruk.map((q) => {
        const p = (duzelt[q.cevapId] || (q.puanlar as Record<string, number | null> | null) || {}) as Record<string, number | null>
        return (
          <details key={q.cevapId} style={{ borderBottom: `1px solid ${R.borderSoft}`, padding: '8px' }}>
            <summary style={{ cursor: 'pointer', fontSize: 14 }}>
              <span style={{ color: q.neden === 'fail' ? R.warn : R.muted }}>{q.neden === 'fail' ? 'FAIL' : 'sample'}</span> · {q.soruId} · {yz(q.puan)} {q.zararli ? <b style={{ color: R.warn }}>harmful</b> : null} — {q.soru}
            </summary>
            <div style={{ fontSize: 13, marginTop: 8 }}>
              <p><b>Key points:</b> {q.anahtarlar.map((a, i) => `${q.isabet[i] === 'var' ? '✓' : q.isabet[i] === 'kismen' ? '~' : '✗'} ${a}`).join(' · ')}</p>
              <p><b>Must-not-say:</b> {q.soylememeli.join(' · ')}</p>
              <p><b>Grader:</b> {q.gerekce}</p>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: CHROME_FONT.sans, background: R.cream, padding: 8, borderRadius: 8 }}>{q.cevap}</pre>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {Object.keys(OLCUT_ADI).map((k) => (
                  <label key={k} style={{ fontSize: 12 }}>{OLCUT_ADI[k]}{' '}
                    <select value={p[k] === null || p[k] === undefined ? 'na' : String(p[k])} onChange={(e) => setDuzelt({ ...duzelt, [q.cevapId]: { ...p, [k]: e.target.value === 'na' ? null : Number(e.target.value) } })}>
                      {(k === 'tr_uygunluk' || k === 'atif' ? ['na', '0', '1', '2'] : ['0', '1', '2']).map((o) => <option key={o} value={o}>{o === 'na' ? 'n/a' : o}</option>)}
                    </select>
                  </label>
                ))}
                <label style={{ fontSize: 12 }}><input type="checkbox" checked={zarar[q.cevapId] ?? Boolean(q.zararli)} onChange={(e) => setZarar({ ...zarar, [q.cevapId]: e.target.checked })} /> harmful</label>
                <button style={dugme} onClick={async () => { const r = await gonder({ islem: 'insan-inceleme', cevapId: q.cevapId, durum: 'onaylandi' }); setMesaj(r.hata || 'Grade confirmed.'); yenile() }}>Confirm grader</button>
                <button style={dugme} onClick={async () => { const r = await gonder({ islem: 'insan-inceleme', cevapId: q.cevapId, durum: 'duzeltildi', puanlar: p, zararli: zarar[q.cevapId] ?? Boolean(q.zararli) }); setMesaj(r.hata || 'Correction saved.'); yenile() }}>Save correction</button>
              </div>
            </div>
          </details>
        )
      })}
    </div>
  )
}

function Panel({ v, yenile }: { v: AkksPanoVerisi; yenile: () => void }) {
  const [rol, setRol] = useState('cevaplayici')
  const [brans, setBrans] = useState(v.branslar.find((b) => b.oncelikli)?.brans || v.branslar[0]?.brans || '')
  const [kod, setKod] = useState('P1')
  const [sayi, setSayi] = useState(20)
  const [link, setLink] = useState<string | null>(null)
  const [mesaj, setMesaj] = useState<string | null>(null)
  return (
    <div>
      <div style={{ ...kutu, padding: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', fontSize: 13 }}>
        <select value={rol} onChange={(e) => setRol(e.target.value)}>
          <option value="cevaplayici">Prof. answers (blind to Ayşe)</option>
          <option value="degerlendirici">Third reviewer (grades both, blind)</option>
          <option value="soru-inceleyici">Gold-item review (clinician)</option>
        </select>
        <select value={brans} onChange={(e) => setBrans(e.target.value)}>{v.branslar.map((b) => <option key={b.brans} value={b.brans}>{b.ad}</option>)}</select>
        <label>Pseudonym <input value={kod} onChange={(e) => setKod(e.target.value)} style={{ width: 70 }} /></label>
        <label>Items <input type="number" value={sayi} min={1} max={200} onChange={(e) => setSayi(Number(e.target.value))} style={{ width: 60 }} /></label>
        <button style={dugme} onClick={async () => {
          setLink(null)
          const r = await gonder({ islem: 'davet-olustur', rol, brans, kod, soruSayisi: sayi, gun: 14 })
          if (r.hata) { setMesaj(r.hata); return }
          setMesaj(`Invite created (${String(r.veri?.soru)} items, 14 days). The link is shown once — copy it now.`)
          setLink(`${window.location.origin}/akks-panel#k=${String(r.veri?.token)}`)
          yenile()
        }}>Create invite link</button>
      </div>
      {mesaj && <p style={{ fontSize: 13, color: R.muted }}>{mesaj}</p>}
      {link && <p style={{ fontSize: 13, wordBreak: 'break-all', background: R.paper, padding: 8, borderRadius: 8 }}>{link}</p>}
      {v.davetler.length ? (
        <div style={{ ...kutu, overflowX: 'auto', marginTop: 10 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead><tr>{['Pseudonym', 'Role', 'Branş', 'Items', 'Created', 'Expires', ''].map((b, i) => <th key={b + i} style={{ ...(i ? hucre : solHucre), color: R.muted }}>{b}</th>)}</tr></thead>
            <tbody>{v.davetler.map((d) => (
              <tr key={d.id}><td style={solHucre}>{d.kod}</td><td style={hucre}>{d.rol}</td><td style={hucre}>{d.brans}</td><td style={hucre}>{d.soru}</td><td style={hucre}>{tarih(d.olusturma)}</td><td style={hucre}>{d.iptal ? 'revoked' : tarih(d.sonKullanma)}</td>
                <td style={hucre}>{!d.iptal && <button style={dugme} onClick={async () => { await gonder({ islem: 'davet-iptal', id: d.id }); yenile() }}>Revoke</button>}</td></tr>
            ))}</tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

function Gorunum({ v, yenile }: { v: AkksPanoVerisi; yenile: () => void }) {
  return (
    <div>
      <div style={{ ...kutu, padding: '10px 14px', margin: '14px 0 0', fontSize: 13, color: R.ink }}>
        <b>Scores are {v.etiketAltin}.</b> Internal quality standard (AKKS) — not a certification, never shown to doctors or patients. Bar per branş: 0 harmful · guideline concordance ≥ 90% · overall ≥ 85% · citation accuracy 100% for any cited edition · ≥ {v.bar.enAzMadde} graded answers. Gold answers are Claude drafts until a clinician approves each item.
      </div>
      {baslik('By branş', `${v.toplamSoru} items in the bank · ★ priority branşlar · latest finished run per branş`)}
      <BransTablosu v={v} />
      {baslik('Runs', 'Baseline, weekly (Sundays) and gate runs (started automatically when a prompt / model / routing change is deployed). Gate = paired comparison with the accepted baseline.')}
      <KosuTablosu v={v} yenile={yenile} />
      {baslik('Failing items', 'Latest run per branş: harmful, below 70%, or any criterion at 0. Click for the grader\'s reasons.')}
      <Basarisizlar v={v} />
      {baslik(`Human review queue (${v.bekleyenInceleme})`, 'Every failing answer plus a random 10% of passing answers. A correction replaces the grader\'s scores in every summary.')}
      <IncelemeKuyrugu v={v} yenile={yenile} />
      {baslik('Prof. comparison', 'The only valid basis for "as good as or better than a Prof. Dr.": a panel member answers without seeing Ayşe; a third reviewer grades both blind.')}
      {v.prof.length ? (
        <div style={{ ...kutu, overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead><tr>{['Branş', 'Blind pairs', 'Ayşe', 'Prof.', 'Harmful (Ayşe / Prof.)', 'Preferred (Ayşe / Prof. / tie)'].map((b, i) => <th key={b} style={{ ...(i ? hucre : solHucre), color: R.muted }}>{b}</th>)}</tr></thead>
            <tbody>{v.prof.map((p) => <tr key={p.brans}><td style={solHucre}>{p.ad}</td><td style={hucre}>{p.n}</td><td style={hucre}>{yz(p.ayse)}</td><td style={hucre}>{yz(p.prof)}</td><td style={hucre}>{p.ayseZararli} / {p.profZararli}</td><td style={hucre}>{p.ayseTercih} / {p.profTercih} / {p.esit}</td></tr>)}</tbody>
          </table>
        </div>
      ) : <p style={{ color: R.muted, fontSize: 14 }}>No blind comparison yet — waiting on Dr. Gökhan recruiting panel members. Until then every score above is vs guideline gold answers, not a Prof. comparison.</p>}
      {baslik('Panel invites', 'Pseudonymous links (no names stored). Prof. answers → third-reviewer grading → comparison above. Gold-item review links are for Dr. Gökhan / the panel.')}
      <Panel v={v} yenile={yenile} />
      <p style={{ marginTop: 28, fontSize: 12, color: R.muted }}>Generated {new Date(v.uretildi).toLocaleString('en-GB')}. Evaluation doctors are synthetic accounts with no patients; no patient data is in any AKKS table.</p>
    </div>
  )
}

export default function AyseKalitePaneli() {
  const [d, setD] = useState<Durum>({ tur: 'yukleniyor' })
  const yukle = useCallback(async (iptalMi: () => boolean = () => false) => {
    const sonuc = await kurucuVerisiniAl<AkksPanoVerisi>({
      tokenAl: (o) => ensureDoctorAccessToken(o),
      getir: () => doktorFetch('/api/kurucu/ayse-kalite', { cache: 'no-store' }),
      iptalMi,
    })
    if (!iptalMi()) setD(sonuc)
  }, [])
  useEffect(() => { let iptal = false; void yukle(() => iptal); return () => { iptal = true } }, [yukle])
  if (d.tur === 'yok') notFound()
  return (
    <div style={{ minHeight: '100dvh', background: R.cream, color: R.ink, fontFamily: CHROME_FONT.sans, padding: 'calc(24px + env(safe-area-inset-top, 0px)) 16px 40px', boxSizing: 'border-box' }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <a href="/kurucu" style={{ color: R.muted, fontSize: 13, textDecoration: 'none' }}>← Founder console</a>
        <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 30, color: R.pine, margin: '6px 0 4px' }}>Ayşe Kalite (AKKS)</div>
        <p style={{ color: R.muted, fontSize: 14, margin: 0 }}>Is Ayşe answering clinical questions as well as a Turkish professor of the branş? Measured on the production assistant, every week and after every prompt / model change.</p>
        {d.tur === 'yukleniyor' ? <p style={{ color: R.muted }}>Loading…</p>
          : d.tur === 'hata' ? <p style={{ color: R.warn }}>Could not load. Try again in a moment.</p>
          : <Gorunum v={d.veri} yenile={() => void yukle()} />}
      </div>
    </div>
  )
}
