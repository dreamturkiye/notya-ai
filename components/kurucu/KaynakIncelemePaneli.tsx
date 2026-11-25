'use client'

/**
 * TR-PROTOKOL-KUTUPHANESI (Kaan, 2026-11-24) — founder review of the protocol library's monthly edition check (/kurucu/kaynaklar).
 * English (Kaan's rule: everything outside the Notya product copy is English). Approve / reject each flag; an approved new
 * edition can publish ONE announcement → one Fısıltı per doctor of that document's branşlar. The registry itself is code:
 * after approving, the edition goes into lib/kaynaklar/protokolKutuphanesi/belgeler.ts in a reviewed commit (+ research log).
 */
import React, { useCallback, useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { kurucuVerisiniAl } from '@/lib/kurucu/oturumBekle'
import { doktorFetch } from '@/lib/doktor/oturumFetch'
import { CHROME_FONT, CHROME_FONT_HREF, CHROME_RENK as R } from '@/lib/doktor/chromeTheme'
import type { BransKapsami } from '@/lib/kaynaklar/protokolKutuphanesi'

type Satir = { id: string; tur: string; url: string; belge_idleri: string[]; ayrinti: Record<string, unknown>; durum: string; created_at: string; karar_at: string | null; karar_notu: string | null }
type Veri = { bekleyen: Satir[]; son: Satir[]; takip: { url: string; http_durum: number | null; kontrol_at: string; degisti_at: string | null }[]; kapsam: BransKapsami[] }
type Durum = { tur: 'yukleniyor' } | { tur: 'yok' } | { tur: 'hata' } | { tur: 'tamam'; veri: Veri }

const TUR_ADI: Record<string, string> = {
  'icerik-degisti': 'Document changed',
  erisilemiyor: 'URL not reachable',
  'yeni-surum-adayi': 'Possible new edition',
  'yeni-belge-adayi': 'Possible new document',
  'listeden-kalkti': 'Removed from SB listing',
}
const kutu: React.CSSProperties = { background: R.paper, border: `1px solid ${R.border}`, borderRadius: 14, padding: 14 }
const girdi: React.CSSProperties = { padding: '6px 8px', borderRadius: 8, border: `1px solid ${R.border}`, fontSize: 13, background: '#fff', color: R.ink }
const dugme: React.CSSProperties = { padding: '6px 12px', borderRadius: 8, border: `1px solid ${R.pine}`, background: R.pine, color: '#fff', fontSize: 13, cursor: 'pointer' }
const ikincil: React.CSSProperties = { ...dugme, background: 'transparent', color: R.pine }

function KuyrukSatiri({ s, karar }: { s: Satir; karar: (govde: object) => Promise<string | null> }) {
  const [belgeId, setBelgeId] = useState(s.belge_idleri[0] || '')
  const [surum, setSurum] = useState('')
  const [yil, setYil] = useState(typeof s.ayrinti.yil === 'number' ? String(s.ayrinti.yil) : '')
  const [url, setUrl] = useState(typeof s.ayrinti.baglanti === 'string' && /^https:/.test(String(s.ayrinti.baglanti)) ? String(s.ayrinti.baglanti) : s.url)
  const [duyur, setDuyur] = useState(false)
  const [not, setNot] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const gonder = async (k: 'onayla' | 'reddet') => {
    setHata(await karar({ id: s.id, karar: k, not, duyuru: k === 'onayla' && duyur ? { belgeId, surum, yil: yil || null, url } : null }))
  }
  return (
    <div style={{ ...kutu, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <strong style={{ color: R.ink }}>{TUR_ADI[s.tur] || s.tur}</strong>
        <span style={{ color: R.muted, fontSize: 12 }}>{new Date(s.created_at).toLocaleDateString('en-GB')}</span>
        {s.belge_idleri.length > 0 && <span style={{ fontSize: 12, color: R.pine }}>{s.belge_idleri.join(', ')}</span>}
      </div>
      <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: R.pine, overflowWrap: 'anywhere' }}>{s.url}</a>
      {Object.keys(s.ayrinti).length > 0 && <code style={{ fontSize: 11, color: R.muted, overflowWrap: 'anywhere' }}>{JSON.stringify(s.ayrinti)}</code>}
      <label style={{ fontSize: 13, color: R.ink, display: 'flex', gap: 6, alignItems: 'center' }}>
        <input type="checkbox" checked={duyur} onChange={(e) => setDuyur(e.target.checked)} /> On approve, announce a new edition (one Fısıltı to doctors of the document&apos;s branşlar)
      </label>
      {duyur && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <input style={girdi} value={belgeId} onChange={(e) => setBelgeId(e.target.value)} placeholder="registry document id" aria-label="Registry document id" />
          <input style={girdi} value={surum} onChange={(e) => setSurum(e.target.value)} placeholder="edition exactly as printed" aria-label="Edition" />
          <input style={{ ...girdi, width: 80 }} value={yil} onChange={(e) => setYil(e.target.value)} placeholder="year" aria-label="Year" />
          <input style={{ ...girdi, minWidth: 280 }} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="official https link" aria-label="Official link" />
        </div>
      )}
      <input style={girdi} value={not} onChange={(e) => setNot(e.target.value)} placeholder="note (optional)" aria-label="Note" />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" style={dugme} onClick={() => void gonder('onayla')}>Approve</button>
        <button type="button" style={ikincil} onClick={() => void gonder('reddet')}>Reject</button>
      </div>
      {hata && <div style={{ color: R.warn, fontSize: 12 }}>{hata}</div>}
    </div>
  )
}

