'use client'
/** HASTA-PORTALI-GUNLUK — the rule engine's friendly note to the patient. 'acil' always carries a 112 call button. */
import type { UyariDuzeyi } from '@/lib/saglikEvi/tipler'
import type { SaglikEviSozleri } from '@/lib/saglikEvi/sozler'

const IKON: Record<UyariDuzeyi, string> = {
  bilgi: 'M12 8h.01M11 12h1v5h1',
  dikkat: 'M12 8v5M12 16h.01',
  hekime_bildir: 'M4 6h16v10H8l-4 4z',
  acil: 'M12 7v6M12 16.5h.01',
}

export function UyariKarti({ s, duzey, metin, okudum, mesajHref }: { s: SaglikEviSozleri; duzey: UyariDuzeyi; metin: string; okudum?: () => void; mesajHref?: string }) {
  return (
    <div className={`sge-uyari sge-uyari--${duzey}`} role={duzey === 'acil' ? 'alert' : 'status'} style={{ textAlign: 'left' }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={duzey === 'acil' ? '#8b3a2e' : duzey === 'bilgi' ? '#0f9b8e' : '#a45b3e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {duzey === 'hekime_bildir' ? null : <circle cx="12" cy="12" r="9.5" />}
        <path d={IKON[duzey]} />
      </svg>
      <div>
        <div>{metin}</div>
        <div className="sge-uyari-alt">
          {duzey === 'acil' ? <a className="sge-112" href="tel:112">{s.ara112}</a> : null}
          {mesajHref && (duzey === 'hekime_bildir' || duzey === 'dikkat') ? <a className="sge-bolum-git" href={mesajHref}>{s.mesajYaz}</a> : null}
          {okudum ? <button type="button" className="sge-baglanti" onClick={okudum}>{s.uyariTamam}</button> : null}
        </div>
      </div>
    </div>
  )
}
