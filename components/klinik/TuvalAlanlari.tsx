'use client'
import type { CSSProperties } from 'react'
import type { AracTanim } from '@/lib/klinik/ozelAracCalistir'

const inp: CSSProperties = { padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(58,44,34,0.16)', fontSize: 14, background: '#fff', color: '#3b2e24' }

export function TuvalAlanlari({ tanim, girdi, yaz }: { tanim: AracTanim; girdi: Record<string, string>; yaz: (id: string, deger: string) => void }) {
  return (
    <div data-tuval-alanlari={tanim.slug} style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
      {tanim.alanlar.map((a) => (
        <label key={a.id} style={{ display: 'grid', gap: 4, fontSize: 13, color: '#3b2e24' }}>
          <span>{a.etiket}</span>
          {a.tur === 'onay' ? (
            <input type="checkbox" checked={girdi[a.id] === '1'} onChange={(e) => yaz(a.id, e.target.checked ? '1' : '')} />
          ) : a.tur === 'secim' ? (
            <select value={girdi[a.id] || ''} onChange={(e) => yaz(a.id, e.target.value)} style={inp}>
              <option value="">Seçin</option>
              {(a.secenekler || []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : a.tur === 'coklu' ? (
            <div style={{ display: 'grid', gap: 4 }}>
              {(a.secenekler || []).map((s) => {
                const sec = (girdi[a.id] || '').split('|').filter(Boolean)
                const varMi = sec.includes(s)
                return (
                  <label key={s} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="checkbox" checked={varMi} onChange={() => {
                      const sonra = varMi ? sec.filter((x) => x !== s) : [...sec, s]
                      yaz(a.id, sonra.join('|'))
                    }} />
                    <span>{s}</span>
                  </label>
                )
              })}
            </div>
          ) : (
            <input
              type={a.tur === 'sayi' ? 'number' : a.tur === 'tarih' ? 'date' : 'text'}
              value={girdi[a.id] || ''}
              onChange={(e) => yaz(a.id, e.target.value)}
              style={inp}
            />
          )}
        </label>
      ))}
    </div>
  )
}
