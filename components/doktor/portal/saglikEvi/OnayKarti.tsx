'use client'
/**
 * HASTA-PORTALI-GUNLUK — KVKK açık rıza for sharing home data with the doctor: explicit (unticked box), plain words,
 * withdrawable in Tercihler. Without it the patient still uses the daily health home; the doctor sees nothing.
 */
import { useState } from 'react'
import type { SaglikEviSozleri } from '@/lib/saglikEvi/sozler'

export function OnayKarti({ s, kvkkHref, onayla, sonra }: { s: SaglikEviSozleri; kvkkHref: string; onayla: () => Promise<void>; sonra: () => void }) {
  const [isaret, setIsaret] = useState(false)
  const [mesgul, setMesgul] = useState(false)
  return (
    <section className="sge-onay" aria-labelledby="sge-onay-b">
      <h2 id="sge-onay-b">{s.onayBaslik}</h2>
      <p>{s.onayMetni} <a href={kvkkHref} className="sge-bolum-git">{s.onayKvkk}</a></p>
      <label><input type="checkbox" checked={isaret} onChange={(e) => setIsaret(e.target.checked)} />{s.onayKutu}</label>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className="sge-btn sge-btn--ana" disabled={!isaret || mesgul} onClick={async () => { setMesgul(true); try { await onayla() } finally { setMesgul(false) } }}>{s.onayVer}</button>
        <button type="button" className="sge-btn" onClick={sonra}>{s.onaySonra}</button>
      </div>
    </section>
  )
}