export default function KaynakIncelemePaneli() {
  const [d, setD] = useState<Durum>({ tur: 'yukleniyor' })
  const yukle = useCallback(async (iptalMi: () => boolean = () => false) => {
    const sonuc = await kurucuVerisiniAl<Veri>({ tokenAl: (o) => ensureDoctorAccessToken(o), getir: () => doktorFetch('/api/kurucu/kaynaklar', { cache: 'no-store' }), iptalMi })
    if (!iptalMi()) setD(sonuc)
  }, [])
  useEffect(() => { let iptal = false; void yukle(() => iptal); return () => { iptal = true } }, [yukle])
  const karar = useCallback(async (govde: object): Promise<string | null> => {
    const r = await doktorFetch('/api/kurucu/kaynaklar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(govde) }).catch(() => null)
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
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <a href="/kurucu" style={{ color: R.muted, fontSize: 13, textDecoration: 'none' }}>← Founder console</a>
        <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 30, color: R.pine }}>Protocol library — edition review</div>
        <p style={{ color: R.muted, fontSize: 14, margin: 0 }}>
          The monthly check (3rd of each month) re-reads every official URL in the registry and the SB listings. Nothing changes until you decide here.
          Approving records your decision; the new edition then goes into the registry code in a reviewed commit (lib/kaynaklar/protokolKutuphanesi/belgeler.ts + research log).
        </p>
        {d.tur === 'yukleniyor' ? <p style={{ color: R.muted }}>Loading…</p>
          : d.tur === 'hata' ? <p style={{ color: R.warn }}>Could not load. Try again in a moment.</p>
          : (
            <>
              <h2 style={{ fontFamily: CHROME_FONT.serif, fontSize: 22, margin: '12px 0 0' }}>Waiting for review ({d.veri.bekleyen.length})</h2>
              {d.veri.bekleyen.length === 0 && <p style={{ color: R.muted, margin: 0 }}>Nothing flagged.</p>}
              {d.veri.bekleyen.map((s) => <KuyrukSatiri key={s.id} s={s} karar={karar} />)}
              <h2 style={{ fontFamily: CHROME_FONT.serif, fontSize: 22, margin: '12px 0 0' }}>Coverage per branş</h2>
              <div style={{ ...kutu, overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
                  <thead><tr>{['Branş', 'Documents', 'Edition confirmed', 'Unconfirmed', 'Superseded'].map((h) => <th key={h} style={{ textAlign: 'left', padding: 6, color: R.muted }}>{h}</th>)}</tr></thead>
                  <tbody>{d.veri.kapsam.map((k) => <tr key={k.brans}><td style={{ padding: 6 }}>{k.brans}</td><td style={{ padding: 6 }}>{k.toplam}</td><td style={{ padding: 6 }}>{k.surumDogrulanmis}</td><td style={{ padding: 6 }}>{k.dogrulanamadi}</td><td style={{ padding: 6 }}>{k.yerineYenisiGeldi}</td></tr>)}</tbody>
                </table>
              </div>
              <h2 style={{ fontFamily: CHROME_FONT.serif, fontSize: 22, margin: '12px 0 0' }}>Last decisions</h2>
              {d.veri.son.map((s) => <div key={s.id} style={{ fontSize: 13, color: R.muted }}>{s.karar_at ? new Date(s.karar_at).toLocaleDateString('en-GB') : ''} · {s.durum} · {TUR_ADI[s.tur] || s.tur} · {s.belge_idleri.join(', ') || s.url}</div>)}
              <h2 style={{ fontFamily: CHROME_FONT.serif, fontSize: 22, margin: '12px 0 0' }}>Watched URLs ({d.veri.takip.length})</h2>
              <div style={{ ...kutu, fontSize: 12, color: R.muted, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {d.veri.takip.map((t) => <div key={t.url} style={{ overflowWrap: 'anywhere' }}>{t.http_durum ?? 'ERR'} · {new Date(t.kontrol_at).toLocaleDateString('en-GB')} · {t.url}</div>)}
                {d.veri.takip.length === 0 && <span>No check has run yet.</span>}
              </div>
            </>
          )}
      </div>
    </div>
  )
}
