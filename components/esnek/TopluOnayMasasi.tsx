'use client'
/**
 * ESNEK-MUAYENE-B3 — daily batch approval (B3, opened by the doctor): each waiting note is opened (its fields shown), every
 * protected item (drugs/doses, side, allergy, diagnosis codes) ticked one by one — never automatic — then the opened notes are
 * approved together. The server re-checks every rule. Country-neutral (words, API and routes injected).
 */
import { useCallback, useEffect, useState } from 'react'
import type { EsnekMetinleri } from '@/core/esnek/metinTr'
import type { AlanGorunumu, OzerkAlan } from '@/core/esnek/ozerklik'
import { EL_RENK as R } from '@/components/elNotu/renk'
import { dugme, type Getirici } from '@/components/elNotu/ElNotuYakala'

type Satir = { noteId: string; hasta: string; tarih: string; alanlar: AlanGorunumu[]; metinler: Partial<Record<OzerkAlan, string>>; acildi: boolean; gorulen: string[]; onaylanacak: { alan: OzerkAlan; metin: string; anahtar: string }[]; hazir: boolean }

export default function TopluOnayMasasi(p: { metin: EsnekMetinleri; getir: Getirici; api: string; notFormu: (noteId: string) => string; git: (yol: string) => void }) {
  const M = p.metin.ozerklik
  const [liste, setListe] = useState<Satir[] | null>(null)
  const [izin, setIzin] = useState(true)
  const [acik, setAcik] = useState<string | null>(null)
  const [mesaj, setMesaj] = useState('')
  const [calisiyor, setCalisiyor] = useState(false)

  const { getir, api } = p
  const yukle = useCallback(async () => {
    const r = await getir(`${api}/toplu-onay`).catch(() => null)
    const j = r?.ok ? await r.json() : { notlar: [], izin: false }
    setListe(j.notlar || []); setIzin(j.izin !== false)
  }, [getir, api])
  useEffect(() => { void yukle() }, [yukle])

  async function olay(noteId: string, tur: 'acildi' | 'gordum', anahtar?: string) {
    const r = await p.getir(`${p.api}/not-durumu`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ noteId, tur, anahtar }) }).catch(() => null)
    if (!r?.ok) return
    setListe((l) => (l || []).map((s) => {
      if (s.noteId !== noteId) return s
      const gorulen = tur === 'gordum' && anahtar ? [...new Set([...s.gorulen, anahtar])] : s.gorulen
      const acildi = s.acildi || tur === 'acildi'
      return { ...s, gorulen, acildi, hazir: acildi && s.onaylanacak.every((x) => gorulen.includes(x.anahtar)) }
    }))
  }
  async function onayla() {
    const hazir = (liste || []).filter((s) => s.hazir).map((s) => s.noteId)
    if (!hazir.length) return
    setCalisiyor(true); setMesaj('')
    const r = await p.getir(`${p.api}/toplu-onay`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ noteIds: hazir }) }).catch(() => null)
    const j = r?.ok ? await r.json() : null
    setCalisiyor(false)
    if (!j) { setMesaj(p.metin.hata); return }
    setMesaj(j.reddedilen?.length ? `${M.topluOnaylandi(j.onaylanan.length)} ${M.topluHata}` : M.topluOnaylandi(j.onaylanan.length))
    await yukle()
  }

  if (!liste) return <div style={{ color: R.soluk, fontSize: 14 }}>…</div>
  if (!izin) return <div style={{ color: R.soluk, fontSize: 14 }}>{M.b3Teklif}</div>
  const hazirSayi = liste.filter((s) => s.hazir).length
  return (
    <div style={{ display: 'grid', gap: 10, color: R.murekkep }}>
      <div style={{ fontSize: 14, color: R.soluk }}>{M.topluAlt}</div>
      {!liste.length && <div style={{ fontSize: 14, color: R.soluk }}>{M.topluBos}</div>}
      {liste.map((s) => (
        <div key={s.noteId} style={{ background: R.kagit, border: `1px solid ${s.hazir ? R.cam : R.cizgi}`, borderRadius: 14, padding: '10px 14px', display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <b style={{ flex: 1, minWidth: 0 }}>{s.hasta}</b>
            <span style={{ fontSize: 12, color: R.soluk }}>{new Date(s.tarih).toLocaleString(p.metin.yerel, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            <button type="button" style={dugme('kucuk')} onClick={() => { setAcik(acik === s.noteId ? null : s.noteId); if (!s.acildi) void olay(s.noteId, 'acildi') }}>{s.acildi ? M.acildi : M.ac}</button>
            <button type="button" style={dugme('kucuk')} onClick={() => p.git(p.notFormu(s.noteId))}>{M.gidilecek}</button>
          </div>
          {acik === s.noteId && (
            <div style={{ display: 'grid', gap: 6 }}>
              {s.alanlar.map((a) => (
                <div key={a.alan} style={{ fontSize: 13 }}>
                  <div style={{ fontWeight: 600 }}>{M.alan[a.alan]} <span style={{ fontWeight: 400, color: R.soluk }}>· {M.durum[a.durum]}</span></div>
                  <div style={{ whiteSpace: 'pre-wrap', color: R.murekkep, maxHeight: 220, overflow: 'auto' }}>{s.metinler[a.alan] || ''}</div>
                </div>
              ))}
              {s.onaylanacak.map((x) => {
                const gordu = s.gorulen.includes(x.anahtar)
                return (
                  <label key={x.anahtar} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: gordu ? R.camAcik : R.amberAcik, borderRadius: 8, padding: '6px 8px', fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={gordu} disabled={gordu} onChange={() => void olay(s.noteId, 'gordum', x.anahtar)} style={{ width: 18, height: 18, marginTop: 1 }} />
                    <span><b>{M.alan[x.alan]}:</b> {x.metin}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      ))}
      {liste.length > 0 && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" style={dugme('birincil')} disabled={!hazirSayi || calisiyor} onClick={() => void onayla()}>{M.topluOnayla(hazirSayi)}</button>
          {!hazirSayi && <span style={{ fontSize: 13, color: R.soluk }}>{M.korumaliOnayla}</span>}
          {mesaj && <span role="status" style={{ fontSize: 13, color: R.cam }}>{mesaj}</span>}
        </div>
      )}
    </div>
  )
}
