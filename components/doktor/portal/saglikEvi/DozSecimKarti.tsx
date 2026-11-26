'use client'
/**
 * DOZ-KAYDI-ISTEGE-BAGLI (Kaan, 2026-11-26) — the one-time, gentle question on Bugün and Doz Takvimi: three answers
 * (remind + I mark · remind only · no reminders). Until it is answered reminders stay on, and the card carries a plain
 * "Hatırlatmaları kapat" (same as the third answer). Asked once: any answer closes it for good; everything can be changed
 * later per medicine (Doz Takvimi) or globally (Tercihler). Wordless — every word arrives in `s` (gorunum-paritesi-ulke).
 */
import { useState } from 'react'
import type { SaglikEviSozleri } from '@/lib/saglikEvi/sozler'
import type { DozSecimi } from '@/lib/saglikEvi/tipler'

const SECIMLER: DozSecimi[] = ['hatirlat_isaretle', 'sadece_hatirlat', 'istemiyorum']

export function DozSecimKarti({ s, sec }: { s: SaglikEviSozleri; sec: (secim: DozSecimi) => Promise<void> }) {
  const [mesgul, setMesgul] = useState(false)
  const yap = async (x: DozSecimi) => { setMesgul(true); try { await sec(x) } finally { setMesgul(false) } }
  return (
    <section className="sge-onay sge-doz-secim" aria-labelledby="sge-doz-secim-b" data-testid="doz-secim-karti">
      <h2 id="sge-doz-secim-b">{s.dozSecimBaslik}</h2>
      <p>{s.dozSecimMetni}</p>
      <div className="sge-secim-liste">
        {SECIMLER.map((x, i) => (
          <button key={x} type="button" className={`sge-secim${i === 0 ? ' sge-secim--ana' : ''}`} disabled={mesgul} onClick={() => yap(x)}>
            <b>{s.dozSecim[x]}</b><span>{s.dozSecimAlt[x]}</span>
          </button>
        ))}
      </div>
      <p className="sge-not" style={{ margin: 0, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span>{s.dozSecimSimdilik}</span>
        <button type="button" className="sge-baglanti" disabled={mesgul} onClick={() => yap('istemiyorum')} data-testid="hatirlatmalari-kapat">{s.hatirlatmalariKapat}</button>
      </p>
    </section>
  )
}
