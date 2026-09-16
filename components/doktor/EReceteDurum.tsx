'use client'
/** NOTYA-ERECETE-01 — reçete sayfasında Medula durumu: ayar eksikse yönlendirir, hazırsa gönderim durumunu söyler. */
import React, { useEffect, useState } from 'react'
import { getDoctorAccessToken } from '@/lib/doktor/clientAuth'

interface Goruntu { hazir: boolean; gonderebilir: boolean; eksikler: string[]; sonTest: { durum: string } | null; imzaYontemi: string }

export default function EReceteDurum(props: { en: number }) {
  const [g, setG] = useState<Goruntu | null | undefined>(undefined)
  useEffect(() => {
    let iptal = false
    ;(async () => {
      const t = await getDoctorAccessToken()
      if (!t) return
      const r = await fetch('/api/doktor/erecete-ayar', { headers: { Authorization: `Bearer ${t}` } })
      const j = await r.json().catch(() => ({}))
      if (!iptal) setG(j.ayar || null)
    })()
    return () => { iptal = true }
  }, [])
  if (g === undefined) return null
  const stil: React.CSSProperties = { maxWidth: props.en, margin: '8px auto 0', padding: '8px 14px', borderRadius: 8, fontFamily: 'system-ui', fontSize: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }
  if (!g || !g.hazir) {
    return (
      <div className="yazdirma-gizle" style={{ ...stil, background: '#F3F4F6', border: '1px solid #D1D5DB', color: '#374151' }}>
        <span>Medula e-reçete: kimlik bilgileri girilmemiş{g?.eksikler?.length ? ` (${g.eksikler.join(', ')})` : ''}.</span>
        <a href="/dashboard/doktor/ayarlar/erecete" style={{ color: '#1D4ED8', fontWeight: 600, textDecoration: 'none' }}>Ayarlar › e-Reçete →</a>
      </div>
    )
  }
  const bagli = g.sonTest?.durum === 'baglandi'
  return (
    <div className="yazdirma-gizle" style={{ ...stil, background: bagli ? '#ECFDF5' : '#FFFBEB', border: `1px solid ${bagli ? '#6EE7B7' : '#FCD34D'}`, color: bagli ? '#065F46' : '#78350F' }}>
      <span>Medula e-reçete: {bagli ? 'bağlantı doğrulandı' : 'bağlantı testi bekliyor'} · e-imza: {g.imzaYontemi === 'token' ? 'kart/token' : g.imzaYontemi === 'mobil' ? 'mobil imza' : 'yok'}</span>
      <button type="button" disabled title={g.gonderebilir ? 'e-imza aracı (Notya İmzacı) kurulunca aktif olur' : 'Bağlantı testi ve e-imza yöntemi gerekli'} style={{ border: '1px solid #9CA3AF', background: '#F9FAFB', color: '#6B7280', borderRadius: 6, padding: '4px 10px', cursor: 'not-allowed' }}>📤 Medula&apos;ya gönder (yakında)</button>
      <a href="/dashboard/doktor/ayarlar/erecete" style={{ color: '#1D4ED8', textDecoration: 'none' }}>Ayarlar</a>
    </div>
  )
}
