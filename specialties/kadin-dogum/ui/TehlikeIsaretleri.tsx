'use client'

import { tehlikeDanismanlikMetni, TEHLIKE_ISARETLERI } from '../protocols/tehlike'
import { kutu, btn } from './clinic-styles'

export function TehlikeIsaretleri({ onKopyala }: { onKopyala?: (metin: string) => void }) {
  const metin = tehlikeDanismanlikMetni()
  const kopyala = async () => {
    try { await navigator.clipboard.writeText(metin) } catch { /* ignore */ }
    onKopyala?.(metin)
  }
  return (
    <section style={kutu} data-kd="tehlike-isaretleri">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Tehlike işaretleri (DÖBYR)</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" style={btn()} onClick={kopyala}>Kopyala</button>
          <button type="button" style={btn(true)} onClick={() => window.print()}>Yazdır</button>
        </div>
      </div>
      <ul style={{ fontSize: 13, color: '#C9D4E3', marginTop: 8 }}>
        {TEHLIKE_ISARETLERI.map((t) => <li key={t.id}>{t.etiket}</li>)}
      </ul>
      <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#8FA0B5', background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 8 }}>
        {metin}
      </pre>
    </section>
  )
}

export default TehlikeIsaretleri
