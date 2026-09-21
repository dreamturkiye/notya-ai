import type { CSSProperties } from 'react'
import { Cerceve } from '@/components/site-v2/Cerceve'
import { HEKIM } from '@/lib/site-v2/demoVeri'

export default function SiteV2Giris() {
  return (
    <Cerceve baslik="Giriş">
      <div style={{ maxWidth: 380, background: '#FBF7F0', border: '1px solid #D8D0C4', padding: 24 }}>
        <p style={{ fontSize: 13, color: '#5A6B62' }}>Sandbox. Canlı şifre yok. Sahne: {HEKIM.email}</p>
        <label style={lab}>E-posta</label>
        <input readOnly value={HEKIM.email} style={inp} />
        <label style={lab}>Şifre</label>
        <input readOnly type="password" value="········" style={inp} />
        <div style={{ marginTop: 16, background: '#1B4332', color: '#F4EFE6', textAlign: 'center', padding: 12, fontWeight: 700 }}>
          Giriş Yap (sahne)
        </div>
      </div>
    </Cerceve>
  )
}

const lab: CSSProperties = { display: 'block', fontSize: 12, margin: '12px 0 4px', color: '#5A6B62' }
const inp: CSSProperties = { width: '100%', padding: 10, border: '1px solid #D8D0C4', background: '#fff', boxSizing: 'border-box' }
