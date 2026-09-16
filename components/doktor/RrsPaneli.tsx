'use client'
/**
 * NOTYA-RRS-01 — Reçete sayfasındaki KIRMIZI/YEŞİL sayfada RRS iş akışı paneli (ekranda; kâğıtta yalnız RRS No).
 * Kopyala → RRS'yi aç → numarayı gir → kaydet. Not onaylı değilse kayıt açılmaz (öneri aşaması).
 */
import React, { useEffect, useState } from 'react'
import { getDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { rrsMetni, RRS_URL, RRS_ADIMLARI, type RrsRenk, type RrsSatir } from '@/lib/doktor/rrs'

interface Kayit { id: string; rrs_recete_no: string | null; durum: string }

export default function RrsPaneli(props: { noteId: string; renk: RrsRenk; satirlar: RrsSatir[]; hastaAd: string; tarih: string; tanilar: string[]; taslakMi: boolean }) {
  const [kayit, setKayit] = useState<Kayit | null>(null)
  const [no, setNo] = useState('')
  const [mesaj, setMesaj] = useState('')
  const renkHex = props.renk === 'kirmizi' ? '#B91C1C' : '#15803D'
  const metin = rrsMetni({ renk: props.renk, hastaAd: props.hastaAd, tarih: props.tarih, tanilar: props.tanilar, satirlar: props.satirlar })

  useEffect(() => {
    if (props.taslakMi) return
    let iptal = false
    ;(async () => {
      const t = await getDoctorAccessToken()
      if (!t) return
      const r = await fetch('/api/doktor/rrs', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ noteId: props.noteId, renk: props.renk, satirlar: props.satirlar }) })
      const j = await r.json().catch(() => ({}))
      if (!iptal && j.kayit) { setKayit(j.kayit); setNo(j.kayit.rrs_recete_no || '') }
    })()
    return () => { iptal = true }
    // satırlar (kutu) değişince yeniden kayıt açılmaz; kaydet ile birlikte gönderilir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.noteId, props.renk, props.taslakMi])

  const kopyala = async () => {
    try { await navigator.clipboard.writeText(metin); setMesaj('RRS metni kopyalandı.') } catch { setMesaj('Kopyalanamadı — metni elle seçin.') }
  }
  const kaydet = async () => {
    if (!kayit) return
    const t = await getDoctorAccessToken()
    if (!t) return
    const r = await fetch('/api/doktor/rrs', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ id: kayit.id, rrsReceteNo: no }) })
    const j = await r.json().catch(() => ({}))
    if (j.kayit) { setKayit(j.kayit); setMesaj(j.kayit.durum === 'duzenlendi' ? 'RRS numarası kaydedildi — kayıt kapandı.' : 'Numara silindi — kayıt bekliyor.') }
    else setMesaj(j.error || 'Kaydedilemedi.')
  }

  return (
    <>
      <div className="yazdirma-gizle" style={{ border: `1px dashed ${renkHex}`, borderRadius: 6, padding: '8px 10px', marginBottom: 10, fontFamily: 'system-ui', fontSize: 12, color: '#111' }}>
        <ol style={{ margin: '0 0 8px 16px', padding: 0, color: '#374151' }}>
          {RRS_ADIMLARI.map((a, i) => <li key={i}>{a}</li>)}
        </ol>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" onClick={kopyala} style={{ border: `1px solid ${renkHex}`, background: 'white', color: renkHex, borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontWeight: 600 }}>📋 RRS için kopyala</button>
          <a href={RRS_URL} target="_blank" rel="noopener noreferrer" style={{ border: `1px solid ${renkHex}`, background: renkHex, color: 'white', borderRadius: 6, padding: '5px 10px', textDecoration: 'none', fontWeight: 600 }}>↗ RRS&apos;yi aç</a>
          {props.taslakMi ? (
            <span style={{ color: '#6B7280' }}>Not onaylanınca RRS kaydı açılır.</span>
          ) : (
            <>
              <input value={no} onChange={(e) => setNo(e.target.value)} placeholder="RRS reçete no" style={{ border: '1px solid #9CA3AF', borderRadius: 6, padding: '5px 8px', width: 150 }} />
              <button type="button" onClick={kaydet} disabled={!kayit} style={{ border: '1px solid #111', background: '#111', color: 'white', borderRadius: 6, padding: '5px 10px', cursor: kayit ? 'pointer' : 'not-allowed' }}>Kaydet</button>
              {kayit && <span style={{ color: kayit.durum === 'duzenlendi' ? '#15803D' : '#92400E' }}>{kayit.durum === 'duzenlendi' ? '✅ RRS\'de düzenlendi' : '⏳ RRS bekliyor'}</span>}
            </>
          )}
        </div>
        {mesaj && <div style={{ marginTop: 6, color: '#374151' }}>{mesaj}</div>}
      </div>
      {kayit?.rrs_recete_no && (
        <div style={{ fontSize: 11, marginBottom: 8, color: '#111' }}>RRS Reçete No: <b>{kayit.rrs_recete_no}</b></div>
      )}
    </>
  )
}
