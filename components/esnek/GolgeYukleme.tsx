'use client'
/**
 * ESNEK-MUAYENE-B1 — the secretary's shadow-mode panel: pick the patient, upload the pages with the SAME "El notu ekle"
 * capture (privacy on the device, Phase A reader — its source is created through the shadow route, so no visit is opened),
 * then paste or type the note she wrote herself. Typing in the box is measured (time-meter baseline); a paste is not
 * measured and she may state the minutes instead (labelled as declared). Nothing changes on the doctor's screens.
 * Country-neutral: words, routes and the patient picker are injected.
 */
import { useRef, useState } from 'react'
import type { EsnekMetinleri } from '@/core/esnek/metinTr'
import type { ElNotuMetinleri } from '@/core/elNotu/metinTr'
import { AktifSure } from '@/core/elNotu/zaman'
import { EL_RENK as R } from '@/components/elNotu/renk'
import ElNotuYakala, { dugme, type Getirici } from '@/components/elNotu/ElNotuYakala'

export default function GolgeYukleme(p: {
  metin: EsnekMetinleri
  elMetin: ElNotuMetinleri
  getir: Getirici
  /** El Notu API prefix (Türkiye: /api/doktor/el-notu). */
  api: string
  hastaSec: (onSec: (h: { id: string; ad: string }) => void) => React.ReactNode
}) {
  const M = p.metin.golge
  const [hasta, setHasta] = useState<{ id: string; ad: string } | null>(null)
  const [yakala, setYakala] = useState(false)
  const [kaynakId, setKaynakId] = useState<string | null>(null)
  const [metin, setMetin] = useState('')
  const [beyan, setBeyan] = useState('')
  const [durum, setDurum] = useState<'' | 'gonderiliyor' | 'tamam' | 'hata'>('')
  const [hata, setHata] = useState('')
  const sure = useRef(new AktifSure())
  const yapistirildi = useRef(0)

  // the shared capture posts to `${api}/kaynak`; in shadow mode that source is created by the shadow route (no session).
  // Its capture time is NOT documentation time (the shadow week is the old workflow) — the time meter never counts it.
  const golgeGetir: Getirici = (url, init) => {
    const yontem = init?.method || 'GET'
    if (url === `${p.api}/kaynak` && yontem === 'POST') return p.getir(`${p.api}/golge/kaynak`, init)
    if (url === `${p.api}/sure` && yontem === 'POST') return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } }))
    return p.getir(url, init)
  }

  function sifirla() { setHasta(null); setKaynakId(null); setMetin(''); setBeyan(''); setHata(''); sure.current = new AktifSure(); yapistirildi.current = 0 }

  async function gonder() {
    if (!kaynakId || metin.trim().length < 10) return
    setDurum('gonderiliyor'); setHata('')
    const ms = sure.current.al()
    // mostly pasted → not measured (honest); typed in the box → measured
    const yazdi = yapistirildi.current < metin.length * 0.5
    const r = await p.getir(`${p.api}/golge`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kaynakId, kaynagi: yazdi ? 'yazdi' : 'yapistir', metin, sureMs: yazdi ? ms : null, beyanDk: beyan ? Number(beyan.replace(',', '.')) : null }),
    }).catch(() => null)
    if (!r || !r.ok) { const j = await r?.json().catch(() => ({})); setHata((j as { error?: string })?.error || p.metin.hata); setDurum('hata'); return }
    setDurum('tamam')
    setTimeout(() => { sifirla(); setDurum('') }, 2500)
  }

  return (
    <section style={{ background: R.kagit, border: `1px solid ${R.cizgi}`, borderRadius: 16, padding: 18, display: 'grid', gap: 12, color: R.murekkep }}>
      <div>
        <div style={{ fontSize: 17, fontWeight: 650 }}>{M.yukleBaslik}</div>
        <div style={{ fontSize: 13, color: R.soluk, marginTop: 4 }}>{M.yukleAlt}</div>
      </div>
      {!hasta && p.hastaSec((h) => { setHasta(h); setYakala(true) })}
      {hasta && !kaynakId && <div style={{ fontSize: 14, fontWeight: 600 }}>{hasta.ad}</div>}
      {hasta && yakala && (
        <ElNotuYakala metin={p.elMetin} getir={golgeGetir} api={p.api} patientId={hasta.id} kanal="kamera"
          onTamam={(s) => { setKaynakId(s.kaynakId); setYakala(false) }} onKapat={() => { setYakala(false); if (!kaynakId) sifirla() }} />
      )}
      {kaynakId && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 13, color: R.cam, fontWeight: 600 }}>{hasta?.ad} · {M.sayfalarOkundu}</div>
          <label style={{ fontSize: 14, fontWeight: 600 }} htmlFor="golge-sekreter-notu">{M.sekreterNotu}</label>
          <textarea id="golge-sekreter-notu" value={metin} placeholder={M.sekreterNotuYer} rows={10}
            onChange={(e) => { sure.current.etkilesim(); setMetin(e.target.value) }}
            onKeyDown={() => sure.current.etkilesim()}
            onPaste={(e) => { yapistirildi.current += e.clipboardData.getData('text').length }}
            style={{ width: '100%', borderRadius: 10, border: `1px solid ${R.cizgi}`, padding: 10, fontSize: 14, fontFamily: 'inherit', background: '#fff', color: R.murekkep }} />
          <label style={{ fontSize: 13, color: R.soluk, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {M.beyanDk}
            <input inputMode="decimal" value={beyan} onChange={(e) => setBeyan(e.target.value.replace(/[^0-9.,]/g, '').slice(0, 5))} aria-label={M.beyanDk}
              style={{ width: 70, borderRadius: 8, border: `1px solid ${R.cizgi}`, padding: '6px 8px', fontSize: 14 }} />
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" style={dugme('birincil')} disabled={durum === 'gonderiliyor' || metin.trim().length < 10} onClick={() => void gonder()}>{durum === 'gonderiliyor' ? M.karsilastiriliyor : M.gonder}</button>
            <button type="button" style={dugme('ikincil')} onClick={sifirla}>{p.elMetin.vazgec}</button>
            {durum === 'tamam' && <span role="status" style={{ fontSize: 13, color: R.cam }}>{M.gonderildi}</span>}
            {hata && <span role="alert" style={{ fontSize: 13, color: R.uyari }}>{hata}</span>}
          </div>
        </div>
      )}
    </section>
  )
}
