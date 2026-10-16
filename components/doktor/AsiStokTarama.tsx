'use client'

/**
 * NOTYA-ASI-STOK-BARKOD-01 — muayene ekranı barkod tarama/uygulama bileşeni.
 *
 * Akış: barkodu tara/yaz → Enter/"Ara" → lot + SKT bilgisi gösterilir → "Uygulandı" → tek istekte
 * stok düşer, `asilar`a (aşı karnesi + bu muayene) yazılır, e-Nabız'a hazırlanır, istenirse faturaya
 * eklenir. Modül bu hekim/branş için kapalıysa bileşen HİÇBİR ŞEY render etmez (brans alan sızması
 * kuralıyla aynı ciddiyette "sızma yok" ilkesi — .cursor/skills/specialty-doktor-araclari).
 *
 * Bu, nottaki "Bu muayenede uygulanan aşılar" serbest metin alanından (NOTYA-ASI-NOT-01, SOAP onayı
 * senkronu) BİLEREK AYRI bir giriş yoludur — karne/elle/sesli eklenen satırlar gibi doğrudan `asilar`a
 * yazar, not yeniden onaylandığında silinmez/değişmez (091'in kaynak_note_id senkronu bu satırları
 * hiç görmez).
 */
import React, { useEffect, useState } from 'react'
import { getDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'

const BORDER = CHROME_RENK.border
const INK = CHROME_RENK.ink
const MUTED = CHROME_RENK.muted
const TEAL = CHROME_RENK.pine
const RED = '#B3261E'
const AMBER = '#B4832F'
const GREEN = '#3F7D4A'

type Tarama =
  | { bulundu: false; barkod: string }
  | { bulundu: true; lot: { id: string; asiAdi: string; lotNo: string | null; barkod: string; miktar: number; varsayilanUygulamaBolgesi: string | null }; sktDurumu: 'gecerli' | 'yaklasiyor' | 'gecti'; stokVarMi: boolean; engellenir: boolean }

export default function AsiStokTarama({ patientId, sessionId }: { patientId: string | null; sessionId: string | null }) {
  const [modulAcikMi, setModulAcikMi] = useState<boolean | null>(null)
  const [barkod, setBarkod] = useState('')
  const [tarama, setTarama] = useState<Tarama | null>(null)
  const [bolge, setBolge] = useState('')
  const [faturayaEkle, setFaturayaEkle] = useState(false)
  const [durum, setDurum] = useState<'bos' | 'ariyor' | 'uyguluyor' | 'tamam'>('bos')
  const [hata, setHata] = useState('')
  const [sonuc, setSonuc] = useState<string>('')

  useEffect(() => {
    const t = getDoctorAccessToken()
    if (!t) return
    fetch('/api/doktor/asi-stok/modul', { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => setModulAcikMi(!!d?.etkinAktif))
      .catch(() => setModulAcikMi(false))
  }, [])

  if (!modulAcikMi) return null

  const ara = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = getDoctorAccessToken()
    if (!t || !barkod.trim()) return
    setDurum('ariyor')
    setHata('')
    setSonuc('')
    try {
      const r = await fetch('/api/doktor/asi-stok/tara', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ barkod }),
      })
      const d = await r.json()
      if (!r.ok) { setHata(d?.error || 'Barkod sorgulanamadı.'); setTarama(null) }
      else {
        setTarama(d)
        if (d.bulundu) setBolge(d.lot.varsayilanUygulamaBolgesi || '')
      }
    } catch {
      setHata('Bağlantı hatası.')
    } finally {
      setDurum('bos')
    }
  }

  const uygula = async () => {
    if (!tarama || !tarama.bulundu || !patientId) return
    const t = getDoctorAccessToken()
    if (!t) return
    setDurum('uyguluyor')
    setHata('')
    try {
      const r = await fetch('/api/doktor/asi-stok/uygula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ lotId: tarama.lot.id, patientId, sessionId, uygulamaBolgesi: bolge || null, faturayaEkle }),
      })
      const d = await r.json()
      if (!r.ok) { setHata(d?.error || 'Uygulama kaydedilemedi.'); setDurum('bos'); return }
      setSonuc(`${tarama.lot.asiAdi} kaydedildi — kalan stok: ${d.kalanMiktar} doz.${faturayaEkle ? (d.fatura?.eklendi ? ' Faturaya eklendi.' : d.fatura?.sebep ? ` Faturaya eklenmedi: ${d.fatura.sebep}` : '') : ''}`)
      setDurum('tamam')
      setTarama(null)
      setBarkod('')
    } catch {
      setHata('Bağlantı hatası.')
      setDurum('bos')
    }
  }

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, marginBottom: 10, background: 'rgba(47,67,52,0.03)', fontFamily: CHROME_FONT.sans }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: INK, marginBottom: 6 }}>Stoktan aşı uygula (barkod tara)</div>
      {!patientId ? (
        <div style={{ fontSize: 12, color: MUTED }}>Hasta bilgisi yüklenmeden barkod taranamaz.</div>
      ) : (
        <>
          <form onSubmit={ara} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            <input
              autoFocus={false}
              value={barkod}
              onChange={(e) => setBarkod(e.target.value)}
              placeholder="Barkodu tarayın veya yazın"
              style={{ flex: '1 1 220px', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '7px 10px', fontSize: 13 }}
            />
            <button type="submit" disabled={durum === 'ariyor'} style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {durum === 'ariyor' ? 'Aranıyor…' : 'Ara'}
            </button>
          </form>

          {tarama && !tarama.bulundu && (
            <div style={{ fontSize: 12.5, color: AMBER }}>"{tarama.barkod}" stokta bulunamadı — Entegrasyonlar → Aşı Stok'tan ekleyin.</div>
          )}

          {tarama && tarama.bulundu && (
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, background: '#fff' }}>
              <div style={{ fontWeight: 600 }}>{tarama.lot.asiAdi}{tarama.lot.lotNo ? ` · Lot ${tarama.lot.lotNo}` : ''}</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Stokta: {tarama.lot.miktar} doz</div>
              {tarama.sktDurumu === 'gecti' && (
                <div role="alert" style={{ fontSize: 12.5, color: '#fff', background: RED, borderRadius: 6, padding: '6px 8px', marginTop: 6, fontWeight: 600 }}>
                  ⚠ Bu lotun son kullanma tarihi geçmiş. Uygulama engellenir — bu lot kaydedilemez.
                </div>
              )}
              {tarama.sktDurumu === 'yaklasiyor' && (
                <div style={{ fontSize: 12, color: AMBER, marginTop: 4 }}>Son kullanma tarihi yaklaşıyor.</div>
              )}
              {!tarama.stokVarMi && (
                <div style={{ fontSize: 12.5, color: RED, marginTop: 4, fontWeight: 600 }}>Stok tükendi — bu lottan uygulanamaz.</div>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                <input value={bolge} onChange={(e) => setBolge(e.target.value)} placeholder="Uygulama bölgesi" style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 8px', fontSize: 12, width: 160 }} />
                <label style={{ fontSize: 12, color: MUTED, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input type="checkbox" checked={faturayaEkle} onChange={(e) => setFaturayaEkle(e.target.checked)} /> Faturaya ekle
                </label>
                <button
                  type="button"
                  onClick={uygula}
                  disabled={durum === 'uyguluyor' || tarama.engellenir || !tarama.stokVarMi}
                  style={{ background: tarama.engellenir || !tarama.stokVarMi ? '#ccc' : GREEN, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: tarama.engellenir || !tarama.stokVarMi ? 'not-allowed' : 'pointer' }}
                >
                  {durum === 'uyguluyor' ? 'Kaydediliyor…' : 'Uygulandı — kaydet'}
                </button>
              </div>
            </div>
          )}

          {sonuc && <div style={{ fontSize: 12.5, color: GREEN, marginTop: 8 }}>✓ {sonuc}</div>}
          {hata && <div style={{ fontSize: 12.5, color: RED, marginTop: 8 }}>{hata}</div>}
        </>
      )}
    </div>
  )
}
